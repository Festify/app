import { put, takeEvery } from 'redux-saga/effects';

import { Types } from '../actions';
import { changeDisplayKenBurnsBackground, ChangeDisplayKenBurnsBackgroundAction } from '../actions/party-settings';

const KEN_BURNS_LS_KEY = 'DisplayKenBurnsBackground';

function* loadKenBurnsValue() {
    const lsVal = localStorage.getItem(KEN_BURNS_LS_KEY);
    if (lsVal) {
        yield put(changeDisplayKenBurnsBackground(lsVal === 'true'));
    }
}

function persistToLocalStorage(action: ChangeDisplayKenBurnsBackgroundAction) {
    localStorage.setItem(KEN_BURNS_LS_KEY, action.payload ? 'true' : 'false');
}

export default function*() {
    yield* loadKenBurnsValue();

    yield takeEvery(Types.CHANGE_DISPLAY_KEN_BURNS_BACKGROUND, persistToLocalStorage);
}
