import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import chunk from 'lodash-es/chunk';
import { all, call, cancel, put, select, takeLatest } from 'redux-saga/effects';
import * as SpotifyApi from 'spotify-web-api-js';

import { Types } from '../actions';
import { getArtistFanart, getMusicBrainzId, updateMetadata } from '../actions/metadata';
import { Views } from '../routing';
import { loadFanartTracksSelector, loadMetadataSelector } from '../selectors/track';
import { Metadata, State } from '../state';
import { takeEveryWithState } from '../util/saga';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

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

            // Proxy fanart through imgix to apply server-side optimizations and blurring (client
            // side-blurring kills performance quite extremely).
            const proxiedBackgrounds = backgrounds.map(url => {
                const u = new URL(url);
                u.host = 'festify-fanart.imgix.net';
                u.protocol = 'https';

                return `${u.toString()}?blur=100&auto=compress,format`;
            });

            yield put(updateMetadata({ [trackId]:  proxiedBackgrounds }));
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
        loadFanartTask = yield takeLatest(
            [Types.UPDATE_TRACKS, Types.UPDATE_METADATA],
            loadFanartForNewTracks,
        );

        yield* loadFanartForNewTracks(null);
    } else if (prevView === Views.Tv) {
        yield cancel(loadFanartTask);
        loadFanartTask = null;
    }
}

function* loadMetadataForNewTracks(_) {
    const remaining: string[] = yield select(loadMetadataSelector);
    for (const ids of chunk(remaining, 50).filter(ch => ch.length > 0)) {
        try {
            const url = `/tracks?ids=${encodeURIComponent(ids.join(','))}`;
            const resp = yield call(fetchWithAnonymousAuth, url);
            const { tracks }: SpotifyApi.MultipleTracksResponse = yield resp.json();

            yield put(updateMetadata(tracks));
        } catch (err) {
            console.error("Failed to load metadata for a track chunk.", err);
        }
    }
}

export default function*() {
    yield all([
        takeLatest(Types.UPDATE_TRACKS, loadMetadataForNewTracks),
        takeEveryWithState(
            LOCATION_CHANGED,
            (s: State) => (s.router!.result || {}).view || Views.Home,
            watchTvMode,
        ),
    ]);
}
