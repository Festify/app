// tslint:disable:ordered-imports

/* tslint:disable-next-line:no-reference */
/// <reference path="../node_modules/@types/spotify-web-playback-sdk/index.d.ts"/>
declare global {
    interface Window {
        ShadyCSS?: {
            nativeCss: boolean;
            nativeShadow: boolean;
        };
        WebComponents: {
            ready?: boolean;
        };
    }
}

import './util/raven';
import './store';
import './views/app-shell';
