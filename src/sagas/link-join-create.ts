import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { put, select, take } from 'redux-saga/effects';

import { Types } from '../actions';
import { triggerOAuthLogin } from '../actions/auth';
import { createPartyStart, joinPartyStart } from '../actions/party-data';
import { changePartyId } from '../actions/view-home';
import { State } from '../state';

/**
 * The saga that handles support for query parameters passed to the site
 * to trigger initial actions like joining or creating a party.
 */
export default function*() {
    const loc = yield take(LOCATION_CHANGED);
    const query = loc.payload.query || {};

    if ('create' in query) {
        const state: State = yield select();

        if (state.user.credentials.spotify.authorizationError) {
            return;
        }
        if (!state.user.credentials.spotify.statusKnown) {
            yield take(Types.NOTIFY_AUTH_STATUS_KNOWN);
        }
        if (state.user.credentials.spotify.authorizing) {
            yield take(Types.NOTIFY_AUTH_STATUS_KNOWN);
        }

        const maybeUser = yield select((s: State) => s.user.credentials.spotify.user);
        yield put(maybeUser ? createPartyStart() : triggerOAuthLogin('spotify'));
    } else if (query.join) {
        yield put(changePartyId(query.join));
        yield put(joinPartyStart());
    }
}
