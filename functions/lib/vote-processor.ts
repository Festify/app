import firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import { isEmpty, isEqual, values } from 'lodash';
import Cache from 'quick-lru';

import { unsafeGetProviderAndId } from './utils';

const VOTE_FACTOR = 1e12;

/**
 * LRU cache used to speed up party creation date lookups over multiple function invocations.
 *
 * The cache is bounded at 1000 items to avoid excessive memory usage and will automatically
 * drop the least-used items on overflow.
 *
 * Remark: This assumes the creation date of parties never change after initial setup.
 */
const partyCache = new Cache<string, number>({ maxSize: 1000 });

/**
 * Gets the creation date of the party with the given ID.
 *
 * Utilizes a LRU cache to speed up the process over multiple function invocations.
 *
 * @param partyId the ID of the party to get the creation date of.
 */
async function fetchPartyCreationDate(partyId: string): Promise<number> {
    const possiblyCached = partyCache.peek(partyId);
    if (possiblyCached !== undefined) {
        return possiblyCached;
    }

    const partySnap: firebase.database.DataSnapshot = await firebase.database()
        .ref('/parties')
        .child(partyId)
        .once('value');

    if (!partySnap.exists()) {
        throw new Error("Party not found!");
    }

    const party: { created_at: number } = partySnap.val();
    if (!party.created_at) {
        throw new Error("Invalid party creation date!");
    }

    partyCache.set(partyId, party.created_at);
    return party.created_at;
}

/**
 * Updates the queue order of a track after a vote was cast.
 *
 * @param voteDelta whether a vote was cast or uncast.
 * @param trackId the ID of the track on whom a vote was cast.
 * @param currentTrack the currently playing track.
 * @param partyId the ID of the party the track belongs to.
 * @param partyCreated the timestamp when the party was created.
 */
async function updateOrder(
    voteDelta: 1 | -1,
    trackId: string,
    currentTrack: { reference: any } | null,
    partyId: string,
    partyCreated: number,
) {
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

    await firebase.database()
        .ref('/tracks')
        .child(partyId)
        .child(trackId)
        .transaction(track => {
            const currentlyPlaying = isEqual(
                (currentTrack || { reference: undefined }).reference,
                (track || {}).reference,
            );

            const voteCount = (!track ? 0 : track.vote_count) + voteDelta;

            if (!track && voteCount < 0) {
                // This occurs when the track has been removed (thus the above code assigns
                // it a vote count of 0) and there are no votes for it anymore, which makes
                // the voteDelta negative. This occurs when the track has been removed.
                //
                // Keep it this way.

                return track;
            } else if (!track && voteCount > 0) {
                // Track does not exist, has just been voted for in via Add Tracks menu.
                // Add it to the queue.

                // If there is no current track, we are going to be the new first one.
                const order = isEmpty(currentTrack) ?
                    Number.MIN_SAFE_INTEGER + 1 :
                    (Date.now() - partyCreated) - (voteCount * VOTE_FACTOR);
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
                    (track.added_at - partyCreated) - (voteCount * VOTE_FACTOR);

                // Order hasn't changed. Tell Firebase SDK that we have nothing to change.
                // tslint:disable-next-line:triple-equals
                if (track.order == order) {
                    return track;
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

export const processVotes = functions.database.ref('/votes/{partyId}/{trackId}/{userId}')
    .onWrite(async (change, ctx) => {
        const { partyId, trackId, userId } = ctx!.params;

        if (!partyId) {
            throw new Error("Invalid party ID!");
        }

        const voteDelta = !!change.after.val() ? 1 : -1;
        const topmostTrack = firebase.database()
            .ref('/tracks')
            .child(partyId)
            .limitToFirst(1)
            .orderByChild('order')
            .once('value');

        const [partyCreated, trackSnap] = await Promise.all([
            fetchPartyCreationDate(partyId),
            topmostTrack,
        ]);
        const track = values(trackSnap.val())[0];
        try {
            await updateOrder(
                voteDelta,
                trackId,
                track,
                partyId,
                partyCreated,
            );
        } catch (err) {
            console.error(`An error occured while processing votes for /votes/${partyId}/${trackId}/${userId}.`);
            throw err;
        }
    });
