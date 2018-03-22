import { Types } from '.';

export type Actions =
    | SharePartyAction;

export interface SharePartyAction {
    type: Types.SHARE_PARTY;
}

export function shareParty(): SharePartyAction {
    return { type: Types.SHARE_PARTY };
}
