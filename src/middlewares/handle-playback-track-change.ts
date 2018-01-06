import { Actions, Types } from '../actions';
import { handleTracksChange } from '../actions/playback-spotify';

export default store => next => (action: Actions) => {
    if (action.type !== Types.UPDATE_TRACKS) {
        return next(action);
    }

    next(action);
    store.dispatch(handleTracksChange());
};
