/* tslint:disable-next-line:no-reference */
/// <reference path="../node_modules/@types/spotify-web-playback-sdk/index.d.ts"/>

import * as Raven from 'raven-js';

import { SENTRY_URL } from '../common.config';

declare global {
    interface Window {
        ShadyCSS?: {
            nativeCss: boolean;
            nativeShadow: boolean;
        };
    }
}

const raven = new (Raven as any).Client();
raven.config(SENTRY_URL).install();

import './store';
import './views/app-shell';
