import { Actions, Types } from "../actions/index";
import { PartyState } from "../state";

export default function(
    state: PartyState = null,
    action: Actions,
): PartyState {
    switch (action.type) {
        case Types.UPDATE_PARTY:
            return action.payload;
        case Types.CLEANUP_PARTY:
            return null;
        default:
            return state;
    }
}
