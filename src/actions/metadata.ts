import chunk from 'lodash-es/chunk';
import { ThunkAction } from 'redux-thunk';

import { Metadata, State, TrackReference } from '../state';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';

export type Actions =
    | UpdateMetadataAction;

export interface UpdateMetadataAction extends PayloadAction<Record<string, Metadata>> {
    type: Types.UPDATE_METADATA;
}

export function loadMetadata(references: TrackReference[]): ThunkAction<Promise<void>, State, void> {
    return (dispatch, getState) => {
        const { metadata } = getState();
        const remaining = references
            .filter(ref => !(`${ref.provider}-${ref.id}` in metadata))
            .map(ref => ref.id);
        const promises = chunk(remaining, 50).map(async ids => {
            const url = `/tracks?ids=${encodeURIComponent(ids.join(','))}`;
            const resp = await fetchWithAnonymousAuth(url);
            const { tracks } = await resp.json();

            dispatch(updateMetadata(tracks));
        });

        return Promise.all(promises).then(() => {});
    };
}

export function updateMetadata(tracks: any[]): UpdateMetadataAction {
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
