const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  openExe: (exePath) => ipcRenderer.invoke('open-exe', exePath)
});
