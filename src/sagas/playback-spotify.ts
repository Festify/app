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
import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import { currentTrackIdSelector, currentTrackMetadataSelector, currentTrackSelector } from '../selectors/track';
import { State, Track, TrackReference } from '../state';
import firebase, { firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

const WATCHER_INTERVAL = 5000;

function attachToEvent(player: Spotify.SpotifyPlayer, name: 'ready'): Channel<Spotify.WebPlaybackInstance>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: 'player_state_changed'): Channel<Spotify.PlaybackState>;
function attachToEvent(player: Spotify.SpotifyPlayer, name: Spotify.ErrorTypes): Channel<Spotify.Error>;

function attachToEvent<T>(player: Spotify.SpotifyPlayer, name: string) {
    return eventChannel<T>(put => {
        const listener = (ev) => {
            if (ev) {
                put(ev);
            }
        };

        player.on(name as any, listener);
        return () => (player as any).removeListener(name, listener);
    });
}

function* updateSpotifyPlayerState(partyId: string, state: Spotify.PlaybackState) {
    yield put(updatePlayerState(state));
    yield* updateFirebasePosition(partyId, state.position);
}

function* updateFirebasePosition(partyId: string, pos: number) {
    yield call(
        () => firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback')
            .update({
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: pos,
            }),
    );
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

        const { fail } = yield race({
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
                updateSpotifyPlayerState,
                partyId,
            );
            const tracksTask = yield fork(
                handleTrackChanges,
                partyId,
            );

            yield put(playerInitFinish(device_id));

            yield take(Types.RESIGN_PLAYBACK_MASTER);

            yield all([
                cancel(playPauseTask, publishPlaybackStateChangesTask, tracksTask),
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

            const playUri = `/me/player/play?device_id=${playerId}`;
            yield call(fetchWithAccessToken, playUri, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uris: [spotifyTrackId] }),
            });

            const position = Math.floor(action.payload!);
            if (position > 0) {
                const seekUri = `/me/player/seek?device_id=${playerId}&position_ms=${position}`;
                yield call(fetchWithAccessToken, seekUri, {
                    method: 'put',
                });
            }

            const playbackRef = firebase.database!()
                .ref(`/parties`)
                .child(partyId)
                .child('playback');

            playbackDisconnect = playbackRef.onDisconnect();

            // Update playback state in Firebase and ensure state stays valid
            // even if browser is closed / internet disconnects
            yield all([
                call(
                    () => playbackDisconnect.update({
                        playing: false,
                        last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                        last_position_ms: 0,
                    }),
                ),
                call(
                    () => firebase.database!()
                        .ref('/tracks')
                        .child(partyId)
                        .child(currentTrackId)
                        .child('played_at')
                        .set(firebaseNS.database!.ServerValue.TIMESTAMP),
                ),
            ]);

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
                call(
                    () => firebase.database!()
                        .ref(`/parties`)
                        .child(partyId)
                        .child('playback')
                        .update({
                            playing: false,
                            last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                            last_position_ms: playbackState ? playbackState.position : 0,
                        }),
                ),
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
            yield call(delay, WATCHER_INTERVAL);
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

        const delayDuration = Math.max(Math.min(durationMs - position - 50, WATCHER_INTERVAL), 0);
        yield call(delay, delayDuration);

        if (delayDuration < WATCHER_INTERVAL) {
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

        const { last_position_ms, playing } = state.party.currentParty!.playback;
        if (!currentMaster || currentMaster === state.player.instanceId) {
            const masterIdRef = firebase.database!()
                .ref('/parties')
                .child(partyId)
                .child('playback')
                .child('master_id');
            yield call(() => masterIdRef.set(state.player.instanceId));

            const topTrack = currentTrackSelector(state);
            if (!topTrack) {
                throw new Error("Missing current track in toggle play pause handler");
            }

            if (playing) {
                yield put(pause());
            } else {
                yield put(play(last_position_ms || 0));
            }
        } else {
            yield call(
                () => firebase.database!()
                    .ref('/parties')
                    .child(partyId)
                    .child('playback')
                    .child('playing')
                    .set(!playing),
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

        if (!newCurrentTrack) {
            continue;
        }

        // Start playback after skip or reset database if we weren't playing
        if (currentParty.playback.playing) {
            yield put(play(0));
        } else {
            const partyId = partyIdSelector(state);
            if (!partyId) {
                throw new Error("Missing party ID");
            }

            yield* updateFirebasePosition(partyId, 0);
        }
    }
}

function* installAsPlaybackMaster() {
    const state: State = yield select();

    const partyId = partyIdSelector(state);
    if (!partyId) {
        throw new Error("Missing party ID!");
    }

    yield call(
        () => firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('playback')
            .child('master_id')
            .set(state.player.instanceId),
    );
}

export default function*() {
    yield all([
        manageSpotifyPlayer(),
        takeEvery(Types.INSTALL_PLAYBACK_MASTER, installAsPlaybackMaster),
    ]);
}
