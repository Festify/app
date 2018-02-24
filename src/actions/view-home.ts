import { PayloadAction, Types } from '.';

export type Actions =
    | ChangePartyIdAction
    | TriggerSpotifyOAuthLoginAction;

export interface ChangePartyIdAction extends PayloadAction<string> {
    type: Types.CHANGE_PARTY_ID;
}

export interface TriggerSpotifyOAuthLoginAction {
    type: Types.TRIGGER_SPOTIFY_OAUTH_LOGIN;
}

export function changePartyId(partyId: string): ChangePartyIdAction {
    return {
        type: Types.CHANGE_PARTY_ID,
        payload: partyId,
    };
}

export function loginWithSpotify(): TriggerSpotifyOAuthLoginAction {
    return { type: Types.TRIGGER_SPOTIFY_OAUTH_LOGIN };
}
