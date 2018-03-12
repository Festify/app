import values from 'lodash-es/values';
import { createSelector } from 'reselect';

import { Metadata, State, Track } from '../state';

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
    tracks => values(tracks)
        .filter(t => t.reference.provider && t.reference.id)
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

export const currentTrackMetadataSelector = createSelector(
    currentTrackIdSelector,
    metadataSelector,
    (trackId, metadata) => trackId ? metadata[trackId] : null,
);

export const voteStringGeneratorFactory = (
    defaultTrackSelector: (state: State, trackId: string) => Track | null,
) => createSelector(
    defaultTrackSelector,
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
