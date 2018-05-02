import { call, fork, put, select, take, takeEvery } from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import {
    pinTrack,
    removeTrack as doRemoveTrack,
    setVote as doSetVote,
    RemoveTrackAction,
    SetVoteAction,
} from '../actions/queue';
import { hasOtherPlaybackMasterSelector, isPartyOwnerSelector } from '../selectors/party';
import { currentTrackSelector, firebaseTrackIdSelector, singleTrackSelector, tracksEqual } from '../selectors/track';
import { State, Track } from '../state';

function* pinTopTrack(partyId: string) {
    let topTrack: Track = undefined!;

    while (true) {
        yield take(Types.UPDATE_TRACKS);

        const state: State = yield select();

        const isOwner = isPartyOwnerSelector(state);
        const hasOtherPlaybackMaster = hasOtherPlaybackMasterSelector(state);
        const newTopTrack = currentTrackSelector(state);

        // Do nothing if we're not owner, if there is an existing other playback
        // master, if we've got no track to pin, or if the current track hasn't changed.
        if (!isOwner || hasOtherPlaybackMaster || !newTopTrack || tracksEqual(topTrack, newTopTrack)) {
            continue;
        }

        topTrack = newTopTrack;
        yield fork(pinTrack, partyId, newTopTrack.reference);
    }
}

function* removeTrack(partyId: string, ac: RemoveTrackAction) {
    try {
        const [ref, moveToHistory] = ac.payload;
        const state: State = yield select();
        const track = singleTrackSelector(
            state,
            firebaseTrackIdSelector(ref),
        );

        yield call(doRemoveTrack, partyId, track, moveToHistory);
    } catch (err) {
        yield put(showToast(`Failed to remove track: ${err}`));
    }
}

function* setVote(partyId: string, ac: SetVoteAction) {
    try {
        const [ref, vote] = ac.payload;
        yield call(doSetVote, partyId, ref, vote);
    } catch (err) {
        yield put(showToast(`Failed to toggle vote: ${err}`));
    }
}

export default function*(partyId: string) {
    yield takeEvery(Types.REMOVE_TRACK, removeTrack, partyId);
    yield takeEvery(Types.SET_VOTE, setVote, partyId);
    yield fork(pinTopTrack, partyId);
}
