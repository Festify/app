import { Actions, Types } from '../actions';
import { UserState } from '../state';

export default function(
    state: UserState = {
        spotify: {
            authorizing: false,
            authorizationError: null,
            statusKnown: false,
            user: null,
        },
        playlists: [],
    },
    action: Actions,
): UserState {
    switch (action.type) {
        case Types.EXCHANGE_CODE_Fail:
            return {
                ...state,
                spotify: {
                    ...state.spotify,
                    authorizing: false,
                    authorizationError: action.payload,
                },
            };
        case Types.EXCHANGE_CODE_Finish:
            return {
                ...state,
                spotify: {
                    ...state.spotify,
                    authorizing: false,
                    authorizationError: null,
                },
            };
            case Types.EXCHANGE_CODE_Start:
                return {
                    ...state,
                    spotify: {
                        ...state.spotify,
                        authorizing: true,
                        authorizationError: null,
                    },
                };
        case Types.UPDATE_USER_PLAYLISTS:
            return {
                ...state,
                playlists: action.payload,
            };
        case Types.NOTIFY_AUTH_STATUS_KNOWN:
            const [provider, user] = action.payload;
            return {
                ...state,
                [provider]: {
                    ...(state[provider]),
                    user,
                    statusKnown: true,
                },
            };
        default:
            return state;
    }
}
