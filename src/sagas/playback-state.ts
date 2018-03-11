import { isEqual } from 'lodash-es';
import { call, cancelled, fork, put, select, takeEvery } from 'redux-saga/effects';

import { Types } from '../actions';
import {
    becomePlaybackMaster,
    resignPlaybackMaster,
    updatePlaybackState,
    UpdatePartyAction,
    UpdatePlaybackStateAction,
} from '../actions/party-data';
import { togglePlaybackFinish } from '../actions/playback-spotify';
import { playbackSelector } from '../selectors/party';
import { Playback, State, Track } from '../state';
import firebase, { firebaseNS } from '../util/firebase';
import { takeEveryWithState } from '../util/saga';

import manageLocalPlayer from './local-player';
import { currentTrackSelector, tracksEqual } from '../selectors/track';

function* handleTakeOver() {
    const { party, player }: State = yield select();

    if (player.instanceId === party.currentParty!.playback.master_id) {
        return;
    }

    yield put(updatePlaybackState({
        master_id: player.instanceId,
    }));
}

function* handlePlayPause() {
    const { party, player }: State = yield select();

    yield put(updatePlaybackState({
        playing: !party.currentParty!.playback.playing,
        master_id: party.currentParty!.playback.master_id || player.instanceId,
    }));

    if (party.currentParty!.playback.master_id !== player.instanceId) {
        yield put(togglePlaybackFinish());
    }
}

function* handleFirebase(partyId: string) {
    try {
        const playbackRef = firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback');

        const playbackDisconnect = playbackRef.onDisconnect();

        // Setup deinitialization for playback state on player disconnect
        yield takeEvery(
            Types.BECOME_PLAYBACK_MASTER,
            function* () {
                yield call(() => playbackDisconnect.update({
                    playing: false,
                    master_id: null,
                }));
            },
        );

        // Cancel deinitialization for playback state on player disconnect
        yield takeEvery(
            Types.RESIGN_PLAYBACK_MASTER,
            function* () {
                yield call(() => playbackDisconnect.cancel());
            },
        );

        // Persist playback state changes in Firebase
        yield takeEveryWithState(
            Types.UPDATE_PLAYBACK_STATE,
            playbackSelector,
            function* ({payload}: UpdatePlaybackStateAction, oldState: Playback, newState: Playback) {
                delete payload.last_change;

                const update =
                    oldState.playing !== newState.playing || oldState.last_position_ms !== newState.last_position_ms
                    ? {
                        ...payload,
                        last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                    }
                    : payload;

                playbackRef.update(update);
            },
        );

        yield takeEveryWithState(
            [Types.UPDATE_PARTY, Types.UPDATE_PLAYBACK_STATE],
            playbackSelector,
            handlePartyUpdate,
        );
    } finally {
        if (yield cancelled()) {
            yield put(resignPlaybackMaster());
        }
    }
}

function* handlePartyUpdate(
    action: UpdatePartyAction | UpdatePlaybackStateAction,
    oldPlayback: Playback,
    newPlayback: Playback,
) {
    // Check if the master status of the player changed
    if (oldPlayback.master_id !== newPlayback.master_id) {
        if (newPlayback.master_id === (yield select((state: State) => state.player.instanceId))) {
            yield put(becomePlaybackMaster());
        } else {
            yield put(resignPlaybackMaster());
        }
    }

    // Prevent endless loop because timestamp always changes
    oldPlayback = {
        ...oldPlayback,
        last_change: newPlayback.last_change,
    };

    // Make sure updatePlaybackState fires when state changes through updatePartyAction
    if (action.type !== Types.UPDATE_PLAYBACK_STATE && !isEqual(newPlayback, oldPlayback)) {
        yield put(updatePlaybackState(newPlayback));
    }
}

/**
 * Handles local playback state and syncs changes from and to Firebase
 */
export function* managePlaybackState(partyId: string) {
    try {
        yield takeEvery(Types.INSTALL_PLAYBACK_MASTER, handleTakeOver);
        yield takeEvery(Types.TOGGLE_PLAYBACK_Start, handlePlayPause);
        yield fork(handleFirebase, partyId);
        yield fork(manageLocalPlayer);

        yield takeEveryWithState(
            Types.UPDATE_TRACKS,
            currentTrackSelector,
            function* (action, oldTrack: Track | null, newTrack: Track | null) {
                if (!oldTrack || tracksEqual(oldTrack, newTrack)) {
                    return;
                }

                yield put(updatePlaybackState({
                    last_position_ms: 0,
                }));
            },
        );
    } finally {
        if (yield cancelled()) {
            yield put(resignPlaybackMaster());
        }
    }
}

export default managePlaybackState;
