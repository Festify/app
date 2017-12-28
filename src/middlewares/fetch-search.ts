import { Actions, Types } from '../actions';
import { searchTracks } from '../actions/view-party';

export default store => next => (action: Actions) => {
    if (action.type !== Types.CHANGE_SEARCH_INPUT_TEXT) {
        return next(action);
    }

    next(action);
    store.dispatch(searchTracks());
};
