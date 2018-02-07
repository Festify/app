import { initializeCurrentLocation, routerForBrowser } from '@mraerino/redux-little-router-reactless';
import { createProvider } from 'fit-html';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';

import { generateInstanceId } from './actions';
import { checkSpotifyLoginStatus } from './actions/auth';
import { initializePlayer } from './actions/playback-spotify';
import middlewares from './middlewares';
import reducers from './reducers';
import {
    enhancer as routerEnhancer,
    middleware as routerMiddleware,
    reducer as routerReducer,
} from './routing';
import sagas from './sagas';
import { State } from './state';

const saga = createSagaMiddleware();

export const store = createStore<State>(
    combineReducers({
        ...reducers,
        router: routerReducer,
    }),
    compose(
        routerEnhancer,
        applyMiddleware(
            thunk,
            routerMiddleware,
            saga,
             ...middlewares,
        ),
        devToolsEnhancer({}),
    ),
);

for (const s of sagas) {
    saga.run(s);
}

store.dispatch(checkSpotifyLoginStatus());
store.dispatch(generateInstanceId());
store.dispatch(initializeCurrentLocation(store.getState().router));
window.onSpotifyWebPlaybackSDKReady = () => {
    store.dispatch(initializePlayer());
};

export const storeProvider = createProvider(store);
customElements.define('store-provider', storeProvider);
