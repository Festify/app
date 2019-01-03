// tslint:disable:no-reference
/// <reference path="../node_modules/@types/spotify-web-playback-sdk/index.d.ts"/>
/// <reference path="../node_modules/spotify-web-api-js/src/typings/spotify-api.d.ts"/>

// tslint:disable:ordered-imports

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import * as serviceWorker from './serviceWorker';

import 'modern-normalize/modern-normalize.css';
import './index.scss';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
