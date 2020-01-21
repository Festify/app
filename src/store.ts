import { initializeCurrentLocation } from '@festify/redux-little-router';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import createSagaMiddleware from 'redux-saga';

import { generateInstanceId } from './actions';
import { spotifySdkInitFinish } from './actions/playback-spotify';
import reducers from './reducers';
import {
    enhancer as routerEnhancer,
    middleware as routerMiddleware,
    reducer as routerReducer,
} from './routing';
import sagas from './sagas';

const saga = createSagaMiddleware();

export const store = createStore(
    combineReducers({
        ...reducers,
        router: routerReducer,
    }),
    compose(routerEnhancer, applyMiddleware(routerMiddleware, saga), devToolsEnhancer({})),
);

for (const s of sagas) {
    saga.run(s);
}

store.dispatch(generateInstanceId());
store.dispatch(initializeCurrentLocation(store.getState().router));
window.onSpotifyWebPlaybackSDKReady = () => {
    store.dispatch(spotifySdkInitFinish());
};
