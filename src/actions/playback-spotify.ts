import { ThunkAction } from 'redux-thunk';
import { createSelector } from 'reselect';

import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
import {
    currentTrackIdSelector,
    currentTrackMetadataSelector,
    currentTrackSelector,
} from '../selectors/track';
import { ConnectPlaybackState, State, Track } from '../state';
import { firebase, firebaseNS } from '../util/firebase';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';
import { removeTrack } from './queue';

export type Actions =
    | PlayerInitStartAction
    | PlayerInitFinishAction
    | PlayerErrorAction
    | UpdateConnectStateAction
    | UpdatePlayerStateAction
    | SpotifySdkInitFinishAction
    | PlayAction
    | PauseAction
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

export interface SpotifySdkInitFinishAction {
    type: Types.SPOTIFY_SDK_INIT_Finish;
}

export interface PlayAction extends PayloadAction<number | undefined> {
    type: Types.PLAY;
}

export interface PauseAction {
    type: Types.PAUSE;
}

let player: Spotify.SpotifyPlayer | null = null;
let needsConnect = false;

export function spotifySdkInitFinish(): SpotifySdkInitFinishAction {
    return { type: Types.SPOTIFY_SDK_INIT_Finish };
}

export function playerInitFinish(deviceId: string): PlayerInitFinishAction {
    return {
        type: Types.PLAYER_INIT_Finish,
        payload: deviceId,
    };
}

export function playerError(error: Error): PlayerErrorAction {
    return {
        type: Types.PLAYER_ERROR,
        error: true,
        payload: error,
    };
}

export function play(position: number | undefined): PlayAction {
    return { type: Types.PLAY, payload: position };
}

export function pause(): PauseAction {
    return { type: Types.PAUSE };
}

export function togglePlaybackStart(): TogglePlaybackStartAction {
    return { type: Types.TOGGLE_PLAYBACK_Start };
}

export function togglePlaybackFinish(): TogglePlaybackFinishAction {
    return { type: Types.TOGGLE_PLAYBACK_Finish };
}

export function togglePlaybackFail(err: Error): TogglePlaybackFailAction {
    return {
        type: Types.TOGGLE_PLAYBACK_Fail,
        error: true,
        payload: err,
    };
}

export function initializePlayer(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch) => {
        player = new Spotify.Player({
            name: 'Festify',
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
        dispatch({ type: Types.PLAYER_INIT_Start } as PlayerInitStartAction);

        const success = await player.connect();
        if (!success) {
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
            throw new Error('Missing player');
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
            throw new Error('Missing party');
        }

        // Spotify yields an error if you try to _pause while player is paused
        if (currentParty.playback.playing) {
            // await dispatch(_pause());
        }

        // Only start playback if we were playing before and if we have a track to _play
        if (currentParty.playback.playing && newCurrentTrack) {
            // await dispatch(_play(0));
        }
    };
}

export function togglePlayPause(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        await dispatch(fetchPlayerState());

        const state = getState();
        if (!isPartyOwnerSelector(state)) {
            throw new Error('Not party owner');
        }

        const { player, party } = state;

        if (!player.localDeviceId) {
            throw new Error('Local device ID missing');
        }

        if (!party.currentParty) {
            throw new Error('Missing party');
        }

        const { playback } = party.currentParty;
        if (playback.playing) {
            // await dispatch(_pause());
        } else if (!player.playbackState) {
            // await dispatch(_play(0)); // Start playing track
        } else {
            // await dispatch(_play()); // Just resume
        }
    };
}

export function updatePlayerState(state: Spotify.PlaybackState | null): UpdatePlayerStateAction {
    return {
        type: Types.UPDATE_PLAYER_STATE,
        payload: state,
    };
}
