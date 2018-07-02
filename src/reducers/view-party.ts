import { LOCATION_CHANGED } from '@festify/redux-little-router';

import { Actions, Types } from '../actions';
import { ChangeDisplayLoginModalAction, SearchFailAction, SearchFinishAction } from '../actions/view-party';
import { PartyViewState } from '../state';

export default function(
    state: PartyViewState = {
        loginModalOpen: false,
        searchInProgress: false,
        searchError: null,
        searchResult: null,
        userMenuOpen: false,
    },
    action: Actions,
): PartyViewState {
    switch (action.type) {
        case Types.CHANGE_DISPLAY_LOGIN_MODAL:
            return {
                ...state,
                loginModalOpen: (action as ChangeDisplayLoginModalAction).payload,
            };
        case LOCATION_CHANGED:
            return {
                ...state,
                searchResult: !(action as any).payload.params || !(action as any).payload.params.query
                    ? null
                    : state.searchResult,
            };
        case Types.REQUIRE_FOLLOW_UP_LOGIN:
            return {
                ...state,
                loginModalOpen: true,
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
        case Types.TOGGLE_USER_MENU:
            return {
                ...state,
                userMenuOpen: !state.userMenuOpen,
            };
        case Types.CLEANUP_PARTY:
            return {
                ...state,
                searchInProgress: false,
                searchError: null,
                searchResult: null,
                userMenuOpen: false,
            };
        default:
            return state;
    }
}
