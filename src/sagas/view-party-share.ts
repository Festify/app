import { call, select, takeEvery } from 'redux-saga/effects';

import { SHARE_PARTY } from '../actions/view-party-share';
import { partyIdSelector } from '../selectors/party';
import { State } from '../state';

function* share() {
    const state: State = yield select();

    const currentParty = state.party.currentParty;
    if (!currentParty) {
        throw new Error('Missing current party');
    }
    const partyId = partyIdSelector(state);
    if (!partyId) {
        throw new Error('Missing current party ID');
    }

    yield call((navigator as any).share, {
        text: `Join ${currentParty.name} and rule the music!`,
        title: currentParty.name,
        url: `${document.location!.origin}/party/${partyId}`,
    });
}

export default function*() {
    const shareFn = (navigator as any).share;
    if (typeof shareFn !== 'function') {
        return;
    }

    yield takeEvery(SHARE_PARTY, share);
}
