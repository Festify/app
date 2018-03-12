import merge from 'lodash-es/merge';

import { Actions, Types } from '../actions';
import { Metadata } from '../state';

export default function(
    state: Record<string, Metadata> = {},
    action: Actions,
): Record<string, Metadata> {
    switch (action.type) {
        case Types.UPDATE_METADATA:
            return merge({}, state, action.payload);
        default:
            return state;
    }
}
