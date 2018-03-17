import createCors from 'cors';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { config } from 'firebase-functions';
import { Agent } from 'https';
import request from 'request-promise';

import { crypto } from './utils';

const cors = createCors({ origin: true });

const API_URL = 'https://accounts.spotify.com/api/token';

const CLIENT_ID = config().spotify.client_id;
const CLIENT_SECRET = config().spotify.client_secret;
const CLIENT_CALLBACK_URL = config().spotify.client_callback_url;
const ENCRYPTION_SECRET = config().spotify.enc_secret;

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
    });
}

function handleSpotifyRejection(res: Response) {
    return err => {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: `Received invalid status code '${err.statusCode}' from Spotify.`,
        });
    };
}

function handleFirebaseRejection(res: Response, error: Error) {
    console.error(error);
    res.status(500).json({
        success: false,
        msg: `Firebase failed with error: ${error.message}.`,
    });
}

export const clientToken = (req: Request, res: Response) => cors(req, res, () => {
    return spotifyRequest({ grant_type: 'client_credentials' })
        .then(body => {
            res.json({
                access_token: body.access_token,
                expires_in: body.expires_in,
            });
        })
        .catch(handleSpotifyRejection(res));
});

export const exchangeCode = (req: Request, res: Response) => cors(req, res, async () => {
    if (!req.body.code) {
        return res.status(400).json({
            success: false,
            msg: 'Missing \'code\' parameter',
        });
    }

    const callbackUrl = req.body.callbackUrl || CLIENT_CALLBACK_URL;

    const authCodeBody = await spotifyRequest({
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code: req.body.code,
    });

    const user = await request({
        agent,
        method: 'GET',
        uri: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': `Bearer ${authCodeBody.access_token}`,
        },
        json: true,
    });

    const userMeta = {
        displayName: user.display_name || user.id,
        photoURL: (user.images && user.images.length > 0)
            ? user.images[0].url
            : undefined,
        email: user.email,
    };

    try {
        await admin.auth().updateUser(user.uri, userMeta);
    } catch (error) {
        // If user does not exist we create it.
        if (error.code === 'auth/user-not-found') {
            const newUser = await admin.auth().createUser({
                uid: user.uri,
                ...userMeta,
            });

            const oldUser = await admin.auth().verifyIdToken(req.body.userToken);

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
                return handleFirebaseRejection(res, ex);
            }
        } else {
            return handleSpotifyRejection(res)(error);
        }
    }

    const firebaseToken = await admin.auth().createCustomToken(user.uri);

    res.json({
        access_token: authCodeBody.access_token,
        expires_in: authCodeBody.expires_in,
        firebase_token: firebaseToken,
        refresh_token: crypto.encrypt(authCodeBody.refresh_token, ENCRYPTION_SECRET),
        token_type: authCodeBody.token_type,
        success: true,
    });
});

export const refreshToken = (req: Request, res: Response) => cors(req, res, () => {
    if (!req.body.refresh_token) {
        return res.status(400).json({
            success: false,
            msg: 'Missing \'refresh_token\' parameter',
        });
    }

    return spotifyRequest({
        grant_type: 'refresh_token',
        refresh_token: crypto.decrypt(req.body.refresh_token, ENCRYPTION_SECRET),
    })
        .then(body => {
            res.json({
                access_token: body.access_token,
                expires_in: body.expires_in,
                success: true,
            });
        })
        .catch(handleSpotifyRejection(res));
});
