import { FirebaseAuth } from '@firebase/auth-types';

import { firebase } from './firebase';

export async function requireAuth() {
    const auth = firebase.auth() as FirebaseAuth;

    if (auth.currentUser) {
        return auth.currentUser;
    }

    await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user ? user : auth.signInAnonymously());
        });
    });
}
