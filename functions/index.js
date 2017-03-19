const _ = require('lodash');
const firebase = require('firebase-admin');
const functions = require('firebase-functions');

const processor = require('./lib/vote-processor');

firebase.initializeApp(functions.config().firebase);

exports.processVotes = functions.database.ref('/votes/{partyId}/{trackId}/{userId}')
    .onWrite(event => {
        if(!event.data.changed()) {
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
                const track = _.values(trackSnap.val())[0];
                return processor.updateOrder(
                    voteDelta,
                    event.params.trackId,
                    track,
                    event.params.partyId,
                    partySnap.val()
                );
            });
    });