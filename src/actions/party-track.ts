import { ThunkAction } from 'redux-thunk';

import {
    isPartyOwnerSelector,
    isPlaybackMasterSelector,
    partyIdSelector,
    playbackMasterSelector,
} from '../selectors/party';
import { State } from '../state';
import firebase from '../util/firebase';

import { ErrorAction, Types } from '.';

export function takeOverPlayback(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();
        if (!isPartyOwnerSelector(state)) {
            throw new Error("Cannot take over playback, not party owner.");
        }

        const partyId = partyIdSelector(state);
        if (!partyId) {
            throw new Error("Missing party ID");
        }

        await firebase.database!()
            .ref('/parties/')
            .child(partyId)
            .child('playback')
            .child('master_id')
            .set(state.player.instanceId);
    };
}
