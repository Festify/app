import values from 'lodash-es/values';
import { createSelector } from 'reselect';

import { Metadata, State, Track } from '../state';

const dummyMetadata: Metadata = {
    artists: [],
    cover: [],
    durationMs: 0,
    name: 'Loading...',
};
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

export const singleMetadataSelector = (state: State, trackId: string) => state.metadata[trackId];

export const defaultMetaSelectorFactory = () => createSelector(
    singleMetadataSelector,
    metadata => ({ ...dummyMetadata, ...metadata }),
);

export const defaultTrackSelectorFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => createSelector(
    trackSelector,
    track => ({ ...dummyTrack, ...track }),
);

export const artistsSelectorFactory = () => createSelector(
    defaultMetaSelectorFactory(),
    metadata => metadata.artists,
);

export const artistJoinerFactory = () => createSelector(
    artistsSelectorFactory(),
    artists => {
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
    tracks => values(tracks).sort((a, b) => a.order - b.order),
);

export const queueTracksSelector = sortedTracksFactory(tracksSelector);

export const topTracksSelector = createSelector(
    queueTracksSelector,
    tracks => tracks.slice(0, 2),
);

export const currentTrackSelector = createSelector(
    queueTracksSelector,
    tracks => tracks.length > 0 ? tracks[0] : null,
);

export const currentTrackIdSelector = createSelector(
    currentTrackSelector,
    track => track ? `${track.reference.provider}-${track.reference.id}` : null,
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
