import { Actions, Types } from '../actions';
import { PartyViewState } from '../state';

export default function(
    state: PartyViewState = {
        searchInput: '',
        searchInProgress: false,
        searchError: null,
        searchResult: null,
    },
    action: Actions,
): PartyViewState {
    switch (action.type) {
        case Types.CHANGE_SEARCH_INPUT_TEXT:
            return {
                ...state,
                searchInput: action.payload,
                searchResult: action.payload === '' ? null : state.searchResult,
            };
        case Types.SEARCH_Start:
            return {
                ...state,
                searchInProgress: true,
                searchError: null,
            };
        case Types.SEARCH_Fail:
            return {
                ...state,
                searchInProgress: false,
                searchError: action.payload,
            };
        case Types.SEARCH_Finish:
            return {
                ...state,
                searchInProgress: false,
                searchError: null,
                searchResult: action.payload,
            };
        case Types.CLEANUP_PARTY:
            return {
                ...state,
                searchInProgress: false,
                searchError: null,
                searchResult: null,
            };
        default:
            return state;
    }
}
