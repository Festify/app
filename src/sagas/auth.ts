import { replace, LOCATION_CHANGED } from '@festify/redux-little-router';
import { User, UserCredential } from '@firebase/auth-types';
import { HttpsCallableResult, HttpsError } from '@firebase/functions-types';
import { delay } from 'redux-saga';
import {
    all,
    apply,
    call,
    fork,
    put,
    select,
    take,
    takeEvery,
    takeLatest,
} from 'redux-saga/effects';

import { CLIENT_ID } from '../../spotify.config';
import { showToast } from '../actions';
import {
    checkLoginStatus,
    exchangeCodeFail,
    exchangeCodeStart,
    getFollowUpLoginProviders,
    hasFollowUpCredentials,
    linkFollowUpUser,
    notifyAuthStatusKnown,
    removeSavedFollowUpLoginCredentials,
    requireFollowUpLogin,
    saveFollowUpLoginCredentials,
    triggerOAuthLogin as triggerOAuthLoginAction,
    welcomeUser,
    CHECK_LOGIN_STATUS,
    LOGOUT,
    TRIGGER_OAUTH_LOGIN,
} from '../actions/auth';
import { updatePlaybackState } from '../actions/party-data';
import { changeDisplayLoginModal, CHANGE_DISPLAY_LOGIN_MODAL } from '../actions/view-party';
import { isPlaybackMasterSelector } from '../selectors/party';
import { getProvider, requireAuth, AuthData } from '../util/auth';
import firebase, { functions } from '../util/firebase';
import { fetchWithAccessToken, LOCALSTORAGE_KEY, SCOPES } from '../util/spotify-auth';

const AUTH_REDIRECT_LOCAL_STORAGE_KEY = 'AuthRedirect';
const OAUTH_URL =
    `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}&state=SPOTIFY_AUTH&show_dialog=true`;

function* checkLogin() {
    const user: User = yield call(requireAuth);
    if (!user.isAnonymous && user.providerId) {
        const strippedProviderId = user.providerId.replace('.com', '');
        yield put(notifyAuthStatusKnown(strippedProviderId as any, user));
    }

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
    }
}

/**
 * Handles the case where the user closed the follow-up login modal.
 *
 * We need to clear out the cached credential here to properly reset application state.
 *
 * @param ac the redux action
 */
function* handleFollowUpCancellation(ac: ReturnType<typeof changeDisplayLoginModal>) {
    if (!ac.payload && hasFollowUpCredentials()) {
        yield call(removeSavedFollowUpLoginCredentials);
        yield call(AuthData.remove, LOCALSTORAGE_KEY);
    }
}

function* handleFirebaseOAuth() {
    try {
        const cred: UserCredential = yield firebase.auth().getRedirectResult();
        if (!cred.user) {
            return;
        }
    } catch (err) {
        let e;

        yield call(removeSavedFollowUpLoginCredentials);
        switch (err.code) {
            /*
             * There already exists an account with this email, but using a different OAuth provider.
             * E. g. the user has logged in with Spotify on the host, but now wants to use Google sign-in.
             *
             * Save the credential of the login to local storage, and ask the user to sign in with one
             * of his previous accounts. If that succeeds, link these credentials together so that both
             * logins work from now on.
             */
            case 'auth/account-exists-with-different-credential':
                yield call(saveFollowUpLoginCredentials, err.credential);
                const enabledProviders = yield call(getFollowUpLoginProviders, err.email);
                yield put(requireFollowUpLogin(enabledProviders));
                return;

            case 'auth/credential-already-in-use':
                yield firebase.auth().signInAndRetrieveDataWithCredential(err.credential);
                return;
            case 'auth/web-storage-unsupported':
                e = new Error('Your browser is not supported or has third party cookies disabled.');
                break;
            default:
                e = new Error(`Failed to perform OAuth ${err.code}: ${err.message}`);
                break;
        }

        yield put(exchangeCodeFail((err.credential && err.credential.providerId) || 'firebase', e));
        return;
    }

    try {
        yield call(linkFollowUpUser);
    } catch (err) {
        yield put(showToast(`Failed to link authentication providers: ${err.message}`));
    }

    const user: User = yield call(requireAuth);
    yield put(welcomeUser(user));
}

