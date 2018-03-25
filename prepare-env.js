/*
 * Write out the branch-specific configuration files to the file system.
 */

const FILE_PATH_MAP = {
    'COMMON_CONFIG': 'common.config.js',
    'FIREBASE_CONFIG': 'firebase.config.js',
    'FIREBASE_SERVICE_ACCOUNT': 'functions/service-account.json',
    'SPOTIFY_CONFIG': 'spotify.config.js',
    'SPOTIFY_FUNCTIONS_CONFIG': 'functions/spotify.config.ts',
};

const fs = require('fs');

let branch = process.env.TRAVIS_BRANCH || process.env.BRANCH;

// If we're not in CI we expect the developer to install the
// required files manually.
if (!branch) {
    return;
}

if (branch !== 'master' && branch !== 'develop') {
    branch = 'develop';
}

const branchSuffix = `_${branch.toUpperCase()}`;
Object.keys(process.env)
    .filter(envName => envName.endsWith(branchSuffix))
    .forEach(envName => process.env[envName.substr(0, envName.length - branchSuffix.length)] = process.env[envName]);

Object.keys(FILE_PATH_MAP).forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
        throw new Error(`Missing environment variable ${envVar}`);
    }

    fs.writeFileSync(FILE_PATH_MAP[envVar], value);
});
