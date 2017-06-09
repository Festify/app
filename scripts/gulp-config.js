module.exports = {
    electron: {
        appId: "rocks.festify.app",
        directories: {
            buildResources: "www/images"
        },
        win: {
            publish: ["github"]
        },
        mac: {
            publish: ["github"],
            category: "public.app-category.music"
        },
        dmg: {
            title: "Festify"
        },
        appx: {
            backgroundColor: "#1c1f24",
            displayName: "Festify",
            publisherDisplayName: "Festify Dev Team"
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
