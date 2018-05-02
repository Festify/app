import firebase from 'firebase-admin';
import 'firebase-functions'; // Import to initialize FIREBASE_CONFIG 🙄

const config = JSON.parse(process.env.FIREBASE_CONFIG!);
// tslint:disable-next-line:no-var-requires
const serviceAccount = require('./service-account.json');

firebase.initializeApp({
    ...config,
    credential: firebase.credential.cert(serviceAccount),
});

export * from './lib/spotify-auth';
export * from './lib/vote-processor';
