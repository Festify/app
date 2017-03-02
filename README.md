# Festify mobile web app

Festify is a free Spotify-powered app that lets your guests choose which music should be played using their smartphones.

[![Greenkeeper badge](https://badges.greenkeeper.io/Festify/app.svg)](https://greenkeeper.io/)

### Project status

*The state of the project is considered **alpha** right now. Please refer to the [roadmap](#roadmap) for details.*

## Getting started

In order to get the app running on your machine/device please follow these steps.

### Services

The app relies on the following external services. You need to obtain API credentials for these for the app to function at all.

- Firebase (for state synchronization / database)
- Spotify API

#### Spotify OAuth Code Grant Flow

In order to succesfully authenticate with Spotify you need some HTTP endpoints that know your Spotify API Secret and are used for giving users long-lived access tokens.

We recommend the usage of AWS Lambda functions for this purpose. See the [instructions in our Spotify Plugin](https://github.com/Festify/cordova-spotify#oauth-code-grant-flow) for details.

#### `.env`

Use this template to have all the environment variables handy for building the app and put it in a file called `.env`, it will be loaded automatically.

```bash
FIREBASE_API_KEY="<YOUR_FIREBASE_API_KEY>"
FIREBASE_AUTH_DOMAIN="<YOUR_DOMAIN>.firebaseapp.com"
FIREBASE_DB_URL="https://<YOUR_DOMAIN>.firebaseio.com"
SPOTIFY_CLIENT_ID="<YOUR_SPOTIFY_CLIENT_ID>"
SPOTIFY_TOKEN_SWAP_URL="<YOUR_TOKEN_SWAP_URL>"
SPOTIFY_TOKEN_REFRESH_URL="<YOUR_TOKEN_REFRESH_URL>"
```

### Prerequisites

Install the following tools to build and run the project:

- [NodeJS](https://nodejs.org/)
- [Bower](https://bower.io/) - `npm i -g bower`
- [Gulp](http://gulpjs.com/) - `npm i -g gulp`
- [Cordova](https://cordova.apache.org/#getstarted) - `npm i -g cordova` (only for mobile builds)
- [XCode](https://developer.apple.com/xcode/) (for iOS builds)
- [Android Studio](https://developer.android.com/studio/install.html) (for Android builds)

### Build

#### Dependency injection
>>>>>>> develop

```bash
npm install
bower install
cordova prepare # if you want to build for native
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

- Closed beta (fill [this form](https://docs.google.com/forms/d/e/1FAIpQLSdjYIMfbVAQ1ZwbpXoiedgA0rnu5FpLocO3moZIkSzhI8fNKQ/viewform) to participate)
- Public beta
- Stable MVP
  - Spotify only
  - basic features
- More releases, more features
  - Probably also more playback providers

## Contributing

1. Fork it! :octocat:
1. Create your feature branch: `git checkout -b my-improvement`
1. Make your changes and test them!
1. Commit & push your changes
1. Submit a pull request :rocket:

## License

This project is licensed under the LGPLv3 - see the [LICENSE file](https://github.com/Festify/app/blob/develop/LICENSE.md) for details

## Sponsors

These people helped us bring Festify to life. Thank you!

[![Duplexmedia](/.github/sponsors/duplexmedia.png)](https://duplexmedia.com/)
[![BrowserStack](/.github/sponsors/browserstack.png)](https://www.browserstack.com)
