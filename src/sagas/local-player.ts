import * as Raven from 'raven-js';
import { eventChannel, Channel, Task } from 'redux-saga';
import {
    all,
    apply,
    call,
    cancel,
    cancelled,
    fork,
    put,
    select,
    take,
    takeEvery,
} from 'redux-saga/effects';

import { showToast, Types } from '../actions';
import { updatePlaybackState } from '../actions/party-data';
import {
    play,
    playerError,
    playerInitFinish,
    setPlayerCompatibility,
    togglePlaybackFinish,
} from '../actions/playback-spotify';
import { markTrackAsPlayed, removeTrackAction } from '../actions/queue';
import { playbackSelector } from '../selectors/party';
import { currentTrackSelector, tracksEqual } from '../selectors/track';
import { Playback, State, Track } from '../state';
import { takeEveryWithState } from '../util/saga';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

function attachToEvents<T>(player: Spotify.SpotifyPlayer, names: string | string[]) {
    return eventChannel<T>(put => {
        const listener = detail => {
            if (detail) {
                put(detail as any);
            }
        };

        if (!(names instanceof Array)) {
            names = [names];
        }

        return names.reduce((prev, ev) => {
            player.on(ev as any, listener);

            return () => {
                player.removeListener(name as any, listener);
                prev();
            };
        }, () => {});
    });
}

function* playTrack(id: string, deviceId: string, positionMs?: number) {
    yield put(play(id, positionMs || 0));

    const playUri = `/me/player/play?device_id=${deviceId}`;
    yield fetchWithAccessToken(playUri, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [`spotify:track:${id}`] }),
    });

    if (!positionMs) {
        return;
    } else {
        positionMs = Math.floor(positionMs);
    }

    const seekUri = `/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`;
    yield fetchWithAccessToken(seekUri, {
        method: 'put',
    });
}

function* handlePlaybackStateChange(
    action,
    oldPlayback: Playback | {} | null,
    newPlayback: Playback | null,
    player: Spotify.SpotifyPlayer,
    deviceId: string,
    partyId: string,
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
    const spotifyState: Spotify.PlaybackState | null = yield player.getCurrentState();

    if (!currentTrack) {
        return;
    }

    const { currentParty, syncPlayback } = yield select((state: State) => {
        return {
            currentParty: state.party.currentParty,
            syncPlayback: state.settingsView.syncedPlayback
        }
    })

    yield call(
        playTrack,
        currentTrack.reference.id,
        deviceId,
        syncPlayback ? currentParty.playback.last_position_ms : 0,
    )

    if (spotifyState && spotifyState.track_window.current_track.id === currentTrack.reference.id) {
        yield call(markTrackAsPlayed, partyId, currentTrack.reference)
    }

    yield put(togglePlaybackFinish());
}

function* handlePlaybackLifecycle(player: Spotify.SpotifyPlayer) {
    const playerStateChanges: Channel<Spotify.PlaybackState> =
        yield call(attachToEvents, player, 'player_state_changed');

    while (true) {
        yield take(Types.PLAY);

        while (true) {
            const state = yield take(playerStateChanges);
            if (state.position === 0 && state.duration > 0 && state.paused === false) {
                break;
            }
        }

        while (true) {
            const state = yield take(playerStateChanges);
            if (state.position === 0 && state.duration === 0 && state.paused === true) {
                break;
            }
        }

        const { reference }: Track = yield select(currentTrackSelector);
        yield put(removeTrackAction(reference, true));
    }
}

function* handleSpotifyPlaybackChange(spotifyPlayback: Spotify.PlaybackState) {
    const localPlayback: Playback | null = yield select(playbackSelector);

    if (!localPlayback) {
        return;
    }

    if (spotifyPlayback.duration === 0) {
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

function* handleQueueChange(
    action,
    oldTrack: Track | null,
    newTrack: Track | null,
    player: Spotify.SpotifyPlayer,
    deviceId: string,
    partyId: string,
) {
    if (tracksEqual(oldTrack, newTrack)) {
        return;
    }

    const playbackState: Playback | null = yield select(playbackSelector);

    if ((!oldTrack && !newTrack) || !playbackState!.playing) {
        return;
    }

    if (newTrack) {
        yield all([
            call(playTrack, newTrack.reference.id, deviceId),
            call(markTrackAsPlayed, partyId, newTrack.reference),
        ]);
    } else {
        yield player.pause();
    }
}

function* handlePlaybackError(error: Spotify.Error) {
    yield put(showToast(error.message));
    console.error("Spotify error:", error);

    Raven.captureException(error.message);
}

export function* manageLocalPlayer(partyId: string) {
    let player: Spotify.SpotifyPlayer = null!;

    try {
        while (true) {
            yield take(Types.BECOME_PLAYBACK_MASTER);

            if (!(yield select((state: State) => state.player.sdkReady))) {
                yield take(Types.SPOTIFY_SDK_INIT_Finish);
            }

            player = new Spotify.Player({
                name: 'Festify 🎉',
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

            const lifecycleManager: Task = yield fork(handlePlaybackLifecycle, player);

            const { device_id }: Spotify.WebPlaybackInstance = yield take(playerReady);
            yield put(playerInitFinish(device_id));

            yield* handlePlaybackStateChange(
                null,
                {},
                yield select(playbackSelector),
                player,
                device_id,
                partyId,
            );

            const queueChangeManager: Task = yield takeEveryWithState(
                Types.UPDATE_TRACKS,
                currentTrackSelector,
                handleQueueChange,
                player,
                device_id,
                partyId,
            );
            const playbackStateUpdateManager: Task = yield takeEveryWithState(
                Types.UPDATE_PLAYBACK_STATE,
                playbackSelector,
                handlePlaybackStateChange,
                player,
                device_id,
                partyId,
            );
            const spotifyPlaybackChangeManager: Task = yield takeEvery(
                playbackStateChanges,
                handleSpotifyPlaybackChange,
            );
            yield takeEvery(playerErrors, handlePlaybackError);

            yield take(Types.RESIGN_PLAYBACK_MASTER);

            yield apply(player, player.disconnect);
            yield cancel(
                lifecycleManager,
                queueChangeManager,
                playbackStateUpdateManager,
                spotifyPlaybackChangeManager,
            );
        }
    } finally {
        if (player && (yield cancelled())) {
            yield apply(player, player.disconnect);
        }
    }
}

export default manageLocalPlayer;

export function* checkPlaybackSdkCompatibility() {
    const { appVersion, userAgent } = navigator;

    const validOS =
        appVersion.includes('Win') ||
        appVersion.includes('Mac') ||
        appVersion.includes('Linux');

    const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPod|iPad|Blackberry/i);

    const validBrowser =
        (userAgent.includes('Firefox') && !userAgent.includes('Opera')) ||
        userAgent.includes('Chrome');

    if (!validOS || !validBrowser || isMobile) {
        yield put(setPlayerCompatibility(false));
    }
}
