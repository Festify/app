import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless/lib';

import { Actions, Types } from '../actions';
import { searchTracks } from '../actions/view-party';

let waitingForParty = false;
export default store => next => (action: Actions) => {
    if (waitingForParty && action.type === Types.UPDATE_PARTY && action.payload) {
        waitingForParty = false;
        store.dispatch(searchTracks());
    }

    if (action.type !== LOCATION_CHANGED) {
        return next(action);
    }
    if (action.payload.params && action.payload.params.query) {
        if (!store.getState().party.currentParty) {
            waitingForParty = true;
            return next(action);
        }
        store.dispatch(searchTracks());
    }

    next(action);
};
