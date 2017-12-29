import { ThunkAction } from 'redux-thunk';

import { ConnectPlaybackState, State } from '../state';
import { fetchWithAccessToken, requireAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | PlayerInitStartAction
    | PlayerInitFinishAction
    | PlayerErrorAction;

export interface PlayerErrorAction extends ErrorAction {
    type: Types.PLAYER_ERROR;
}

export interface PlayerInitStartAction {
    type: Types.PLAYER_INIT_Start;
}

export interface PlayerInitFinishAction extends PayloadAction<string> {
    type: Types.PLAYER_INIT_Finish;
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
        }));

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

        const resp = await fetchWithAccessToken('/me/player');
        const { is_playing, device } = await resp.json();
        dispatch({
            type: Types.UPDATE_CONNECT_STATE,
            payload: {
                deviceId: device.id,
                name: device.name,
                playing: is_playing,
            },
        } as UpdateConnectStateAction);
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
