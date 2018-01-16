import { Actions, Types } from '../actions';
import { HomeViewState } from '../state';

export default function(
    state: HomeViewState = {
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
            if (!state.partyJoinInProgress) {
                return state;
            }

            return {
                ...state,
                partyJoinError: null,
                partyJoinInProgress: false,
            };
        default:
            return state;
    }
}
