import { call, put, select, takeEvery } from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import {
    removeTrack as doRemoveTrack,
    setVote as doSetVote,
    RemoveTrackAction,
    SetVoteAction,
} from '../actions/queue';
import { firebaseTrackIdSelector, singleTrackSelector } from '../selectors/track';
import { State } from '../state';

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
}
