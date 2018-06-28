import { goBack, Location, LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { put, takeEvery } from 'redux-saga/effects';

import { showToast } from '../actions';
import { Views } from '../routing';

let prevView: Views;
function* lazyLoadViews(ac: Location) {
    if (!ac.payload.result) {
        return;
    }

    const view: Views = ac.payload.result.view;
    if (view === Views.Home || view === prevView) {
        return;
    }

    prevView = view;
    try {
        if (view === Views.Party) {
            yield import('../views/view-party');
        } else {
            yield import('../views/view-tv');
        }
    } catch (err) {
        yield put(showToast(`Failed to load ${view === Views.Party ? 'queue' : 'TV mode'}. Please try again.`));
        yield put(goBack());
    }
}

export default function*() {
    yield takeEvery(LOCATION_CHANGED, lazyLoadViews);
}
