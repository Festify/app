import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';

import { fetchPlaylists } from '../actions/party-settings';
import { PartyViews } from '../routing';

export default store => next => action => {
    if (action.type !== LOCATION_CHANGED) {
        return next(action);
    }

    const { result } = action.payload;
    if (!result || result.subView !== PartyViews.Settings) {
        return next(action);
    }

    next(action);
    store.dispatch(fetchPlaylists());
};
