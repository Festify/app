import { push, LOCATION_CHANGED } from '@festify/redux-little-router';
import { User } from '@firebase/auth-types';
import { DataSnapshot } from '@firebase/database-types';
import { Channel } from 'redux-saga';
import { all, call, cancel, fork, put, select, take, takeEvery } from 'redux-saga/effects';

import { notifyAuthStatusKnown, NOTIFY_AUTH_STATUS_KNOWN } from '../actions/auth';
import {
    becomePlaybackMaster,
    cleanupParty,
    openPartyFail,
    openPartyFinish,
    openPartyStart,
    resignPlaybackMaster,
    updateConnectionState,
    updateParty,
    updateTracks,
    updateUserVotes,
    CLEANUP_PARTY,
    OPEN_PARTY_START,
} from '../actions/party-data';
import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import { ConnectionState, Party, State } from '../state';
import { store } from '../store';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS, valuesChannel } from '../util/firebase';

import managePlaybackState from './playback-state';
import manageQueue from './queue';
import { managePartySettings } from './view-party-settings';

function* publishConnectionStateUpdates(snap: DataSnapshot) {
    const state = snap.val() ? ConnectionState.Connected : ConnectionState.Disconnected;

    yield put(updateConnectionState(state));
}
function* publishTrackUpdates(snap: DataSnapshot) {
    yield put(updateTracks(snap.val()));
}
function* publishUserVoteUpdates(snap: DataSnapshot) {
    yield put(updateUserVotes(snap.val()));
}
function* publishPartyUpdates(snap: DataSnapshot) {
    const party: Party | null = snap.val();

    if (!party) {
        return;
    }

    const state1: State = yield select();
    yield put(updateParty(party));

    const state2: State = yield select();
    if (!isPartyOwnerSelector(state2) || !state1.party.currentParty) {
        return;
    }

    // Become playback master if: there hasn't been a party before, or the old party's master ID
    // wasn't equal to the instance it, and now it is.
    // Resign if we don't have a party anymore, or we were master and now we aren't anymore.

    if (
        state1.party.currentParty.playback.master_id !== state1.player.instanceId &&
        party.playback.master_id === state1.player.instanceId
    ) {
        yield put(becomePlaybackMaster());
    } else if (
        (!state2.party.currentParty ||
            state1.party.currentParty.playback.master_id === state1.player.instanceId) &&
        party.playback.master_id !== state1.player.instanceId
    ) {
        yield put(resignPlaybackMaster());
    }
}

function* loadParty() {
    const closeListener = (e: BeforeUnloadEvent) => {
        const { party, player } = store.getState();

        if (
            !party.currentParty ||
            !party.currentParty.playback.playing ||
            party.currentParty.playback.master_id !== player.instanceId
        ) {
            return;
        }

        e.returnValue = '😅';
        return '😅';
    };

    while (true) {
        const { payload: id }: ReturnType<typeof openPartyStart> = yield take(OPEN_PARTY_START);

        const partyRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase
                .database()
                .ref('/parties/')
                .child(id),
        );
        const partySnap: DataSnapshot = yield take(partyRef);

        if (!partySnap.exists()) {
            yield put(openPartyFail(new Error('Party not found!')));
            yield put(push('/'));
            continue;
        }

        yield* publishPartyUpdates(partySnap);

        const { uid }: User = yield call(requireAuth);
        const party: Party = partySnap.val();

        const tracksRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase
                .database()
                .ref('/tracks')
                .child(id),
        );
        const votesRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase
                .database()
                .ref('/votes_by_user')
                .child(id)
                .child(uid),
        );
        const connection: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase.database().ref('.info/connected'),
        );

        yield takeEvery(connection, publishConnectionStateUpdates);
        yield takeEvery(partyRef, publishPartyUpdates);
        yield takeEvery(tracksRef, publishTrackUpdates);
        yield takeEvery(votesRef, publishUserVoteUpdates);

        const partySettings = yield fork(managePartySettings, id);
        const playbackManager = yield fork(managePlaybackState, id);
        const queueManager = yield fork(manageQueue, id);

        yield firebase
            .database()
            .ref('/user_parties')
            .child(uid)
            .child(id)
            .set(firebaseNS.database!.ServerValue.TIMESTAMP);

        window.onbeforeunload = closeListener;

        yield put(openPartyFinish(party));

        yield take(CLEANUP_PARTY);

        yield cancel(partySettings, playbackManager, queueManager);

        connection.close();
        partyRef.close();
        tracksRef.close();
        votesRef.close();
    }
}

function* watchRoute() {
    let oldPartyId = '';
    while (true) {
        const action = yield take(LOCATION_CHANGED);

        const partyId = action.payload.params && action.payload.params.partyId;
        if (oldPartyId === partyId) {
            continue;
        }

        if (partyId) {
            yield put(openPartyStart(partyId));
        } else if (oldPartyId) {
            yield put(cleanupParty());
        }

        oldPartyId = partyId;
    }
}

function* watchLogin() {
    while (true) {
        const ac: ReturnType<typeof notifyAuthStatusKnown> = yield take(NOTIFY_AUTH_STATUS_KNOWN);
        const partyId: string = yield select(partyIdSelector);

        if (!partyId || !ac.payload.data) {
            continue;
        }

        yield put(cleanupParty());
        yield put(openPartyStart(partyId));
    }
}

export default function*() {
    yield all([loadParty(), watchRoute(), watchLogin()]);
}
