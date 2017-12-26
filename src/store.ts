import { initializeCurrentLocation, routerForBrowser } from '@mraerino/redux-little-router-reactless';
import { createProvider } from 'fit-html';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import thunk from 'redux-thunk';

import reducers from './reducers';
import {
    enhancer as routerEnhancer,
    middleware as routerMiddleware,
    reducer as routerReducer,
} from './routing';
import { State } from './state';

export const store = createStore<State>(
    combineReducers({
        ...reducers,
        router: routerReducer,
    }),
    compose(
        routerEnhancer,
        applyMiddleware(thunk, routerMiddleware),
        devToolsEnhancer({}),
    ),
);

store.dispatch(initializeCurrentLocation(store.getState().router));

export const storeProvider = createProvider(store);
customElements.define('store-provider', storeProvider);
