import { CLIENT_ID, CLIENT_TOKEN_URL, TOKEN_REFRESH_URL } from '../../spotify.config';

import { AuthData } from './auth';

export const LOCALSTORAGE_KEY = 'SpotifyAuthData';
export const SCOPES = [
    "streaming",
    "user-read-birthdate",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
];

export const fetchWithAnonymousAuth = fetchFactory(requireAnonymousAuth);
export const fetchWithAccessToken = fetchFactory(requireAccessToken);

let authData: AuthData | null = null;
let accessTokenPromise: Promise<string> | null = null;

export function requireAccessToken(): Promise<string> {
    if (accessTokenPromise) {
        return accessTokenPromise;
    }

    accessTokenPromise = _requireAccessToken();
    return accessTokenPromise;
}

async function _requireAccessToken(): Promise<string> {
    if (authData && authData.expiresAt > Date.now() + 10000) {
        return authData.accessToken;
    }

    authData = AuthData.loadFrom(LOCALSTORAGE_KEY);
    if (authData.isValid) {
        return authData.accessToken;
    }

    if (!authData.refreshToken) {
        throw new Error("Missing refresh token.");
    }
    const body = `refresh_token=${encodeURIComponent(authData.refreshToken)}`;
    const resp = await fetch(TOKEN_REFRESH_URL, {
        body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'post',
    });
    const { access_token, expires_in, msg, success } = await resp.json();
    if (!success) {
        throw new Error(`Token refresh failed: ${msg}.`);
    }

    authData = new AuthData(
        access_token,
        Date.now() + (expires_in * 1000),
        authData.refreshToken,
    );
    authData.saveTo(LOCALSTORAGE_KEY);
    accessTokenPromise = null;

    return authData.accessToken;
}

let anonymousAccessToken: string = '';
let anonymousExpireTimeMs: number = 0;
let anonymousPromise: Promise<string> | null = null;

export function requireAnonymousAuth(): Promise<string> {
    if (anonymousPromise) {
        return anonymousPromise;
    }

    anonymousPromise = _requireAnonymousAuth();
    return anonymousPromise;
}

async function _requireAnonymousAuth(): Promise<string> {
    if (Date.now() < anonymousExpireTimeMs) {
        return anonymousAccessToken;
    }

    const resp = await fetch(CLIENT_TOKEN_URL);
    const { access_token, expires_in } = await resp.json();

    anonymousAccessToken = access_token;
    anonymousExpireTimeMs = Date.now() + (expires_in * 1000) - 10000; // Safety margin
    anonymousPromise = null;
    return access_token;
}

function fetchFactory(
    tokenFetcher: () => Promise<string>,
): (url: string, options?: RequestInit) => Promise<Response> {
    return async (url: string, options: RequestInit = {}) => {
        if (url.startsWith('/')) {
            url = 'https://api.spotify.com/v1' + url;
        }

        const token = await tokenFetcher();
        return await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        });
    };
}
