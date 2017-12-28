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
    UPDATE_METADATA = 'UPDATE_METADATA',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_PARTY = 'UPDATE_PARTY',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
}

export interface PayloadAction<T> {
    payload: T;
}
