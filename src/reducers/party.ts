import { Actions, Types } from '../actions';
import { VOTE_FACTOR } from '../config';
import { PartyState, Track } from '../state';

export default function(
    state: PartyState = {
        currentParty: null,
        partyLoadError: null,
        partyLoadInProgress: false,
        tracks: null,
        userVotes: null,
    },
    action: Actions,
): PartyState {
    switch (action.type) {
        case Types.OPEN_PARTY_Start:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: true,
            };
        case Types.OPEN_PARTY_Fail:
            return {
                ...state,
                partyLoadError: action.payload,
                partyLoadInProgress: false,
            };
        case Types.TOGGLE_VOTE:
            const [ref, vote] = action.payload;
            const trackId = `${ref.provider}-${ref.id}`;

            const trackList: Record<string, Track> = { ...state.tracks };
            if (state.tracks && state.tracks[trackId]) {
                const track = trackList[trackId];
                const voteQuantifier = vote ? -1 : 1;

                trackList[trackId] = {
                    ...track,
                    order: track.order + (VOTE_FACTOR * voteQuantifier),
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
        case Types.UPDATE_PARTY:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: false,
                currentParty: action.payload,
            };
        case Types.UPDATE_TRACKS:
            return {
                ...state,
                tracks: action.payload,
            };
        case Types.UPDATE_USER_VOTES:
            return {
                ...state,
                userVotes: action.payload,
            };
        case Types.CLEANUP_PARTY:
            return {
                currentParty: null,
                partyLoadError: null,
                partyLoadInProgress: false,
                userVotes: null,
                tracks: null,
            };
        default:
            return state;
    }
}
