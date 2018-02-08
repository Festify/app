import chunk from 'lodash-es/chunk';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as SpotifyApi from 'spotify-web-api-js';

import { Types } from '../actions';
import { updateMetadata } from '../actions/metadata';
import { UpdateTracksAction } from '../actions/party-data';
import { State } from '../state';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

function* loadMetadataForNewTracks(action: UpdateTracksAction) {
    if (!action.payload) {
        return;
    }

    const { metadata }: State = yield select();

    const remaining = Object.keys(action.payload)
        .filter(k => action.payload![k])
        .map(k => action.payload![k].reference)
        .filter(ref => ref.id && !(`${ref.provider}-${ref.id}` in metadata))
        .map(ref => ref.id);

    for (const ids of chunk(remaining, 50)) {
        if (ids.length === 0) {
            continue;
        }

        const url = `/tracks?ids=${encodeURIComponent(ids.join(','))}`;
        const resp = yield call(fetchWithAnonymousAuth, url);
        const { tracks }: SpotifyApi.MultipleTracksResponse = yield resp.json();

        yield put(updateMetadata(tracks));
    }
}

export default function*() {
    yield takeEvery(Types.UPDATE_TRACKS, loadMetadataForNewTracks);
}
