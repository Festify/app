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

export const trackSelector = (state: State, trackId: string) => state.party.tracks && state.party.tracks[trackId];

export const metadataSelector = (state: State, trackId: string) => state.metadata[trackId];

export const defaultMetaSelectorFactory = () => createSelector(
    metadataSelector,
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
    artists => artists.join(' & '),
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
