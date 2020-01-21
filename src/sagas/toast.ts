import { delay } from 'redux-saga';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';

import { hideToast, showToast, Actions, SHOW_TOAST } from '../actions';
import { EXCHANGE_CODE_FAIL } from '../actions/auth';

function* displayToast(action: ReturnType<typeof showToast>) {
    if (!Number.isFinite(action.payload.duration)) {
        return;
    }

    yield call(delay, action.payload.duration);
    yield put(hideToast());
}

function* displayErrorToast(action: Actions) {
    // Check whether action has an `error` prop
    if (!('error' in action)) {
        return;
    }

    yield put(
        showToast(
            action.type === EXCHANGE_CODE_FAIL
                ? action.payload.data.message
                : action.payload.message,
            10000,
        ),
    );
}

export default function*() {
    yield takeLatest(SHOW_TOAST, displayToast);
    yield takeEvery('*', displayErrorToast);
}
