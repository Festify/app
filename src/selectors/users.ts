import { State } from '../state';
import firebase from '../util/firebase';
import { LOCALSTORAGE_KEY } from '../util/spotify-auth';

export const currentUsernameSelector = () => {
    const user = firebase.auth().currentUser;
    return user ? user.displayName || user.email || '' : null;
};

export const hasConnectedSpotifyAccountSelector = (s: State) =>
    Boolean(s.user.credentials.spotify.user || localStorage[LOCALSTORAGE_KEY]);
