import { createSelector } from 'reselect';

import { Metadata, State, Track, TrackReference } from '../state';

import { playbackSelector } from './party';

export const firebaseTrackIdSelector = (t: Track | TrackReference): string => {
    const ref = (t as Track).reference || (t as TrackReference);
    return `${ref.provider}-${ref.id}`;
};

export const tracksSelector = (state: State) => state.party.tracks || {};

export const singleTrackSelector = (state: State, trackId: string) =>
    tracksSelector(state)[trackId];

export const metadataSelector = (state: State): Record<string, Metadata> => state.metadata || {};

export const singleMetadataSelector = (state: State, trackId: string): Metadata | null =>
    metadataSelector(state)[trackId];

export const artistJoinerFactory: () => (s: State, id: string) => string | null = () =>
    createSelector(singleMetadataSelector, (metadata) => {
        if (!metadata || !metadata.artists) {
            return null;
        }

        const [first, ...rest] = metadata.artists;
        return rest.length > 0 ? `${first} feat. ${rest.join(' & ')}` : first;
    });

export const sortedTracksFactory = (
    tracksSelector: (state: State) => Record<string, Track> | null,
): ((state: State) => Track[]) =>
    createSelector(
        tracksSelector,
        metadataSelector,
        ({ party }) => {
            return party.currentParty &&
                party.currentParty.settings &&
                party.currentParty.settings.maximum_track_length
                ? party.currentParty.settings.maximum_track_length * 60 * 1000
                : Infinity;
        },
        (tracks, meta, maxDurationMs) => {
            if (!tracks) {
                return [];
            }

            return Object.keys(tracks)
                .map((k) => tracks[k])
                .filter((t) => t.reference && t.reference.provider && t.reference.id)
                .filter((t) => {
                    const fbId = firebaseTrackIdSelector(t);
                    return !(fbId in meta) || meta[fbId].durationMs <= maxDurationMs;
                })
                .sort((a, b) => a.order - b.order);
        },
    );

export const queueTracksSelector = sortedTracksFactory(tracksSelector);

export const currentTrackSelector = createSelector(queueTracksSelector, (tracks) =>
    tracks.length > 0 ? tracks[0] : null,
);

export const currentTrackIdSelector = createSelector(currentTrackSelector, (track) =>
    track ? firebaseTrackIdSelector(track) : null,
);

export function tracksEqual(a: Track | null | undefined, b: Track | null | undefined): boolean {
    // tslint:disable-next-line:triple-equals
    if (a == b) {
        return true;
    } else if (!a || !b) {
        return false;
        // tslint:disable-next-line:triple-equals
    } else if (a.reference == b.reference) {
        return true;
    } else if (!a.reference || !b.reference) {
        return false;
    } else {
        return a.reference.provider === b.reference.provider && a.reference.id === b.reference.id;
    }
}

export const voteStringGeneratorFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) =>
    createSelector(
        trackSelector,
        currentTrackSelector,
        playbackSelector,
        (track, currentTrack, playback) => {
            if (!track || !playback) {
                return '';
            }

            if (tracksEqual(track, currentTrack)) {
                return playback.playing ? 'Playing now' : 'Paused';
            } else if (track.vote_count > 1) {
                return `${track.vote_count} Votes`;
            } else if (track.vote_count === 1) {
                return 'One Vote';
            } else if (track.is_fallback) {
                return 'Fallback Track';
            } else {
                return 'Not in Queue';
            }
        },
    );

export const loadFanartTracksSelector = createSelector(
    metadataSelector,
    queueTracksSelector,
    (meta, tracks) =>
        tracks
            .slice(0, 2)
            .map((t) => firebaseTrackIdSelector(t))
            .filter((id) => id in meta && !meta[id].background)
            .map((id) => [id, meta[id]] as [string, Metadata]),
);

export const loadMetadataSelector = createSelector(
    metadataSelector,
    queueTracksSelector,
    (meta, tracks) =>
        tracks
            .filter((t) => {
                const fbId = firebaseTrackIdSelector(t);
                return !(fbId in meta) || meta[fbId].durationMs == null;
            })
            .map((t) => t.reference.id),
);
