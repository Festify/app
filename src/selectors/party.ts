import { State } from '../state';
import firebase from '../util/firebase';

export const isPartyOwnerSelector = (state: State) => {
    const fbUser = firebase.auth!().currentUser;
    return Boolean(fbUser && state.party.currentParty && state.party.currentParty.created_by === fbUser.uid);
};

export const isPlaybackMasterSelector = (state: State) => {
    const master = state.party.currentParty
        ? state.party.currentParty.playback.master_id
        : null;
    return state.player.instanceId === master;
};

export const partyIdSelector = (state: State): string | null => {
    const params = state.router.params;
    return params ? params.partyId : null;
};
