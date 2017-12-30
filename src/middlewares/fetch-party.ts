import { LOCATION_CHANGED } from "@mraerino/redux-little-router-reactless";

import { closeParty, loadParty } from "../actions/party-data";

let oldPartyId: string | null = null;
export default store => next => action => {
    if (action.type !== LOCATION_CHANGED) {
        return next(action);
    }

    const partyId = (action.payload.params || {}).partyId === undefined
        ? null
        : action.payload.params.partyId;
    if (oldPartyId === partyId) {
        return next(action);
    }

    oldPartyId = partyId;

    if (partyId === null) {
        store.dispatch(closeParty());
        return next(action);
    }

    store.dispatch(loadParty(partyId));
    next(action);
};
