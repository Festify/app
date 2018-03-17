import { ConnectPlaybackState } from '../state';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | PlayerInitStartAction
    | PlayerInitFinishAction
    | PlayerErrorAction
    | UpdateConnectStateAction
    | SpotifySdkInitFinishAction
    | PlayAction
    | PauseAction
    | TogglePlaybackStartAction
    | TogglePlaybackFinishAction
    | TogglePlaybackFailAction
    | SetPlayerCompatibilityAction;

export interface PlayerErrorAction extends ErrorAction {
    type: Types.PLAYER_ERROR;
}

export interface PlayerInitStartAction {
    type: Types.PLAYER_INIT_Start;
}

export interface PlayerInitFinishAction extends PayloadAction<string> {
    type: Types.PLAYER_INIT_Finish;
}

export interface TogglePlaybackStartAction {
    type: Types.TOGGLE_PLAYBACK_Start;
}

export interface TogglePlaybackFinishAction {
    type: Types.TOGGLE_PLAYBACK_Finish;
}

export interface TogglePlaybackFailAction extends ErrorAction {
    type: Types.TOGGLE_PLAYBACK_Fail;
}

export interface UpdateConnectStateAction extends PayloadAction<ConnectPlaybackState> {
    type: Types.UPDATE_CONNECT_STATE;
}

export interface SpotifySdkInitFinishAction {
    type: Types.SPOTIFY_SDK_INIT_Finish;
}

export interface PlayAction extends PayloadAction<{trackId: string, position: number}> {
    type: Types.PLAY;
}

export interface PauseAction {
    type: Types.PAUSE;
}

export interface SetPlayerCompatibilityAction extends PayloadAction<boolean> {
    type: Types.SET_PLAYER_COMPATIBILITY;
}

export function playerInitFinish(deviceId: string): PlayerInitFinishAction {
    return {
        type: Types.PLAYER_INIT_Finish,
        payload: deviceId,
    };
}

export function playerError(error: Error): PlayerErrorAction {
    return {
        type: Types.PLAYER_ERROR,
        error: true,
        payload: error,
    };
}

export function play(trackId: string, position: number): PlayAction {
    return { type: Types.PLAY, payload: {trackId, position} };
}

export function pause(): PauseAction {
    return { type: Types.PAUSE };
}

export function spotifySdkInitFinish(): SpotifySdkInitFinishAction {
    return { type: Types.SPOTIFY_SDK_INIT_Finish };
}

export function togglePlaybackStart(): TogglePlaybackStartAction {
    return { type: Types.TOGGLE_PLAYBACK_Start };
}

export function togglePlaybackFinish(): TogglePlaybackFinishAction {
    return { type: Types.TOGGLE_PLAYBACK_Finish };
}

export function togglePlaybackFail(err: Error): TogglePlaybackFailAction {
    return {
        type: Types.TOGGLE_PLAYBACK_Fail,
        error: true,
        payload: err,
    };
}

export function setPlayerCompatibility(compatible: boolean): SetPlayerCompatibilityAction {
    return {
        type: Types.SET_PLAYER_COMPATIBILITY,
        payload: compatible,
    };
}
