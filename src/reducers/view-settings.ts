import { Actions, Types } from '../actions';
import { SettingsViewState } from '../state';

export default function(
    state: SettingsViewState = {
        playlistLoadError: null,
        playlistLoadInProgress: false,
        playlistSearchQuery: '',
        queueFlushError: null,
        queueFlushInProgress: false,
        tracksLoadError: null,
        tracksLoadInProgress: false,
        tracksToLoad: 0,
        tracksLoaded: 0,
    },
    action: Actions,
): SettingsViewState {
    switch (action.type) {
        case Types.CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT:
            return {
                ...state,
                playlistSearchQuery: action.payload,
            };
        case Types.FLUSH_QUEUE_Start:
            return {
                ...state,
                queueFlushError: null,
                queueFlushInProgress: true,
            };
        case Types.FLUSH_QUEUE_Fail:
            return {
                ...state,
                queueFlushError: action.payload,
                queueFlushInProgress: false,
            };
        case Types.FLUSH_QUEUE_Finish:
            return {
                ...state,
                queueFlushError: null,
                queueFlushInProgress: false,
            };
        case Types.INSERT_FALLBACK_PLAYLIST_Start:
            return {
                ...state,
                tracksLoadError: null,
                tracksLoadInProgress: true,
                tracksToLoad: action.payload.playlist.trackCount,
                tracksLoaded: 0,
            };
        case Types.INSERT_FALLBACK_PLAYLIST_Progress:
            return {
                ...state,
                tracksLoaded: state.tracksLoadInProgress
                    ? state.tracksLoaded + action.payload
                    : state.tracksLoaded,
            };
        case Types.INSERT_FALLBACK_PLAYLIST_Fail:
            return {
                ...state,
                tracksLoadError: action.payload,
                tracksLoadInProgress: false,
                tracksToLoad: 0,
                tracksLoaded: 0,
            };
        case Types.INSERT_FALLBACK_PLAYLIST_Finish:
            return {
                ...state,
                tracksLoadError: null,
                tracksLoadInProgress: false,
                tracksToLoad: 0,
                tracksLoaded: 0,
            };
        case Types.LOAD_PLAYLISTS_Start:
            return {
                ...state,
                playlistLoadError: null,
                playlistLoadInProgress: true,
            };
        case Types.LOAD_PLAYLISTS_Fail:
            return {
                ...state,
                playlistLoadError: action.payload,
                playlistLoadInProgress: false,
            };
        case Types.UPDATE_USER_PLAYLISTS:
            return {
                ...state,
                playlistLoadError: null,
                playlistLoadInProgress: false,
            };
        default:
            return state;
    }
}
