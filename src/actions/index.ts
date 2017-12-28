import { Actions as MetadataActions } from './metadata';
import { Actions as PartyDataActions } from './party-data';
import { Actions as HomeViewActions } from './view-home';
import { Actions as PartyViewActions } from './view-party';

export type Actions =
    | HomeViewActions
    | MetadataActions
    | PartyDataActions
    | PartyViewActions;

export const enum Types {
    CHANGE_SEARCH_INPUT_TEXT = 'CHANGE_SEARCH_INPUT_TEXT',
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    CLEANUP_PARTY = 'CLEANUP_PARTY',
    TOGGLE_VOTE = 'TOGGLE_VOTE',
    UPDATE_METADATA = 'UPDATE_METADATA',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_PARTY = 'UPDATE_PARTY',
    UPDATE_USER_VOTES = 'UPDATE_USER_VOTES',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
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
