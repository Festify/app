import { FirebaseAuth } from '@firebase/auth-types';
import { DataSnapshot, FirebaseDatabase, Query, Reference } from '@firebase/database-types';
import { ThunkAction } from 'redux-thunk';

import { Party, State, Track } from '../state';
import { requireAuth } from '../util/auth';
import firebase from '../util/firebase';
import { requireAccessToken } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';
import { connectPlayer } from './playback-spotify';

export type Actions =
    | OpenPartyStartAction
    | OpenPartyFailAction
    | CleanupPartyAction
    | UpdatePartyAction
    | UpdateTracksAction
    | UpdateUserVotesAction;

export interface CleanupPartyAction {
    type: Types.CLEANUP_PARTY;
}

export interface OpenPartyStartAction {
    type: Types.OPEN_PARTY_Start;
}

export interface OpenPartyFailAction extends PayloadAction<Error> {
    type: Types.OPEN_PARTY_Fail;
    error: true;
}

export interface UpdatePartyAction extends PayloadAction<Party> {
    type: Types.UPDATE_PARTY;
}

export interface UpdateTracksAction extends PayloadAction<Record<string, Track> | null> {
    type: Types.UPDATE_TRACKS;
}

export interface UpdateUserVotesAction extends PayloadAction<Record<string, boolean> | null> {
    type: Types.UPDATE_USER_VOTES;
}

let partyRef: Reference | null = null;
let topmostTrackRef: Query | null;
let tracksRef: Query | null = null;
let votesRef: Reference | null = null;

export function openParty(id: string): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.OPEN_PARTY_Start } as OpenPartyStartAction);

        if (partyRef || tracksRef) {
            dispatch(closeParty());
        }

        partyRef = (firebase.database!() as FirebaseDatabase)
            .ref('/parties/')
            .child(id);

        const partySnap = await partyRef.once('value');

        if (!partySnap.exists()) {
            dispatch(openPartyFail(new Error("Party not found!")));
            return;
        }

        const { uid } = await requireAuth();
        const isOwner = (partySnap.val() as Party).created_by === uid;

        if (isOwner) {
            requireAccessToken().then(() => dispatch(connectPlayer())).catch(() => {});

            topmostTrackRef = firebase.database!()
                .ref('/tracks')
                .child(id)
                .orderByChild('order')
                .limitToFirst(1);

            topmostTrackRef.on('value', (snap: DataSnapshot) => {
                if (!snap.exists()) {
                    return;
                }

                const [trackKey] = Object.keys(snap.val());
                firebase.database!()
                    .ref('/tracks')
                    .child(id)
                    .child(trackKey)
                    .child('order')
                    .set(Number.MIN_SAFE_INTEGER)
                    .catch(err => console.warn("Failed to update current track order:", err));
            });
        }
        tracksRef = (firebase.database!() as FirebaseDatabase)
            .ref('/tracks')
            .child(id);
        votesRef = (firebase.database!() as FirebaseDatabase)
            .ref('/votes_by_user')
            .child(id)
            .child(uid);

        partyRef.on('value', (snap: DataSnapshot) => {
            if (!snap.exists()) {
                dispatch(openPartyFail(new Error("Party not found!")));
                return;
            }
            dispatch(updateParty(snap.val()));
        });
        tracksRef.on('value', (snap: DataSnapshot) => dispatch(updateTracks(snap.val())));
        votesRef.on('value', (snap: DataSnapshot) => dispatch(updateUserVotes(snap.val())));
    };
}

export function closeParty(): ThunkAction<void, State, void> {
    return (dispatch) => {
        if (partyRef !== null) {
            partyRef.off('value');
            partyRef = null;
        }
        if (topmostTrackRef != null) {
            topmostTrackRef.off('value');
            topmostTrackRef = null;
        }
        if (tracksRef != null) {
            tracksRef.off('value');
            tracksRef = null;
        }
        if (votesRef != null) {
            votesRef.off('value');
            votesRef = null;
        }
        dispatch({ type: Types.CLEANUP_PARTY });
    };
}

export function openPartyFail(err: Error): OpenPartyFailAction {
    return {
        type: Types.OPEN_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export function updateParty(party: Party): UpdatePartyAction {
    return {
        type: Types.UPDATE_PARTY,
        payload: party,
    };
}

export function updateTracks(tracks: Record<string, Track> | null): UpdateTracksAction {
    return {
        type: Types.UPDATE_TRACKS,
        payload: tracks,
    };
}

export function updateUserVotes(votes: Record<string, boolean> | null): UpdateUserVotesAction {
    return {
        type: Types.UPDATE_USER_VOTES,
        payload: votes,
    };
}
