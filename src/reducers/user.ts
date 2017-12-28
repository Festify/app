import { Actions, Types } from '../actions';
import { AuthState } from '../state';

export default function(
    state: AuthState = {
        spotify: {
            statusKnown: false,
            user: null,
        },
    },
    action: Actions,
): AuthState {
    switch (action.type) {
        case Types.NOTIFY_AUTH_STATUS_KNOWN:
            const [provider, user] = action.payload;
            return {
                ...state,
                [provider]: {
                    user,
                    statusKnown: true,
                },
            };
        default:
            return state;
    }
}
