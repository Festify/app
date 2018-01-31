import chunk from 'lodash-es/chunk';
import { ThunkAction } from 'redux-thunk';
import * as SpotifyApi from 'spotify-web-api-js';

import { Metadata, State, TrackReference } from '../state';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';

export type Actions =
    | UpdateMetadataAction;

export interface UpdateMetadataAction extends PayloadAction<Record<string, Metadata>> {
    type: Types.UPDATE_METADATA;
}

export function loadMetadata(references: TrackReference[]): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const { metadata } = getState();
        const remaining = references
            .filter(ref => ref.id && !(`${ref.provider}-${ref.id}` in metadata))
            .map(ref => ref.id);

        const promises = chunk(remaining, 50).map(async (ids: string[]) => {
            if (ids.length === 0) {
                return;
            }

            const url = `/tracks?ids=${encodeURIComponent(ids.join(','))}`;
            const resp = await fetchWithAnonymousAuth(url);
            const { tracks } = await resp.json();

            dispatch(updateMetadata(tracks));
        });

        await Promise.all(promises);
    };
}

export function updateMetadata(tracks: SpotifyApi.TrackObjectFull[]): UpdateMetadataAction {
    const metadata = tracks.reduce((acc, track) => {
        acc[`spotify-${track.id}`] = {
            artists: track.artists.map(art => art.name),
            cover: track.album.images,
            durationMs: track.duration_ms,
            name: track.name,
        } as Metadata;
        return acc;
    }, {});

    return {
        type: Types.UPDATE_METADATA,
        payload: metadata,
    };
}
