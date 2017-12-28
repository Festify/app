import { replace } from '@mraerino/redux-little-router-reactless';
import { ThunkAction } from 'redux-thunk';
import * as SpotifyApi from 'spotify-web-api-js';

import { TOKEN_EXCHANGE_URL } from '../../spotify.config';
import { State } from '../state';
import { AuthData } from '../util/auth';
import { fetchWithAccessToken, LOCALSTORAGE_KEY } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';

export type Actions =
    | NotifyStatusKnownAction;

export interface NotifyStatusKnownAction extends PayloadAction<[string, any]> {
    type: Types.NOTIFY_AUTH_STATUS_KNOWN;
}

export function checkSpotifyLoginStatus(): ThunkAction<void, State, void> {
    return async (dispatch) => {
        const lsEntry = localStorage[LOCALSTORAGE_KEY];
        if (!lsEntry) {
            dispatch(notifyAuthStatusKnown('spotify', null));
            return;
        }

        const resp = await fetchWithAccessToken('/me');
        const user = await resp.json();

        dispatch(notifyAuthStatusKnown('spotify', user));
    };
}

export function notifyAuthStatusKnown(
    provider: 'spotify',
    user: SpotifyApi.UserObjectPrivate | null,
): NotifyStatusKnownAction {
    return {
        type: Types.NOTIFY_AUTH_STATUS_KNOWN,
        payload: [provider, user],
    };
}

export function exchangeCode(code: string): ThunkAction<Promise<void>, State, void> {
    return async (dispatch) => {
        dispatch(replace('/', {}));

        const body = `callbackUrl=${encodeURIComponent(location.origin)}&code=${encodeURIComponent(code)}`;
        const resp = await fetch(TOKEN_EXCHANGE_URL, {
            body,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'post',
        });

        const { access_token, expires_in, msg, refresh_token, success } = await resp.json();

        if (!success) {
            throw new Error(`Token exchange failed: ${msg}.`);
        }

        const data: AuthData = {
            accessToken: access_token,
            expiresAt: Date.now() + (expires_in * 1000),
            refreshToken: refresh_token,
        };
        localStorage[LOCALSTORAGE_KEY] = JSON.stringify(data);

        dispatch(checkSpotifyLoginStatus());
    };
}
