const cors = require('cors')({ origin: true });
const { crypto } = require('./utils');
const functions = require('firebase-functions');
const request = require('request-promise');

const API_URL = "https://accounts.spotify.com/api/token";
const CLIENT_ID = functions.config().spotify.client_id;
const CLIENT_SECRET = functions.config().spotify.client_secret;
const CLIENT_CALLBACK_URL = functions.config().spotify.client_callback_url;
const CLIENT_CALLBACK_PROTO_URL = functions.config().spotify.client_callback_protocol_url;
const ENCRYPTION_SECRET = functions.config().spotify.enc_secret;

const authKey = new Buffer(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

function spotifyRequest(params) {
    return request({
        method: 'POST',
        uri: API_URL,
        form: params,
        headers: {
            'Authorization': `Basic ${authKey}`
        },
        json: true
    });
}

function handleSpotifyRejection(res) {
    return err => {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: `Received invalid status code '${err.statusCode}' from Spotify.`
        });
    };
}

exports.clientToken = (req, res) => {
    return cors(req, res, () => {
        return spotifyRequest({ grant_type: 'client_credentials' })
            .then(body => {
                res.json({
                    access_token: body.access_token,
                    expires_in: body.expires_in
                });
            })
            .catch(handleSpotifyRejection(res));
    });
};

exports.exchangeCode = (req, res) => doExchange(req, res, CLIENT_CALLBACK_URL);

exports.exchangeCodeProtocol = (req, res) => doExchange(req, res, CLIENT_CALLBACK_PROTO_URL);

function doExchange(req, res, defaultCallbackUrl) {
    return cors(req, res, () => {
        if (!req.body.code) {
            return res.status(400).json({
                success: false,
                msg: "Missing 'code' parameter"
            });
        }

        const callbackUrl = req.body.callbackUrl || defaultCallbackUrl;

        return spotifyRequest({
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
            code: req.body.code
        })
            .then(body => {
                res.json({
                    access_token: body.access_token,
                    expires_in: body.expires_in,
                    refresh_token: crypto.encrypt(body.refresh_token, ENCRYPTION_SECRET),
                    token_type: body.token_type,
                    success: true
                });
            })
            .catch(handleSpotifyRejection(res));
    });
}

exports.refreshToken = (req, res) => {
    return cors(req, res, () => {
        if (!req.body.refresh_token) {
            return res.status(400).json({
                success: false,
                msg: "Missing 'refresh_token' parameter"
            });
        }

        return spotifyRequest({
            grant_type: 'refresh_token',
            refresh_token: crypto.decrypt(req.body.refresh_token, ENCRYPTION_SECRET)
        })
            .then(body => {
                res.json({
                    access_token: body.access_token,
                    expires_in: body.expires_in,
                    success: true
                });
            })
            .catch(handleSpotifyRejection(res));
    });
};
