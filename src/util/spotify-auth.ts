import { CLIENT_ID, CLIENT_TOKEN_URL } from '../../spotify.config';

let anonymousAccessToken: string = '';
let anonymousExpireTimeMs: number = 0;
let anonymousPromise: Promise<string> | null = null;

export async function fetchWithAnonymousAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await requireAnonymousAuth();
    return await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        },
    });
}

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
