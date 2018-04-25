import firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Change, EventContext } from 'firebase-functions';
import { values } from 'lodash';

/**
 * Finds the top track within a database snapshot of a parties tracks.
 *
 * @param snap the snapshot containing all party tracks
 */
function findTopTrack(snap: firebase.database.DataSnapshot): firebase.database.DataSnapshot | null {
    let result: firebase.database.DataSnapshot | null = null;
    snap.forEach(s => {
        if (!result || s.child('order').val() < result.child('order').val()) {
            result = s;
        }
        return false;
    });
    return result;
}

function tracksEqual(
    a: firebase.database.DataSnapshot | null | undefined,
    b: firebase.database.DataSnapshot | null | undefined,
): boolean {
    // tslint:disable-next-line:triple-equals
    if (a == b) {
        return true;
    } else if (!a || !b) {
        return false;
    }

    const aVal = a.val();
    const bVal = b.val();
    // tslint:disable-next-line:triple-equals
    if (aVal.reference == bVal.reference) {
        return true;
    } else if (!aVal.reference || !bVal.reference) {
        return false;
    } else {
        return aVal.reference.provider === bVal.reference.provider &&
            aVal.reference.id === bVal.reference.id;
    }
}

export const pinTopTrack = functions.database.ref('/tracks/{partyId}')
    .onWrite(async (change, ctx) => {
        const { partyId } = ctx!.params;
        if (!partyId || !(typeof partyId === 'string')) {
            throw new Error("Missing party ID");
        }

        // Dirty check and do nothing, if top tracks haven't changed
        const oldTopTrack = change.before && findTopTrack(change.before);
        const newTopTrack = change.after && findTopTrack(change.after);

        // tslint:disable-next-line:triple-equals
        if (tracksEqual(oldTopTrack, newTopTrack) || !newTopTrack) {
            return;
        }

        await firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .child(newTopTrack.key!)
            .child('order')
            .transaction(() => Number.MIN_SAFE_INTEGER + 1);
    });
