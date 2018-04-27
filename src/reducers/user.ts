import { Actions, Types } from '../actions';
import { AuthProviderStatus, UserCredentials, UserState } from '../state';

const defaultUser = <T>(): AuthProviderStatus<T> => ({
    authorizing: false,
    authorizationError: null,
    statusKnown: false,
    user: null,
});

export default function(
    state: UserState = {
        credentials: {
            facebook: defaultUser(),
            firebase: defaultUser(),
            github: defaultUser(),
            google: defaultUser(),
            spotify: defaultUser(),
            twitter: defaultUser(),
        },
        playlists: [],
    },
    action: Actions,
): UserState {
    function reduceAuthProvider<T>(
        prov: keyof UserCredentials,
        data: Partial<AuthProviderStatus<T>>,
    ): UserState {
        return {
            ...state,
            credentials: {
                ...state.credentials,
                [prov]: {
                    ...(state.credentials[prov]),
                    ...data,
                },
            },
        };
    }

    switch (action.type) {
        case Types.EXCHANGE_CODE_Fail:
            return reduceAuthProvider(action.payload.provider, {
                authorizing: false,
                authorizationError: action.payload.data,
                statusKnown: true,
            });
        case Types.EXCHANGE_CODE_Start:
            return reduceAuthProvider(action.payload, {
                authorizing: true,
                authorizationError: null,
                statusKnown: false,
            });
        case Types.NOTIFY_AUTH_STATUS_KNOWN:
            return reduceAuthProvider(action.payload.provider, {
                authorizing: false,
                authorizationError: null,
                statusKnown: true,
                user: action.payload.data,
            });
        case Types.UPDATE_USER_PLAYLISTS:
            return {
                ...state,
                playlists: action.payload,
            };
        default:
            return state;
    }
}
