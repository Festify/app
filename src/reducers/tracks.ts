import { Actions, Types } from '../actions';
import { Track } from '../state';

export default function(
    state: Track[],
    action: Actions,
): Track[] {
    switch (action.type) {
        case Types.UPDATE_TRACKS:
            return action.payload;
        default:
            return state;
    }
}
