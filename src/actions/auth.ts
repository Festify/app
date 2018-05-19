import { User } from '@firebase/auth-types';

import { EnabledProvidersList, UserCredentials } from '../state';

import { PayloadAction, Types } from '.';

export type Actions =
    | CheckSpotifyLoginStatusAction
    | ExchangeCodeFailAction
    | ExchangeCodeStartAction
    | NotifyAuthStatusKnownAction
    | RequireFollowUpLoginAction
    | TriggerOAuthLoginAction;

export interface CheckSpotifyLoginStatusAction {
    type: Types.CHECK_SPOTIFY_LOGIN_STATUS;
}

export interface ExchangeCodeFailAction extends PayloadAction<ProviderObject<Error>> {
    error: true;
    type: Types.EXCHANGE_CODE_Fail;
}

export interface ExchangeCodeStartAction extends PayloadAction<keyof UserCredentials> {
    type: Types.EXCHANGE_CODE_Start;
}

export interface NotifyAuthStatusKnownAction extends PayloadAction<ProviderObject<
    User | SpotifyApi.UserObjectPrivate | null
>> {
    type: Types.NOTIFY_AUTH_STATUS_KNOWN;
}

export interface RequireFollowUpLoginAction extends PayloadAction<EnabledProvidersList> {
    type: Types.REQUIRE_FOLLOW_UP_LOGIN;
}

export type OAuthLoginProviders = Exclude<keyof UserCredentials, 'firebase'>;

export interface TriggerOAuthLoginAction extends PayloadAction<OAuthLoginProviders> {
    type: Types.TRIGGER_OAUTH_LOGIN;
}

export interface ProviderObject<T> {
    data: T;
    provider: keyof UserCredentials;
}

export function checkSpotifyLoginStatus(): CheckSpotifyLoginStatusAction {
    return { type: Types.CHECK_SPOTIFY_LOGIN_STATUS };
}

export function exchangeCodeFail(provider: keyof UserCredentials, err: Error): ExchangeCodeFailAction {
    return {
        type: Types.EXCHANGE_CODE_Fail,
        error: true,
        payload: { provider, data: err },
    };
}

export function exchangeCodeStart(provider: keyof UserCredentials): ExchangeCodeStartAction {
    return {
        type: Types.EXCHANGE_CODE_Start,
        payload: provider,
    };
}

export function notifyAuthStatusKnown(
    provider: keyof UserCredentials,
    user: User | SpotifyApi.UserObjectPrivate | null,
): NotifyAuthStatusKnownAction {
    return {
        type: Types.NOTIFY_AUTH_STATUS_KNOWN,
        payload: { provider, data: user },
    };
}

export function requireFollowUpLogin(withProviders: EnabledProvidersList): RequireFollowUpLoginAction {
    return {
        type: Types.REQUIRE_FOLLOW_UP_LOGIN,
        payload: withProviders,
    };
}

export function triggerOAuthLogin(provider: OAuthLoginProviders): TriggerOAuthLoginAction {
    return {
        type: Types.TRIGGER_OAUTH_LOGIN,
        payload: provider,
    };
}
