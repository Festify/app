import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';

import { Actions, Types } from '../actions';
import { exchangeCode } from '../actions/auth';

export default store => next => (action: Actions) => {
    if (action.type !== LOCATION_CHANGED) {
        return next(action);
    }

    const { code, state } = action.payload.query;
    if (state !== 'SPOTIFY_AUTH') {
        return next(action);
    }

    store.dispatch(exchangeCode(code));
};
