import { User } from '@firebase/auth-types';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import {
    removeTrack as doRemoveTrack,
    setVote as doSetVote,
    setVoteAction,
    RemoveTrackAction,
    SetVoteAction,
} from '../actions/queue';
import { changeDisplayLoginModal } from '../actions/view-party';
import { firebaseTrackIdSelector, singleTrackSelector } from '../selectors/track';
import { State } from '../state';
import { requireAuth } from '../util/auth';

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
    yield takeEvery(Types.REMOVE_TRACK, removeTrack, partyId);
    yield takeEvery(Types.REQUEST_SET_VOTE, setVote, partyId);
}
