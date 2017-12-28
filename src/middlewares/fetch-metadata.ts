import { Actions, Types } from '../actions';
import { loadMetadata } from '../actions/metadata';

export default store => next => (action: Actions) => {
    if (action.type !== Types.UPDATE_TRACKS || !action.payload) {
        return next(action);
    }

    const refs = Object.keys(action.payload)
        .map(k => action.payload[k].reference);
    store.dispatch(loadMetadata(refs));

    next(action);
};
