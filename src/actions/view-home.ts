import { FirebaseDatabase } from '@firebase/database-types';
import { push } from '@mraerino/redux-little-router-reactless/lib';
import { ThunkAction } from 'redux-thunk';

import { Party, State } from '../state';
import firebase from '../util/firebase';

import { PayloadAction, Types } from '.';

export type Actions =
    | ChangePartyIdAction
    | JoinPartyFailAction
    | JoinPartyStartAction;

export function createParty() {
    throw new Error("Unimplemented");
}

export interface ChangePartyIdAction extends PayloadAction<string> {
    type: Types.CHANGE_PARTY_ID;
}

export function changePartyId(partyId: string): ChangePartyIdAction {
    return {
        type: Types.CHANGE_PARTY_ID,
        payload: partyId,
    };
}

export interface JoinPartyFailAction extends PayloadAction<Error> {
    type: Types.JOIN_PARTY_Fail;
    error: true;
}

export interface JoinPartyStartAction {
    type: Types.JOIN_PARTY_Start;
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
