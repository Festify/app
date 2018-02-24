import values from 'lodash-es/values';
import { createSelector } from 'reselect';

import { Metadata, State, Track } from '../state';

const dummyTrack: Track = {
    added_at: 0,
    is_fallback: false,
    order: 0,
    reference: {
        id: '',
        provider: 'spotify',
    },
    vote_count: 0,
};

export const tracksSelector = (state: State) => state.party.tracks || {};

export const singleTrackSelector = (state: State, trackId: string) => state.party.tracks && state.party.tracks[trackId];

export const metadataSelector = (state: State) => state.metadata || {};

export const singleMetadataSelector = (state: State, trackId: string): Metadata | null => state.metadata[trackId];

export const defaultTrackSelectorFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => createSelector(
    trackSelector,
    track => ({ ...dummyTrack, ...track }),
);

export const artistsSelectorFactory = () => createSelector(
    singleMetadataSelector,
    metadata => metadata ? metadata.artists : null,
);

export const artistJoinerFactory = () => createSelector(
    artistsSelectorFactory(),
    artists => {
        if (!artists) {
            return null;
        }

        const [first, ...rest] = artists;
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
    defaultTrackSelector: (state: State, trackId: string) => Track,
) => createSelector(
    defaultTrackSelector,
    ({ is_fallback, vote_count }) => {
        if (vote_count > 1) {
            return `${vote_count} Votes`;
        } else if (vote_count === 1) {
            return "One Vote";
        } else {
            return is_fallback ? "Fallback Track" : "Not in Queue";
        }
    },
);
