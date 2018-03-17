import { isEqual } from 'lodash-es';
import { Task } from 'redux-saga';
import { call, cancelled, fork, join, put, select, take, takeEvery } from 'redux-saga/effects';

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
import { currentTrackSelector, tracksEqual } from '../selectors/track';
import { Playback, State, Track } from '../state';
import firebase, { firebaseNS } from '../util/firebase';
import { takeEveryWithState } from '../util/saga';

import manageLocalPlayer from './local-player';

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
    let isPlaybackMaster = false;
    try {
        const playbackRef = firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback');
        const playbackDisconnect = playbackRef.onDisconnect();

        // Setup deinitialization for playback state on player disconnect
        const becomeTask: Task = yield takeEvery(
            Types.BECOME_PLAYBACK_MASTER,
            function* () {
                isPlaybackMaster = true;
                yield call(() => playbackDisconnect.update({
                    playing: false,
                    master_id: null,
                }));
            },
        );

        // Cancel deinitialization for playback state on player disconnect
        const resignTask: Task = yield takeEvery(
            Types.RESIGN_PLAYBACK_MASTER,
            function* () {
                isPlaybackMaster = false;
                yield call(() => playbackDisconnect.cancel());
            },
        );

        // Persist playback state changes in Firebase
        const stateTask: Task = yield fork(function*() {
            while (true) {
                const oldState: Playback | null = yield select(playbackSelector);
                const { payload }: UpdatePlaybackStateAction = yield take(Types.UPDATE_PLAYBACK_STATE);

                // Exclude last_change for non-playback-state-changing updates to prevent
                // infinite update loop
                const { last_change, ...rest } = payload;
                const isChangingState = !oldState ||
                    oldState.playing !== payload.playing ||
                    oldState.last_position_ms !== payload.last_position_ms;
                const update = isChangingState ? {
                    ...payload,
                    last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                } : rest;

                playbackRef.update(update);
            }
        });

        const updateTask: Task = yield takeEveryWithState(
            [Types.UPDATE_PARTY, Types.UPDATE_PLAYBACK_STATE],
            playbackSelector,
            handlePartyUpdate,
        );

        // Wait for cancellation of this saga (occurs when party is left)
        yield join(
            becomeTask,
            resignTask,
            stateTask,
            updateTask,
        );
    } finally {
        // Remove playback state from DB when party is left while we're playing
        if (yield cancelled() && isPlaybackMaster) {
            firebase.database!()
                .ref('/parties')
                .child(partyId)
                .child('playback')
                .update({
                    master_id: null,
                    playing: false,
                });
        }
    }
}

function* handlePartyUpdate(
    action: UpdatePartyAction | UpdatePlaybackStateAction,
    oldPlayback: Playback | null,
    newPlayback: Playback | null,
) {
    // These cases occur when party is left
    if (!oldPlayback || !newPlayback) {
        return;
    }

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
    yield takeEvery(Types.INSTALL_PLAYBACK_MASTER, handleTakeOver);
    yield takeEvery(Types.TOGGLE_PLAYBACK_Start, handlePlayPause);
    yield fork(handleFirebase, partyId);
    yield fork(manageLocalPlayer, partyId);

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
}

export default managePlaybackState;
