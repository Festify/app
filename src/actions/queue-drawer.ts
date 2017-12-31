import { push } from '@mraerino/redux-little-router-reactless';
import { ThunkAction } from 'redux-thunk';

import { State } from '../state';

const MOUSE_BTN_LEFT = 0;

export function handleClick(ev: MouseEvent, route: string): ThunkAction<void, State, void> {
    return (dispatch) => {
        if ((ev.button && ev.button !== MOUSE_BTN_LEFT) ||
            ev.shiftKey || ev.altKey || ev.metaKey || ev.ctrlKey ||
            ev.defaultPrevented) {
            return;
        }

        ev.preventDefault();
        dispatch(push(route, {}));
    };
}
