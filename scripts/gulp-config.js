module.exports = {
    electron: {
        appId: 'rocks.festify.app',
        win: {
            publish: ['github'],
            icon: 'www/images/icon.ico'
        },
        mac: {
            publish: ['github'],
            icon: 'www/images/icon.icns',
            category: 'public.app-category.music'
        },
        dmg: {
            title: 'Festify',
            background: 'www/images/background.png'
        },
        appx: {
            backgroundColor: '#1c1f24',
            displayName: 'Festify',
            publisherDisplayName: 'Festify Dev Team'
        }
    },
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
