import * as SpotifyApi from 'spotify-web-api-js';

import { Metadata } from '../state';

import { PayloadAction, Types } from '.';

export type Actions =
    | UpdateMetadataAction;

export interface UpdateMetadataAction extends PayloadAction<Record<string, Partial<Metadata>>> {
    type: Types.UPDATE_METADATA;
}

export function updateMetadata(
    meta: Record<string, Metadata> | SpotifyApi.TrackObjectFull[] | Record<string, string[]>,
): UpdateMetadataAction {
    function isFanartObj(
        meta: Record<string, Metadata> | Record<string, string[]>,
    ): meta is Record<string, string[]> {
        return Object.keys(meta).some(k => Array.isArray(meta[k]));
    }

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
    } else if (isFanartObj(meta)) {
        const payload: Record<string, Partial<Metadata>> = {};
        Object.keys(meta)
            .forEach(key => payload[key] = { background: meta[key] });

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
