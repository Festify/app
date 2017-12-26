import firebase from '@firebase/app';
import '@firebase/auth';
import '@firebase/database';

import firebaseConfig from '../../firebase.config.js';

const app = firebase.initializeApp(firebaseConfig)!;
export default app;

export {
    app as firebase,
    firebase as firebaseNS,
};
