const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        title: "UploadSql"
    });

    mainWindow.maximize();

    // Decide if we are in dev mode or production
    const isDev = !app.isPackaged;

    if (isDev) {
        // In development, load the Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built React app
        mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startBackend() {
    try {
        process.env.PORT = '3001';
        // AppImage environments sometimes strip custom PATHs where Docker lives
        process.env.PATH = process.env.PATH + ':/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin';

        require('./backend/server.js');
        console.log('Backend loaded successfully natively inside Electron.');
    } catch (err) {
        console.error('Failed to start backend process.', err);
    }
}

app.on('ready', () => {
    startBackend();
    setTimeout(createWindow, 500); // 500ms is enough for native require
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    // Backend will close automatically when the main process exits
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
