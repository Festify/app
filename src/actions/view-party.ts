import { Track } from '../state';

export type Actions =
    | ReturnType<typeof changeDisplayLoginModal>
    | ReturnType<typeof changeTrackSearchInput>
    | ReturnType<typeof searchFail>
    | ReturnType<typeof searchFinish>
    | ReturnType<typeof searchStart>;

export const CHANGE_DISPLAY_LOGIN_MODAL = 'CHANGE_DISPLAY_LOGIN_MODAL';
export const CHANGE_TRACK_SEARCH_INPUT = 'CHANGE_TRACK_SEARCH_INPUT';
export const SEARCH_FAIL = 'SEARCH_Fail';
export const SEARCH_FINISH = 'SEARCH_Finish';
export const SEARCH_START = 'SEARCH_Start';

export const changeDisplayLoginModal = (display: boolean) => ({
    type: CHANGE_DISPLAY_LOGIN_MODAL as typeof CHANGE_DISPLAY_LOGIN_MODAL,
    payload: display,
});

export const changeTrackSearchInput = (text: string) => ({
    type: CHANGE_TRACK_SEARCH_INPUT as typeof CHANGE_TRACK_SEARCH_INPUT,
    payload: text,
});

export const eraseTrackSearchInput = () => changeTrackSearchInput('');

export const searchFail = (error: Error) => ({
    type: SEARCH_FAIL as typeof SEARCH_FAIL,
    error: true,
    payload: error,
});

export const searchFinish = (tracks: Record<string, Track>) => ({
    type: SEARCH_FINISH as typeof SEARCH_FINISH,
    payload: tracks,
});

export const searchStart = () => ({ type: SEARCH_START as typeof SEARCH_START });
