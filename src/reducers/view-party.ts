import { LOCATION_CHANGED } from '@festify/redux-little-router';

import { Actions } from '../actions';
import { REQUIRE_FOLLOW_UP_LOGIN } from '../actions/auth';
import { CLEANUP_PARTY } from '../actions/party-data';
import {
    CHANGE_DISPLAY_LOGIN_MODAL,
    SEARCH_FAIL,
    SEARCH_FINISH,
    SEARCH_START,
} from '../actions/view-party';
import { TOGGLE_USER_MENU } from '../actions/view-queue-drawer';
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
        case CHANGE_DISPLAY_LOGIN_MODAL:
            return {
                ...state,
                loginModalOpen: action.payload,
            };
        case LOCATION_CHANGED:
            return {
                ...state,
                searchResult:
                    !(action as any).payload.params || !(action as any).payload.params.query
                        ? null
                        : state.searchResult,
            };
        case REQUIRE_FOLLOW_UP_LOGIN:
            return {
                ...state,
                loginModalOpen: true,
            };
        case SEARCH_START:
            return {
                ...state,
                searchInProgress: true,
                searchError: null,
            };
        case SEARCH_FAIL:
            return {
                ...state,
                searchInProgress: false,
                searchError: action.payload,
            };
        case SEARCH_FINISH:
            return {
                ...state,
                searchInProgress: false,
                searchError: null,
                searchResult: action.payload,
            };
        case TOGGLE_USER_MENU:
            return {
                ...state,
                userMenuOpen: !state.userMenuOpen,
            };
        case CLEANUP_PARTY:
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
