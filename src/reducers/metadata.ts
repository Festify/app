import merge from 'lodash-es/merge';

import { Actions } from '../actions';
import { UPDATE_METADATA } from '../actions/metadata';
import { Metadata } from '../state';

export default function(
    state: Record<string, Metadata> = {},
    action: Actions,
): Record<string, Metadata> {
    switch (action.type) {
        case UPDATE_METADATA:
            return merge({}, state, action.payload);
        default:
            return state;
    }
}
