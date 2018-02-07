import { Actions, Types } from '../actions';
import { AppShellState } from '../state';

export default function(
    state: AppShellState = { currentToast: null },
    action: Actions,
): AppShellState {
    switch (action.type) {
        case Types.HIDE_TOAST:
            return {
                ...state,
                currentToast: null,
            };
        case Types.SHOW_TOAST:
            return {
                ...state,
                currentToast: action.payload.text,
            };
        default:
            return state;
    }
}
