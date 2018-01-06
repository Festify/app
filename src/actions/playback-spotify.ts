import { ThunkAction } from 'redux-thunk';
import { createSelector } from 'reselect';

import { partyIdSelector } from '../selectors/party';
import { currentTrackSelector, topTracksSelector } from '../selectors/track';
import { ConnectPlaybackState, State, Track } from '../state';
import { firebase, firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';

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

export interface UpdatePlayerStateAction extends PayloadAction<Spotify.PlaybackState> {
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
        player.on('player_state_changed', playerState => dispatch({
            type: Types.UPDATE_PLAYER_STATE,
            payload: playerState,
        } as UpdatePlayerStateAction));

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

        dispatch(fetchConnectPlayerState());
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

export function fetchConnectPlayerState(): ThunkAction<Promise<void>, State, void> {
    return async dispatch => {
        const deviceResponse = await fetchWithAccessToken('/me/player/devices');
        const { devices } = await deviceResponse.json();

        if (!devices.some(d => d.is_active)) {
            return;
        }

        const resp = await fetchWithAccessToken('/me/player');
        const { is_playing, device, progress_ms } = await resp.json();

        dispatch({
            type: Types.UPDATE_CONNECT_STATE,
            payload: {
                deviceId: device.id,
                name: device.name,
                playing: is_playing,
                positionMs: progress_ms,
            },
        } as UpdateConnectStateAction);
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
        const newCurrentTrack = currentTrackSelector(state);

        if (tracksEqual(currentTrack, newCurrentTrack)) {
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
            await dispatch(play(undefined, 0));
        }
    };
}

const topTracksIdSelector: (state: State) => string[] = createSelector(
    topTracksSelector,
    tracks => tracks.map(t => `spotify:track:${t.reference.id}`),
);

export function pause(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const currentPartyId = partyIdSelector(getState());
        if (!currentPartyId) {
            throw new Error('Missing current party ID');
        }

        await fetchWithAccessToken('/me/player/pause', { method: 'put' });
        const state = getState();

        let newPos = 0;
        if (state.player.connect) {
            newPos = state.player.connect.positionMs;
        } else if (player) {
            const state = await player.getCurrentState();
            if (state) {
                newPos = state.position;
            }
        }
        await firebase.database!()
            .ref(`/parties`)
            .child(currentPartyId)
            .child('playback')
            .update({
                playing: false,
                last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
                last_position_ms: newPos,
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
export function play(deviceId?: string, positionMs?: number): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        if (deviceId && positionMs === undefined) {
            throw new Error("Cannot start playing on given device without starting position");
        }

        const state = getState();
        const tracks = topTracksIdSelector(state);

        if (tracks.length === 0) {
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

        const resume = positionMs === undefined;
        const uri = `/me/player/play${deviceId ? '?device_id=' + encodeURIComponent(deviceId) : ''}`;

        await fetchWithAccessToken(uri, {
            method: 'put',
            headers: {
                'Content-Type': 'application/json',
            },
            body: !resume ? JSON.stringify({ uris: tracks }) : undefined,
        });

        if (positionMs || positionMs === 0) {
            await fetchWithAccessToken(
                `/me/player/seek?position_ms=${Math.floor(positionMs)}`,
                { method: 'put' },
            );
        }

        const playbackRef = firebase.database!()
            .ref(`/parties`)
            .child(currentPartyId)
            .child('playback');

        // TODO: Cancel onDisconnect when sb else takes over playback
        await playbackRef.onDisconnect().update({
            playing: false,
            last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
            last_position_ms: 0,
        });
        await playbackRef.update({
            playing: true,
            last_change: firebaseNS.database!.ServerValue.TIMESTAMP,
            last_position_ms: resume
                ? currentParty.playback.last_position_ms
                : positionMs,
        });
    };
}

export function takeoverPlayback(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();

        if (!state.player.localDeviceId) {
            throw new Error('Local device ID missing');
        }

        const currentPartyId = partyIdSelector(state);
        if (!currentPartyId) {
            throw new Error('Missing current party ID');
        }

        if (!state.party.currentParty) {
            throw new Error('Missing current party');
        }

        const { playback } = state.party.currentParty;

        const positionMs = playback.playing
            ? playback.last_position_ms + (Date.now() - playback.last_change)
            : 0;

        await dispatch(play(state.player.localDeviceId, positionMs));
        await firebase.database!()
            .ref('/parties')
            .child(currentPartyId)
            .child('playback')
            .child('device_id')
            .set(state.player.localDeviceId);
    };
}

export function togglePlayPause(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        dispatch({ type: Types.TOGGLE_PLAYBACK_Start } as TogglePlaybackStartAction);

        try {
            await dispatch(fetchConnectPlayerState());

            const state = getState();
            const { player, party } = state;

            if (!player.localDeviceId) {
                throw new Error('Local device ID missing');
            }

            if (!party.currentParty) {
                throw new Error('Missing party');
            }

            const { playback } = party.currentParty;

            if (!player.connect || (player.connect.playing !== playback.playing)) {
                console.warn('Some other device may be playing, taking over playback');
                await dispatch(takeoverPlayback());
            } else {
                await dispatch(playback.playing ? pause() : play());
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
