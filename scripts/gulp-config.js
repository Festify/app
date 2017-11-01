const yaml = require('js-yaml');
const fs = require('fs');

module.exports = {
    envFiles: [
        '.env',
        'google-services.json',
        'GoogleService-Info.plist'
    ],
    paths: {
        appDir: 'www',
        electronDir: 'electron/www',
        webDir: 'build'
    }
};
