import firebase from '../util/firebase';

export const currentUsernameSelector = () => {
    const user = firebase.auth!().currentUser;
    return user
        ? user.displayName || user.email || ''
        : null;
};
