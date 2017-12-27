import { Action } from 'redux';

import { Track, TracksState } from "../state";

export type Actions =
    | ChangePartyIdAction
    | JoinPartyStartAction
    | UpdateTracksAction;

export const enum Types {
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
}

export interface PayloadAction<T> {
    payload: T;
}

export interface ChangePartyIdAction extends PayloadAction<string> {
    type: Types.CHANGE_PARTY_ID;
}
export interface JoinPartyFailAction extends PayloadAction<Error> {
    type: Types.JOIN_PARTY_Fail;
    error: true;
}
export interface JoinPartyStartAction {
    type: Types.JOIN_PARTY_Start;
}
export interface UpdateTracksAction extends PayloadAction<TracksState> {
    type: Types.UPDATE_TRACKS;
}
