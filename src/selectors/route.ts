import { createSelector } from 'reselect';

import { State } from '../state';

export const paramsSelector = (state: State) => state.router.params;

export const partyIdSelector = (state: State): string | null => {
    const params = paramsSelector(state);
    return params ? params.partyId : null;
};
