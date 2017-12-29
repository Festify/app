import { State } from '../state';
import firebase from '../util/firebase';

import { paramsSelector } from './route';

export const isPartyOwnerSelector = (state: State) => {
    const fbUser = firebase.auth!().currentUser;
    return Boolean(fbUser && state.party.currentParty && state.party.currentParty.created_by === fbUser.uid);
};

export const partyIdSelector = (state: State): string | null => {
    const params = paramsSelector(state);
    return params ? params.partyId : null;
};
