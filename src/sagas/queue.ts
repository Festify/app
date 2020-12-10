import { User } from '@firebase/auth-types';
import { call, fork, put, select, take, takeEvery } from 'redux-saga/effects';

import { showToast } from '../actions';
import { UPDATE_TRACKS } from '../actions/party-data';
import {
    pinTrack,
    removeTrack as doRemoveTrack,
    removeTrackAction,
    setVote as doSetVote,
    setVoteAction,
    REMOVE_TRACK,
    REQUEST_SET_VOTE,
} from '../actions/queue';
import { changeDisplayLoginModal } from '../actions/view-party';
import { isPartyOwnerSelector, isPlaybackMasterSelector } from '../selectors/party';
import {
    currentTrackSelector,
    firebaseTrackIdSelector,
    singleTrackSelector,
    tracksEqual,
} from '../selectors/track';
import { State, Track } from '../state';
import { requireAuth } from '../util/auth';

function* pinTopTrack(partyId: string) {
    let topTrack: Track = undefined!;

    while (true) {
        yield take(UPDATE_TRACKS);

        const state: State = yield select();

        const isOwner = isPartyOwnerSelector(state);
        const isPlaybackMaster = isPlaybackMasterSelector(state);
        const newTopTrack = currentTrackSelector(state);

        // Do nothing if we're not owner, if there is an existing other playback
        // master, if we've got no track to pin, or if the current track hasn't changed.
        if (!isOwner || !isPlaybackMaster || !newTopTrack || tracksEqual(topTrack, newTopTrack)) {
            continue;
        }

        topTrack = newTopTrack;
        yield fork(pinTrack, partyId, newTopTrack.reference);
    }
}

function* removeTrack(partyId: string, ac: ReturnType<typeof removeTrackAction>) {
    try {
        const [ref, moveToHistory] = ac.payload;
        const state: State = yield select();
        const track = singleTrackSelector(state, firebaseTrackIdSelector(ref));

        yield call(doRemoveTrack, partyId, track, moveToHistory);
    } catch (err) {
        yield put(showToast(`Failed to remove track: ${err}`));
    }
}

function* setVote(partyId: string, ac: ReturnType<typeof setVoteAction>) {
    const { party }: State = yield select();
    if (party.currentParty!.settings && !party.currentParty!.settings!.allow_anonymous_voters) {
        const user: User = yield call(requireAuth);
        if (user.isAnonymous) {
            yield put(changeDisplayLoginModal(true));
            return;
        }
    }

    const [ref, vote] = ac.payload;
    yield put(setVoteAction(ref, vote));
    try {
        yield call(doSetVote, partyId, ref, vote);
    } catch (err) {
        yield put(showToast(`Failed to toggle vote: ${err}`));
    }
}

export default function*(partyId: string) {
    yield takeEvery(REMOVE_TRACK, removeTrack, partyId);
    yield takeEvery(REQUEST_SET_VOTE, setVote, partyId);
    yield fork(pinTopTrack, partyId);
}
