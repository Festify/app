import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';

import { fetchPlaylists } from '../actions/party-settings';
import { PartyViews } from '../routing';

export default store => next => action => {
    next(action);

    if (action.type !== LOCATION_CHANGED) {
        return;
    }

    const { result } = action.payload;
    if (!result || result.subView !== PartyViews.Settings) {
        return;
    }

    store.dispatch(fetchPlaylists());
};
