import { Actions as PartyDataActions } from './party-data';
import { Actions as HomeViewActions } from './view-home';

export type Actions =
    | HomeViewActions
    | PartyDataActions;

export const enum Types {
    CHANGE_PARTY_ID = 'CHANGE_PARTY_ID',
    JOIN_PARTY_Start = 'JOIN_PARTY_START',
    JOIN_PARTY_Fail = 'JOIN_PARTY_FAIL',
    CLEANUP_PARTY = 'CLEANUP_PARTY',
    UPDATE_TRACKS = 'UPDATE_TRACKS',
    UPDATE_PARTY = 'UPDATE_PARTY',
    OPEN_PARTY_Start = 'OPEN_PARTY_START',
    OPEN_PARTY_Fail = 'OPEN_PARTY_FAIL',
}

export interface PayloadAction<T> {
    payload: T;
}
