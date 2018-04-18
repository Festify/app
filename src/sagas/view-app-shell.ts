import { goBack, Location, LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { put, takeEvery } from 'redux-saga/effects';

import { showToast } from '../actions';
import { Views } from '../routing';

let partyViewImported = false;
let tvModeImported = false;

function* lazyLoadViews(ac: Location) {
    if (!ac.payload.result) {
        return;
    }

    const view: Views = ac.payload.result.view;
    try {
        switch (view) {
            case Views.Party:
                if (partyViewImported) {
                    return;
                }

                yield import('../views/view-party');
                partyViewImported = true;
                break;
            case Views.Tv:
                if (tvModeImported) {
                    return;
                }

                yield import('../views/view-tv');
                tvModeImported = true;
                break;
        }
    } catch (err) {
        yield put(showToast(`Failed to load ${view === Views.Party ? 'queue' : 'TV mode'}. Please try again.`));
        yield put(goBack());
    }
}

export default function*() {
    yield takeEvery(LOCATION_CHANGED, lazyLoadViews);
}
