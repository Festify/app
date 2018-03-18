import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { put, select, take } from 'redux-saga/effects';

import { Types } from '../actions';
import { loginWithSpotify } from '../actions/auth';
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

        if (state.user.spotify.authorizationError) {
            return;
        }
        if (!state.user.spotify.statusKnown) {
            yield take(Types.NOTIFY_AUTH_STATUS_KNOWN);
        }
        if (state.user.spotify.authorizing) {
            yield take(Types.EXCHANGE_CODE_Finish);
        }

        const maybeUser = yield select((s: State) => s.user.spotify.user);
        yield put(maybeUser ? createPartyStart() : loginWithSpotify());
    } else if (query.join) {
        yield put(changePartyId(query.join));
        yield put(joinPartyStart());
    }
}
