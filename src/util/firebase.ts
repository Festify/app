import { DataSnapshot, Query } from '@firebase/database-types';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import { eventChannel } from 'redux-saga';

import firebaseConfig from '../../firebase.config.js';

const app = firebase.initializeApp(firebaseConfig);
export default app;

export { firebase as firebaseNS };

export const functions = {
    clientToken: app.functions().httpsCallable('getClientToken'),
    exchangeCode: app.functions().httpsCallable('exchangeCode'),
    isSpotifyUser: app.functions().httpsCallable('isSpotifyUser'),
    linkSpotifyAccounts: app.functions().httpsCallable('linkSpotifyAccounts'),
    refreshToken: app.functions().httpsCallable('refreshToken'),
};

export function valuesChannel(ref: Query) {
    return eventChannel<DataSnapshot>(put => {
        ref.on('value', put as (snap: DataSnapshot) => void);
        return () => ref.off('value', put);
    });
}
