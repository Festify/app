import firebase from '@firebase/app';
import '@firebase/auth';
import '@firebase/database';
import { DataSnapshot, Query } from '@firebase/database-types';
import { eventChannel } from 'redux-saga';

import firebaseConfig from '../../firebase.config.js';

const app = firebase.initializeApp(firebaseConfig)!;
export default app;

export {
    app as firebase,
    firebase as firebaseNS,
};

export function valuesChannel(ref: Query) {
    return eventChannel<DataSnapshot>(put => {
        ref.on('value', put as (snap: DataSnapshot) => void);
        return () => ref.off('value', put);
    });
}
