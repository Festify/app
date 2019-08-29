<a href="https://festify.rocks/">
    <img title="Festify Logo" height="150" src="https://festify.rocks/img/festify-logo.svg">
</a>

# Festify

[![Greenkeeper badge](https://badges.greenkeeper.io/Festify/app.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/Festify/app.svg?branch=develop)](https://travis-ci.org/Festify/app)

Festify is a free Spotify-powered app that lets your guests choose which music should be played using their smartphones. [festify.rocks](https://festify.rocks/)

## Building

### Dependencies

1. [nodejs](https://nodejs.org), [TypeScript](https://typescriptlang.org) and [yarn](https://yarnpkg.com): Festify is written in TypeScript for better scalability and fewer bugs. We use yarn for package management.
1. [Firebase](https://firebase.google.com): Festify is built upon Firebase Realtime Database and Firebase Cloud Functions. Set up a _dedicated and paid_ Firebase project. For user management, you need to enable at least [anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth), and if you want cheat-prevention to work, also authentication with GitHub, Facebook, Twitter, and Google+. In that case, you also need to set up and register the respective app / developer accounts with these services.
1. [Spotify](https://beta.developer.spotify.com/): Festify plays music from Spotify. Set up a Spotify Developer Application (you need a Spotify Premium account) and configure the OAuth redirect URL. Usually at least `http://localhost:3000` is needed for a dev-environment. 3000 is the port the dev-server started with `yarn serve` runs on, but this can be any port you like, if you configure the dev server accordingly.
1. [Fanart.tv](https://fanart.tv) & [Sentry](https://sentry.io): Festify displays Fanart from fanart.tv in the TV Mode and uses Sentry for error reporting. You require an account for both services.

### Environment Files

Festify loads configuration variables though JS / TS / JSON files included in the build process. All following paths are relative to the repository root.

- `common.config.js`: This file includes common configuration values that don't deserve their own file. Currently this is the Sentry URL and the Fanart.tv API key. It looks like this:
    ```js
    export const FANART_TV_API_KEY = "FANART_API_KEY_HERE";
    export const SENTRY_URL = "SENTRY_URL_HERE";
    ```

- `firebase.config.js`: This file contains a simplified form of the config snippet you get when you add Firebase to a web application.
    ```js
    export default {
        apiKey: "FIREBASE_API_KEY",
        authDomain: "FIREBASE_AUTH_DOMAIN",
        databaseURL: "FIREBASE_DATABASE_URL",
        projectId: "FIREBASE_PROJECT_ID",
    };
    ```

- `spotify.config.js`: This file contains the required configuration for authorization with Spotify and playback.
    ```js
    export const CLIENT_ID = "YOUR_SPOTIFY_APPLICATION_CLIENT_ID";
    ```

- `functions/service-account.json`: This is the Firebase service account file obtained directly from the web console. You can obtain it by going to Project Settings > Service Accounts > Firebase Admin SDK > Generate new private key.

- `functions/spotify.config.ts`: This file contains Spotify configuration for the cloud functions.
    ```ts
    export const CLIENT_ID = "YOUR_SPOTIFY_APPLICATION_CLIENT_ID";
    export const ENCRYPTION_SECRET = "REFRESH_TOKEN_ENCRYPTION_KEY - PLEASE GENERATE";
    export const CLIENT_SECRET = "YOUR_SPOTIFY_APPLICATION_CLIENT_SECRET";
    ```

Since all config values (except for the `service-account.json`) are loaded through standard ES modules machinery, building the project will notify you if something is missing.

### Building & Serving

The `package.json` contains all necessary commands for building Festify.
- `build`<a name="build-festify"></a>: Compiles the TypeScript to JS and bundles all JS to a single file. You can then deploy the files in `/build` to a webserver of choice to run Festify.
- `fix`: Attempts to automatically fix linter errors.
- `lint`: Lints the TS sources with tslint.
- `prepare-env`: Used in CI environments to load environment files from branch-name-suffixed environment variables.
- `serve`: Starts the rollup dev-server serving a local instance of Festify on port 3000. Also supports live-reloading. Ensure you deploy the project to firebase before using the dev server because Festify depends on cloud functions to be present!

## Contributing

1. Fork it! :octocat:
1. Create your feature branch: `git checkout -b my-improvement`
1. Make your changes and test them!
1. Commit & push your changes
1. Submit a pull request :rocket:

## License

LGPLv3

## Sponsors

These people helped us bring Festify to life. Thank you!

<a href="https://browserstack.com/"><img title="BrowserStack" src="https://festify.rocks/img/sponsors/browserstack.svg" width="400"></a>
