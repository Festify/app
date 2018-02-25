import { replace } from '@mraerino/redux-little-router-reactless';
import * as SpotifyApi from 'spotify-web-api-js';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | CheckSpotifyLoginStatusAction
    | ExchangeCodeFailAction
    | ExchangeCodeFinishAction
    | ExchangeCodeStartAction
    | NotifyAuthStatusKnownAction
    | TriggerSpotifyOAuthLoginAction;

export interface CheckSpotifyLoginStatusAction {
    type: Types.CHECK_SPOTIFY_LOGIN_STATUS;
}

export interface ExchangeCodeFailAction extends ErrorAction {
    type: Types.EXCHANGE_CODE_Fail;
}

export interface ExchangeCodeFinishAction {
    type: Types.EXCHANGE_CODE_Finish;
}

export interface ExchangeCodeStartAction {
    type: Types.EXCHANGE_CODE_Start;
}

export interface NotifyAuthStatusKnownAction extends PayloadAction<[
    'spotify',
    SpotifyApi.UserObjectPrivate | null
]> {
    type: Types.NOTIFY_AUTH_STATUS_KNOWN;
}

export interface TriggerSpotifyOAuthLoginAction {
    type: Types.TRIGGER_SPOTIFY_OAUTH_LOGIN;
}

export function checkSpotifyLoginStatus(): CheckSpotifyLoginStatusAction {
    return { type: Types.CHECK_SPOTIFY_LOGIN_STATUS };
}

export function exchangeCodeFail(err: Error): ExchangeCodeFailAction {
    return {
        type: Types.EXCHANGE_CODE_Fail,
        error: true,
        payload: err,
    };
}

export function exchangeCodeFinish(): ExchangeCodeFinishAction {
    return { type: Types.EXCHANGE_CODE_Finish };
}

export function exchangeCodeStart(): ExchangeCodeStartAction {
    return { type: Types.EXCHANGE_CODE_Start };
}

export function notifyAuthStatusKnown(
    provider: 'spotify',
    user: SpotifyApi.UserObjectPrivate | null,
): NotifyAuthStatusKnownAction {
    return {
        type: Types.NOTIFY_AUTH_STATUS_KNOWN,
        payload: [provider, user],
    };
}

export function loginWithSpotify(): TriggerSpotifyOAuthLoginAction {
    return { type: Types.TRIGGER_SPOTIFY_OAUTH_LOGIN };
}
