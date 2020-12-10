import { LOCATION_CHANGED } from '@festify/redux-little-router';
import { buffers, eventChannel, Channel, END } from 'redux-saga';
import { call, put, select, take, takeLatest } from 'redux-saga/effects';

import { NOTIFY_AUTH_STATUS_KNOWN } from '../actions/auth';
import {
    changePartyName as updatePartyNameAction,
    changePartySetting as changePartySettingAction,
    flushQueue,
    flushQueueFail,
    flushQueueFinish,
    insertPlaylist as insertFallbackPlaylist,
    insertPlaylistFail,
    insertPlaylistFinish,
    insertPlaylistProgress,
    insertPlaylistStart,
    loadPlaylists,
    loadPlaylistsFail,
    loadPlaylistsStart,
    updateUserPlaylists,
    CHANGE_PARTY_SETTING,
    FLUSH_QUEUE_START,
    INSERT_FALLBACK_PLAYLIST_START,
    UPDATE_PARTY_NAME,
} from '../actions/view-party-settings';
import { PartyViews } from '../routing';
import { isPartyOwnerSelector } from '../selectors/party';
import { queueTracksSelector } from '../selectors/track';
import { hasConnectedSpotifyAccountSelector } from '../selectors/users';
import { Playlist, State, Track } from '../state';
import firebase from '../util/firebase';

function* changePartySetting(partyId: string, ac: ReturnType<typeof changePartySettingAction>) {
    if (!(yield select(isPartyOwnerSelector))) {
        return;
    }

    yield firebase
        .database()
        .ref('/parties')
        .child(partyId)
        .child('settings')
        .child(ac.payload.setting)
        .set(ac.payload.value);
}

function* fetchPlaylists() {
    const state: State = yield select();
    if (
        !state.router.result ||
        state.router.result.subView !== PartyViews.Settings ||
        !hasConnectedSpotifyAccountSelector(state)
    ) {
        return;
    }

    yield put(loadPlaylistsStart());
    try {
        const playlists: Playlist[] = yield call(loadPlaylists);
        yield put(updateUserPlaylists(playlists));
    } catch (err) {
        yield put(loadPlaylistsFail(err));
    }
}

function* flushTracks(partyId: string) {
    try {
        const tracks: Track[] = yield select(queueTracksSelector);
        if (tracks.length) {
            yield call(flushQueue, partyId, tracks);
        }
        yield put(flushQueueFinish());
    } catch (err) {
        yield put(flushQueueFail(err));
    }
}

function* insertPlaylist(partyId: string, ac: ReturnType<typeof insertPlaylistStart>) {
    type SubActions =
        | { type: 'progress'; payload: number }
        | { type: 'error'; payload: Error }
        | END;

    function doInsert(creationDate: number) {
        return eventChannel<SubActions>(put => {
            insertFallbackPlaylist(
                partyId,
                creationDate,
                ac.payload.playlist,
                ac.payload.shuffled,
                progress => put({ type: 'progress', payload: progress }),
            )
                .then(() => put(END))
                .catch(err => put({ type: 'error', payload: err }));

            return () => {};
        }, buffers.expanding());
    }

    const createdOn: number = yield select((s: State) => s.party.currentParty!.created_at);
    const chan: Channel<SubActions> = yield call(doInsert, createdOn);

    while (true) {
        const ev: SubActions = yield take.maybe(chan);
        if (ev === END) {
            yield put(insertPlaylistFinish());
            break;
        } else if (ev.type === 'progress') {
            yield put(insertPlaylistProgress(ev.payload));
        } else if (ev.type === 'error') {
            yield put(insertPlaylistFail(ev.payload));
            break;
        }
    }
}

function* updatePartyName(partyId: string, ac: ReturnType<typeof updatePartyNameAction>) {
    yield firebase
        .database()
        .ref('/parties')
        .child(partyId)
        .child('name')
        .set(ac.payload);
}

export function* managePartySettings(partyId: string) {
    yield takeLatest(CHANGE_PARTY_SETTING, changePartySetting, partyId);
    yield takeLatest(FLUSH_QUEUE_START, flushTracks, partyId);
    yield takeLatest(INSERT_FALLBACK_PLAYLIST_START, insertPlaylist, partyId);
    yield takeLatest(UPDATE_PARTY_NAME, updatePartyName, partyId);
}

export default function*() {
    yield takeLatest([NOTIFY_AUTH_STATUS_KNOWN, LOCATION_CHANGED], fetchPlaylists);
}
