// tslint:disable:ordered-imports

// tslint:disable:no-reference
/// <reference path="../node_modules/@types/spotify-web-playback-sdk/index.d.ts"/>
/// <reference path="../node_modules/spotify-web-api-js/src/typings/spotify-api.d.ts"/>

declare global {
    interface Window {
        ShadyCSS?: {
            nativeCss: boolean;
            nativeShadow: boolean;
        };
    }
}

import './util/raven';
import './store';
import './views/app-shell';
