import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';
import { buffers, eventChannel, Channel, END } from 'redux-saga';
import { apply, call, put, select, take, takeLatest } from 'redux-saga/effects';

import { Types } from '../actions';
import {
    changeDisplayKenBurnsBackground,
    flushQueue,
    flushQueueFail,
    flushQueueFinish,
    insertPlaylist as insertFallbackPlaylist,
    insertPlaylistFail,
    insertPlaylistFinish,
    insertPlaylistProgress,
    loadPlaylists,
    loadPlaylistsFail,
    loadPlaylistsStart,
    updateUserPlaylists,
    ChangeDisplayKenBurnsBackgroundAction,
    InsertFallbackPlaylistStartAction,
    UpdatePartyNameAction,
} from '../actions/view-settings';
import { PartyViews } from '../routing';
import { queueTracksSelector } from '../selectors/track';
import { Playlist, State, Track } from '../state';
import firebase from '../util/firebase';
import { takeEveryWithState } from '../util/saga';

const KEN_BURNS_LS_KEY = 'DisplayKenBurnsBackground';

function* changeDisplayKenBurnsValue(ac: ChangeDisplayKenBurnsBackgroundAction) {
    yield apply(
        localStorage,
        localStorage.setItem,
        [KEN_BURNS_LS_KEY, ac.payload ? 'true' : 'false'],
    );
}

function* fetchKenBurnsDisplayValue() {
    const lsVal: string | null = yield apply(
        localStorage,
        localStorage.getItem,
        [KEN_BURNS_LS_KEY],
    );
    if (lsVal) {
        yield put(changeDisplayKenBurnsBackground(lsVal === 'true'));
    }
}

function* fetchPlaylists(locChanged, prevView: PartyViews, curView: PartyViews) {
    if (curView !== PartyViews.Settings) {
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

function* insertPlaylist(partyId: string, ac: InsertFallbackPlaylistStartAction) {
    type SubActions =
        | { type: 'progress', payload: number }
        | { type: 'error', payload: Error }
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

function* updatePartyName(partyId: string, ac: UpdatePartyNameAction) {
    yield firebase.database!()
        .ref('/party')
        .child(partyId)
        .child('name')
        .set(ac.payload);
}

export function* managePartySettings(partyId: string) {
    yield takeLatest(Types.CHANGE_DISPLAY_KEN_BURNS_BACKGROUND, changeDisplayKenBurnsValue);
    yield takeLatest(Types.FLUSH_QUEUE_Start, flushTracks, partyId);
    yield takeLatest(Types.INSERT_FALLBACK_PLAYLIST_Start, insertPlaylist, partyId);
    yield takeLatest(Types.UPDATE_PARTY_NAME, updatePartyName, partyId);
}

export default function*() {
    yield* fetchKenBurnsDisplayValue();
    yield takeEveryWithState(
        LOCATION_CHANGED,
        (s: State) => s.router.result.subView,
        fetchPlaylists,
    );
}
