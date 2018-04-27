import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless/lib';

import { Actions, Types } from '../actions';
import { SearchFailAction, SearchFinishAction } from '../actions/view-party';
import { PartyViewState } from '../state';

export default function(
    state: PartyViewState = {
        searchInProgress: false,
        searchError: null,
        searchResult: null,
    },
    action: Actions,
): PartyViewState {
    switch (action.type) {
        case LOCATION_CHANGED:
            return {
                ...state,
                searchResult: !(action as any).payload.params || !(action as any).payload.params.query
                    ? null
                    : state.searchResult,
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
                searchError: (action as SearchFailAction).payload,
            };
        case Types.SEARCH_Finish:
            return {
                ...state,
                searchInProgress: false,
                searchError: null,
                searchResult: (action as SearchFinishAction).payload,
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
