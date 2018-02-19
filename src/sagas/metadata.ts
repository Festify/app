import chunk from 'lodash-es/chunk';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as SpotifyApi from 'spotify-web-api-js';

import { Types } from '../actions';
import { updateMetadata } from '../actions/metadata';
import { UpdateTracksAction } from '../actions/party-data';
import { Metadata, State, Track } from '../state';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

function shouldLoadMetadata(t: Track | null, metadata: Record<string, Metadata>): boolean {
    return Boolean(
        t &&
        t.reference.provider &&
        t.reference.id &&
        !(`${t.reference.provider}-${t.reference.id}` in metadata),
    );
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
        const url = `/tracks?ids=${encodeURIComponent(ids.join(','))}`;
        const resp = yield call(fetchWithAnonymousAuth, url);
        const { tracks }: SpotifyApi.MultipleTracksResponse = yield resp.json();

        yield put(updateMetadata(tracks));
    }
}

export default function*() {
    yield takeEvery(Types.UPDATE_TRACKS, loadMetadataForNewTracks);
}
