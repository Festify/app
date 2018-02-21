import { delay, eventChannel, Channel } from 'redux-saga';
import {
    actionChannel,
    all,
    apply,
    call,
    cancel,
    fork,
    put,
    race,
    select,
    take,
    takeEvery,
} from 'redux-saga/effects';
import { createSelector } from 'reselect';

import { Types } from '../actions';
import { OpenPartyStartAction } from '../actions/party-data';
import {
    pause,
    playerError,
    playerInitFinish,
    updatePlayerState,
    PauseAction,
    PlayAction,
} from '../actions/playback-spotify';
import { removeTrack } from '../actions/queue';
import { partyIdSelector } from '../selectors/party';
import { currentTrackIdSelector, currentTrackMetadataSelector, currentTrackSelector } from '../selectors/track';
import { Metadata, State, TrackReference } from '../state';
import firebase, { firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

function attachToEvent(player: Spotify.SpotifyPlayer, name: 'ready'): Channel<Spotify.WebPlaybackInstance>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: 'player_state_changed'): Channel<Spotify.PlaybackState>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: Spotify.ErrorTypes): Channel<Spotify.Error>;

function attachToEvent<T>(player: Spotify.SpotifyPlayer, name: string) {
    return eventChannel<T>((put: any) => {
        /*
         * Web Playback SDK doesn't allow removing event handlers yet, so we
         * simply remove the put function as a kind of flag, so that future events
         * won't be forwarded.
         */
        const listener = (ev: T) => {
            if (put) {
                put(ev);
            }
        };

        player.on(name as any, listener as any);

        return () => put = null;
    });
}

function* controlSpotifyPlayer() {
    yield take(Types.SPOTIFY_SDK_INIT_Finish);

    while (true) {
        yield take(Types.BECOME_PLAYBACK_MASTER);

        const player = new Spotify.Player({
            name: 'Festify',
            getOAuthToken: (cb) => requireAccessToken().then(cb),
            volume: 1,
        });

        const initErrors: Channel<Spotify.Error> = yield call(attachToEvent, player, 'initialization_error');
        const authenticationErrors: Channel<Spotify.Error> = yield call(attachToEvent, player, 'authentication_error');
        const accountErrors: Channel<Spotify.Error> = yield call(attachToEvent, player, 'account_error');
        const playbackErrors: Channel<Spotify.Error> = yield call(attachToEvent, player, 'playback_error');
        const playerReady: Channel<Spotify.WebPlaybackInstance> = yield call(attachToEvent, player, 'ready');
        const playbackStateChanges: Channel<Spotify.PlaybackState> =
            yield call(attachToEvent, player, 'player_state_changed');

        const connectSuccess: boolean = yield apply(player, player.connect);

        if (!connectSuccess) {
            const error: Spotify.Error = yield take(initErrors);
            yield put(playerError(error as Error));
            continue;
        }

        const instance: Spotify.WebPlaybackInstance = yield take(playerReady);
        yield put(playerInitFinish(instance.device_id));

        yield fork(handlePlayPause, player);
        const publishPlaybackStateChangesTask = yield takeEvery(
            playbackStateChanges,
            function* (state: Spotify.PlaybackState) {
                yield put(updatePlayerState(state));
            },
        );

        yield take(Types.RESIGN_PLAYBACK_MASTER);

        yield all([
            put(pause()), // This stops the handlePlayPause-task (no cancel-effect here)
            cancel(publishPlaybackStateChangesTask),
            apply(player, player.disconnect),
        ]);
    }
}

const currentTrackSpotifyIdSelector: (state: State) => string | null = createSelector(
    currentTrackSelector,
    track => track ? `spotify:track:${track.reference.id}` : null,
);

