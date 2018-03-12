import { Location, LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import chunk from 'lodash-es/chunk';
import maxBy from 'lodash-es/maxBy';
import { all, call, cancel, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import * as SpotifyApi from 'spotify-web-api-js';

import { FANART_TV_API_KEY } from '../../fanart.config';
import { Types } from '../actions';
import { updateMetadata } from '../actions/metadata';
import { UpdateTracksAction } from '../actions/party-data';
import { Views } from '../routing';
import { firebaseTrackIdSelector, queueTracksSelector } from '../selectors/track';
import { Metadata, State, Track } from '../state';
import { takeEveryWithState } from '../util/saga';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

const FANART_URL = 'https://webservice.fanart.tv/v3/music';
const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2/artist/?fmt=json&limit=10&query=';

function* loadFanartForNewTracks(_) {
    const state: State = yield select();
    const tracks: Track[] = queueTracksSelector(state);

    const remaining = tracks.slice(0, 3)
        .filter(t => t.reference.provider && t.reference.id)
        .map(t => firebaseTrackIdSelector(t))
        .filter(id => id in state.metadata && !state.metadata[id].background)
        .map(id => [id, state.metadata[id]] as [string, Metadata]);

    for (const [trackId, metadata] of remaining) {
        const empty = () => ({ [trackId]: [] });

        try {
            const musicBrainzResponse: Response = yield call(
                fetch,
                `${MUSICBRAINZ_URL}${encodeURIComponent(metadata.artists[0])}`,
                { headers: { 'Accept': 'application/json' } },
            );

            if (!musicBrainzResponse.ok) {
                // tslint:disable-next-line:max-line-length
                console.warn(`Status ${musicBrainzResponse.status} from MusicBrainz. Not loading fanart for '${metadata.name}'.`);
                yield put(updateMetadata(empty()));
                continue;
            }

            const musicBrainzResult = yield musicBrainzResponse.json();
            if (!musicBrainzResult.artists.length) {
                yield put(updateMetadata(empty()));
                continue;
            }

            /*
             * MusicBrainz has no concept of popularity and does not order the search results in
             * any meaningful way. This means that searches for popular artists can potentially
             * yield lots of unknown bands before the band actually searched for. (Searching for UK
             * rock band `Muse` lists them at index 5, preceeded by four unknown bands with the
             * same name).
             *
             * Under the assumption that Festify users generally like popular music and that popular
             * artists have more metadata on MusicBrainz than lesser known artists, we try to deduce
             * the right search result by choosing the artist with the most metadata / most complete
             * profile.
             */
            const likeliestArtist = maxBy<{ id: string }>(
                musicBrainzResult.artists,
                artist => Object.keys(artist).length,
            )!;

            const fanartResponse: Response = yield call(
                fetch,
                `${FANART_URL}/${likeliestArtist.id}?api_key=${FANART_TV_API_KEY}`,
            );

            if (!fanartResponse.ok) {
                // We don't need to log 404s
                if (fanartResponse.status !== 404) {
                    // tslint:disable-next-line:max-line-length
                    console.warn(`Status ${fanartResponse.status} from fanart.tv. Not loading fanart for '${metadata.name}'.`);
                }
                yield put(updateMetadata(empty()));
                continue;
            }

            const backgroundImages = (yield fanartResponse.json()).artistbackground.map(bg => bg.url);
            yield put(updateMetadata({ [trackId]: backgroundImages }));
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
    }
}

function shouldLoadMetadata(t: Track | null, metadata: Record<string, Metadata>): boolean {
    if (!t || !t.reference.provider || !t.reference.id) {
        return false;
    }

    const id = firebaseTrackIdSelector(t);
    return !(id in metadata) || metadata[id].durationMs == null;
}

function* loadMetadataForNewTracks(action: UpdateTracksAction) {
    if (!action.payload) {
        return;
    }

    const { metadata }: State = yield select();
    const remaining = Object.keys(action.payload)
        .filter(k => shouldLoadMetadata(action.payload![k], metadata))
        .map(k => action.payload![k].reference.id);

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
        takeEvery(Types.UPDATE_TRACKS, loadMetadataForNewTracks),
        takeEveryWithState(
            LOCATION_CHANGED,
            (s: State) => (s.router!.result || {}).view || Views.Home,
            watchTvMode,
        ),
    ]);
}
