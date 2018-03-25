import values from 'lodash-es/values';
import { createSelector } from 'reselect';

import { Metadata, State, Track, TrackReference } from '../state';

export const firebaseTrackIdSelector = (t: Track | TrackReference): string =>
    (t as Track).reference
        ? firebaseTrackIdSelector((t as Track).reference)
        : `${(t as TrackReference).provider}-${(t as TrackReference).id}`;

export const tracksSelector = (state: State) => state.party.tracks || {};

export const singleTrackSelector = (state: State, trackId: string) => state.party.tracks && state.party.tracks[trackId];

export const metadataSelector = (state: State) => state.metadata || {};

export const singleMetadataSelector = (state: State, trackId: string): Metadata | null => state.metadata[trackId];

export const artistJoinerFactory: () => (s: State, id: string) => string | null = () => createSelector(
    singleMetadataSelector,
    metadata => {
        if (!metadata || !metadata.artists) {
            return null;
        }

        const [first, ...rest] = metadata.artists;
        return rest.length > 0
            ? `${first} feat. ${rest.join(' & ')}`
            : first;
    },
);

export const sortedTracksFactory = (
    tracksSelector: (state: State) => Record<string, Track> | null,
): ((state: State) => Track[]) => createSelector(
    tracksSelector,
    metadataSelector,
    (tracks, meta) => values(tracks)
        .filter(t => t.reference && t.reference.provider && t.reference.id)
        .filter(t => {
            const fbId = firebaseTrackIdSelector(t);
            return !(fbId in meta) || meta[fbId].isPlayable;
        })
        .sort((a, b) => a.order - b.order),
);

export const queueTracksSelector = sortedTracksFactory(tracksSelector);

export const currentTrackSelector = createSelector(
    queueTracksSelector,
    tracks => tracks.length > 0 ? tracks[0] : null,
);

export const currentTrackIdSelector = createSelector(
    currentTrackSelector,
    track => track ? `${track.reference.provider}-${track.reference.id}` : null,
);

export function tracksEqual(a: Track | null | undefined, b: Track | null | undefined): boolean {
    if (a === b) {
        return true;
    } else if (!a || !b) {
        return false;
    } else {
        return a.reference.provider === b.reference.provider &&
            a.reference.id === b.reference.id;
    }
}

export const voteStringGeneratorFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => createSelector(
    trackSelector,
    track => {
        if (!track) {
            return '';
        }

        if (track.vote_count > 1) {
            return `${track.vote_count} Votes`;
        } else if (track.vote_count === 1) {
            return "One Vote";
        } else {
            return track.is_fallback ? "Fallback Track" : "Not in Queue";
        }
    },
);

export const loadFanartTracksSelector = createSelector(
    metadataSelector,
    queueTracksSelector,
    (meta, tracks) => tracks.slice(0, 2)
        .map(t => firebaseTrackIdSelector(t))
        .filter(id => id in meta && !meta[id].background)
        .map(id => [id, meta[id]] as [string, Metadata]),
);

export const loadMetadataSelector = createSelector(
    metadataSelector,
    queueTracksSelector,
    (meta, tracks) => tracks.filter(t => {
            const fbId = firebaseTrackIdSelector(t);
            return !(fbId in meta) || meta[fbId].durationMs == null;
        })
        .map(t => t.reference.id),
);
