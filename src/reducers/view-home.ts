import { Actions, Types } from '../actions';
import { HomeViewState } from '../state';

export default function(
    state: HomeViewState = { partyId: '', partyIdValid: false },
    action: Actions,
): HomeViewState {
    switch (action.type) {
        case Types.CHANGE_PARTY_ID:
            return {
                ...state,
                partyId: action.payload,
                partyIdValid: /[0-9]+/.test(action.payload),
            };
        default:
            return state;
    }
}
