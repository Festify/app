import { Actions, Types } from '../actions';
import { UserState } from '../state';

export default function(
    state: UserState = {
        spotify: {
            statusKnown: false,
            user: null,
        },
        playlists: [],
    },
    action: Actions,
): UserState {
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
