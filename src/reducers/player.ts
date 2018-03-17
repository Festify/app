import { Actions, Types } from '../actions';
import { PlayerState } from '../state';

export default function (
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
        case Types.ASSIGN_INSTANCE_ID:
            return {
                ...state,
                instanceId: action.payload,
            };
        case Types.PLAYER_INIT_Start:
            return {
                ...state,
                initializing: true,
                initializationError: null,
            };
        case Types.PLAYER_INIT_Finish:
            return {
                ...state,
                initializing: false,
                initializationError: null,
                localDeviceId: action.payload,
            };
        case Types.PLAYER_ERROR:
            return {
                ...state,
                initializing: false,
                initializationError: action.payload,
            };
        case Types.TOGGLE_PLAYBACK_Start:
            return {
                ...state,
                togglingPlayback: true,
                togglePlaybackError: null,
            };
        case Types.TOGGLE_PLAYBACK_Finish:
            return {
                ...state,
                togglingPlayback: false,
                togglePlaybackError: null,
            };
        case Types.TOGGLE_PLAYBACK_Fail:
            return {
                ...state,
                togglingPlayback: false,
                togglePlaybackError: action.payload,
            };
        case Types.SPOTIFY_SDK_INIT_Finish:
            return {
                ...state,
                sdkReady: true,
            };
        case Types.SET_PLAYER_COMPATIBILITY:
            return {
                ...state,
                isCompatible: action.payload,
            };
        default:
            return state;
    }
}
