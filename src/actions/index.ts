import {
    go,
    goBack,
    goForward,
    initializeCurrentLocation,
    push,
    replace,
    replaceRoutes,
} from '@mraerino/redux-little-router-reactless';

import { Actions as AuthActions } from './auth';
import { Actions as MetadataActions } from './metadata';
import { Actions as PartyDataActions } from './party-data';
import { Actions as PlaybackSpotifyActions } from './playback-spotify';
import { Actions as QueueActions } from './queue';
import { Actions as HomeViewActions } from './view-home';
import { Actions as PartyViewActions } from './view-party';
import { Actions as SettingsActions } from './view-party-settings';
import { Actions as ShareActions } from './view-party-share';

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
    | QueueActions
    | RouterActions
    | SettingsActions
    | ShareActions
    | ShowToastAction
    | HideToastAction;

export const enum Types {
    ASSIGN_INSTANCE_ID = 'ASSIGN_INSTANCE_ID',
    BECOME_PLAYBACK_MASTER = 'BECOME_PLAYBACK_MASTER',
    RESIGN_PLAYBACK_MASTER = 'RESIGN_PLAYBACK_MASTER',
    INSTALL_PLAYBACK_MASTER = 'INSTALL_PLAYBACK_MASTER',
    CLICK_LINK = 'CLICK_LINK',
    CHANGE_DISPLAY_KEN_BURNS_BACKGROUND = 'CHANGE_DISPLAY_KEN_BURNS_BACKGROUND',
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT = 'CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT',
    CHANGE_TRACK_SEARCH_INPUT = 'CHANGE_TRACK_SEARCH_INPUT',
    CHECK_SPOTIFY_LOGIN_STATUS = 'CHECK_SPOTIFY_LOGIN_STATUS',
    CLEANUP_PARTY = 'CLEANUP_PARTY',
    CREATE_PARTY_Start = 'CREATE_PARTY_START',
    CREATE_PARTY_Fail = 'CREATE_PARTY_FAIL',
    EXCHANGE_CODE_Start = 'EXCHANGE_CODE_START',
    EXCHANGE_CODE_Fail = 'EXCHANGE_CODE_FAIL',
    EXCHANGE_CODE_Finish = 'EXCHANGE_CODE_FINISH',
    FLUSH_QUEUE_Start = 'FLUSH_QUEUE_START',
    FLUSH_QUEUE_Fail = 'FLUSH_QUEUE_FAIL',
    FLUSH_QUEUE_Finish = 'FLUSH_QUEUE_FINISH',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    INSERT_FALLBACK_PLAYLIST_Start = 'INSERT_FALLBACK_PLAYLIST_START',
    INSERT_FALLBACK_PLAYLIST_Finish = 'INSERT_FALLBACK_PLAYLIST_FINISH',
    INSERT_FALLBACK_PLAYLIST_Progress = 'INSERT_FALLBACK_PLAYLIST_PROGRESS',
    INSERT_FALLBACK_PLAYLIST_Fail = 'INSERT_FALLBACK_PLAYLIST_FAIL',
    LOAD_PLAYLISTS_Start = 'LOAD_PLAYLISTS_START',
    LOAD_PLAYLISTS_Fail = 'LOAD_PLAYLISTS_FAIL',
    NOTIFY_AUTH_STATUS_KNOWN = 'NOTIFY_AUTH_STATUS_KNOWN',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
    OPEN_PARTY_Finish = 'OPEN_PARTY_FINISH',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    PLAYER_ERROR = 'PLAYER_ERROR',
    PLAYER_INIT_Start = 'PLAYER_INIT_START',
    PLAYER_INIT_Finish = 'PLAYER_INIT_FINISH',
    QUEUE_DRAG_Enter = 'QUEUE_DRAG_Enter',
    QUEUE_DRAG_Over = 'QUEUE_DRAG_Over',
    QUEUE_DRAG_Drop = 'QUEUE_DRAG_Drop',
    REMOVE_TRACK = 'REMOVE_TRACK',
    SEARCH_Start = 'SEARCH_START',
    SEARCH_Finish = 'SEARCH_FINISH',
    SEARCH_Fail = 'SEARCH_FAIL',
    SHARE_PARTY = 'SHARE_PARTY',
    SHOW_TOAST = 'SHOW_TOAST',
    HIDE_TOAST = 'HIDE_TOAST',
    SET_VOTE = 'SET_VOTE',
    TOGGLE_PLAYBACK_Start = 'TOGGLE_PLAYBACK_START',
    TOGGLE_PLAYBACK_Finish = 'TOGGLE_PLAYBACK_FINISH',
    TOGGLE_PLAYBACK_Fail = 'TOGGLE_PLAYBACK_FAIL',
    TRIGGER_SPOTIFY_OAUTH_LOGIN = 'TRIGGER_SPOTIFY_OAUTH_LOGIN',
    UPDATE_NETWORK_CONNECTION_STATE = 'UPDATE_NETWORK_CONNECTION_STATE',
    UPDATE_METADATA = 'UPDATE_METADATA',
    UPDATE_PARTY = 'UPDATE_PARTY',
    UPDATE_PARTY_NAME = 'UPDATE_PARTY_NAME',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_USER_PLAYLISTS = 'UPDATE_USER_PLAYLISTS',
    UPDATE_USER_VOTES = 'UPDATE_USER_VOTES',
    UPDATE_PLAYBACK_STATE = 'UPDATE_PLAYBACK_STATE',
    SET_PLAYER_COMPATIBILITY = 'SET_PLAYER_COMPATIBILITY',
    SPOTIFY_SDK_INIT_Finish = 'SPOTIFY_SDK_INIT_FINISH',
    PLAY = 'PLAY',
    PAUSE = 'PAUSE',
}

