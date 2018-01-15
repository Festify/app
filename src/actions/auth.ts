import { replace } from '@mraerino/redux-little-router-reactless';
import { ThunkAction } from 'redux-thunk';
import * as SpotifyApi from 'spotify-web-api-js';

import { TOKEN_EXCHANGE_URL } from '../../spotify.config';
import { State } from '../state';
import { AuthData } from '../util/auth';
import { fetchWithAccessToken, LOCALSTORAGE_KEY } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | ExchangeCodeFailAction
    | ExchangeCodeFinishAction
    | ExchangeCodeFinishAction
    | NotifyStatusKnownAction;

export interface ExchangeCodeFailAction extends ErrorAction {
    type: Types.EXCHANGE_CODE_Fail;
}

export interface ExchangeCodeFinishAction {
    type: Types.EXCHANGE_CODE_Finish;
}

export interface ExchangeCodeStartAction {
    type: Types.EXCHANGE_CODE_Start;
}

export interface NotifyStatusKnownAction extends PayloadAction<['spotify', any]> {
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
        dispatch({ type: Types.EXCHANGE_CODE_Start } as ExchangeCodeStartAction);
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
            dispatch({
                type: Types.EXCHANGE_CODE_Fail,
                error: true,
                payload: new Error(`Token exchange failed: ${msg}.`),
            } as ExchangeCodeFailAction);
            return;
        }

        const data = new AuthData(
            access_token,
            Date.now() + (expires_in * 1000),
            refresh_token,
        );
        data.saveTo(LOCALSTORAGE_KEY);

        await dispatch(checkSpotifyLoginStatus());
        dispatch({ type: Types.EXCHANGE_CODE_Finish } as ExchangeCodeFinishAction);
    };
}
