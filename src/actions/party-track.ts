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
import { togglePlayPause as togglePlayback } from './playback-spotify';

export function togglePlayPause(): ThunkAction<void, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.TOGGLE_PLAYBACK_Start });

        try {
            const state = getState();
            const playbackMaster = playbackMasterSelector(state);

            if (!playbackMaster) {
                await dispatch(takeOverPlayback());
            } else if (!isPlaybackMasterSelector(state)) {
                throw new Error("Not playback master. Support for taking over playback will be available soon.");
            }

            await dispatch(togglePlayback());

            dispatch({ type: Types.TOGGLE_PLAYBACK_Finish });
        } catch (error) {
            dispatch({
                type: Types.TOGGLE_PLAYBACK_Fail,
                payload: error,
                error: true,
            });
        }
    };
}

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