export interface PayloadAction<T> {
    payload: T;
}

export interface ErrorAction extends PayloadAction<Error> {
    error: true;
}

export interface AssignInstanceId extends PayloadAction<string> {
    type: Types.ASSIGN_INSTANCE_ID;
}

export interface ClickLinkAction extends PayloadAction<LinkData> {
    type: Types.CLICK_LINK;
}

export interface QueueDragEnterAction extends PayloadAction<DragData> {
    type: Types.QUEUE_DRAG_Enter;
}

export interface QueueDragOverAction extends PayloadAction<DragData> {
    type: Types.QUEUE_DRAG_Over;
}

export interface QueueDragDropAction extends PayloadAction<DragData> {
    type: Types.QUEUE_DRAG_Drop;
}

export interface HideToastAction {
    type: Types.HIDE_TOAST;
}

export interface LinkData {
    event: MouseEvent;
    route: string;
}

export interface DragData {
    event: DragEvent;
}

export interface ShowToastAction extends PayloadAction<ToastData> {
    type: Types.SHOW_TOAST;
}

export interface ToastData {
    duration: number;
    text: string;
}

export function clickLink(event: MouseEvent, route: string): ClickLinkAction {
    return {
        type: Types.CLICK_LINK,
        payload: { event, route },
    };
}

export function queueDragEnter(event: DragEvent): QueueDragEnterAction {
    return {
        type: Types.QUEUE_DRAG_Enter,
        payload: { event },
    };
}

export function queueDragOver(event: DragEvent): QueueDragOverAction {
    return {
        type: Types.QUEUE_DRAG_Over,
        payload: { event },
    };
}

export function queueDragDrop(event: DragEvent): QueueDragDropAction {
    return {
        type: Types.QUEUE_DRAG_Drop,
        payload: { event },
    };
}

export function generateInstanceId(): AssignInstanceId {
    return {
        type: Types.ASSIGN_INSTANCE_ID,
        payload: String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
    };
}

export function hideToast(): HideToastAction {
    return { type: Types.HIDE_TOAST };
}

export function showToast(text: string, duration: number = 3000): ShowToastAction {
    if (duration < 0) {
        throw new Error("Toast duration < 0");
    }

    return {
        type: Types.SHOW_TOAST,
        payload: { duration, text },
    };
}
