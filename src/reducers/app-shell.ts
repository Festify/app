import { Actions, HIDE_TOAST, SHOW_TOAST } from '../actions';
import { AppShellState } from '../state';

export default function(
    state: AppShellState = { currentToast: null },
    action: Actions,
): AppShellState {
    switch (action.type) {
        case HIDE_TOAST:
            return {
                ...state,
                currentToast: null,
            };
        case SHOW_TOAST:
            return {
                ...state,
                currentToast: action.payload.text,
            };
        default:
            return state;
    }
}
