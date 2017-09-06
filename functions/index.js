const firebase = require('firebase-admin');
const functions = require('firebase-functions');

firebase.initializeApp(functions.config().firebase);

exports.clientToken = functions.https.onRequest(require('./lib/spotify-auth').clientToken);

exports.exchangeCode = functions.https.onRequest(require('./lib/spotify-auth').exchangeCode);

exports.exchangeCodeProtocol = functions.https.onRequest(require('./lib/spotify-auth').exchangeCodeProtocol);

exports.processVotes = functions.database.ref('/votes/{partyId}/{trackId}/{userId}')
    .onWrite(require('./lib/vote-processor').handler);

exports.refreshToken = functions.https.onRequest(require('./lib/spotify-auth').refreshToken);
