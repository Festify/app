const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const startSpotify = require('start-spotify');
const {autoUpdater} = require('electron-updater');
const {ipcMain} = require('electron');

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1024,
        height: 900,
        backgroundColor: '#1c1f24',
        show: true,
        title: 'Festify',
        webPreferences: {
            nativeWindowOpen: false
        }
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'www', 'app.html'),
        protocol: 'file:',
        slashes: true
    }));
    startSpotify()
        .catch(() => win.loadURL(url.format({
            pathname: path.join(__dirname, 'www', 'spotify-missing.html'),
            protocol: 'file:',
            slashes: true
        })));

    win.once('ready-to-show', () => win.focus());
    win.on('closed', () => win = null);
}

app.on('ready', () => {
    createWindow();
    autoUpdater.checkForUpdates();
});

autoUpdater.on('update-downloaded', (ev, info) => {
    win.webContents.send('update-available');
});

ipcMain.on('install-update', (event, arg) => {
    autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
});
