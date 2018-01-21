import { showToast, Actions, Types } from '../actions';

export default store => next => (action: Actions) => {
    next(action);

    switch (action.type) {
        case Types.EXCHANGE_CODE_Fail:
        case Types.INSERT_FALLBACK_PLAYLIST_Fail:
        case Types.JOIN_PARTY_Fail:
        case Types.LOAD_PLAYLISTS_Fail:
        case Types.OPEN_PARTY_Fail:
        case Types.PLAYER_ERROR:
        case Types.TOGGLE_PLAYBACK_Fail:
            store.dispatch(showToast(action.payload.message));
            break;
    }
};
