const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectCSV: () => ipcRenderer.invoke('select-csv'),
  readCSV: (path) => ipcRenderer.invoke('read-csv', path),
  exportXLSX: (data) => ipcRenderer.invoke('export-xlsx', data),
  saveXLSX: () => ipcRenderer.invoke('save-xlsx')
});
