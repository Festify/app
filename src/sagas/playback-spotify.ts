import { DataSnapshot } from '@firebase/database-types';
import { delay, eventChannel, Channel } from 'redux-saga';
import {
    actionChannel,
    all,
    apply,
    call,
    cancel,
    cancelled,
    fork,
    put,
    race,
    select,
    take,
    takeEvery,
} from 'redux-saga/effects';
import { createSelector } from 'reselect';

import { Types } from '../actions';
import {
    OpenPartyFailAction,
    OpenPartyFinishAction,
    OpenPartyStartAction,
} from '../actions/party-data';
import {
    pause,
    play,
    playerError,
    playerInitFinish,
    togglePlaybackFail,
    togglePlaybackFinish,
    updatePlayerState,
    PauseAction,
    PlayAction,
} from '../actions/playback-spotify';
import { removeTrack } from '../actions/queue';
import { isPartyOwnerSelector } from '../selectors/party';
import { currentTrackIdSelector, currentTrackMetadataSelector, currentTrackSelector } from '../selectors/track';
import { State, Track, TrackReference } from '../state';
import firebase, { firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

function attachToEvent(player: Spotify.SpotifyPlayer, name: 'ready'): Channel<Spotify.WebPlaybackInstance>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: 'player_state_changed'): Channel<Spotify.PlaybackState>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: Spotify.ErrorTypes): Channel<Spotify.Error>;

function attachToEvent<T>(player: Spotify.SpotifyPlayer, name: string) {
    return eventChannel<T>(put => {
        player.on(name as any, put as any);
        return () => (player as any).removeListener(name, put);
    });
}

function* manageSpotifyPlayer() {
    const partyOpenStarts: Channel<OpenPartyStartAction> =
        yield actionChannel(Types.OPEN_PARTY_Start);
    const partyOpenFails: Channel<OpenPartyFailAction> =
        yield actionChannel(Types.OPEN_PARTY_Fail);
    const partyOpenFinishes: Channel<OpenPartyFinishAction> =
        yield actionChannel(Types.OPEN_PARTY_Finish);

    yield take(Types.SPOTIFY_SDK_INIT_Finish);

    while (true) {
        const openPartyAction: OpenPartyStartAction = yield take(partyOpenStarts);
        const partyId = openPartyAction.payload;

        const { fail, finish } = yield race({
            fail: take(partyOpenFails),
            finish: take(partyOpenFinishes),
        });

        if (fail || !isPartyOwnerSelector(yield select())) {
            continue;
        }

        const playerTask = yield fork(controlPlayerLifecycle, partyId);
        const uiTask = yield takeEvery(
            Types.TOGGLE_PLAYBACK_Start,
            handlePlayPausePressed,
            partyId,
        );

        yield take(Types.CLEANUP_PARTY);

        yield cancel(playerTask, uiTask);
    }
}

function* controlPlayerLifecycle(partyId: string) {
    let player: Spotify.SpotifyPlayer = null!;
    try {
        const playActions: Channel<PlayAction> = yield actionChannel(Types.PLAY);
        const pauseActions: Channel<PauseAction> = yield actionChannel(Types.PAUSE);

        while (true) {
            yield take(Types.BECOME_PLAYBACK_MASTER);

            player = new Spotify.Player({
                name: 'Festify',
                getOAuthToken: (cb) => requireAccessToken().then(cb),
                volume: 1,
            });

            const initErrors: Channel<Spotify.Error> =
                yield call(attachToEvent, player, 'initialization_error');
            const authenticationErrors: Channel<Spotify.Error> =
                yield call(attachToEvent, player, 'authentication_error');
            const accountErrors: Channel<Spotify.Error> =
                yield call(attachToEvent, player, 'account_error');
            const playbackErrors: Channel<Spotify.Error> =
                yield call(attachToEvent, player, 'playback_error');
            const playerReady: Channel<Spotify.WebPlaybackInstance> =
                yield call(attachToEvent, player, 'ready');
            const playbackStateChanges: Channel<Spotify.PlaybackState> =
                yield call(attachToEvent, player, 'player_state_changed');

            const connectSuccess: boolean = yield apply(player, player.connect);

            if (!connectSuccess) {
                const { account, auth, init, playback } = yield race({
                    account: take(accountErrors),
                    auth: take(authenticationErrors),
                    init: take(initErrors),
                    playback: take(playbackErrors),
                });
                yield put(playerError(account || auth || init || playback));
                continue;
            }

            const { device_id }: Spotify.WebPlaybackInstance = yield take(playerReady);
            const playPauseTask = yield fork(
                handlePlayPause,
                partyId,
                player,
                device_id,
                playActions,
                pauseActions,
            );
            const publishPlaybackStateChangesTask = yield takeEvery(
                playbackStateChanges,
                function* (state: Spotify.PlaybackState) {
                    yield put(updatePlayerState(state));
                },
            );
            const tracksTask = yield fork(
                handleTrackChanges,
                partyId,
            );

            yield put(playerInitFinish(device_id));

            yield take(Types.RESIGN_PLAYBACK_MASTER);

            yield all([
                cancel(playPauseTask, publishPlaybackStateChangesTask),
                apply(player, player.disconnect),
            ]);
            initErrors.close();
            accountErrors.close();
            authenticationErrors.close();
            playbackErrors.close();
            playerReady.close();
            playbackStateChanges.close();
        }
    } finally {
        if (player && (yield cancelled())) {
            yield apply(player, player.disconnect);
        }
    }
}

