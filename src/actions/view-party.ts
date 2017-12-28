import debounce from 'lodash-es/debounce';
import { ThunkAction } from 'redux-thunk';

import { Reference, State, Track } from '../state';
import { requireAuth } from '../util/auth';
import firebase from '../util/firebase';
import { fetchWithAnonymousAuth } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | ChangeSearchInputTextAction
    | ToggleVoteAction
    | SearchStartAction
    | SearchFinishAction
    | SearchFailAction;

export interface ChangeSearchInputTextAction extends PayloadAction<string> {
    type: Types.CHANGE_SEARCH_INPUT_TEXT;
}

export interface ToggleVoteAction extends PayloadAction<[Reference, boolean]> {
    type: Types.TOGGLE_VOTE;
}

export interface SearchStartAction {
    type: Types.SEARCH_Start;
}

export interface SearchFinishAction extends PayloadAction<Record<string, Track>> {
    type: Types.SEARCH_Finish;
}

export interface SearchFailAction extends ErrorAction {
    type: Types.SEARCH_Fail;
}

export function changeSearchInputText(text: string): ChangeSearchInputTextAction {
    return {
        type: Types.CHANGE_SEARCH_INPUT_TEXT,
        payload: text,
    };
}

export function toggleVote(ref: Reference): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();
        const { userVotes } = state.party;
        const { params } = state.router;

        const partyId = params && params.partyId;

        if (!partyId) {
            throw new Error("Missing party ID!");
        }

        const hasVoted = userVotes && userVotes[`${ref.provider}-${ref.id}`] === true;
        const trackId = `${ref.provider}-${ref.id}`;

        dispatch({
            type: Types.TOGGLE_VOTE,
            payload: [ref, !hasVoted],
        } as ToggleVoteAction);

        const { uid } = await requireAuth();

        const a = firebase.database!()
            .ref('/votes')
            .child(partyId)
            .child(trackId)
            .child(uid)
            .set(!hasVoted);
        const b = firebase.database!()
            .ref('/votes_by_user')
            .child(partyId)
            .child(uid)
            .child(trackId)
            .set(!hasVoted);

        await Promise.all([a, b]);
    };
}

let latestSearchFetch = 0;
const searchThunk = debounce(async (dispatch, getState: () => State) => {
    dispatch({ type: Types.SEARCH_Start } as SearchStartAction);

    const state = getState();
    const query = state.partyView.searchInput;
    const { currentParty } = state.party;
    const url =
        `https://api.spotify.com/v1/search?type=track&limit=${20}&market=${currentParty!.country}` +
        `&q=${encodeURIComponent(query.replace('-', ' ') + '*')}`;

    const fetchTime = latestSearchFetch = Date.now();
    let tracks;
    try {
        const trackResponse = await fetchWithAnonymousAuth(url);
        if (fetchTime < latestSearchFetch) {
            return;
        }

        tracks = (await trackResponse.json()).tracks.items;
    } catch (e) {
        return dispatch({
            type: Types.SEARCH_Fail,
            error: true,
            payload: e,
        });
    }

    const result = tracks.reduce((acc, track, i) => {
        const trackId = `spotify-${track.id}`;
        acc[trackId] = {
            added_at: Date.now(),
            is_fallback: false,
            order: i,
            reference: {
                provider: 'spotify',
                id: track.id,
            },
            vote_count: 0,
        } as Track;
        return acc;
    }, {});

    dispatch(searchFinish(result));
}, 300);

export function searchTracks(): ThunkAction<Promise<void>, State, void> {
    return searchThunk;
}

export function searchFinish(tracks: Record<string, Track>): SearchFinishAction {
    return {
        type: Types.SEARCH_Finish,
        payload: tracks,
    };
}
