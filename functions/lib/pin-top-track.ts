import firebase from 'firebase-admin';
import { database, Event } from 'firebase-functions';

export default async (event: Event<database.DeltaSnapshot>) => {
    if (!event.data.changed()) {
        return;
    }

    const partyId: string = event.params && event.params.partyId;
    if (!partyId) {
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
};
