import * as SpotifyApi from 'spotify-web-api-js';

import { Metadata } from '../state';

import { PayloadAction, Types } from '.';

export type Actions =
    | UpdateMetadataAction;

export interface UpdateMetadataAction extends PayloadAction<Record<string, Metadata>> {
    type: Types.UPDATE_METADATA;
}

export function updateMetadata(
    meta: Record<string, Metadata> | SpotifyApi.TrackObjectFull[],
): UpdateMetadataAction {
    if (Array.isArray(meta)) {
        const payload: Record<string, Metadata> = {};
        for (const track of meta) {
            payload[`spotify-${track.id}`] = {
                artists: track.artists.map(art => art.name),
                cover: track.album.images.filter(img => img.width && img.height),
                durationMs: track.duration_ms,
                name: track.name,
            } as Metadata;
        }

        return {
            type: Types.UPDATE_METADATA,
            payload,
        };
    } else {
        return {
            type: Types.UPDATE_METADATA,
            payload: meta,
        };
    }
}
