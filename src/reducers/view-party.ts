import { Actions, Types } from '../actions';
import { PartyViewState } from '../state';

export default function(
    state: PartyViewState = { searchInput: '' },
    action: Actions,
): PartyViewState {
    switch (action.type) {
        case Types.CHANGE_SEARCH_INPUT_TEXT:
            return {
                ...state,
                searchInput: action.payload,
            };
        default:
            return state;
    }
}
