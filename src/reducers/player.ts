import { Actions, Types } from "../actions";
import { PlayerState } from "../state";

export default function (
    state: PlayerState = {
        connect: null,
        local: null,
        localDeviceId: null,
        initializing: false,
        initializationError: null,
        togglingPlayback: false,
        togglePlaybackError: null,
    },
    action: Actions,
): PlayerState {
    switch (action.type) {
        case Types.UPDATE_CONNECT_STATE:
            return {
                ...state,
                connect: action.payload,
            };
        case Types.UPDATE_PLAYER_STATE:
            return {
                ...state,
                local: action.payload,
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
        default:
            return state;
    }
}
