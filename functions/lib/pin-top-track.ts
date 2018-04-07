import firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Change, EventContext } from 'firebase-functions';

export const pinTopTrack = functions.database.ref('/tracks/{partyId}/{trackId}/order')
    .onWrite(async (change, ctx) => {
        const { partyId } = ctx!.params;
        if (!partyId || !(typeof partyId === 'string')) {
            throw new Error("Missing party ID");
        }

        const topTrack: firebase.database.DataSnapshot = await firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .orderByChild('order')
            .limitToFirst(1)
            .once('value');

        if (!topTrack.exists()) {
            return;
        }

        const keys = Object.keys(topTrack.val());
        if (keys.length === 0) {
            return;
        }

        await firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .child(keys[0])
            .child('order')
            .set(Number.MIN_SAFE_INTEGER);
    });