const currentTrackSpotifyIdSelector: (state: State) => string | null = createSelector(
    currentTrackSelector,
    track => track ? `spotify:track:${track.reference.id}` : null,
);

function* handlePlayPause(
    partyId: string,
    player: Spotify.SpotifyPlayer,
    playerId: string,
    playActions: Channel<PlayAction>,
    pauseActions: Channel<PauseAction>,
) {
    let playbackDisconnect;
    let playbackWatcherTask;

    try {
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

            let currentTrackMeta = currentTrackMetadataSelector(state);
            while (!currentTrackMeta) {
                yield call(delay, 50);
                const s = yield select();
                currentTrackMeta = currentTrackMetadataSelector(s);
            }

            const { currentParty } = state.party;
            if (!currentParty) {
                yield put(playerError(new Error('Missing party')));
                continue;
            }

            const resume = action.payload === undefined;

            if (resume) {
                yield apply(player, player.resume);
            } else {
                const uri = `/me/player/play?device_id=${encodeURIComponent(playerId)}`;
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
                .child(partyId)
                .child('playback');

            playbackDisconnect = playbackRef.onDisconnect();

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
                    .child(partyId)
                    .child(currentTrackId)
                    .child('played_at')
                    .set(firebaseNS.database!.ServerValue.TIMESTAMP);
                tasks.push(setPlayedAt);
            }

            yield all(tasks);

            playbackWatcherTask = yield fork(
                watchPlayback,
                player,
                partyId,
                currentTrack.reference,
                currentTrackMeta.durationMs,
            );

            yield take(pauseActions);

            const playbackState: Spotify.PlaybackState = yield apply(player, player.getCurrentState);
            yield all([
                cancel(playbackWatcherTask),
                apply(player, player.pause),
                apply(playbackDisconnect, playbackDisconnect.cancel),
                firebase.database!()
                    .ref(`/parties`)
                    .child(partyId)
                    .child('playback')
                    .update({
                        playing: false,
                        last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                        last_position_ms: playbackState ? playbackState.position : 0,
                    }),
            ]);
        }
    } finally {
        if (yield cancelled()) {
            const playbackState: Spotify.PlaybackState = yield apply(player, player.getCurrentState);

            const tasks: any[] = [
                firebase.database!()
                    .ref(`/parties`)
                    .child(partyId)
                    .child('playback')
                    .update({
                        playing: false,
                        last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                        last_position_ms: playbackState ? playbackState.position : 0,
                    }),
            ];
            if (playbackWatcherTask) {
                tasks.push(cancel(playbackWatcherTask));
            }
            if (playbackState && !playbackState.paused) {
                tasks.push(apply(player, player.pause));
            }
            if (playbackDisconnect) {
                tasks.push(apply(playbackDisconnect, playbackDisconnect.cancel));
            }

            yield all(tasks);
        }
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
    try {
        const state: State = yield select();
        const currentMasterSnap: DataSnapshot = yield call(
            () => firebase.database!()
                .ref('/parties')
                .child(partyId)
                .child('playback')
                .child('master_id')
                .once('value'),
        );
        const currentMaster: string | null = currentMasterSnap.val();

        const isPlaying = state.party.currentParty!.playback.playing;
        if (!currentMaster || currentMaster === state.player.instanceId) {
            const masterIdRef = firebase.database!()
                .ref('/parties')
                .child(partyId)
                .child('playback')
                .child('master_id');
            const masterDc = masterIdRef.onDisconnect();

            yield all([
                call(() => masterIdRef.set(state.player.instanceId)),
                call(() => masterDc.remove()),
            ]);

            if (isPlaying) {
                yield put(pause());
            } else if (!state.player.playbackState) {
                yield put(play(0));
            } else {
                yield put(play());
            }
        } else {
            yield call(
                () => firebase.database!()
                    .ref('/parties')
                    .child(partyId)
                    .child('playback')
                    .child('playing')
                    .set(!isPlaying),
            );
        }

        yield put(togglePlaybackFinish());
    } catch (err) {
        yield put(togglePlaybackFail(err));
    }
}

function* handleTrackChanges() {
    function tracksEqual(a: Track | null, b: Track | null): boolean {
        if (a === b) {
            return true;
        } else if (!a || !b) {
            return false;
        } else {
            return a.reference.provider === b.reference.provider &&
                a.reference.id === b.reference.id;
        }
    }

    let currentTrack: Track | null = null;
    while (true) {
        yield take(Types.UPDATE_TRACKS);

        const state: State = yield select();
        const newCurrentTrack = currentTrackSelector(state);

        if (tracksEqual(currentTrack, newCurrentTrack)) {
            continue;
        }

        currentTrack = newCurrentTrack;

        const { currentParty } = state.party;
        if (!currentParty) {
            throw new Error('Missing party');
        }

        if (currentParty.playback.playing) {
            yield put(pause());
        }
        if (currentParty.playback.playing && newCurrentTrack) {
            yield put(play(0));
        }
    }
}

export default function*() {
    yield manageSpotifyPlayer();
}
