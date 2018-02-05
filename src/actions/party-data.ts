import { DataSnapshot, FirebaseDatabase, Query, Reference } from '@firebase/database-types';
import { push } from '@mraerino/redux-little-router-reactless/lib';
import { ThunkAction } from 'redux-thunk';

import { ConnectionState, Party, State, Track } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS } from '../util/firebase';
import { requireAccessToken } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';
import { connectPlayer, disconnectPlayer } from './playback-spotify';

export type Actions =
    | OpenPartyStartAction
    | OpenPartyFailAction
    | CleanupPartyAction
    | JoinPartyFailAction
    | JoinPartyStartAction
    | UpdateNetworkConnectionStateAction
    | UpdatePartyAction
    | UpdateTracksAction
    | UpdateUserVotesAction;

export interface CleanupPartyAction {
    type: Types.CLEANUP_PARTY;
}

export interface JoinPartyFailAction extends PayloadAction<Error> {
    type: Types.JOIN_PARTY_Fail;
    error: true;
}

export interface JoinPartyStartAction {
    type: Types.JOIN_PARTY_Start;
}

export interface OpenPartyStartAction {
    type: Types.OPEN_PARTY_Start;
}

export interface OpenPartyFailAction extends PayloadAction<Error> {
    type: Types.OPEN_PARTY_Fail;
    error: true;
}

export interface UpdateNetworkConnectionStateAction extends PayloadAction<ConnectionState> {
    type: Types.UPDATE_NETWORK_CONNECTION_STATE;
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

let connectionRef: Reference | null = null;
let partyRef: Reference | null = null;
let playbackMasterRef: Reference | null = null;
let topmostTrackRef: Query | null;
let tracksRef: Query | null = null;
let votesRef: Reference | null = null;

export function closeParty(): ThunkAction<void, State, void> {
    return (dispatch) => {
        if (connectionRef !== null) {
            connectionRef.off('value');
            connectionRef = null;
        }
        if (partyRef !== null) {
            partyRef.off('value');
            partyRef = null;
        }
        if (playbackMasterRef !== null) {
            playbackMasterRef.off('value');
            playbackMasterRef.set(null); // Unset playback master state
            playbackMasterRef = null;
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

export function createParty(): ThunkAction<Promise<string>, State, void> {
    return async (dispatch, getState) => {
        const { player, user } = getState();
        const spotifyUser = user.spotify.user;

        if (!spotifyUser) {
            throw new Error("Missing Spotify user.");
        }

        const { uid } = await requireAuth();

        const now = firebaseNS.database!.ServerValue.TIMESTAMP;
        const userDisplayName = spotifyUser.display_name || spotifyUser.id;
        const userNamePosessive = userDisplayName.endsWith('s') ? "'" : "'s";
        const party: Party = {
            country: spotifyUser.country,
            created_at: now as any,
            created_by: uid,
            name: `${userDisplayName}${userNamePosessive} Party`,
            playback: {
                device_id: null,
                last_change: now as any,
                last_position_ms: 0,
                master_id: player.instanceId,
                playing: false,
            },
            short_id: String(Math.floor(Math.random() * 1000000)),
        };

        const result = await firebase.database!()
            .ref('/parties')
            .push(party);

        if (!result.key) {
            throw new Error("Missing ID of newly created party!");
        }

        return result.key;
    };
}

export function loadParty(id: string): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.OPEN_PARTY_Start } as OpenPartyStartAction);

        if (connectionRef || partyRef || topmostTrackRef || tracksRef || votesRef) {
            dispatch(closeParty());
        }

        connectionRef = firebase.database!()
            .ref('.info/connected');

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
            playbackMasterRef = firebase.database!()
                .ref('/parties')
                .child(id)
                .child('playback')
                .child('master_id');
            playbackMasterRef.onDisconnect()
                .set(null);

            playbackMasterRef.on('value', (snap: DataSnapshot) => {
                const instanceId = getState().player.instanceId;
                const masterId: string | null = snap.val();

                if (masterId === instanceId) {
                    // Set up spotify player if we own the party
                    requireAccessToken()
                        .then(() => dispatch(connectPlayer()))
                        .catch(() => {});

                    // Pin topmost / playing track to top of queue
                    // TODO: Outsource this into cloud function once old app is gone
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
                } else {
                    dispatch(disconnectPlayer());

                    if (!topmostTrackRef) {
                        return;
                    }

                    topmostTrackRef.off('value');
                    topmostTrackRef = null;
                }
            });
        }
        tracksRef = (firebase.database!() as FirebaseDatabase)
            .ref('/tracks')
            .child(id);
        votesRef = (firebase.database!() as FirebaseDatabase)
            .ref('/votes_by_user')
            .child(id)
            .child(uid);

        connectionRef.on('value', (snap: DataSnapshot) => dispatch(updateConnectionState(
            snap.val() ? ConnectionState.Connected : ConnectionState.Disconnected,
        )));
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

export function openParty(shortId: string): ThunkAction<Promise<any>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.JOIN_PARTY_Start });

        const longId = await resolveShortId(shortId);
        if (!longId) {
            dispatch({
                type: Types.JOIN_PARTY_Fail,
                error: true,
                payload: new Error("Party not found!"),
            } as JoinPartyFailAction);
            return;
        }

        dispatch(push(`/party/${longId}`, {}));
    };
}

export function openPartyFail(err: Error): OpenPartyFailAction {
    return {
        type: Types.OPEN_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export async function resolveShortId(shortId: string): Promise<string | null> {
    const snapshot = await firebase.database!()
        .ref('/parties')
        .orderByChild('short_id')
        .equalTo(shortId)
        .once('value');

    if (snapshot.numChildren() < 1) {
        return null;
    }

    const result: Record<string, Party> = snapshot.val();
    const possibleLongId = Object.keys(result).reduce(
        (acc, k) => result[k].created_at > (result[acc] || { created_at: -1 }).created_at ? k : acc,
        '',
    );

    return possibleLongId || null; // Filter out empty IDs
}

export function updateConnectionState(isConnected: ConnectionState): UpdateNetworkConnectionStateAction {
    return {
        type: Types.UPDATE_NETWORK_CONNECTION_STATE,
        payload: isConnected,
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
