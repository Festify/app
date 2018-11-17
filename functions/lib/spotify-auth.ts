import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Agent } from 'https';
import request from 'requestretry';

import { CLIENT_ID, CLIENT_SECRET, ENCRYPTION_SECRET } from '../spotify.config';

import { crypto, isValidUrl } from './utils';

const API_URL = 'https://accounts.spotify.com/api/token';

const agent = new Agent({ keepAlive: true });
const authKey = new Buffer(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

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

async function transferData(oldUid: string, newUid: string) {
    const userParties = await admin.database()
        .ref('/user_parties')
        .child(oldUid)
        .once('value');
    const parties = userParties.val() ? Object.keys(userParties.val()) : [];

    const updates = {};

    for (const partyId of parties) {
        const oldUserVotesRef = admin.database()
            .ref('/votes_by_user')
            .child(partyId)
            .child(oldUid);

        const oldUserVotes = (await oldUserVotesRef.once('value')).val();

        if (oldUserVotes) {
            for (const voteId of Object.keys(oldUserVotes)) {
                updates[`/votes_by_user/${partyId}/${newUid}/${voteId}`] = oldUserVotes[voteId];
                updates[`/votes/${partyId}/${voteId}/${newUid}`] = oldUserVotes[voteId];
            }
        }

        updates[`/votes/${partyId}/${oldUid}`] = null;
    }

    updates[`/votes_by_user/${oldUid}`] = null;
    updates[`/user_parties/${oldUid}`] = null;

    try {
        await admin.database().ref().update(updates);
        await admin.auth().deleteUser(oldUid);
    } catch (ex) {
        console.error(ex);
        throw new functions.https.HttpsError(
            'unknown',
            "Failed to update user data.",
            ex.code,
        );
    }
}

/**
 * Check whether the account is already linked to the given Firebase account,
 * verify access and link them, if possible.
 *
 * @param email the email associated with the Spotify account
 * @param accessToken a Firebase JWT token to the existing account
 * @param spotifyId the Spotify ID of the account
 */
async function selectAccountAndVerifyAccess(
    email: string,
    currentUser: admin.auth.DecodedIdToken,
    spotifyId: string,
): Promise<string | null> {
    let existingUser: admin.auth.UserRecord;
    try {
        existingUser = await admin.auth().getUserByEmail(email);
    } catch (err) {
        // If the user doesn't exist, just create it as before
        if (err.code === 'auth/user-not-found') {
            return null;
        }

        throw err;
    }

    // tslint:disable:no-string-literal
    const associatedSpotifyId: string | null =
        existingUser.customClaims && existingUser.customClaims['spotify'];

    // Check whether the existing user is already linked to the given Spotify account
    if (associatedSpotifyId === spotifyId) {
        // The accounts are already linked, all is well!

        return existingUser.uid;
    } else if (associatedSpotifyId) {
        // A different Spotify account is already associated with the existing account.
        // TODO: This case mustn't occur as per the current strategy.

        throw new functions.https.HttpsError(
            'permission-denied',
            "An account with the same E-Mail already exists, but is linked to a different Spotify account.",
        );
    } else {
        /*
         * There is no Spotify account associated with the given account.
         * Check whether the current client has access to this account and link them.
         */

        if (currentUser.uid !== existingUser.uid) {
            throw new functions.https.HttpsError(
                'already-exists', // tslint:disable-next-line:max-line-length
                `A Firebase user with email ${email} already exists and the current account does not have the privileges to be linked (emails don't match).`,
                { email },
            );
        }

        // Save Spotify ID in user record
        await admin.auth().setCustomUserClaims(existingUser.uid, { spotify: spotifyId });
        return existingUser.uid;
    }
}

export const exchangeCode = functions.https.onCall(async (data, ctx) => {
    const { callbackUrl, code } = data;
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
    return {
        accessToken: authCodeBody.access_token,
        expiresIn: authCodeBody.expires_in,
        refreshToken: crypto.encrypt(authCodeBody.refresh_token, ENCRYPTION_SECRET),
        tokenType: authCodeBody.token_type,
    };
});

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

export const isSpotifyUser = functions.https.onCall(async (data, ctx) => {
    const user = await admin.auth().getUserByEmail(data.email);
    // tslint:disable:no-string-literal
    return Boolean(user.customClaims && user.customClaims['spotify']);
});

export const linkSpotifyAccounts = functions.https.onCall(async (data, ctx) => {
    if (!ctx.auth || !ctx.auth.uid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            "Missing user authorization",
        );
    }

    const user = await request({
        agent,
        method: 'GET',
        uri: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': `Bearer ${data.accessToken}`,
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

    const spotifyId = `spotify:user:${user.id}`;
    const linkedAccountUid = await selectAccountAndVerifyAccess(
        user.email,
        ctx.auth.token,
        spotifyId,
    );
    const userMeta: Partial<admin.auth.CreateRequest> = {
        photoURL: (user.images && user.images.length > 0 && isValidUrl(user.images[0].url))
            ? user.images[0].url
            : undefined,
        email: user.email,
    };

    let loginUid;
    try {
        if (linkedAccountUid) {
            await admin.auth().updateUser(linkedAccountUid, userMeta);
            loginUid = linkedAccountUid;
        } else {
            // If user does not exist we create it.

            const [oldUser, newUser] = await Promise.all([
                admin.auth().getUser(ctx.auth.uid),
                admin.auth().createUser({
                    ...userMeta,
                    displayName: user.display_name || user.id,
                }),
            ]);

            await admin.auth().setCustomUserClaims(newUser.uid, { spotify: spotifyId });
            if (oldUser.providerData.length === 0) {
                await transferData(ctx.auth.uid, newUser.uid);
            }

            loginUid = newUser.uid;
        }
    } catch (error) {
        if (error.code === 'auth/invalid-display-name') {
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

    return { firebaseToken: await admin.auth().createCustomToken(loginUid) };
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
