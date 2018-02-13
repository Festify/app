import { push } from '@mraerino/redux-little-router-reactless';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { CLIENT_ID } from '../../spotify.config';

import { Types } from '../actions';
import {
    createNewParty,
    createPartyFail,
    joinPartyFail,
    openPartyStart,
    resolveShortId,
    JoinPartyStartAction,
 } from '../actions/party-data';
import { State } from '../state';
import { SCOPES } from '../util/spotify-auth';

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

const oauthUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}`
    + `&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code`
    + `&scope=${encodeURIComponent(SCOPES.join(' '))}&state=SPOTIFY_AUTH&show_dialog=true`;

function* triggerOAuthLogin() {
    yield call(console.log, "Only the swaggiest of developers hacking on Festify will see this 🙌.");
    window.location.href = oauthUrl;
}

export default function*() {
    yield all([
        takeLatest(Types.CREATE_PARTY_Start, createParty),
        takeLatest(Types.JOIN_PARTY_Start, joinParty),
        takeLatest(Types.TRIGGER_SPOTIFY_OAUTH_LOGIN, triggerOAuthLogin),
    ]);
}
