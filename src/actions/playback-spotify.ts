import { ThunkAction } from 'redux-thunk';
import { createSelector } from 'reselect';

import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import {
    currentTrackIdSelector,
    currentTrackMetadataSelector,
    currentTrackSelector,
    topTracksSelector,
} from '../selectors/track';
import { ConnectPlaybackState, State, Track } from '../state';
import { firebase, firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';
import { updateConnectionState } from './party-data';
import { removeTrack } from './queue';

export type Actions =
    | PlayerInitStartAction
    | PlayerInitFinishAction
    | PlayerErrorAction
    | UpdateConnectStateAction
    | UpdatePlayerStateAction
    | TogglePlaybackStartAction
    | TogglePlaybackFinishAction
    | TogglePlaybackFailAction;

export interface PlayerErrorAction extends ErrorAction {
    type: Types.PLAYER_ERROR;
}

export interface PlayerInitStartAction {
    type: Types.PLAYER_INIT_Start;
}

export interface PlayerInitFinishAction extends PayloadAction<string> {
    type: Types.PLAYER_INIT_Finish;
}

export interface TogglePlaybackStartAction {
    type: Types.TOGGLE_PLAYBACK_Start;
}

export interface TogglePlaybackFinishAction {
    type: Types.TOGGLE_PLAYBACK_Finish;
}

export interface TogglePlaybackFailAction extends ErrorAction {
    type: Types.TOGGLE_PLAYBACK_Fail;
}

export interface UpdatePlayerStateAction extends PayloadAction<Spotify.PlaybackState | null> {
    type: Types.UPDATE_PLAYER_STATE;
}

export interface UpdateConnectStateAction extends PayloadAction<ConnectPlaybackState> {
    type: Types.UPDATE_CONNECT_STATE;
}

let player: Spotify.SpotifyPlayer | null = null;
let needsConnect = false;

export function initializePlayer(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch) => {
        player = new Spotify.Player({
            name: "Festify",
            getOAuthToken: (cb) => requireAccessToken().then(cb),
            volume: 1,
        });

        const dispatchError = e => dispatch({
            type: Types.PLAYER_ERROR,
            error: true,
            payload: e,
        } as PlayerErrorAction);

        (window as any).player = player;

        player.on('initialization_error', dispatchError);
        player.on('authentication_error', dispatchError);
        player.on('account_error', dispatchError);
        player.on('playback_error', dispatchError);

        player.on('ready', ({ device_id }) => dispatch({
            type: Types.PLAYER_INIT_Finish,
            payload: device_id,
        } as PlayerInitFinishAction));
        player.on('player_state_changed', playerState => dispatch(
            updatePlayerState(playerState),
        ));

        if (needsConnect) {
            await dispatch(connectPlayer());
        }
    };
}

export function connectPlayer(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        if (!player) {
            needsConnect = true;
            return;
        }
        needsConnect = false;

        await requireAccessToken();

        const party = getState().party.currentParty;

        dispatch({ type: Types.PLAYER_INIT_Start } as PlayerInitStartAction);

        const success = await player.connect();
        if (!success) {
            return;
        }

        if (!party) {
            return;
        }

        dispatch(fetchPlayerState());
    };
}

export function disconnectPlayer(): ThunkAction<void, State, void> {
    return (dispatch) => {
        if (!player) {
            return;
        }

        player.disconnect();
    };
}

export function fetchPlayerState(): ThunkAction<Promise<void>, State, void> {
    return async dispatch => {
        if (!player) {
            throw new Error("Missing player");
        }

        const state = await player.getCurrentState();
        dispatch(updatePlayerState(state));
    };
}

let currentTrack: Track | null = null;
export function handleTracksChange(): ThunkAction<Promise<void>, State, void> {
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

    return async (dispatch, getState) => {
        const state = getState();
        const isOwner = isPartyOwnerSelector(state);
        const newCurrentTrack = currentTrackSelector(state);

        // TODO: Extend logic to not only watch party ownership, but also
        // playback master device status
        if (!isOwner || tracksEqual(currentTrack, newCurrentTrack)) {
            return;
        }
        currentTrack = newCurrentTrack;

        const { currentParty } = state.party;
        if (!currentParty) {
            throw new Error("Missing party");
        }

        // Spotify yields an error if you try to pause while player is paused
        if (currentParty.playback.playing) {
            await dispatch(pause());
        }

        // Only start playback if we were playing before and if we have a track to play
        if (currentParty.playback.playing && newCurrentTrack) {
            await dispatch(play(0));
        }
    };
}

