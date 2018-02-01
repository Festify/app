import { push } from '@mraerino/redux-little-router-reactless/lib';
import { ThunkAction } from 'redux-thunk';

import { CLIENT_ID } from '../../spotify.config';
import { State } from '../state';
import { SCOPES } from '../util/spotify-auth';

import { PayloadAction, Types } from '.';
import { createParty, openParty, resolveShortId, JoinPartyFailAction } from './party-data';

export type Actions =
    | ChangePartyIdAction;

export interface ChangePartyIdAction extends PayloadAction<string> {
    type: Types.CHANGE_PARTY_ID;
}

export function changePartyId(partyId: string): ChangePartyIdAction {
    return {
        type: Types.CHANGE_PARTY_ID,
        payload: partyId,
    };
}

export function createNewParty(): ThunkAction<Promise<void>, State, void> {
    return async dispatch => {
        const partyId = await createParty();
        dispatch(push(`/party/${partyId}`, {}));
    };
}

export function joinParty(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const partyId = getState().homeView.partyId;
        await dispatch(openParty(partyId));
    };
}

export function loginWithSpotify(): ThunkAction<void, State, void> {
    return () => {
        console.log("Good bye.");

        const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}`
            + `&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code`
            + `&scope=${encodeURIComponent(SCOPES.join(' '))}&state=SPOTIFY_AUTH&show_dialog=true`;

        window.location.href = url;
    };
}
