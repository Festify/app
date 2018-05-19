import { User, UserCredential } from '@firebase/auth-types';
import { delay } from 'redux-saga';
import { all, apply, call, fork, put, takeEvery } from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import {
    exchangeCodeFail,
    linkFollowUpUser,
    notifyAuthStatusKnown,
    removeSavedFollowUpLoginCredential,
    requireFollowUpLogin,
    saveForFollowUpLogin,
    welcomeUser,
    OAuthLoginProviders,
    TriggerOAuthLoginAction,
} from '../actions/auth';
import { ChangeDisplayLoginModalAction } from '../actions/view-party';
import { EnabledProvidersList } from '../state';
import { getProvider, requireAuth } from '../util/auth';
import firebase from '../util/firebase';

function* checkInitialLogin() {
    const user: User = yield call(requireAuth);
    if (user.isAnonymous || !user.providerId) {
        return;
    }
    const strippedProviderId = user.providerId.replace('.com', '');
    yield put(notifyAuthStatusKnown(strippedProviderId as any, user));
}

/**
 * Handles the case where the user closed the follow-up login modal.
 *
 * We need to clear out the cached credential here to properly reset application state.
 *
 * @param ac the redux action
 */
function* handleFollowUpCancellation(ac: ChangeDisplayLoginModalAction) {
    if (!ac.payload) {
        yield call(removeSavedFollowUpLoginCredential);
    }
}

const isSpotifyUser = firebase.functions!().httpsCallable('isSpotifyUser');

function* handleOAuthRedirect() {
    try {
        const cred: UserCredential = yield firebase.auth!().getRedirectResult();
        if (!cred.user) {
            return;
        }
    } catch (err) {
        let e;

        yield call(removeSavedFollowUpLoginCredential);
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
                yield call(saveForFollowUpLogin, err.credential);

                const [providers, isSpotify] = yield all([
                    firebase.auth!().fetchProvidersForEmail(err.email),
                    call(isSpotifyUser, { email: err.email }),
                ]);
                const strippedProviders = providers.map(provId => provId.replace('.com', ''));
                const enabledProviders = EnabledProvidersList.enable(strippedProviders as OAuthLoginProviders[]);

                yield put(requireFollowUpLogin({
                    ...enabledProviders,
                    spotify: isSpotify,
                }));
                return;

            case 'auth/credential-already-in-use':
                yield firebase.auth!().signInAndRetrieveDataWithCredential(err.credential);
                return;
            case 'auth/web-storage-unsupported':
                e = new Error("Your browser is not supported or has third party cookies disabled.");
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
        yield put(showToast("Failed to link authentication providers. :("));
    }

    const user: User = yield call(requireAuth);
    yield put(welcomeUser(user));

    // The main saga calls checkInitialLogin here, which calls requireAuth
}

/**
 * This saga forcefully refreshes the user token every 55 minutes
 * to prevent Firebase from disconnecting and thus destroying playback.
 */
function* refreshFirebaseAuth() {
    while (true) {
        yield call(delay, 1000 * 60 * 55);

        const { currentUser } = firebase.auth!();
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
                console.warn(`Failed to forcefully reauth user, trying again after ${duration / 1000}s.`, err);
                yield call(delay, duration);
            }
        }
    }
}

function* triggerOAuthLogin(ac: TriggerOAuthLoginAction) {
    if (ac.payload === 'spotify') { // handled in ./spotify-auth.ts
        return;
    }

    try {
        const user: User = yield call(requireAuth);
        if (user.isAnonymous) {
            yield firebase.auth!().signInWithRedirect(getProvider(ac.payload));
        } else {
            yield user.linkWithRedirect(getProvider(ac.payload));
        }
    } catch (err) {
        const e = (err.code === 'auth/provider-already-linked') // tslint:disable-next-line:max-line-length
            ? new Error(`Failed to start OAuth because the account is already linked with an account from ${ac.payload}.`)
            : new Error(`Failed to start OAuth with code ${err.code}: ${err.message}`);
        yield put(exchangeCodeFail(ac.payload, e));
    }
}

export default function*() {
    yield fork(refreshFirebaseAuth);
    yield takeEvery(Types.CHANGE_DISPLAY_LOGIN_MODAL, handleFollowUpCancellation);
    yield takeEvery(Types.TRIGGER_OAUTH_LOGIN, triggerOAuthLogin);

    yield* handleOAuthRedirect();
    yield* checkInitialLogin();
}