function* handleSpotifyOAuth() {
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
        resp = yield call(functions.exchangeCode, { callbackUrl: location.origin, code });
    } catch (err) {
        yield put(exchangeCodeFail('spotify', err));
        return;
    }

    const { accessToken, expiresIn, refreshToken } = resp.data;

    const data = new AuthData(accessToken, Date.now() + expiresIn * 1000, refreshToken);
    yield apply(data, data.saveTo, [LOCALSTORAGE_KEY]);

    let firebaseToken;
    try {
        const { data }: HttpsCallableResult = yield call(functions.linkSpotifyAccounts, {
            accessToken,
        });
        firebaseToken = data.firebaseToken;
    } catch (err) {
        switch (err.code) {
            case 'already-exists':
                yield call(saveFollowUpLoginCredentials, { spotify: true });
                const followUpProviders = yield call(getFollowUpLoginProviders, err.details.email);
                yield put(requireFollowUpLogin(followUpProviders));
                return;
            default:
                const e =
                    (err as HttpsError).code === 'invalid-argument'
                        ? err // In this case the error message is suitable for displaying to the user
                        : new Error(`Token exchange failed with ${err.code}: ${err.message}.`);
                yield put(exchangeCodeFail('spotify', e));
                return;
        }
    }

    let newUser: UserCredential;
    try {
        newUser = yield firebase.auth().signInWithCustomToken(firebaseToken);
    } catch (err) {
        const e = new Error(`Firebase login failed with ${err.code}: ${err.message}`);
        yield put(exchangeCodeFail('spotify', e));
        return;
    }

    try {
        yield call(linkFollowUpUser);
    } catch (err) {
        const e = new Error(`Failed to link authentication providers: ${err.message}`);
        yield put(exchangeCodeFail('spotify', e));
        return;
    }

    yield* checkLogin();
    yield put(welcomeUser(newUser.user!));
}

function* handleOAuthRedirects() {
    yield all([handleFirebaseOAuth(), handleSpotifyOAuth()]);
}

/**
 * Logs the user out of Festify.
 */
function* logout() {
    if (yield select(isPlaybackMasterSelector)) {
        yield put(
            updatePlaybackState({
                master_id: null,
                playing: false,
            }),
        );
    }

    yield call(AuthData.remove, LOCALSTORAGE_KEY);
    yield firebase.auth().signOut();
    yield put(checkLoginStatus());
}

/**
 * This saga forcefully refreshes the user token every 55 minutes
 * to prevent Firebase from disconnecting and thus destroying playback.
 */
function* refreshFirebaseAuth() {
    while (true) {
        yield call(delay, 1000 * 60 * 55);

        const { currentUser } = firebase.auth();
        if (!currentUser) {
            continue;
        }

        // Retry five times
        for (let i = 0; i < 5; i++) {
            try {
                yield apply(currentUser, currentUser.getIdToken, [true]);
                break;
            } catch (err) {
                const duration = 5000 * i;
                console.warn(
                    `Failed to forcefully reauth user, trying again after ${duration / 1000}s.`,
                    err,
                );
                yield call(delay, duration);
            }
        }
    }
}

function* triggerOAuthLogin(ac: ReturnType<typeof triggerOAuthLoginAction>) {
    if (ac.payload === 'spotify') {
        yield call(
            console.log,
            'Only the swaggiest of developers hacking on Festify will see this 🙌.',
        );
        localStorage[AUTH_REDIRECT_LOCAL_STORAGE_KEY] =
            window.location.pathname + window.location.search + window.location.hash;
        window.location.href = OAUTH_URL;
    } else {
        try {
            yield firebase.auth().signInWithRedirect(getProvider(ac.payload));
        } catch (err) {
            const e =
                err.code === 'auth/provider-already-linked' // tslint:disable-next-line:max-line-length
                    ? new Error(
                          `Failed to start OAuth because the account is already linked with an account from ${ac.payload}.`,
                      )
                    : new Error(`Failed to start OAuth with code ${err.code}: ${err.message}`);
            yield put(exchangeCodeFail(ac.payload, e));
        }
    }
}

export default function*() {
    yield fork(refreshFirebaseAuth);
    yield takeEvery(CHANGE_DISPLAY_LOGIN_MODAL, handleFollowUpCancellation);
    yield takeEvery(CHECK_LOGIN_STATUS, checkLogin);
    yield takeLatest(LOGOUT, logout);
    yield takeEvery(TRIGGER_OAUTH_LOGIN, triggerOAuthLogin);

    yield* handleOAuthRedirects();
    yield* checkLogin();
}
