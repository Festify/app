import { push } from '@mraerino/redux-little-router-reactless';
import { ThunkAction } from 'redux-thunk';

import { PartyViews, Views } from '../routing';
import { State } from '../state';

export function exitParty(): typeof push {
    return push('/', {});
}

export function navigateTo(view: PartyViews | Views.Tv): ThunkAction<void, State, void> {
    return (dispatch, getState) => {
        const { router } = getState();

        if (!router.params) {
            throw new Error("Missing router state.");
        }

        const { partyId } = router.params;
        let route = view === Views.Tv
            ? `/tv/${partyId}`
            : `/party/${partyId}`;

        if (view === PartyViews.Share) {
            route += '/share';
        } else if (view === PartyViews.Settings) {
            route += '/settings';
        }

        dispatch(push(route, {}));
    };
}
