import { State } from '../state';

import { paramsSelector } from './route';

export const partyIdSelector = (state: State): string | null => {
    const params = paramsSelector(state);
    return params ? params.partyId : null;
};
