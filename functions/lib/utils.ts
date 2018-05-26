import { createCipher, createDecipher } from 'crypto';
import { URL } from 'url';

const algo = 'aes-256-cbc';

export const crypto = {
    encrypt(text, key) {
        const cipher = createCipher(algo, key);
        return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    },

    decrypt(text, key) {
        const decipher = createDecipher(algo, key);
        return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
    },
};

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Escapes a string so that it can be used as a Firebase key.
 *
 * @param k the string to escape
 * @returns the key ready to be used with Firebase
 */
export const escapeKey = (k: string) => encodeURIComponent(k).replace(/\./g, '%2E'); // 2E is char code of .

export const unsafeGetProviderAndId = (trackId: string): [string, string] => {
    const separatorIndex = trackId.indexOf('-');
    return [
        trackId.substring(0, separatorIndex),
        trackId.substring(separatorIndex + 1),
    ];
};
