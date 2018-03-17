/* tslint:disable-next-line:no-reference */
/// <reference path="../node_modules/@types/spotify-web-playback-sdk/index.d.ts"/>

declare global {
    interface Window {
        ShadyCSS?: {
            nativeCss: boolean;
            nativeShadow: boolean;
        };
    }
}

import './store';
import './views/app-shell';
