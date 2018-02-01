import {
    go,
    goBack,
    goForward,
    initializeCurrentLocation,
    push,
    replace,
    replaceRoutes,
} from "@mraerino/redux-little-router-reactless";
import { ThunkAction } from 'redux-thunk';

import { State } from '../state';

import { Actions as AuthActions } from './auth';
import { Actions as MetadataActions } from './metadata';
import { Actions as PartyDataActions } from './party-data';
import { Actions as SettingsActions } from './party-settings';
import { Actions as PlaybackSpotifyActions } from './playback-spotify';
import { Actions as HomeViewActions } from './view-home';
import { Actions as PartyViewActions } from './view-party';

export type RouterActions =
    | typeof push
    | typeof replace
    | typeof go
    | typeof goBack
    | typeof goForward
    | typeof replaceRoutes
    | typeof initializeCurrentLocation;

export type Actions =
    | AuthActions
    | HomeViewActions
    | MetadataActions
    | PartyDataActions
    | PartyViewActions
    | PlaybackSpotifyActions
    | RouterActions
    | SettingsActions
    | ShowToastAction
    | HideToastAction;

export const enum Types {
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT = 'CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT',
    CLEANUP_PARTY = 'CLEANUP_PARTY',
    EXCHANGE_CODE_Start = 'EXCHANGE_CODE_START',
    EXCHANGE_CODE_Fail = 'EXCHANGE_CODE_FAIL',
    EXCHANGE_CODE_Finish = 'EXCHANGE_CODE_FINISH',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    INSERT_FALLBACK_PLAYLIST_Start = 'INSERT_FALLBACK_PLAYLIST_START',
    INSERT_FALLBACK_PLAYLIST_Finish = 'INSERT_FALLBACK_PLAYLIST_FINISH',
    INSERT_FALLBACK_PLAYLIST_Progress = 'INSERT_FALLBACK_PLAYLIST_PROGRESS',
    INSERT_FALLBACK_PLAYLIST_Fail = 'INSERT_FALLBACK_PLAYLIST_FAIL',
    LOAD_PLAYLISTS_Start = 'LOAD_PLAYLISTS_START',
    LOAD_PLAYLISTS_Fail = 'LOAD_PLAYLISTS_FAIL',
    NOTIFY_AUTH_STATUS_KNOWN = 'NOTIFY_AUTH_STATUS_KNOWN',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
    PLAYER_ERROR = 'PLAYER_ERROR',
    PLAYER_INIT_Start = 'PLAYER_INIT_START',
    PLAYER_INIT_Finish = 'PLAYER_INIT_FINISH',
    SEARCH_Start = 'SEARCH_START',
    SEARCH_Finish = 'SEARCH_FINISH',
    SEARCH_Fail = 'SEARCH_FAIL',
    SHOW_TOAST = 'SHOW_TOAST',
    HIDE_TOAST = 'HIDE_TOAST',
    TOGGLE_VOTE = 'TOGGLE_VOTE',
    TOGGLE_PLAYBACK_Start = 'TOGGLE_PLAYBACK_START',
    TOGGLE_PLAYBACK_Finish = 'TOGGLE_PLAYBACK_FINISH',
    TOGGLE_PLAYBACK_Fail = 'TOGGLE_PLAYBACK_FAIL',
    UPDATE_CONNECT_STATE = 'UPDATE_CONNECT_STATE',
    UPDATE_NETWORK_CONNECTION_STATE = 'UPDATE_NETWORK_CONNECTION_STATE',
    UPDATE_METADATA = 'UPDATE_METADATA',
    UPDATE_PARTY = 'UPDATE_PARTY',
    UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_USER_PLAYLISTS = 'UPDATE_USER_PLAYLISTS',
    UPDATE_USER_VOTES = 'UPDATE_USER_VOTES',
}

export interface PayloadAction<T> {
    payload: T;
}

export interface ErrorAction extends PayloadAction<Error> {
    error: true;
}

export interface ToastData {
    duration: number;
    text: string;
}

export interface ShowToastAction extends PayloadAction<string> {
    type: Types.SHOW_TOAST;
}

export interface HideToastAction {
    type: Types.HIDE_TOAST;
}

let toastTimeout: number = -1;
export function showToast(text: string, duration: number = 3000): ThunkAction<void, State, void> {
    return dispatch => {
        if (duration < 0 || isNaN(duration) || !isFinite(duration)) {
            throw new Error("Invalid duration.");
        }

        clearTimeout(toastTimeout);
        dispatch({
            type: Types.SHOW_TOAST,
            payload: text,
        } as ShowToastAction);

        toastTimeout = setTimeout(() => {
            clearTimeout(toastTimeout);
            toastTimeout = -1;
            dispatch({
                type: Types.HIDE_TOAST,
                payload: text,
            } as HideToastAction);
        }, duration);
    };
}
