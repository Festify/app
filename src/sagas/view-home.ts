import { push } from '@mraerino/redux-little-router-reactless';
import { all, call, fork, put, select, takeLatest } from 'redux-saga/effects';

import { Types } from '../actions';
import {
    createNewParty,
    createPartyFail,
    joinPartyFail,
    resolveShortId,
    JoinPartyStartAction,
} from '../actions/party-data';
import { setPlayerCompatibility } from '../actions/playback-spotify';
import { State } from '../state';

function* createParty() {
    const { player, user }: State = yield select();
    const spotifyUser = user.spotify.user;

    if (!spotifyUser) {
        const e = new Error("Missing Spotify user");
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
        );
    } catch (err) {
        yield put(createPartyFail(err));
        return;
    }

    yield put(push(`/party/${partyId}`));
}

function* joinParty(ac: JoinPartyStartAction) {
    const { homeView }: State = yield select();
    const longId = yield call(resolveShortId, homeView.partyId);

    if (!longId) {
        const e = new Error("Party not found!");
        yield put(joinPartyFail(e));
        return;
    }

    yield put(push(`/party/${longId}`));
}

function* checkUserAgent() {
    const { appVersion, userAgent } = navigator;

    const validOS =
            appVersion.indexOf('Win') !== -1 ||
            appVersion.indexOf('Mac') !== -1 ||
            appVersion.indexOf('Linux') !== -1;

    const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPod|iPad|Blackberry/i);

    const validBrowser =
        (userAgent.indexOf('Firefox') !== -1 && userAgent.indexOf('Opera') === -1) ||
        (userAgent.indexOf('Chrome') !== -1);

    console.log(validOS, validBrowser);

    if (!validOS || !validBrowser || isMobile) {
        yield put(setPlayerCompatibility(false));
    }
}

export default function*() {
    yield all([
        takeLatest(Types.CREATE_PARTY_Start, createParty),
        takeLatest(Types.JOIN_PARTY_Start, joinParty),
        fork(checkUserAgent),
    ]);
}
