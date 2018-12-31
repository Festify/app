import debounce from 'promise-debounce';

import { AuthData } from './auth';
import { functions } from './firebase';

export const LOCALSTORAGE_KEY = 'SpotifyAuthData';
export const SCOPES = [
  "streaming",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-birthdate",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-read-private",
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
    throw new Error("Missing refresh token.");
  }

  const { accessToken, expiresIn } = (await functions.refreshToken({ refreshToken: authData.refreshToken })).data;
  authData = new AuthData(
    accessToken,
    Date.now() + (expiresIn * 1000),
    authData.refreshToken,
  );
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
  anonymousExpireTimeMs = Date.now() + (data.expiresIn * 1000) - 10000; // Safety margin
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
    let isInactive = false;
    let attempts = 0;

    do {
      const resp = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (resp.status === 202) {
        isInactive = true;
        await (new Promise(res => setTimeout(res, 5000)));
      } else {
        return resp;
      }
    } while (isInactive && attempts++ < 5);

    throw new Error('Device is inactive');
  };
}
