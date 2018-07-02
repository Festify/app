import { Actions } from '../actions';
import {
    CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT,
    FLUSH_QUEUE_FAIL,
    FLUSH_QUEUE_FINISH,
    FLUSH_QUEUE_START,
    INSERT_FALLBACK_PLAYLIST_FAIL,
    INSERT_FALLBACK_PLAYLIST_FINISH,
    INSERT_FALLBACK_PLAYLIST_PROGRESS,
    INSERT_FALLBACK_PLAYLIST_START,
    LOAD_PLAYLISTS_FAIL,
    LOAD_PLAYLISTS_START,
    UPDATE_USER_PLAYLISTS,
} from '../actions/view-party-settings';
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
        case CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT:
            return {
                ...state,
                playlistSearchQuery: action.payload,
            };
        case FLUSH_QUEUE_START:
            return {
                ...state,
                queueFlushError: null,
                queueFlushInProgress: true,
            };
        case FLUSH_QUEUE_FAIL:
            return {
                ...state,
                queueFlushError: action.payload,
                queueFlushInProgress: false,
            };
        case FLUSH_QUEUE_FINISH:
            return {
                ...state,
                queueFlushError: null,
                queueFlushInProgress: false,
            };
        case INSERT_FALLBACK_PLAYLIST_START:
            return {
                ...state,
                tracksLoadError: null,
                tracksLoadInProgress: true,
                tracksToLoad: action.payload.playlist.trackCount,
                tracksLoaded: 0,
            };
        case INSERT_FALLBACK_PLAYLIST_PROGRESS:
            return {
                ...state,
                tracksLoaded: state.tracksLoadInProgress
                    ? state.tracksLoaded + action.payload
                    : state.tracksLoaded,
            };
        case INSERT_FALLBACK_PLAYLIST_FAIL:
            return {
                ...state,
                tracksLoadError: action.payload,
                tracksLoadInProgress: false,
                tracksToLoad: 0,
                tracksLoaded: 0,
            };
        case INSERT_FALLBACK_PLAYLIST_FINISH:
            return {
                ...state,
                tracksLoadError: null,
                tracksLoadInProgress: false,
                tracksToLoad: 0,
                tracksLoaded: 0,
            };
        case LOAD_PLAYLISTS_START:
            return {
                ...state,
                playlistLoadError: null,
                playlistLoadInProgress: true,
            };
        case LOAD_PLAYLISTS_FAIL:
            return {
                ...state,
                playlistLoadError: action.payload,
                playlistLoadInProgress: false,
            };
        case UPDATE_USER_PLAYLISTS:
            return {
                ...state,
                playlistLoadError: null,
                playlistLoadInProgress: false,
            };
        default:
            return state;
    }
}
