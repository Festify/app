import { delay } from 'redux-saga';
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects';

import { hideToast, showToast, ShowToastAction, Types } from '../actions';
import { ExchangeCodeFailAction } from '../actions/auth';
import { CreatePartyFailAction, JoinPartyFailAction, OpenPartyFailAction } from '../actions/party-data';
import { PlayerErrorAction, TogglePlaybackFailAction } from '../actions/playback-spotify';
import {
    FlushQueueFailAction,
    InsertFallbackPlaylistFailAction,
    LoadPlaylistsFailAction,
} from '../actions/view-party-settings';

type ErrorActions =
    | CreatePartyFailAction
    | ExchangeCodeFailAction
    | FlushQueueFailAction
    | InsertFallbackPlaylistFailAction
    | JoinPartyFailAction
    | LoadPlaylistsFailAction
    | OpenPartyFailAction
    | PlayerErrorAction
    | TogglePlaybackFailAction;

function* displayToast(action: ShowToastAction) {
    if (!Number.isFinite(action.payload.duration)) {
        return;
    }

    yield call(delay, action.payload.duration);
    yield put(hideToast());
}

function* displayErrorToast(action: ErrorActions) {
    yield put(showToast(
        (action.type === Types.EXCHANGE_CODE_Fail)
            ? action.payload.data.message
            : action.payload.message,
        10000,
    ));
}

export default function*() {
    yield all([
        takeLatest(Types.SHOW_TOAST, displayToast),
        takeEvery([
            Types.CREATE_PARTY_Fail,
            Types.EXCHANGE_CODE_Fail,
            Types.FLUSH_QUEUE_Fail,
            Types.INSERT_FALLBACK_PLAYLIST_Fail,
            Types.JOIN_PARTY_Fail,
            Types.LOAD_PLAYLISTS_Fail,
            Types.OPEN_PARTY_Fail,
            Types.PLAYER_ERROR,
            Types.TOGGLE_PLAYBACK_Fail,
        ], displayErrorToast),
    ]);
}
