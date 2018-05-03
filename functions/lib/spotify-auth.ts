import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Agent } from 'https';
import request from 'requestretry';
import { URL } from 'url';

import { CLIENT_ID, CLIENT_SECRET, ENCRYPTION_SECRET } from '../spotify.config';

import { crypto, escapeKey } from './utils';

const API_URL = 'https://accounts.spotify.com/api/token';

const agent = new Agent({ keepAlive: true });
const authKey = new Buffer(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

function spotifyRequest(
    params: string | { [key: string]: any },
    url: string = API_URL,
    method: string = 'POST',
) {
    return request({
        agent,
        method,
        uri: url,
        form: params,
        headers: {
            'Authorization': `Basic ${authKey}`,
        },
        json: true,
        fullResponse: false,
    });
}

export const getClientToken = functions.https.onCall(async (data, ctx) => {
    let body;
    try {
        body = await spotifyRequest({ grant_type: 'client_credentials' });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError(
            'unknown',
            `Received invalid status code '${err.statusCode}' from Spotify.`,
        );
    }

    return {
        accessToken: body.access_token,
        expiresIn: body.expires_in,
    };
});

export const exchangeCode = functions.https.onCall(async (data, ctx) => {
    const { callbackUrl, code, userToken } = data;
    if (!code) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            "Missing 'code' parameter",
        );
    }
    if (!callbackUrl) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            "Missing 'callbackUrl' parameter",
        );
    }

    const authCodeBody = await spotifyRequest({
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code,
    });
    const user = await request({
        agent,
        method: 'GET',
        uri: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': `Bearer ${authCodeBody.access_token}`,
        },
        json: true,
        fullResponse: false,
    });

    if (!user.email) {
        throw new functions.https.HttpsError(
            'invalid-argument', // tslint:disable-next-line:max-line-length
            "The account is lacking an E-Mail address. Please ensure your Spotify account has a valid E-Mail address associated with it.",
            'auth/invalid-email',
        );
    }

    const escapedUid = `spotify:user:${escapeKey(user.id)}`;
    const userMeta = {
        displayName: user.display_name || user.id,
        photoURL: (user.images && user.images.length > 0 && isValidUrl(user.images[0].url))
            ? user.images[0].url
            : undefined,
        email: user.email || `${user.id}@spotify.festify.us`,
    };

    try {
        await admin.auth().updateUser(escapedUid, userMeta);
    } catch (error) {
        // If user does not exist we create it.
        if (error.code === 'auth/user-not-found') {
            const newUser = await admin.auth().createUser({
                uid: escapedUid,
                ...userMeta,
            });

            if (userToken) {
                const oldUser = await admin.auth().verifyIdToken(userToken);

                const userParties = await admin.database()
                    .ref('/user_parties')
                    .child(oldUser.uid)
                    .once('value');

                const parties = Object.keys(userParties.val());

                const updates = {};

                for (const partyId of parties) {
                    const oldUserVotesRef = admin.database()
                        .ref('/votes_by_user')
                        .child(partyId)
                        .child(oldUser.uid);

                    const oldUserVotes = (await oldUserVotesRef.once('value')).val();

                    if (oldUserVotes) {
                        for (const voteId of Object.keys(oldUserVotes)) {
                            updates[`/votes_by_user/${partyId}/${newUser.uid}/${voteId}`] = oldUserVotes[voteId];
                            updates[`/votes/${partyId}/${voteId}/${newUser.uid}`] = oldUserVotes[voteId];
                        }
                    }

                    updates[`/votes/${partyId}/${oldUser.uid}`] = null;
                    updates[`/parties/${partyId}/created_by`] = newUser.uid;
                }

                updates[`/votes_by_user/${oldUser.uid}`] = null;
                updates[`/user_parties/${oldUser.uid}`] = null;

                try {
                    await admin.database().ref().update(updates);
                    await admin.auth().deleteUser(oldUser.uid);
                } catch (ex) {
                    console.error(ex);
                    throw new functions.https.HttpsError(
                        'unknown',
                        "Failed to delete old and update new user.",
                        ex.code,
                    );
                }
            }
        } else if (error.code === 'auth/invalid-display-name') {
            console.error(error, userMeta.displayName);
            throw new functions.https.HttpsError(
                'invalid-argument',
                `${userMeta.displayName} is not a valid username.`,
                error.code,
            );
        } else if (error.code === 'auth/invalid-email') {
            console.error(error, user.email);
            throw new functions.https.HttpsError(
                'invalid-argument',
                `${user.email} is not a valid email address.`,
                error.code,
            );
        } else {
            console.error(error);
            throw new functions.https.HttpsError(
                'unknown',
                "Failed to update user.",
                error.code,
            );
        }
    }

    return {
        accessToken: authCodeBody.access_token,
        expiresIn: authCodeBody.expires_in,
        firebaseToken: await admin.auth().createCustomToken(escapedUid),
        refreshToken: crypto.encrypt(authCodeBody.refresh_token, ENCRYPTION_SECRET),
        tokenType: authCodeBody.token_type,
    };
});

export const refreshToken = functions.https.onCall(async (data, ctx) => {
    const { refreshToken } = data;
    if (!refreshToken) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            "Missing 'refreshToken' parameter.",
        );
    }

    let body;
    try {
        body = await spotifyRequest({
            grant_type: 'refresh_token',
            refresh_token: crypto.decrypt(refreshToken, ENCRYPTION_SECRET),
        });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError(
            'unknown',
            `Received invalid status code '${err.status}' from Spotify.`,
        );
    }

    return {
        accessToken: body.access_token,
        expiresIn: body.expires_in,
    };
});