function* handlePlayPause(player: Spotify.SpotifyPlayer) {
    const playActions: Channel<PlayAction> = yield actionChannel(Types.PLAY);
    const pauseActions: Channel<PauseAction> = yield actionChannel(Types.PAUSE);

    while (true) {
        const action: PlayAction = yield take(playActions);

        const state: State = yield select();
        const currentTrack = currentTrackSelector(state);
        const currentTrackId = currentTrackIdSelector(state);
        const spotifyTrackId = currentTrackSpotifyIdSelector(state);

        // If the queue is empty we have nothing to play
        if (!currentTrack || !currentTrackId || !spotifyTrackId) {
            continue;
        }

        const currentPartyId = partyIdSelector(state);
        if (!currentPartyId) {
            yield put(playerError(new Error('Missing current party ID')));
            continue;
        }
        const { currentParty } = state.party;
        if (!currentParty) {
            yield put(playerError(new Error('Missing party')));
            continue;
        }
        const { localDeviceId } = state.player;
        if (!localDeviceId) {
            yield put(playerError(new Error('Missing local device ID')));
            continue;
        }
        if (!player) {
            yield put(playerError(new Error('Missing player')));
            continue;
        }

        const resume = action.payload === undefined;

        if (resume) {
            yield apply(player, player.resume);
        } else {
            const uri = `/me/player/play?device_id=${encodeURIComponent(localDeviceId)}`;
            yield call(fetchWithAccessToken, uri, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uris: [spotifyTrackId] }),
            });
        }

        const playbackRef = firebase.database!()
            .ref(`/parties`)
            .child(currentPartyId)
            .child('playback');

        const playbackDisconnect = playbackRef.onDisconnect();

        // Update playback state in Firebase and ensure state stays valid
        // even if browser is closed / internet disconnects
        const tasks = [
            playbackDisconnect.update({
                playing: false,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: 0,
            }),
            playbackRef.update({
                playing: true,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: resume
                    ? currentParty.playback.last_position_ms
                    : action.payload,
            }),
        ];

        // Save playback date in database to prevent track from being removed
        // when fallback playlist changes
        if (!resume) {
            const setPlayedAt = firebase.database!()
                .ref('/tracks')
                .child(currentPartyId)
                .child(currentTrackId)
                .child('played_at')
                .set(firebaseNS.database!.ServerValue.TIMESTAMP);
            tasks.push(setPlayedAt);
        }

        yield all(tasks);

        let currentTrackMeta: Metadata | null = currentTrackMetadataSelector(state);
        while (!currentTrackMeta) {
            yield call(delay, 50);
            const s = yield select();
            currentTrackMeta = currentTrackMetadataSelector(s);
        }

        const playbackWatcher = yield fork(
            watchPlayback,
            player,
            currentPartyId,
            currentTrack.reference,
            currentTrackMeta.durationMs,
        );

        yield race({
            pause: take(pauseActions),
            cleanup: take(Types.CLEANUP_PARTY),
        });

        yield all([
            cancel(playbackWatcher),
            apply(player, player.pause),
            apply(playbackDisconnect, playbackDisconnect.cancel),
            firebase.database!()
                .ref(`/parties`)
                .child(currentPartyId)
                .child('playback')
                .update({
                    playing: false,
                    last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                    last_position_ms: (yield apply(player, player.getCurrentState))!.position,
                }),
        ]);
    }
}

function* watchPlayback(
    player: Spotify.SpotifyPlayer,
    partyId: string,
    currentTrackRef: TrackReference,
    durationMs: number,
) {
    while (true) {
        const playbackState: Spotify.PlaybackState | null = yield apply(player, player.getCurrentState);
        if (!playbackState) {
            console.warn('Missing playback state in playback watcher.');
            continue;
        }

        yield put(updatePlayerState(playbackState));

        const { paused, position } = playbackState;
        yield firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback')
            .update({
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: position,
                playing: !paused,
            });

        const delayDuration = Math.min(durationMs - position - 50, 5000);
        yield call(delay, delayDuration);

        if (delayDuration < 5000) {
            yield put(removeTrack(currentTrackRef, true) as any);
        }
    }
}

function* handlePlayPausePressed(partyId: string) {

}

function* handleToggle() {
    while (true) {
        const ac: OpenPartyStartAction = yield take(Types.OPEN_PARTY_Start);
        const task = yield fork(handlePlayPausePressed, ac.payload);
        yield take([Types.CLEANUP_PARTY, Types.OPEN_PARTY_Fail]);
        yield cancel(task);
    }
}

export default function*() {
    yield all([
        controlSpotifyPlayer(),
        handleToggle(),
    ]);
}
