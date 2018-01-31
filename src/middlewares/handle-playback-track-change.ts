import { Actions, Types } from '../actions';
import { handleTracksChange } from '../actions/playback-spotify';

export default store => next => (action: Actions) => {
    next(action);

    if (action.type !== Types.UPDATE_TRACKS) {
        return;
    }

    store.dispatch(handleTracksChange());
};
