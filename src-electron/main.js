import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import serve from 'electron-serve';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = app.isPackaged;
const loadURL = isProd
    ? serve({ directory: path.join(__dirname, '../build') })
    : () => win.loadURL('http://localhost:1420');


async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    await loadURL(win);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
