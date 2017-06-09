const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const startSpotify = require('start-spotify');
const {autoUpdater} = require('electron-updater');

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1024,
        height: 900,
        backgroundColor: '#1c1f24',
        title: 'Festify'
    });

    startSpotify()
        .then(() => win.loadURL(url.format({
            pathname: path.join(__dirname, 'www', 'app.html'),
            protocol: 'file:',
            slashes: true
        })))
        .catch(() => win.loadURL(url.format({
            pathname: path.join(__dirname, 'www', 'spotify-missing.html'),
            protocol: 'file:',
            slashes: true
        })));

    win.on('closed', () => win = null);
}

app.on('ready', () => {
    createWindow();
    autoUpdater.checkForUpdates();
});

autoUpdater.on('update-downloaded', (ev, info) => {
    if(confirm("An update for Festify Beta is available. Would you like to install it now?")) {
        autoUpdater.quitAndInstall();
    }
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
});
