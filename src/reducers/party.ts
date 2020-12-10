import { Actions } from '../actions';
import {
    CLEANUP_PARTY,
    OPEN_PARTY_FAIL,
    OPEN_PARTY_FINISH,
    OPEN_PARTY_START,
    UPDATE_NETWORK_CONNECTION_STATE,
    UPDATE_PARTY,
    UPDATE_PLAYBACK_STATE,
    UPDATE_TRACKS,
    UPDATE_USER_VOTES,
} from '../actions/party-data';
import { SET_VOTE } from '../actions/queue';
import { firebaseTrackIdSelector } from '../selectors/track';
import { ConnectionState, PartyState, Track } from '../state';

const VOTE_FACTOR = 1e12;

export default function(
    state: PartyState = {
        connectionState: ConnectionState.Unknown,
        currentParty: null,
        hasTracksLoaded: false,
        partyLoadError: null,
        partyLoadInProgress: false,
        tracks: null,
        userVotes: null,
    },
    action: Actions,
): PartyState {
    switch (action.type) {
        case OPEN_PARTY_START:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: true,
            };
        case OPEN_PARTY_FAIL:
            return {
                ...state,
                partyLoadError: action.payload,
                partyLoadInProgress: false,
            };
        case OPEN_PARTY_FINISH:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: false,
            };
        case SET_VOTE:
            const [ref, vote] = action.payload;
            const trackId = firebaseTrackIdSelector(ref);

            const trackList: Record<string, Track> = { ...state.tracks };
            if (state.tracks && state.tracks[trackId]) {
                const track = trackList[trackId];
                const voteQuantifier = vote ? -1 : 1;

                // Precompute order for quicker UI reaction
                trackList[trackId] = {
                    ...track,
                    order: track.order + VOTE_FACTOR * voteQuantifier,
                    vote_count: track.vote_count - voteQuantifier,
                };
            }

            return {
                ...state,
                tracks: trackList,
                userVotes: {
                    ...state.userVotes,
                    [trackId]: vote,
                },
            };
        case UPDATE_NETWORK_CONNECTION_STATE:
            return {
                ...state,
                connectionState: action.payload,
            };
        case UPDATE_PARTY:
            return {
                ...state,
                currentParty: action.payload,
            };
        case UPDATE_TRACKS:
            return {
                ...state,
                hasTracksLoaded: true,
                tracks: action.payload,
            };
        case UPDATE_USER_VOTES:
            return {
                ...state,
                userVotes: action.payload,
            };
        case UPDATE_PLAYBACK_STATE:
            if (!state.currentParty) {
                return state;
            }

            return {
                ...state,
                currentParty: {
                    ...state.currentParty,
                    playback: {
                        ...state.currentParty.playback,
                        ...action.payload,
                    },
                },
            };
        case CLEANUP_PARTY:
            return {
                connectionState: ConnectionState.Unknown,
                currentParty: null,
                hasTracksLoaded: false,
                partyLoadError: null,
                partyLoadInProgress: false,
                userVotes: null,
                tracks: null,
            };
        default:
            return state;
    }
}
