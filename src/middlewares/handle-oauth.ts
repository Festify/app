import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';

import { Actions } from '../actions';
import { exchangeCode } from '../actions/auth';

export default store => next => (action: Actions) => {
    next(action);

    if (action.type !== LOCATION_CHANGED) {
        return;
    }

    const { code, state } = action.payload.query;
    if (state !== 'SPOTIFY_AUTH') {
        return;
    }

    store.dispatch(exchangeCode(code));
};
