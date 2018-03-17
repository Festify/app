import { Actions, Types } from '../actions';
import { TvViewState } from '../state';

export default function(
    state: TvViewState = {
        displayKenBurnsBackground: true,
    },
    action: Actions,
): TvViewState {
    switch (action.type) {
        case Types.CHANGE_DISPLAY_KEN_BURNS_BACKGROUND:
            return {
                ...state,
                displayKenBurnsBackground: action.payload,
            };
        default:
            return state;
    }
}
