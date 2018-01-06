import {
    go,
    goBack,
    goForward,
    initializeCurrentLocation,
    push,
    replace,
    replaceRoutes,
} from "@mraerino/redux-little-router-reactless";

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
    | SettingsActions;

export const enum Types {
    NOTIFY_AUTH_STATUS_KNOWN = 'NOTIFY_AUTH_STATUS_KNOWN',
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT = 'CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    INSERT_FALLBACK_PLAYLIST_Start = 'INSERT_FALLBACK_PLAYLIST_START',
    INSERT_FALLBACK_PLAYLIST_Finish = 'INSERT_FALLBACK_PLAYLIST_FINISH',
    INSERT_FALLBACK_PLAYLIST_Progress = 'INSERT_FALLBACK_PLAYLIST_PROGRESS',
    INSERT_FALLBACK_PLAYLIST_Fail = 'INSERT_FALLBACK_PLAYLIST_FAIL',
    LOAD_PLAYLISTS_Start = 'LOAD_PLAYLISTS_START',
    LOAD_PLAYLISTS_Fail = 'LOAD_PLAYLISTS_FAIL',
    CLEANUP_PARTY = 'CLEANUP_PARTY',
    TOGGLE_VOTE = 'TOGGLE_VOTE',
    UPDATE_CONNECT_STATE = 'UPDATE_CONNECT_STATE',
    UPDATE_METADATA = 'UPDATE_METADATA',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_PARTY = 'UPDATE_PARTY',
    UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE',
    UPDATE_USER_PLAYLISTS = 'UPDATE_USER_PLAYLISTS',
    UPDATE_USER_VOTES = 'UPDATE_USER_VOTES',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
    PLAYER_INIT_Start = 'PLAYER_INIT_START',
    PLAYER_INIT_Finish = 'PLAYER_INIT_FINISH',
    TOGGLE_PLAYBACK_Start = 'TOGGLE_PLAYBACK_Start',
    TOGGLE_PLAYBACK_Finish = 'TOGGLE_PLAYBACK_Finish',
    TOGGLE_PLAYBACK_Fail = 'TOGGLE_PLAYBACK_Fail',
    PLAYER_ERROR = 'PLAYER_ERROR',
    SEARCH_Start = 'SEARCH_START',
    SEARCH_Finish = 'SEARCH_FINISH',
    SEARCH_Fail = 'SEARCH_FAIL',
}

export interface PayloadAction<T> {
    payload: T;
}

export interface ErrorAction extends PayloadAction<Error> {
    error: true;
}
