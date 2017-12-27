import { DataSnapshot, FirebaseDatabase, Reference } from "@firebase/database-types";
import { ThunkAction } from "redux-thunk";

import { Party, State } from "../state";
import firebase from "../util/firebase";

import { PayloadAction, Types } from "./index";

export type Actions =
    | OpenPartyStartAction
    | OpenPartyFailAction
    | CleanupPartyAction
    | UpdatePartyAction;

let partyRef: Reference | null = null;
export function openParty(id: string): ThunkAction<Promise<void>, State, void> {
    return async (dispatch) => {
        dispatch({ type: Types.OPEN_PARTY_Start });

        if (partyRef) {
            dispatch(closeParty());
        }

        partyRef = (firebase.database!() as FirebaseDatabase)
            .ref("/parties/")
            .child(id);

        const partySnap = await partyRef.once('value');

        if (!partySnap.exists()) {
            dispatch(openPartyFail(new Error("Party not found!")));
            return;
        }

        partyRef.on('value', (snap: DataSnapshot) => {
            if (!snap.exists()) {
                dispatch(openPartyFail(new Error("Party not found!")));
            }
            dispatch(updateParty(snap.val()));
        });
    };
}

export function closeParty(): ThunkAction<void, State, void> {
    return (dispatch) => {
        if (partyRef !== null) {
            partyRef.off('value');
            partyRef = null;
        }
        dispatch({ type: Types.CLEANUP_PARTY });
    };
}

export interface OpenPartyStartAction {
    type: Types.OPEN_PARTY_Start;
}

export interface OpenPartyFailAction extends PayloadAction<Error> {
    type: Types.OPEN_PARTY_Fail;
    error: true;
}
export function openPartyFail(err: Error): OpenPartyFailAction {
    return {
        type: Types.OPEN_PARTY_Fail,
        error: true,
        payload: err,
    };
}

export interface CleanupPartyAction {
    type: Types.CLEANUP_PARTY;
}

export interface UpdatePartyAction extends PayloadAction<Party> {
    type: Types.UPDATE_PARTY;
}

export function updateParty(party: Party): UpdatePartyAction {
    return {
        type: Types.UPDATE_PARTY,
        payload: party,
    };
}
