import { LOCATION_CHANGED } from '@festify/redux-little-router';
import chunk from 'lodash-es/chunk';
import { call, cancel, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import {
    getArtistFanart,
    getMusicBrainzId,
    updateMetadata,
    MetadataStore,
    UPDATE_METADATA,
} from '../actions/metadata';
import { UPDATE_TRACKS } from '../actions/party-data';
import { Views } from '../routing';
import { loadFanartTracksSelector, loadMetadataSelector } from '../selectors/track';
import { Metadata, State } from '../state';
import { takeEveryWithState } from '../util/saga';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

const cache = new MetadataStore();

let hasThrownIdbError = false;
function* cacheMetadata(ac: ReturnType<typeof updateMetadata>) {
    try {
        yield cache.cacheMetadata(ac.payload);
    } catch (err) {
        // Only warn once
        if (hasThrownIdbError) {
            return;
        }
        hasThrownIdbError = true;
        console.warn('Failed to cache metadata to IndexedDB.', err);
    }
}

const emptyArray = [];
function* loadFanartForNewTracks(_) {
    const remaining: [string, Metadata][] = yield select(loadFanartTracksSelector);

    for (const [trackId, metadata] of remaining) {
        const empty = () => ({ [trackId]: emptyArray });

        try {
            const likeliestArtist: string | null = yield call(getMusicBrainzId, metadata);
            if (!likeliestArtist) {
                yield put(updateMetadata(empty()));
                continue;
            }

            const backgrounds: string[] | null = yield call(getArtistFanart, likeliestArtist);
            if (!backgrounds) {
                yield put(updateMetadata(empty()));
                continue;
            }

            yield put(updateMetadata({ [trackId]: backgrounds }));
        } catch (err) {
            console.error(`Failed to fetch fanart for '${metadata.name}'.`, err);
        }
    }
}

let loadFanartTask;
function* watchTvMode(action, prevView: Views, newView: Views) {
    if (loadFanartTask && prevView === newView) {
        return;
    }

    if (newView === Views.Tv) {
        loadFanartTask = yield takeLatest([UPDATE_TRACKS, UPDATE_METADATA], loadFanartForNewTracks);

        yield* loadFanartForNewTracks(null);
    } else if (prevView === Views.Tv) {
        yield cancel(loadFanartTask);
        loadFanartTask = null;
    }
}

function* loadMetadataForNewTracks(_) {
    const state: State = yield select();
    const remaining: string[] = loadMetadataSelector(state);

    if (!state.party.currentParty || !remaining.length) {
        return;
    }

    /*
     * Cached metadata lives only for twelve hours, so we can assume that the track hasn't
     * gone unavailable during that period of time. This means we can load metadata from
     * IDB first, and only resort to calling the Web API later.
     */

    try {
        const fullIds = remaining.map(id => `spotify-${id}`);
        const cached: Record<string, Metadata> = yield cache.getMetadata(fullIds);
        yield put(updateMetadata(cached));
    } catch (err) {
        console.warn('Failed to load cached tracks from IndexedDB. Fetching from Spotify API...');
    }

    const country = state.party.currentParty.country;
    const uncached: string[] = yield select(loadMetadataSelector);
    for (const ids of chunk(uncached, 50).filter(ch => ch.length > 0)) {
        try {
            const url = `/tracks?market=${country}&ids=${encodeURIComponent(ids.join(','))}`;
            const resp = yield call(fetchWithAnonymousAuth, url);
            const { tracks }: SpotifyApi.MultipleTracksResponse = yield resp.json();

            yield put(updateMetadata(tracks));
        } catch (err) {
            console.error('Failed to load metadata for a track chunk.', err);
        }
    }
}

export default function*() {
    yield takeEvery(UPDATE_METADATA, cacheMetadata),
        yield takeLatest(UPDATE_TRACKS, loadMetadataForNewTracks),
        yield takeEveryWithState(
            LOCATION_CHANGED,
            (s: State) => (s.router!.result || { view: Views.Home }).view,
            watchTvMode,
        );
}
