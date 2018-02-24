import { DataSnapshot } from '@firebase/database-types';
import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { Channel } from 'redux-saga';
import { all, apply, call, put, select, take, takeEvery } from 'redux-saga/effects';

import { Types } from '../actions';
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
    OpenPartyStartAction,
} from '../actions/party-data';
import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import { ConnectionState, Party, State } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { valuesChannel } from '../util/firebase';
import { requireAccessToken } from '../util/spotify-auth';

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
    if (!isPartyOwnerSelector(state2)) {
        return;
    }

    if (!state1.party.currentParty) {
        return;
    }

    // Become playback master if: there hasn't been a party before, or the old party's master ID
    // wasn't equal to the instance it, and now it is.
    // Resign if we don't have a party anymore, or we were master and now we aren't anymore.

    if (state1.party.currentParty.playback.master_id !== state1.player.instanceId &&
        party.playback.master_id === state1.player.instanceId) {
        yield put(becomePlaybackMaster());
    } else if ((!state2.party.currentParty ||
        state1.party.currentParty.playback.master_id === state1.player.instanceId) &&
        party.playback.master_id !== state1.player.instanceId) {
        yield put(resignPlaybackMaster());
    }
}

function* loadParty() {
    while (true) {
        const { payload: id }: OpenPartyStartAction = yield take(Types.OPEN_PARTY_Start);

        const partyRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase.database!()
                .ref('/parties/')
                .child(id),
        );
        const partySnap: DataSnapshot = yield take(partyRef);

        if (!partySnap.exists()) {
            yield put(openPartyFail(new Error("Party not found!")));
            continue;
        }

        yield* publishPartyUpdates(partySnap);

        const { uid }: { uid: string } = yield call(requireAuth);
        const party: Party = partySnap.val();

        const tracksRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase.database!()
                .ref('/tracks')
                .child(id),
        );
        const votesRef: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase.database!()
                .ref('/votes_by_user')
                .child(id)
                .child(uid),
        );
        const connection: Channel<DataSnapshot> = yield call(
            valuesChannel,
            firebase.database!().ref('.info/connected'),
        );

        yield takeEvery(connection, publishConnectionStateUpdates);
        yield takeEvery(partyRef, publishPartyUpdates);
        yield takeEvery(tracksRef, publishTrackUpdates);
        yield takeEvery(votesRef, publishUserVoteUpdates);

        yield put(openPartyFinish(party));

        yield take(Types.CLEANUP_PARTY);

        connection.close();
        partyRef.close();
        tracksRef.close();
        votesRef.close();

        yield call(
            () => firebase.database!()
                .ref('/parties')
                .child(id)
                .child('playback')
                .child('master_id')
                .set(null),
        );
    }
}

function* managePlaybackMasterReset() {
    while (true) {
        yield take(Types.BECOME_PLAYBACK_MASTER);

        const partyId = partyIdSelector(yield select());
        if (!partyId) {
            throw new Error("Missing party ID");
        }

        yield call(requireAccessToken);

        const dc = firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback')
            .child('master_id')
            .onDisconnect();
        yield apply(dc, dc.remove);

        yield take(Types.RESIGN_PLAYBACK_MASTER);

        yield apply(dc, dc.cancel);
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

export default function*() {
    yield all([
        loadParty(),
        managePlaybackMasterReset(),
        watchRoute(),
    ]);
}
