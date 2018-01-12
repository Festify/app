import { mapValues, omit } from 'lodash-es';
import { ThunkAction } from 'redux-thunk';

import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import { singleTrackSelector } from '../selectors/track';
import { State, TrackReference } from '../state';
import { requireAuth } from '../util/auth';
import firebase from '../util/firebase';

import { Types } from '.';
import { ToggleVoteAction } from './view-party';

export function flushTracks(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();
        if (!isPartyOwnerSelector(state)) {
            throw new Error("Not party owner, cannot flush tracks.");
        }

        const partyId = partyIdSelector(state);
        if (!partyId) {
            throw new Error("Missing party ID");
        }

        const trackRemoveObject = {};
        Object.keys(state.party.tracks!)
            .filter(k => !state.party.tracks![k].played_at)
            .forEach(k => trackRemoveObject[k] = null);
        await Promise.all([
            firebase.database!()
                .ref('/tracks')
                .child(partyId)
                .update(trackRemoveObject),
            firebase.database!()
                .ref('/votes')
                .child(partyId)
                .remove(),
            firebase.database!()
                .ref('/votes_by_user')
                .child(partyId)
                .remove(),
        ]);
    };
}

export function removeTrack(
    ref: TrackReference,
    moveToHistory: boolean,
): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();

        if (!isPartyOwnerSelector(state)) {
            throw new Error("Not party owner, cannot remove tracks.");
        }

        const partyId = partyIdSelector(state);
        if (!partyId) {
            throw new Error("Missing party ID");
        }

        const trackId = `${ref.provider}-${ref.id}`;
        const track = singleTrackSelector(state, trackId);

        if (!track) {
            console.warn("Removing nonexistent track");
            return;
        }

        const updates: any[] = [
            firebase.database!()
                .ref('/tracks')
                .child(partyId)
                .child(trackId)
                .set(null),
            firebase.database!()
                .ref('/votes')
                .child(partyId)
                .child(trackId)
                .set(null),
            firebase.database!()
                .ref('/votes_by_user')
                .child(partyId)
                .transaction(votes => mapValues(votes, userVotes => omit(userVotes, trackId))),
        ];
        if (moveToHistory) {
            updates.push(
                firebase.database!()
                    .ref('/tracks_played')
                    .child(partyId)
                    .push(track),
            );
        }

        await Promise.all(updates);
    };
}

export function toggleVote(ref: TrackReference): ThunkAction<Promise<void>, State, void> {
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
