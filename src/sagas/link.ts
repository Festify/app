import { push } from '@mraerino/redux-little-router-reactless';
import { apply, put, takeEvery } from 'redux-saga/effects';

import { ClickLinkAction, Types } from '../actions';

const MOUSE_BTN_LEFT = 0;

function* handleLinkClick(ac: ClickLinkAction) {
    const { event, route } = ac.payload;
    if ((event.button && event.button !== MOUSE_BTN_LEFT) ||
        event.shiftKey || event.altKey || event.metaKey || event.ctrlKey ||
        event.defaultPrevented) {
        return;
    }

    yield apply(event, event.preventDefault);
    yield put(push(route, {}));
}

export default function*() {
    yield takeEvery(Types.CLICK_LINK, handleLinkClick);
}
