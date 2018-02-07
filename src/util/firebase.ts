import firebase from '@firebase/app';
import '@firebase/auth';
import '@firebase/database';
import { DataSnapshot, Query, Reference } from '@firebase/database-types';
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
        const listener = (snap: DataSnapshot) => put(snap);
        ref.on('value', listener);

        return () => ref.off('value', listener);
    });
}
