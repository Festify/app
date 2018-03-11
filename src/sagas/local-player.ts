import { buffers, eventChannel, Channel, delay, Task } from 'redux-saga';
import { actionChannel, apply, call, cancel, cancelled, fork, put, select, take, takeEvery, race } from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import { Playback, State, Track } from '../state';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

import { updatePlaybackState, UpdatePlaybackStateAction } from '../actions/party-data';
import { play, playerError, playerInitFinish, togglePlaybackFinish } from '../actions/playback-spotify';
import { playbackSelector } from '../selectors/party';
import { currentTrackSelector, currentTrackSpotifyIdSelector, tracksEqual } from '../selectors/track';
import { takeEveryWithState } from '../util/saga';
import { removeTrack } from '../actions/queue';

let currentTrackWatcher: Task | null = null;

function attachToEvents<T>(player: Spotify.SpotifyPlayer, names: string | string[]) {
    return eventChannel<T>(put => {
        const listenerFactory = type => (detail) => {
            if (detail) {
                put(detail as any);
            }
        };

        if (!(names instanceof Array)) {
            names = [names];
        }

        return names.reduce((prev, ev) => {
            const listener = listenerFactory(ev);

            player.on(ev as any, listener);

            return () => {
                player.removeListener(name as any, listener);
                prev();
            };
        }, () => {});
    });
}

async function playTrack(uri: string, deviceId: string, positionMs?: number) {
    const playUri = `/me/player/play?device_id=${deviceId}`;
    await fetchWithAccessToken(playUri, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [uri] }),
    });

    if (!positionMs) {
        return;
    } else {
        positionMs = Math.floor(positionMs);
    }

    const seekUri = `/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`;
    console.log(seekUri);
    await fetchWithAccessToken(seekUri, {
        method: 'put',
    });
}

function* handlePlaybackStateChange(
    action,
    oldPlayback: Playback | {} | null,
    newPlayback: Playback | null,
    player: Spotify.SpotifyPlayer,
    deviceId: string,
) {
    if (!oldPlayback || !newPlayback) {
        throw new Error('Wat');
    }

    if (('playing' in oldPlayback) && oldPlayback.playing === newPlayback.playing) {
        return;
    }

    if (!newPlayback.playing) {
        if ('playing' in oldPlayback && oldPlayback.playing) {
            yield player.pause();
        }

        yield put(togglePlaybackFinish());
        return;
    }

    const currentTrack: Track | null = yield select(currentTrackSelector);
    const currentTrackUri: string | null = yield select(currentTrackSpotifyIdSelector);
    const spotifyState: Spotify.PlaybackState | null = yield player.getCurrentState();

    if (!currentTrack) {
        return;
    }

    if (spotifyState && spotifyState.track_window.current_track.id === currentTrack.reference.id) {
        yield player.resume();
    } else {
        const playing = 'playing' in oldPlayback ? oldPlayback.playing : undefined;
        const position = newPlayback.last_position_ms
            ? newPlayback.last_position_ms + (playing !== false ? Date.now() - newPlayback.last_change : 0)
            : 0;

        yield call(
            playTrack,
            currentTrackUri,
            deviceId,
            position,
        );
    }

    yield put(togglePlaybackFinish());

    if (currentTrackWatcher) {
        yield cancel(currentTrackWatcher);
    }

    currentTrackWatcher = yield fork(watchPlayback, player);
}

