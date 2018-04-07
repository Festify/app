import firebase from 'firebase-admin';

// tslint:disable-next-line:no-var-requires
const serviceAccount = require('./service-account.json');

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
});

export * from './lib/pin-top-track';
export * from './lib/spotify-auth';
export * from './lib/vote-processor';