export function togglePlayPause(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.TOGGLE_PLAYBACK_Start } as TogglePlaybackStartAction);

        try {
            await dispatch(fetchPlayerState());

            const state = getState();
            const { player, party } = state;

            if (!player.localDeviceId) {
                throw new Error('Local device ID missing');
            }

            if (!party.currentParty) {
                throw new Error('Missing party');
            }

            const { playback } = party.currentParty;
            if (playback.playing) {
                await dispatch(pause());
            } else if (!player.playbackState) {
                await dispatch(play(0)); // Start playing track
            } else {
                await dispatch(play()); // Just resume
            }

            dispatch({ type: Types.TOGGLE_PLAYBACK_Finish } as TogglePlaybackFinishAction);
        } catch (error) {
            dispatch({
                type: Types.TOGGLE_PLAYBACK_Fail,
                payload: error,
                error: true,
            } as TogglePlaybackFailAction);
        }
    };
}

export function updatePlayerState(state: Spotify.PlaybackState | null): UpdatePlayerStateAction {
    return {
        type: Types.UPDATE_PLAYER_STATE,
        payload: state,
    };
}

const topTracksIdSelector: (state: State) => string[] = createSelector(
    topTracksSelector,
    tracks => tracks.map(t => `spotify:track:${t.reference.id}`),
);

function pause(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const currentPartyId = partyIdSelector(getState());
        if (!currentPartyId) {
            throw new Error('Missing current party ID');
        }

        if (!player) {
            throw new Error("Missing player");
        }

        await player.pause();
        clearInterval(playbackProgressInterval);
        await firebase.database!()
            .ref(`/parties`)
            .child(currentPartyId)
            .child('playback')
            .update({
                playing: false,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: (await player.getCurrentState())!.position,
            });
    };
}

/**
 * Start / resume playback of the currently playing track
 *
 * @param deviceId The device ID to play on, pass undefined to play on currently active device. When
 * passing a device ID here, you must also pass a starting position to play from (can be 0, but not `undefined`).
 * @param positionMs The position in milliseconds to play the track from. Pass `undefined` to resume
 * playback instead of starting anew.
 */
function play(positionMs?: number): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();
        const currentTrackId = currentTrackIdSelector(state);
        const spotifyTrackIds = topTracksIdSelector(state);

        // If the queue is empty we have nothing to play
        if (!currentTrackId || spotifyTrackIds.length === 0) {
            return;
        }

        const currentPartyId = partyIdSelector(state);
        if (!currentPartyId) {
            throw new Error('Missing current party ID');
        }
        const { currentParty } = state.party;
        if (!currentParty) {
            throw new Error("Missing party");
        }
        const { localDeviceId } = state.player;
        if (!localDeviceId) {
            throw new Error("Missing local device ID");
        }
        if (!player) {
            throw new Error("Missing player");
        }

        const resume = positionMs === undefined;
        if (resume) {
            await player.resume();
        } else {
            const uri = `/me/player/play?device_id=${encodeURIComponent(localDeviceId)}`;
            await fetchWithAccessToken(uri, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uris: spotifyTrackIds }),
            });
        }

        const playbackRef = firebase.database!()
            .ref(`/parties`)
            .child(currentPartyId)
            .child('playback');

        // Update playback state in firebase and ensure state stays valid
        // even if browser is closed / internet disconnects
        const tasks = [
            // TODO: Cancel onDisconnect when sb else takes over playback
            playbackRef.onDisconnect().update({
                playing: false,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: 0,
            }),
            playbackRef.update({
                playing: true,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: resume
                    ? currentParty.playback.last_position_ms
                    : positionMs,
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

        await Promise.all(tasks);

        dispatch(watchPlaybackProgress());
    };
}

let playbackProgressInterval: number = -1;
let trackEndTimeout: number = -1;
function watchPlaybackProgress(): ThunkAction<void, State, void> {
    return (dispatch, getState) => {
        clearInterval(playbackProgressInterval);
        playbackProgressInterval = setInterval(async () => {
            await dispatch(fetchPlayerState());

            const state = getState();
            if (!state.player.playbackState) {
                console.warn("Missing playback state in playback watcher.");
                return;
            }
            const currentTrack = currentTrackSelector(state);
            const currentTrackMeta = currentTrackMetadataSelector(state);
            if (!currentTrack || !currentTrackMeta) {
                return;
            }
            const partyId = partyIdSelector(state);
            if (!partyId) {
                throw new Error("Missing party ID");
            }

            const { paused, position } = state.player.playbackState;

            await firebase.database!()
                .ref('/parties')
                .child(partyId)
                .child('playback')
                .update({
                    last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                    last_position_ms: position,
                    playing: !paused,
                });

            clearTimeout(trackEndTimeout);
            trackEndTimeout = setTimeout(
                async () => {
                    clearInterval(playbackProgressInterval);
                    await dispatch(removeTrack(currentTrack.reference, true));
                },
                Math.max(currentTrackMeta.durationMs - position - 50, 0),
            );
        }, 5000);
    };
}
