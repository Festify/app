<a href="https://festify.rocks/"><img title="Festify Logo" height="150" src="https://festify.rocks/img/festify-logo.svg"></a>

# Festify mobile web app

Festify is a free Spotify-powered app that lets your guests choose which music should be played using their smartphones.

[![Greenkeeper badge](https://badges.greenkeeper.io/Festify/app.svg)](https://greenkeeper.io/)

### Project status

_The state of the project is considered_ **alpha** _right now. Please refer to the [roadmap](#roadmap) for details._

## Getting started

In order to get the app running on your machine/device please follow these steps.

### Services

The app relies on the following external services. You need to obtain API credentials for these for the app to function at all.

- [Firebase](https://firebase.google.com/) (for state synchronization / database) - [allow anonymous access](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Spotify API](https://developer.spotify.com/my-applications/)

#### Spotify OAuth Code Grant Flow

In order to succesfully authenticate with Spotify you need some HTTP endpoints that know your Spotify API Secret and are used for giving users long-lived access tokens.

We recommend the usage of cloud functions for this purpose. See the [functions folder](https://github.com/Festify/app/tree/develop/functions) or the [instructions in our Spotify Plugin](https://github.com/Festify/cordova-spotify#oauth-code-grant-flow) for details.

#### Environment

Use this template to have all the environment variables handy for building the app and put it in a file called `.env-default`, it will be loaded automatically.

```bash
DOMAIN="<DOMAIN_FESTIFY_IS_HOSTED_ON>"
FIREBASE_API_KEY="<YOUR_FIREBASE_API_KEY>"
FIREBASE_AUTH_DOMAIN="<YOUR_DOMAIN>.firebaseapp.com"
FIREBASE_DB_URL="https://<YOUR_DOMAIN>.firebaseio.com"
SPOTIFY_CLIENT_ID="<YOUR_SPOTIFY_CLIENT_ID>"
SPOTIFY_TOKEN_SWAP_URL="<YOUR_TOKEN_SWAP_URL>"
SPOTIFY_TOKEN_REFRESH_URL="<YOUR_TOKEN_REFRESH_URL>"
```

You will also need two files from Firebase for correctly building Festify. For iOS, you will need your `GoogleService-Info.plist` and for Android builds you need the `google-services.json` file. You can obtain them from the Firebase Dev Console.

If you want to support multiple build environments, you can make Gulp download the environment-specific files `.env`, `google-services.json` and `GoogleService-Info.plist`. The link is given as environment variable `FILE_URL_TEMPLATE`. The value must be a `util.format` compatible format string that, when formatted with the current branch name and the file to download, makes a valid link to the given file. E.g.: `https://example.com/config/%s/%s`. During the build, Gulp will download these files and place them where they're needed. It will also run `dotenv`, so that when the `.env`-file is downloaded, the process environment will be updated.

### Prerequisites

Install the following tools to build and run the project:

- [NodeJS](https://nodejs.org/)
- [Bower](https://bower.io/) - `npm i -g bower`
- [Gulp](http://gulpjs.com/) - `npm i -g gulp`
- [Cordova](https://cordova.apache.org/#getstarted) - `npm i -g cordova` (only for mobile builds)
- [XCode](https://developer.apple.com/xcode/) (for iOS builds)
- [Android Studio](https://developer.android.com/studio/install.html) (for Android builds)
- [Firebase Tools](https://github.com/firebase/firebase-tools) - `npm i -g firebase-tools`

### Build

#### Dependency injection

```bash
npm install
bower install
cordova prepare # if you want to build for native

cd ./functions && npm install && firebase deploy --only functions # Cloud functions for order calculation
```

#### Web App only

*You can also just build the guest frontend, which runs in a browser, but can't play music*

- Development server: `gulp serve`
- Production build: `gulp build`

#### iOS

```bash
gulp build-cordova
cordova build ios
cordova run ios
```

#### Android

```bash
gulp build-cordova
cordova build android
cordova run android
```

## Roadmap

- [X] Closed beta (fill [this form](https://docs.google.com/forms/d/e/1FAIpQLSdjYIMfbVAQ1ZwbpXoiedgA0rnu5FpLocO3moZIkSzhI8fNKQ/viewform) to participate)
- [X] Stable MVP
  - Spotify only
  - basic features
- [ ] More releases, more features
  - Probably also more playback providers

## Contributing

1. Fork it! :octocat:
1. Create your feature branch: `git checkout -b my-improvement`
1. Make your changes and test them!
1. Commit & push your changes
1. Submit a pull request :rocket:

## License

This project is licensed under the LGPLv3 - see the [LICENSE file](https://github.com/Festify/app/blob/develop/LICENSE.md) for details.

## Sponsors

These people helped us bring Festify to life. Thank you!

<a href="https://duplexmedia.com/"><img title="Duplexmedia" src="https://www.duplexmedia.com/uploads/images/logo.svg" width="400"></a>

<a href="https://browserstack.com/"><img title="BrowserStack" src="https://festify.rocks/img/sponsors/browserstack.svg" width="400"></a>

