'use strict';

const algo = 'aes-256-cbc';
const crypto = require('crypto');

exports.crypto = {
    encrypt(text, key) {
        const cipher = crypto.createCipher(algo, key);
        return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    },

    decrypt(text, key) {
        const decipher = crypto.createDecipher(algo, key);
        return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
    }
};

exports.unsafeGetProviderAndId = function (trackId) {
    const separatorIndex = trackId.indexOf('-');
    return [
        trackId.substring(0, separatorIndex),
        trackId.substring(separatorIndex + 1)
    ];
};
