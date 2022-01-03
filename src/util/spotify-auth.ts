import debounce from 'promise-debounce';

import { AuthData } from './auth';
import { functions } from './firebase';

export const LOCALSTORAGE_KEY = 'SpotifyAuthData';
export const SCOPES = [
    'streaming',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-read-private',
];

export const requireAccessToken: () => Promise<string> = debounce(_requireAccessToken);
export const requireAnonymousAuth: () => Promise<string> = debounce(_requireAnonymousAuth);

export const fetchWithAnonymousAuth = fetchFactory(requireAnonymousAuth);
export const fetchWithAccessToken = fetchFactory(requireAccessToken);

let authData: AuthData | null = null;

async function _requireAccessToken(): Promise<string> {
    if (authData && authData.expiresAt > Date.now() + 10000) {
        return authData.accessToken;
    }

    authData = AuthData.loadFrom(LOCALSTORAGE_KEY);
    if (authData.isValid) {
        return authData.accessToken;
    }

    if (!authData.refreshToken) {
        throw new Error('Missing refresh token.');
    }

    const { accessToken, expiresIn } = (
        await functions.refreshToken({ refreshToken: authData.refreshToken })
    ).data;
    authData = new AuthData(accessToken, Date.now() + expiresIn * 1000, authData.refreshToken);
    authData.saveTo(LOCALSTORAGE_KEY);

    return authData.accessToken;
}

let anonymousAccessToken: string = '';
let anonymousExpireTimeMs: number = 0;

async function _requireAnonymousAuth(): Promise<string> {
    if (Date.now() < anonymousExpireTimeMs) {
        return anonymousAccessToken;
    }

    const { data } = await functions.clientToken();

    anonymousAccessToken = data.accessToken;
    anonymousExpireTimeMs = Date.now() + data.expiresIn * 1000 - 10000; // Safety margin
    return data.accessToken;
}

function fetchFactory(
    tokenFetcher: () => Promise<string>,
): (url: string, options?: RequestInit) => Promise<Response> {
    return async (url: string, options: RequestInit = {}) => {
        if (url.startsWith('/')) {
            url = 'https://api.spotify.com/v1' + url;
        }

        const token = await tokenFetcher();
        let attempts = 0;

        do {
            try {
                const resp = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (resp.status === 429) {
                    console.warn(`Got too many requests for ${url}, retrying in 5s...`);
                    await new Promise((res) => setTimeout(res, 5000));
                } else if (resp.status === 502) {
                    console.warn(`Got bad gateway for ${url}, retrying in 200ms...`);
                    await new Promise((res) => setTimeout(res, 200));
                } else {
                    return resp;
                }
            } catch (err) {
                console.warn(`Got error for ${url}, retrying in 1s...`, err);
                await new Promise((res) => setTimeout(res, 1000));
            }
        } while (attempts++ < 5);

        throw new Error('Device is inactive');
    };
}
