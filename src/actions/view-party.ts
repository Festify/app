import { Track, TrackReference } from '../state';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | ToggleVoteAction
    | SearchStartAction
    | SearchFinishAction
    | SearchFailAction;

export interface ChangeSearchInputTextAction extends PayloadAction<string> {
    type: Types.CHANGE_SEARCH_INPUT_TEXT;
}

export interface ToggleVoteAction extends PayloadAction<[TrackReference, boolean]> {
    type: Types.TOGGLE_VOTE;
}

export interface SearchStartAction {
    type: Types.SEARCH_Start;
}

export interface SearchFinishAction extends PayloadAction<Record<string, Track>> {
    type: Types.SEARCH_Finish;
}

export interface SearchFailAction extends ErrorAction {
    type: Types.SEARCH_Fail;
}

export function changeSearchInputText(text: string): ChangeSearchInputTextAction {
    return {
        type: Types.CHANGE_SEARCH_INPUT_TEXT,
        payload: text,
    };
}

export function searchFail(error: Error): SearchFailAction {
    return {
        type: Types.SEARCH_Fail,
        error: true,
        payload: error,
    };
}

export function searchFinish(tracks: Record<string, Track>): SearchFinishAction {
    return {
        type: Types.SEARCH_Finish,
        payload: tracks,
    };
}

export function searchStart(): SearchStartAction {
    return { type: Types.SEARCH_Start };
}
