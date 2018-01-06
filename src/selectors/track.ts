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

export const currentTrackIdSelector = createSelector(
    tracksSelector,
    (tracks: Record<string, Track>) => Object.keys(tracks)
        .reduce((acc, key) => !acc || tracks[key].order < tracks[acc!].order ? key : acc, null),
);
export const currentTrackSelector = createSelector(
    tracksSelector,
    currentTrackIdSelector,
    (tracks: Record<string, Track>, currentId: string | null) => currentId ? tracks[currentId] : null,
);

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
