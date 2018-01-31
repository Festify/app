import { LOCATION_CHANGED } from "@mraerino/redux-little-router-reactless";

import { closeParty, loadParty } from "../actions/party-data";

let oldPartyId: string | null = null;
export default store => next => action => {
    next(action);

    if (action.type !== LOCATION_CHANGED) {
        return;
    }

    const partyId = (action.payload.params || {}).partyId === undefined
        ? null
        : action.payload.params.partyId;
    if (oldPartyId === partyId) {
        return;
    }

    oldPartyId = partyId;
    store.dispatch(partyId !== null ? loadParty(partyId) : closeParty());
};
