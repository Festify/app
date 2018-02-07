import { delay } from 'redux-saga';
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects';

import { hideToast, showToast, ShowToastAction, Types } from '../actions';
import { ExchangeCodeFailAction } from '../actions/auth';
import { JoinPartyFailAction, OpenPartyFailAction } from '../actions/party-data';
import { InsertFallbackPlaylistFailAction, LoadPlaylistsFailAction } from '../actions/party-settings';
import { TogglePlaybackFailAction } from '../actions/party-track';
import { PlayerErrorAction } from '../actions/playback-spotify';

type ErrorActions =
    | ExchangeCodeFailAction
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
    yield put(showToast(action.payload.message));
}

export default function*() {
    yield all([
        takeLatest(Types.SHOW_TOAST, displayToast),
        takeEvery([
            Types.EXCHANGE_CODE_Fail,
            Types.INSERT_FALLBACK_PLAYLIST_Fail,
            Types.JOIN_PARTY_Fail,
            Types.LOAD_PLAYLISTS_Fail,
            Types.OPEN_PARTY_Fail,
            Types.PLAYER_ERROR,
            Types.TOGGLE_PLAYBACK_Fail,
        ], displayErrorToast),
    ]);
}
