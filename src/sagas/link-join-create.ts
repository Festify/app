import { LOCATION_CHANGED } from '@festify/redux-little-router';
import { put, select, take } from 'redux-saga/effects';

import {
    notifyAuthStatusKnown,
    triggerOAuthLogin,
    NOTIFY_AUTH_STATUS_KNOWN,
} from '../actions/auth';
import { createPartyStart, joinPartyStart } from '../actions/party-data';
import { changePartyId } from '../actions/view-home';
import { State } from '../state';

/**
 * The saga that handles support for query parameters passed to the site
 * to trigger initial actions like joining or creating a party.
 */
export default function*() {
    const loc = yield take(LOCATION_CHANGED);
    const query = loc.payload.query || {};

    if ('create' in query) {
        const state: State = yield select();

        if (state.user.credentials.spotify.authorizationError) {
            return;
        }
        while (true) {
            const { payload: authPayload }: ReturnType<typeof notifyAuthStatusKnown> = yield take(
                NOTIFY_AUTH_STATUS_KNOWN,
            );
            if (authPayload.provider === 'spotify' && !!authPayload.data) {
                break;
            }
        }

        const maybeUser = yield select((s: State) => s.user.credentials.spotify.user);
        yield put(maybeUser ? createPartyStart() : triggerOAuthLogin('spotify'));
    } else if (query.join) {
        yield put(changePartyId(query.join));
        yield put(joinPartyStart());
    } else if (/\/([0-9]{1,8})/g.test(loc.payload.pathname)) {
        yield put(changePartyId(loc.payload.pathname.substr(1)));
        yield put(joinPartyStart());
    }
}
