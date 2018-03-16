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

export const exchangeCode = (req: Request, res: Response) => cors(req, res, () => {
    if (!req.body.code) {
        return res.status(400).json({
            success: false,
            msg: 'Missing \'code\' parameter',
        });
    }

    const callbackUrl = req.body.callbackUrl || CLIENT_CALLBACK_URL;

    return spotifyRequest({
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code: req.body.code,
    })
        .then(body => {
            return request({
                agent,
                method: 'GET',
                uri: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': `Bearer ${body.access_token}`,
                },
                json: true,
            }).then(resp => [resp, body]);
        })
        .then(([user, body]) => {
            const userMeta = {
                displayName: user.display_name || user.id,
                photoURL: (user.images && user.images.length > 0)
                    ? user.images[0].url
                    : undefined,
                email: user.email,
            };

            return admin.auth()
                .updateUser(user.uri, userMeta)
                .catch((error) => {
                    // If user does not exists we create it.
                    if (error.code === 'auth/user-not-found') {
                        return admin.auth().createUser({
                            uid: user.uri,
                            ...userMeta,
                        });
                    }
                    throw error;
                }).then(() => Promise.all([
                    Promise.resolve(body),
                    admin.auth().createCustomToken(user.uri),
                ]));
        })
        .then(([body, firebaseToken]) => {
            res.json({
                access_token: body.access_token,
                expires_in: body.expires_in,
                firebase_token: firebaseToken,
                refresh_token: crypto.encrypt(body.refresh_token, ENCRYPTION_SECRET),
                token_type: body.token_type,
                success: true,
            });
        })
        .catch(handleSpotifyRejection(res));
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
