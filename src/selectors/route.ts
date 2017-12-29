import { createSelector } from 'reselect';

import { State } from '../state';

export const paramsSelector = (state: State) => state.router.params;
