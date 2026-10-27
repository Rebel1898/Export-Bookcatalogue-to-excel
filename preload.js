const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectCSV: () => ipcRenderer.invoke('select-csv'),
  readCSV: (path) => ipcRenderer.invoke('read-csv', path),
  exportXLSX: (data) => ipcRenderer.invoke('export-xlsx', data),
  saveXLSX: () => ipcRenderer.invoke('save-xlsx'),
  openRuleSet: () => ipcRenderer.invoke('open-ruleset'),
   openRuleSet: () => ipcRenderer.invoke('open-ruleset'),
  loadRules: () => ipcRenderer.invoke('load-rules'),
  saveRule: (rule) => ipcRenderer.invoke('save-rule', rule),
  applyRule: () => ipcRenderer.invoke('applyRule')
});
