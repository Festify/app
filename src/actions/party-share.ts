import { ThunkAction } from 'redux-thunk';

import { partyIdSelector } from '../selectors/party';
import { State } from '../state';

export function shareParty(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const shareFn = (navigator as any).share;
        if (typeof shareFn !== 'function') {
            throw new Error("Browser does not support Web Share API");
        }

        const state = getState();
        if (!state.party.currentParty) {
            throw new Error("Missing party");
        }
        const partyId = partyIdSelector(state);
        if (!partyId) {
            throw new Error("Missing current party ID");
        }

        const { name } = state.party.currentParty;
        await shareFn({
            text: `Join ${name} and rule the music!`,
            title: name,
            url: `${document.location.origin}/party/${partyId}`,
        });
    };
}
