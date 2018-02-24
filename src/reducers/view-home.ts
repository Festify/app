import { Actions, Types } from '../actions';
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
        case Types.CHANGE_PARTY_ID:
            return {
                ...state,
                partyId: action.payload,
                partyIdValid: /[0-9]+/.test(action.payload),
            };
        case Types.CREATE_PARTY_Start:
            return {
                ...state,
                partyCreationError: null,
                partyCreationInProgress: true,
            };
        case Types.CREATE_PARTY_Fail:
            return {
                ...state,
                partyCreationError: action.payload,
                partyCreationInProgress: false,
            };
        case Types.JOIN_PARTY_Start:
            return {
                ...state,
                partyJoinError: null,
                partyJoinInProgress: true,
            };
        case Types.JOIN_PARTY_Fail:
            return {
                ...state,
                partyJoinError: action.payload,
                partyJoinInProgress: false,
            };
        case Types.OPEN_PARTY_Start:
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
