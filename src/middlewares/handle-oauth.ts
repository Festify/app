import { LOCATION_CHANGED } from '@mraerino/redux-little-router-reactless';

import { showToast, Actions } from '../actions';
import { exchangeCode } from '../actions/auth';

export default store => next => (action: Actions) => {
    next(action);

    if (action.type !== LOCATION_CHANGED) {
        return;
    }

    const { code, error, state } = action.payload.query;
    if (state !== 'SPOTIFY_AUTH') {
        return;
    }

    switch (error) {
        case 'access_denied':
            store.dispatch(showToast("Oops, Spotify denied access. Please try again."));
            return;
    }

    store.dispatch(exchangeCode(code));
};
