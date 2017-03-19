const _ = require('lodash');
const firebase = require('firebase-admin');
const utils = require('./utils');

const VOTE_FACTOR = 1e12;

exports.updateOrder = function (voteDelta, trackId, currentTrack, partyId, currentParty) {
    if (!partyId) {
        throw "Invalid party ID!";
    }
    if (!currentParty || !currentParty.created_at) {
        throw "Invalid party!";
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
            const currentlyPlaying = _.isEqual(
                (currentTrack || {}).reference,
                (track || {}).reference
            );

            const voteCount = (!track ? 0 : track.vote_count) + voteDelta;

            if (!track && voteCount > 0) {
                // Track does not exist, has just been voted for in via Add Tracks menu.
                // Add it to the queue.

                // If there is no current track, we are going to be the new first one.
                const order = _.isEmpty(currentTrack) ?
                    Number.MIN_SAFE_INTEGER + 1 :
                    (Date.now() - currentParty.created_at) - (voteCount * VOTE_FACTOR);
                const [provider, id] = utils.unsafeGetProviderAndId(trackId);

                return {
                    added_at: firebase.database.ServerValue.TIMESTAMP,
                    is_fallback: false,
                    order: order,
                    reference: {
                        id: id,
                        provider: provider
                    },
                    vote_count: voteCount
                };
            } else if (voteCount > 0 || currentlyPlaying || (!!track && track.is_fallback)) {
                // Track exists and has votes, is playing or is a fallback track.
                // Leave it in and update the ranking. This is the most probable case.

                const order = currentlyPlaying ?
                    Number.MIN_SAFE_INTEGER + 1 :
                    (track.added_at - currentParty.created_at) - (voteCount * VOTE_FACTOR);

                // Order hasn't changed. Undefined tells Firebase SDK that
                // we have nothing to change.
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
};