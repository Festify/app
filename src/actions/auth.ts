import { AuthCredential, OAuthCredential, User } from '@firebase/auth-types';

import { EnabledProvidersList, UserCredentials } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS, functions } from '../util/firebase';
import { requireAccessToken } from '../util/spotify-auth';

import { showToast } from '.';

export type Actions =
    | ReturnType<typeof checkLoginStatus>
    | ReturnType<typeof exchangeCodeFail>
    | ReturnType<typeof exchangeCodeStart>
    | ReturnType<typeof logout>
    | ReturnType<typeof notifyAuthStatusKnown>
    | ReturnType<typeof requireFollowUpLogin>
    | ReturnType<typeof triggerOAuthLogin>;

export type OAuthLoginProviders = Exclude<keyof UserCredentials, 'firebase'>;

export interface ProviderObject<T> {
    data: T;
    provider: keyof UserCredentials;
}

export const CHECK_LOGIN_STATUS = 'CHECK_LOGIN_STATUS';
export const EXCHANGE_CODE = 'EXCHANGE_CODE';
export const EXCHANGE_CODE_FAIL = 'EXCHANGE_CODE_FAIL';
export const LOGOUT = 'LOGOUT';
export const NOTIFY_AUTH_STATUS_KNOWN = 'NOTIFY_AUTH_STATUS_KNOWN';
export const REQUIRE_FOLLOW_UP_LOGIN = 'REQUIRE_FOLLOW_UP_LOGIN';
export const TRIGGER_OAUTH_LOGIN = 'TRIGGER_OAUTH_LOGIN';

export const checkLoginStatus = () => ({ type: CHECK_LOGIN_STATUS as typeof CHECK_LOGIN_STATUS });

export const exchangeCodeStart = (prov: keyof UserCredentials) => ({
    type: EXCHANGE_CODE as typeof EXCHANGE_CODE,
    payload: prov,
});

export const exchangeCodeFail = (provider: keyof UserCredentials, err: Error) => ({
    type: EXCHANGE_CODE_FAIL as typeof EXCHANGE_CODE_FAIL,
    error: true,
    payload: { provider, data: err },
});

export const logout = () => ({ type: LOGOUT as typeof LOGOUT });

export const notifyAuthStatusKnown = (
    provider: keyof UserCredentials,
    user: User | SpotifyApi.UserObjectPrivate | null,
) => ({
    type: NOTIFY_AUTH_STATUS_KNOWN as typeof NOTIFY_AUTH_STATUS_KNOWN,
    payload: { provider, data: user },
});

export const requireFollowUpLogin = (withProviders: EnabledProvidersList) => ({
    type: REQUIRE_FOLLOW_UP_LOGIN as typeof REQUIRE_FOLLOW_UP_LOGIN,
    payload: withProviders,
});

export const triggerOAuthLogin = (provider: OAuthLoginProviders) => ({
    type: TRIGGER_OAUTH_LOGIN as typeof TRIGGER_OAUTH_LOGIN,
    payload: provider,
});

export const welcomeUser = (user: User) =>
    showToast(user.displayName ? `Welcome, ${user.displayName}!` : 'Welcome!');

/* Utils */

const FOLLOWUP_LS_KEY = 'FollowUpCredential';

export async function getFollowUpLoginProviders(email: string): Promise<EnabledProvidersList> {
    const [providers, isSpotify] = await Promise.all([
        firebase.auth().fetchProvidersForEmail(email),
        functions.isSpotifyUser({ email }),
    ]);
    const strippedProviders = providers.map(provId => provId.replace('.com', ''));
    const enabledProviders = EnabledProvidersList.enable(
        strippedProviders as OAuthLoginProviders[],
    );

    return {
        ...enabledProviders,
        spotify: isSpotify.data,
    };
}

export function hasFollowUpCredentials(): boolean {
    return !!localStorage[FOLLOWUP_LS_KEY];
}

export async function linkFollowUpUser() {
    if (!localStorage[FOLLOWUP_LS_KEY]) {
        return;
    }

    const { accessToken, idToken, providerId, secret, spotify } = JSON.parse(
        localStorage[FOLLOWUP_LS_KEY],
    );
    removeSavedFollowUpLoginCredentials();

    if (spotify) {
        const accessToken = await requireAccessToken();
        await functions.linkSpotifyAccounts({ accessToken });
    } else {
        let credential: AuthCredential;
        switch (providerId) {
            case 'facebook.com':
                credential = firebaseNS.auth!.FacebookAuthProvider.credential(accessToken);
                break;
            case 'github.com':
                credential = firebaseNS.auth!.GithubAuthProvider.credential(accessToken);
                break;
            case 'google.com':
                credential = firebaseNS.auth!.GoogleAuthProvider.credential(idToken, accessToken);
                break;
            case 'twitter.com':
                credential = firebaseNS.auth!.TwitterAuthProvider.credential(accessToken, secret);
                break;
            default:
                throw new Error('Unknown provider');
        }

        const user = await requireAuth();
        await user.linkAndRetrieveDataWithCredential(credential);
    }
}

export function removeSavedFollowUpLoginCredentials() {
    localStorage.removeItem(FOLLOWUP_LS_KEY);
}

export function saveFollowUpLoginCredentials(cred: OAuthCredential | { spotify: true }) {
    localStorage[FOLLOWUP_LS_KEY] = JSON.stringify(cred);
}
