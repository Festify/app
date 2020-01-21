import { Actions, ASSIGN_INSTANCE_ID } from '../actions';
import {
    PLAYER_ERROR,
    PLAYER_INIT_FINISH,
    SET_PLAYER_COMPATIBILITY,
    SPOTIFY_SDK_INIT_FINISH,
    TOGGLE_PLAYBACK_FAIL,
    TOGGLE_PLAYBACK_FINISH,
    TOGGLE_PLAYBACK_START,
} from '../actions/playback-spotify';
import { PlayerState } from '../state';

export default function(
    state: PlayerState = {
        instanceId: '',
        localDeviceId: null,
        initializing: false,
        initializationError: null,
        isCompatible: true,
        togglingPlayback: false,
        togglePlaybackError: null,
        sdkReady: false,
    },
    action: Actions,
): PlayerState {
    switch (action.type) {
        case ASSIGN_INSTANCE_ID:
            return {
                ...state,
                instanceId: action.payload,
            };
        case PLAYER_INIT_FINISH:
            return {
                ...state,
                initializing: false,
                initializationError: null,
                localDeviceId: action.payload,
            };
        case PLAYER_ERROR:
            return {
                ...state,
                initializing: false,
                initializationError: action.payload,
            };
        case TOGGLE_PLAYBACK_START:
            return {
                ...state,
                togglingPlayback: true,
                togglePlaybackError: null,
            };
        case TOGGLE_PLAYBACK_FINISH:
            return {
                ...state,
                togglingPlayback: false,
                togglePlaybackError: null,
            };
        case TOGGLE_PLAYBACK_FAIL:
            return {
                ...state,
                togglingPlayback: false,
                togglePlaybackError: action.payload,
            };
        case SPOTIFY_SDK_INIT_FINISH:
            return {
                ...state,
                sdkReady: true,
            };
        case SET_PLAYER_COMPATIBILITY:
            return {
                ...state,
                isCompatible: action.payload,
            };
        default:
            return state;
    }
}
