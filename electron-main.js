const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('open-exe', async (_event, exePath) => {
  if (typeof exePath !== 'string' || exePath.trim() === '') {
    return { ok: false, error: 'Caminho inválido.' };
  }

  const result = await shell.openPath(exePath);
  if (result) {
    return { ok: false, error: result };
  }

  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
