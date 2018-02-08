import firebase from 'firebase-admin';
import { isEmpty, isEqual, values } from 'lodash-es';

import { unsafeGetProviderAndId } from './utils';

const VOTE_FACTOR = 1e12;

function updateOrder(voteDelta, trackId, currentTrack, partyId, currentParty) {
    if (!partyId) {
        throw new Error("Invalid party ID!");
    }
    if (!currentParty || !currentParty.created_at) {
        throw new Error("Invalid party!");
    }

    /**
     * Order calculation is based on a formula, so we don't have to keep an
     * index for ordering tracks.
     *
     * Because a Firebase Query is always sorted in ascending order,
     * the first track should have the lowest value. The value of the
     * other tracks should therefore ascend after that, sorted by vote count,
     * then by the time of insertion.
     *
     * DISCLAIMER: The following is not mathematically proven, but we think
     * it should work.
     *
     * The currently playing track should always be the first track in the list,
     * which is why we assign it the lowest safe integer value possible.
     * The first part of the formula ensures sorting by time of insertion,
     * and because we want the vote count to always outweigh the time delta,
     * we multiply it by a very large factor (10^12 in this case) and subtract it.
     */

    return firebase.database()
        .ref('/tracks')
        .child(partyId)
        .child(trackId)
        .transaction(track => {
            const currentlyPlaying = isEqual(
                (currentTrack || {}).reference,
                (track || {}).reference,
            );

            const voteCount = (!track ? 0 : track.vote_count) + voteDelta;

            if (!track && voteCount > 0) {
                // Track does not exist, has just been voted for in via Add Tracks menu.
                // Add it to the queue.

                // If there is no current track, we are going to be the new first one.
                const order = isEmpty(currentTrack) ?
                    Number.MIN_SAFE_INTEGER + 1 :
                    (Date.now() - currentParty.created_at) - (voteCount * VOTE_FACTOR);
                const [provider, id] = unsafeGetProviderAndId(trackId);

                return {
                    added_at: firebase.database.ServerValue.TIMESTAMP,
                    is_fallback: false,
                    order,
                    reference: { id, provider },
                    vote_count: voteCount,
                };
            } else if (voteCount > 0 || currentlyPlaying || (!!track && track.is_fallback)) {
                // Track exists and has votes, is playing or is a fallback track.
                // Leave it in and update the ranking. This is the most probable case.

                const order = currentlyPlaying ?
                    Number.MIN_SAFE_INTEGER + 1 :
                    (track.added_at - currentParty.created_at) - (voteCount * VOTE_FACTOR);

                // Order hasn't changed. Undefined tells Firebase SDK that
                // we have nothing to change.
                // tslint:disable-next-line:triple-equals
                if (track.order == order) {
                    return undefined;
                }

                track.order = order;
                if (!currentlyPlaying) {
                    track.vote_count = voteCount;
                }
                return track;
            } else {
                // Track does not have votes and is not a fallback track, so remove it
                // by returning null.

                return null;
            }
        });
}

export default (event) => {
    if (!event.data.changed()) {
        return;
    }

    const voteDelta = !!event.data.val() ? 1 : -1;

    const party = firebase.database()
        .ref('/parties')
        .child(event.params.partyId)
        .once('value');
    const topmostTrack = firebase.database()
        .ref('/tracks')
        .child(event.params.partyId)
        .limitToFirst(1)
        .orderByChild('order')
        .once('value');

    return Promise.all([party, topmostTrack])
        .then(([partySnap, trackSnap]) => {
            const track = values(trackSnap.val())[0];
            return updateOrder(
                voteDelta,
                event.params.trackId,
                track,
                event.params.partyId,
                partySnap.val(),
            );
        })
        .then(() => true);
};
