import { Actions } from '../actions';
import {
    CREATE_PARTY_FAIL,
    CREATE_PARTY_START,
    JOIN_PARTY_FAIL,
    JOIN_PARTY_START,
    OPEN_PARTY_START,
} from '../actions/party-data';
import { CHANGE_PARTY_ID } from '../actions/view-home';
import { HomeViewState } from '../state';

export default function(
    state: HomeViewState = {
        partyCreationError: null,
        partyCreationInProgress: false,
        partyJoinError: null,
        partyJoinInProgress: false,
        partyId: '',
        partyIdValid: false,
    },
    action: Actions,
): HomeViewState {
    switch (action.type) {
        case CHANGE_PARTY_ID:
            return {
                ...state,
                partyId: action.payload,
                partyIdValid: /[0-9]+/.test(action.payload),
            };
        case CREATE_PARTY_START:
            return {
                ...state,
                partyCreationError: null,
                partyCreationInProgress: true,
            };
        case CREATE_PARTY_FAIL:
            return {
                ...state,
                partyCreationError: action.payload,
                partyCreationInProgress: false,
            };
        case JOIN_PARTY_START:
            return {
                ...state,
                partyJoinError: null,
                partyJoinInProgress: true,
            };
        case JOIN_PARTY_FAIL:
            return {
                ...state,
                partyJoinError: action.payload,
                partyJoinInProgress: false,
            };
        case OPEN_PARTY_START:
            if (!state.partyJoinInProgress && !state.partyCreationInProgress) {
                return state;
            }

            return {
                ...state,
                partyCreationError: null,
                partyCreationInProgress: false,
                partyJoinError: null,
                partyJoinInProgress: false,
            };
        default:
            return state;
    }
}
