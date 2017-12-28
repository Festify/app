import { ThunkAction } from 'redux-thunk';

import { Reference, State } from '../state';
import { requireAuth } from '../util/auth';
import firebase from '../util/firebase';

import { PayloadAction, Types } from '.';

export type Actions =
    | ChangeSearchInputTextAction
    | ToggleVoteAction;

export interface ChangeSearchInputTextAction extends PayloadAction<string> {
    type: Types.CHANGE_SEARCH_INPUT_TEXT;
}

export interface ToggleVoteAction extends PayloadAction<[Reference, boolean]> {
    type: Types.TOGGLE_VOTE;
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
