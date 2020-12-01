import { push, replace, LOCATION_CHANGED } from '@festify/redux-little-router';
import { delay } from 'redux-saga';
import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { updateMetadata } from '../actions/metadata';
import { UPDATE_PARTY } from '../actions/party-data';
import { setVoteAction, SET_VOTE } from '../actions/queue';
import {
    changeTrackSearchInput,
    searchFail,
    searchFinish,
    searchStart,
    CHANGE_TRACK_SEARCH_INPUT,
} from '../actions/view-party';
import { PartyViews } from '../routing';
import { queueRouteSelector, searchRouteSelector } from '../selectors/routes';
import { State, Track } from '../state';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

function* doSearch(action) {
    const { party }: State = yield select();
    if (!party.currentParty) {
        yield take(UPDATE_PARTY);
    }

    const {
        query: { s },
    } = action.payload || { query: { s: '' } };
    if (!s) {
        return;
    }

    yield put(searchStart());
    yield call(delay, 500);

    const {
        party: { currentParty },
    }: State = yield select();
    let url =
        `/search?type=track&limit=${20}&market=${currentParty!.country}` +
        `&q=${encodeURIComponent(s.replace('-', ' ') + '*')}`;

    const tracks: SpotifyApi.TrackObjectFull[] = [];
    try {
        // Search until we have at least 20 available and playable search results
        while (tracks.length < 20 && url) {
            const trackResponse = yield call(fetchWithAnonymousAuth, url);
            const resp: SpotifyApi.TrackSearchResponse = yield trackResponse.json();
            console.log(resp.tracks.items);
            const votableTracks = resp.tracks.items
                //.filter((t) => t.is_playable !== false)
                .filter((t) => {
                    return currentParty!.settings && !currentParty!.settings!.allow_explicit_tracks
                        ? !t.explicit
                        : true;
                });

            tracks.push(...votableTracks);
            url = resp.tracks.next;
        }
    } catch (e) {
        yield put(searchFail(e));
        return;
    }

    const result = tracks.reduce((acc, track, i) => {
        acc[`spotify-${track.id}`] = {
            added_at: Date.now(),
            is_fallback: false,
            order: i,
            reference: {
                provider: 'spotify',
                id: track.id,
            },
            vote_count: 0,
        } as Track;
        return acc;
    }, {});

    yield put(updateMetadata(tracks));
    yield put(searchFinish(result));
}

function* enforceMultiVoteSetting(ac: ReturnType<typeof setVoteAction>) {
    const state: State = yield select();
    if (!state.party.currentParty || !state.party.currentParty.settings) {
        return;
    }

    const hasVoted: boolean = ac.payload[1];
    if (
        !state.party.currentParty.settings.allow_multi_track_add &&
        state.router.result!.subView === PartyViews.Search &&
        hasVoted
    ) {
        yield put(push(queueRouteSelector(state)!));
    }
}

function* updateUrl(action: ReturnType<typeof changeTrackSearchInput>) {
    const state: State = yield select();
    const { s } = state.router!.query || { s: '' };

    if (!action.payload) {
        yield put(push(queueRouteSelector(state)!, {}));
        return;
    }

    // Replace URL if we already have an incomplete query to avoid clobbing
    // up the users browser history.
    const routerFn = s ? replace : push;
    yield put(routerFn(searchRouteSelector(state, action.payload)!, {}));
}

export default function* () {
    yield takeLatest(LOCATION_CHANGED, doSearch);
    yield takeEvery(CHANGE_TRACK_SEARCH_INPUT, updateUrl);
    yield takeEvery(SET_VOTE, enforceMultiVoteSetting);
}
