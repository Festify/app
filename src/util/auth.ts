import { FirebaseAuth, User } from '@firebase/auth-types';

import { firebase } from './firebase';

export interface AuthData {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
}

export async function requireAuth(): Promise<User> {
    const auth = firebase.auth!() as FirebaseAuth;

    if (auth.currentUser) {
        return auth.currentUser;
    }

    return await new Promise<User>(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user ? user : auth.signInAnonymously());
        });
    });
}
