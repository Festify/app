const firebase = require('firebase-admin');
const functions = require('firebase-functions');
const raven = require('raven');

firebase.initializeApp(functions.config().firebase);
raven.config(functions.config().sentry.url).install();

exports.processVotes = functions.database.ref('/votes/{partyId}/{trackId}/{userId}')
    .onWrite(require('./lib/vote-processor').handler);
