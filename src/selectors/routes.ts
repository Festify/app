import { createSelector } from 'reselect';

import { partyIdSelector } from './party';

export const queueRouteSelector = createSelector(
    partyIdSelector,
    partyId => partyId ? `/party/${partyId}` : null,
);

export const settingsRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => queueRoute ? `${queueRoute}/settings` : null,
);

export const shareRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => queueRoute ? `${queueRoute}/share` : null,
);

export const tvRouteSelector = createSelector(
    partyIdSelector,
    partyId => partyId ? `/tv/${partyId}` : null,
);
