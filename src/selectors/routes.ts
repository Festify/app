import { createSelector } from 'reselect';

import { State } from '../state';

import { partyIdSelector } from './party';

export const queueRouteSelector = createSelector(partyIdSelector, partyId =>
    partyId ? `/party/${partyId}` : null,
);

export const searchRouteSelector = createSelector(
    queueRouteSelector,
    (s: State, query: string) => encodeURIComponent(query),
    (queueRoute, query) => (queueRoute ? `${queueRoute}/search?s=${query}` : null),
);

export const settingsRouteSelector = createSelector(queueRouteSelector, queueRoute =>
    queueRoute ? `${queueRoute}/settings` : null,
);

export const shareRouteSelector = createSelector(queueRouteSelector, queueRoute =>
    queueRoute ? `${queueRoute}/share` : null,
);

export const tvRouteSelector = createSelector(partyIdSelector, partyId =>
    partyId ? `/tv/${partyId}` : null,
);
