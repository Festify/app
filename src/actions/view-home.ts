import { FirebaseDatabase } from '@firebase/database-types';
import { push } from '@mraerino/redux-little-router-reactless/lib';
import { ThunkAction } from 'redux-thunk';

import { CLIENT_ID, SCOPES } from '../../spotify.config';
import { Party, State } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS } from '../util/firebase';

import { PayloadAction, Types } from '.';

export type Actions =
    | ChangePartyIdAction
    | JoinPartyFailAction
    | JoinPartyStartAction;

export interface ChangePartyIdAction extends PayloadAction<string> {
    type: Types.CHANGE_PARTY_ID;
}

export interface JoinPartyFailAction extends PayloadAction<Error> {
    type: Types.JOIN_PARTY_Fail;
    error: true;
}

export interface JoinPartyStartAction {
    type: Types.JOIN_PARTY_Start;
}

export function changePartyId(partyId: string): ChangePartyIdAction {
    return {
        type: Types.CHANGE_PARTY_ID,
        payload: partyId,
    };
}

export function createParty(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const { user } = getState().auth.spotify;

        if (!user) {
            throw new Error("Missing Spotify user.");
        }

        const { uid } = await requireAuth();

        const now = firebaseNS.database!.ServerValue.TIMESTAMP;
        const userDisplayName = user.display_name || user.id;
        const userNamePosessive = userDisplayName.endsWith('s') ? "'" : "'s";
        const party = {
            country: user.country,
            created_at: now,
            created_by: uid,
            name: `${userDisplayName}${userNamePosessive} Party`,
            playback: {
                last_change: now,
                last_position_ms: 0,
                playing: false,
            },
            short_id: String(Math.floor(Math.random() * 1000000)),
        };

        const result = await firebase.database!()
            .ref('/parties')
            .push(party);

        dispatch(push(`/party/${result.key}`, {}));
    };
}

export function joinParty(): ThunkAction<Promise<any>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.JOIN_PARTY_Start });

        try {
            const partyId = getState().homeView.partyId;

            const snapshot = await (firebase.database!() as FirebaseDatabase)
                .ref('/parties')
                .orderByChild('short_id')
                .equalTo(partyId)
                .once('value');

            if (snapshot.numChildren() < 1) {
                throw new Error("Party not found!");
            }

            const result: Record<string, Party> = snapshot.val();
            const resultId = Object.keys(result).reduce(
                (acc, k) => result[k].created_at > (result[acc] || { created_at: -1 }).created_at ? k : acc,
                '',
            );

            dispatch(push(`/party/${resultId}`, {}));
        } catch (e) {
            dispatch({
                type: Types.JOIN_PARTY_Fail,
                error: true,
                payload: e,
            } as JoinPartyFailAction);
        }
    };
}

export function loginWithSpotify(): ThunkAction<void, State, void> {
    return (dispatch) => {
        console.log("Good bye.");

        const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}`
            + `&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code`
            + `&scope=${encodeURIComponent(SCOPES.join(' '))}&state=SPOTIFY_AUTH`;

        window.location.href = url;
    };
}
