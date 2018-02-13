import { replace, LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { all, apply, call, put, select, take, takeEvery } from 'redux-saga/effects';

import { TOKEN_EXCHANGE_URL } from '../../spotify.config';
import { showToast, Types } from '../actions';
import {
    exchangeCodeFail,
    exchangeCodeFinish,
    exchangeCodeStart,
    notifyAuthStatusKnown,
} from '../actions/auth';
import { State } from '../state';
import { AuthData } from '../util/auth';
import { fetchWithAccessToken, LOCALSTORAGE_KEY } from '../util/spotify-auth';

function* checkSpotifyLoginStatus() {
    if (!localStorage[LOCALSTORAGE_KEY]) {
        yield put(notifyAuthStatusKnown('spotify', null));
        return;
    }

    const resp = yield call(fetchWithAccessToken, '/me');
    const user = yield resp.json();

    yield put(notifyAuthStatusKnown('spotify', user));
}

function* exchangeCode() {
    const action = yield take(LOCATION_CHANGED);
    const { code, error, state } = action.payload.query;

    if (state !== 'SPOTIFY_AUTH') {
        return;
    }

    yield put(exchangeCodeStart());

    if (error === 'access_denied') {
        const e = new Error("Oops, Spotify denied access.");
        yield put(exchangeCodeFail(e));
        return;
    }

    yield put(replace('/', {}));

    const body = `callbackUrl=${encodeURIComponent(location.origin)}&code=${encodeURIComponent(code)}`;
    const resp = yield call(fetch, TOKEN_EXCHANGE_URL, {
        body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'post',
    });

    const { access_token, expires_in, msg, refresh_token, success } = yield resp.json();

    if (!success) {
        const e = new Error(`Token exchange failed: ${msg}.`);
        yield put(exchangeCodeFail(e));
        return;
    }

    const data = new AuthData(
        access_token,
        Date.now() + (expires_in * 1000),
        refresh_token,
    );

    yield apply(data, data.saveTo, [LOCALSTORAGE_KEY]);
    yield* checkSpotifyLoginStatus();
    yield put(exchangeCodeFinish());

    const { user }: State = yield select();
    const welcomeText = user.spotify.user
        ? `Welcome, ${user.spotify.user.display_name || user.spotify.user.id}!`
        : "Welcome!";
    yield put(showToast(welcomeText));
}

export default function*() {
    yield all([
        takeEvery(Types.CHECK_SPOTIFY_LOGIN_STATUS, checkSpotifyLoginStatus),
        exchangeCode(),
    ]);
}
