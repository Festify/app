import { delay } from 'redux-saga';
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects';

import { hideToast, showToast, SHOW_TOAST } from '../actions';
import { exchangeCodeFail, EXCHANGE_CODE_FAIL } from '../actions/auth';
import {
    createPartyFail,
    joinPartyFail,
    openPartyFail,
    CREATE_PARTY_FAIL,
    JOIN_PARTY_FAIL,
    OPEN_PARTY_FAIL,
} from '../actions/party-data';
import { playerError, togglePlaybackFail, PLAYER_ERROR, TOGGLE_PLAYBACK_FAIL } from '../actions/playback-spotify';
import {
    flushQueueFail,
    insertPlaylistFail,
    loadPlaylistsFail,
    FLUSH_QUEUE_FAIL,
    INSERT_FALLBACK_PLAYLIST_FAIL,
    LOAD_PLAYLISTS_FAIL,
} from '../actions/view-party-settings';

type ErrorActions =
    | ReturnType<typeof createPartyFail>
    | ReturnType<typeof exchangeCodeFail>
    | ReturnType<typeof flushQueueFail>
    | ReturnType<typeof insertPlaylistFail>
    | ReturnType<typeof joinPartyFail>
    | ReturnType<typeof loadPlaylistsFail>
    | ReturnType<typeof openPartyFail>
    | ReturnType<typeof playerError>
    | ReturnType<typeof togglePlaybackFail>;

function* displayToast(action: ReturnType<typeof showToast>) {
    if (!Number.isFinite(action.payload.duration)) {
        return;
    }

    yield call(delay, action.payload.duration);
    yield put(hideToast());
}

function* displayErrorToast(action: ErrorActions) {
    yield put(showToast(
        (action.type === EXCHANGE_CODE_FAIL)
            ? action.payload.data.message
            : action.payload.message,
        10000,
    ));
}

export default function*() {
    yield all([
        takeLatest(SHOW_TOAST, displayToast),
        takeEvery([
            CREATE_PARTY_FAIL,
            EXCHANGE_CODE_FAIL,
            FLUSH_QUEUE_FAIL,
            INSERT_FALLBACK_PLAYLIST_FAIL,
            JOIN_PARTY_FAIL,
            LOAD_PLAYLISTS_FAIL,
            OPEN_PARTY_FAIL,
            PLAYER_ERROR,
            TOGGLE_PLAYBACK_FAIL,
        ], displayErrorToast),
    ]);
}
