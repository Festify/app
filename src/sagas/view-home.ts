import { push } from '@festify/redux-little-router';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { showToast } from '../actions';
import { NOTIFY_AUTH_STATUS_KNOWN } from '../actions/auth';
import {
    createNewParty,
    createPartyFail,
    joinPartyFail,
    joinPartyStart,
    resolveShortId,
    CREATE_PARTY_START,
    JOIN_PARTY_START,
} from '../actions/party-data';
import { Views } from '../routing';
import { PartySettings, State } from '../state';

function* createParty() {
    const { player, user }: State = yield select();
    const spotifyUser = user.credentials.spotify.user;

    if (!spotifyUser) {
        const e = new Error('Missing Spotify user');
        yield put(createPartyFail(e));
        return;
    }

    const userDisplayName = spotifyUser.display_name || spotifyUser.id;
    let partyId: string;
    try {
        partyId = yield call(
            createNewParty,
            userDisplayName,
            player.instanceId,
            spotifyUser.country,
            PartySettings.defaultSettings(),
        );
    } catch (err) {
        yield put(createPartyFail(err));
        return;
    }

    yield put(push(`/party/${partyId}`));
}

function* joinParty(ac: ReturnType<typeof joinPartyStart>) {
    const { homeView }: State = yield select();

    if (!homeView.partyIdValid) {
        const e = new Error('Party ID is invalid!');
        yield put(joinPartyFail(e));
        return;
    }

    const longId = yield call(resolveShortId, homeView.partyId);

    if (!longId) {
        const e = new Error('Party not found!');
        yield put(joinPartyFail(e));
        return;
    }

    yield put(push(`/party/${longId}`));
}

function* warnNonPremium() {
    const { router, user }: State = yield select();

    if (
        (router.result || { view: Views.Home }).view !== Views.Home ||
        !user.credentials.spotify.user ||
        user.credentials.spotify.user.product === 'premium'
    ) {
        return;
    }

    yield put(
        showToast(
            // tslint:disable-next-line:max-line-length
            "To create parties and play music on Festify, you need to have a 'Spotify Premium' account. Please login again using a premium account if you want to host parties.",
            10000,
        ),
    );
}

export default function*() {
    yield takeLatest(NOTIFY_AUTH_STATUS_KNOWN, warnNonPremium);
    yield takeLatest(CREATE_PARTY_START, createParty);
    yield takeLatest(JOIN_PARTY_START, joinParty);
}
