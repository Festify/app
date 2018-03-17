import { createSelector } from 'reselect';

import { partyIdSelector } from './party';

export const queueRouteSelector = createSelector(
    partyIdSelector,
    partyId => `/party/${partyId}`,
);

export const settingsRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => `${queueRoute}/settings`,
);

export const shareRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => `${queueRoute}/share`,
);

export const tvRouteSelector = createSelector(
    partyIdSelector,
    partyId => `/tv/${partyId}`,
);
