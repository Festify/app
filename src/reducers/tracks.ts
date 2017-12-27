import { Actions, Types } from '../actions';
import { TracksState } from '../state';

export default function(
    state: TracksState = null,
    action: Actions,
): TracksState {
    switch (action.type) {
        case Types.CLEANUP_PARTY:
            return null;
        case Types.UPDATE_TRACKS:
            return action.payload;
        default:
            return state;
    }
}
