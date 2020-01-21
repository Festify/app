export type Actions =
    | ReturnType<typeof playerInitFinish>
    | ReturnType<typeof playerError>
    | ReturnType<typeof spotifySdkInitFinish>
    | ReturnType<typeof play>
    | ReturnType<typeof pause>
    | ReturnType<typeof togglePlaybackFail>
    | ReturnType<typeof togglePlaybackFinish>
    | ReturnType<typeof togglePlaybackStart>
    | ReturnType<typeof setPlayerCompatibility>;

export const PLAYER_INIT_FINISH = 'PLAYER_INIT_Finish';
export const PLAYER_ERROR = 'PLAYER_ERROR';
export const PLAY = 'PLAY';
export const PAUSE = 'PAUSE';
export const SPOTIFY_SDK_INIT_FINISH = 'SPOTIFY_SDK_INIT_Finish';
export const TOGGLE_PLAYBACK_FAIL = 'TOGGLE_PLAYBACK_Fail';
export const TOGGLE_PLAYBACK_FINISH = 'TOGGLE_PLAYBACK_Finish';
export const TOGGLE_PLAYBACK_START = 'TOGGLE_PLAYBACK_Start';
export const SET_PLAYER_COMPATIBILITY = 'SET_PLAYER_COMPATIBILITY';

export const playerInitFinish = (deviceId: string) => ({
    type: PLAYER_INIT_FINISH as typeof PLAYER_INIT_FINISH,
    payload: deviceId,
});

export const playerError = (error: Error) => ({
    type: PLAYER_ERROR as typeof PLAYER_ERROR,
    error: true,
    payload: error,
});

export const play = (trackId: string, position: number) => ({
    type: PLAY as typeof PLAY,
    payload: { trackId, position },
});

export const pause = () => ({ type: PAUSE as typeof PAUSE });

export const spotifySdkInitFinish = () => ({
    type: SPOTIFY_SDK_INIT_FINISH as typeof SPOTIFY_SDK_INIT_FINISH,
});

export const togglePlaybackStart = () => ({
    type: TOGGLE_PLAYBACK_START as typeof TOGGLE_PLAYBACK_START,
});

export const togglePlaybackFinish = () => ({
    type: TOGGLE_PLAYBACK_FINISH as typeof TOGGLE_PLAYBACK_FINISH,
});

export const togglePlaybackFail = (err: Error) => ({
    type: TOGGLE_PLAYBACK_FAIL as typeof TOGGLE_PLAYBACK_FAIL,
    error: true,
    payload: err,
});

export const setPlayerCompatibility = (compatible: boolean) => ({
    type: SET_PLAYER_COMPATIBILITY as typeof SET_PLAYER_COMPATIBILITY,
    payload: compatible,
});
