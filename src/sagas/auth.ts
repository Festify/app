import { User, UserCredential } from '@firebase/auth-types';
import { delay } from 'redux-saga';
import { apply, call, fork, put, takeEvery } from 'redux-saga/effects';

import { Types } from '../actions';
import { exchangeCodeFail, notifyAuthStatusKnown, TriggerOAuthLoginAction } from '../actions/auth';
import { getProvider, requireAuth } from '../util/auth';
import firebase from '../util/firebase';

function* checkInitialLogin() {
    const user: User = yield call(requireAuth);
    if (user.isAnonymous) {
        return;
    }
    const strippedProviderId = user.providerId.replace('.com', '');
    yield put(notifyAuthStatusKnown(strippedProviderId as any, user));
}

function* handleOAuthLogin(ac: TriggerOAuthLoginAction) {
    if (ac.payload === 'spotify') { // handled in ./spotify-auth.ts
        return;
    }

    try {
        const user: User = yield requireAuth();
        yield user.linkWithRedirect(getProvider(ac.payload));
    } catch (err) {
        const e = (err.code === 'auth/provider-already-linked') // tslint:disable-next-line:max-line-length
            ? new Error(`Failed to start OAuth because the account is already linked with an account from ${ac.payload}.`)
            : new Error(`Failed to start OAuth with code ${err.code}: ${err.message}`);
        yield put(exchangeCodeFail(ac.payload, e));
    }
}

function* handleOAuthRedirect() {
    let result: UserCredential;
    try {
        result = yield firebase.auth!().getRedirectResult();
    } catch (err) {
        switch (err.code) {
            case 'auth/credential-already-in-use':
                result = yield firebase.auth!().signInAndRetrieveDataWithCredential(err.credential);
                break;
            default:
                const e = new Error(`Failed to perform OAuth ${err.code}: ${err.message}`);
                yield put(exchangeCodeFail((err.credential && err.credential.providerId) || 'firebase', e));
                return;
        }
    }

    // User aborted login, do nothing
    if (!result.credential || !result.user) {
        return;
    }

    yield requireAuth();
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

export default function*() {
    yield fork(refreshFirebaseAuth);
    yield takeEvery(Types.TRIGGER_OAUTH_LOGIN, handleOAuthLogin);

    yield* handleOAuthRedirect();
    yield* checkInitialLogin();
}