function* watchPlayback(player: Spotify.SpotifyPlayer) {
    const WATCHER_INTERVAL = 2000;

    const playbackStateChanges: Channel<Spotify.PlaybackState> =
        yield call(attachToEvents, player, 'player_state_changed');

    let playerState: Spotify.PlaybackState = yield player.getCurrentState();
    let delayDuration = WATCHER_INTERVAL;

    while (playerState.duration === 0) {
        playerState = yield take(playbackStateChanges);
    }

    try {
        while (true) {
            playerState = yield player.getCurrentState();
            delayDuration = Math.max(Math.min(playerState.duration - playerState.position - 200, WATCHER_INTERVAL), 0);

            if (delayDuration <= 0 || (playerState.duration === 0 && playerState.position === 0)) {
                break;
            }

            yield race({
                delay: call(delay, delayDuration),
                event: take(playbackStateChanges),
            });
        }
    } finally {
        if (delayDuration < WATCHER_INTERVAL) {
            const {reference} = yield select(currentTrackSelector);
            yield put(removeTrack(reference, true) as any);
            return;
        }
    }
}

function* handleSpotifyPlaybackChange(spotifyPlayback: Spotify.PlaybackState) {
    const localPlayback: Playback | null = yield select(playbackSelector);

    if (!localPlayback) {
        return;
    }

    const newStatus: Partial<Playback> = {
        last_position_ms: spotifyPlayback.position,
    };

    if (localPlayback.playing !== !spotifyPlayback.paused) {
        newStatus.playing = !spotifyPlayback.paused;
    }

    yield put(updatePlaybackState(newStatus));
}

function* handleQueueChange(action, oldTrack: Track | null, newTrack: Track | null, deviceId: string) {
    if (tracksEqual(oldTrack, newTrack)) {
        return;
    }

    const spotifyTrackId: string | null = yield select(currentTrackSpotifyIdSelector);
    const playbackState: Playback | null = yield select(playbackSelector);

    if (!spotifyTrackId || !playbackState!.playing) {
        return;
    }

    yield call(playTrack, spotifyTrackId, deviceId);
}

function* handlePlaybackError(error: Spotify.Error) {
    yield put(showToast(error.message));
}

export function* manageLocalPlayer() {
    let player: Spotify.SpotifyPlayer = null!;

    try {
        while (true) {
            yield take(Types.BECOME_PLAYBACK_MASTER);

            if (!(yield select((state: State) => state.player.sdkReady))) {
                yield take(Types.SPOTIFY_SDK_INIT_Finish);
            }

            player = new Spotify.Player({
                name: 'Festify',
                getOAuthToken: (cb) => requireAccessToken().then(cb),
                volume: 1,
            });

            const playerErrors: Channel<Spotify.Error> =
                yield call(attachToEvents, player, [
                    'initialization_error',
                    'authentication_error',
                    'account_error',
                    'playback_error',
                ]);

            const playerReady: Channel<Spotify.WebPlaybackInstance> =
                yield call(attachToEvents, player, 'ready');
            const playbackStateChanges: Channel<Spotify.PlaybackState> =
                yield call(attachToEvents, player, 'player_state_changed');

            const connectSuccess: boolean = yield apply(player, player.connect);

            if (!connectSuccess) {
                const error = yield take(playerErrors);
                yield put(playerError(error));
                yield put(updatePlaybackState({
                    master_id: null,
                    playing: false,
                }));
            }

            const { device_id }: Spotify.WebPlaybackInstance = yield take(playerReady);
            yield put(playerInitFinish(device_id));

            yield* handlePlaybackStateChange(null, {}, yield select(playbackSelector), player, device_id);

            yield takeEveryWithState(
                Types.UPDATE_TRACKS,
                currentTrackSelector,
                handleQueueChange,
                device_id,
            );

            yield takeEveryWithState(
                Types.UPDATE_PLAYBACK_STATE,
                playbackSelector,
                handlePlaybackStateChange,
                player,
                device_id,
            );

            yield takeEvery(
                playbackStateChanges,
                handleSpotifyPlaybackChange,
            );

            yield takeEvery(playerErrors, handlePlaybackError);

            yield take(Types.RESIGN_PLAYBACK_MASTER);

            yield apply(player, player.disconnect);
        }
    } finally {
        if (player && (yield cancelled())) {
            yield apply(player, player.disconnect);
        }
    }
}

export default manageLocalPlayer;
