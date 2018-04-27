import { UserCredential } from '@firebase/auth-types';
import { HttpsCallableResult } from '@firebase/functions-types';
import { replace, LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { apply, call, put, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { CLIENT_ID } from '../../spotify.config';
import { showToast, Types } from '../actions';
import { exchangeCodeFail, exchangeCodeStart, notifyAuthStatusKnown, TriggerOAuthLoginAction } from '../actions/auth';
import { requireAuth, AuthData } from '../util/auth';
import firebase from '../util/firebase';
import { fetchWithAccessToken, LOCALSTORAGE_KEY, SCOPES } from '../util/spotify-auth';

const AUTH_REDIRECT_LOCAL_STORAGE_KEY = 'authRedirect';
const exchangeCodeFn = firebase.functions!().httpsCallable('exchangeCode');

function* checkSpotifyLoginStatus() {
    if (!localStorage[LOCALSTORAGE_KEY]) {
        yield put(notifyAuthStatusKnown('spotify', null));
        return;
    }

    try {
        const resp = yield call(fetchWithAccessToken, '/me');
        const user = yield resp.json();

        yield put(notifyAuthStatusKnown('spotify', user));
    } catch (err) {
        console.error('Failed to fetch Spotify Login Status.');
        return;
    }
}

function* exchangeCode() {
    const action = yield take(LOCATION_CHANGED);
    const { code, error, state } = action.payload.query;

    if (state !== 'SPOTIFY_AUTH') {
        return;
    }

    yield put(exchangeCodeStart('spotify'));

    if (error === 'access_denied') {
        const e = new Error('Oops, Spotify denied access.');
        yield put(exchangeCodeFail('spotify', e));
        return;
    }

    yield put(replace(localStorage[AUTH_REDIRECT_LOCAL_STORAGE_KEY] || '/', {}));
    localStorage.removeItem(AUTH_REDIRECT_LOCAL_STORAGE_KEY);

    yield call(requireAuth);

    let resp: HttpsCallableResult;
    try {
        resp = yield call(exchangeCodeFn, { callbackUrl: location.origin, code });
    } catch (err) {
        const e = new Error(`Token exchange failed with ${err.code}: ${err.message}.`);
        yield put(exchangeCodeFail('spotify', e));
        return;
    }

    const { accessToken, expiresIn, firebaseToken, refreshToken } = resp.data;

    let newUser: UserCredential;
    try {
        newUser = yield firebase.auth!().signInAndRetrieveDataWithCustomToken(firebaseToken);
    } catch (err) {
        const e = new Error(`Firebase login failed with ${err.code}: ${err.message}`);
        yield put(exchangeCodeFail('spotify', e));
        return;
    }

    const data = new AuthData(
        accessToken,
        Date.now() + (expiresIn * 1000),
        refreshToken,
    );
    yield apply(data, data.saveTo, [LOCALSTORAGE_KEY]);

    yield* checkSpotifyLoginStatus();
    yield put(showToast(newUser.user!.displayName ? `Welcome, ${newUser.user!.displayName}!` : 'Welcome!'));
}

const oauthUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}`
    + `&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code`
    + `&scope=${encodeURIComponent(SCOPES.join(' '))}&state=SPOTIFY_AUTH&show_dialog=true`;

function* triggerOAuthLogin(ac: TriggerOAuthLoginAction) {
    if (ac.payload !== 'spotify') {
        return;
    }

    localStorage[AUTH_REDIRECT_LOCAL_STORAGE_KEY] =
        window.location.pathname + window.location.search + window.location.hash;
    yield call(console.log, 'Only the swaggiest of developers hacking on Festify will see this 🙌.');
    window.location.href = oauthUrl;
}

export default function*() {
    yield takeEvery(Types.CHECK_SPOTIFY_LOGIN_STATUS, checkSpotifyLoginStatus);
    yield takeLatest(Types.TRIGGER_OAUTH_LOGIN, triggerOAuthLogin);

    yield* exchangeCode();
}
