const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'book.png')
  });

  win.loadFile('index.html');
    win.maximize();
}

// CSV
ipcMain.handle('select-csv', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Csv-parse
ipcMain.handle('read-csv', async (event, filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  const headers = Object.keys(records[0] || {});
  return { columns: headers, rows: records };
});

// Exportar XLSX 
ipcMain.handle('export-xlsx', async (event, args) => {
  if (!args) {
    throw new Error("No se recibieron argumentos desde el renderer");
  }

  const { rows, columns, newNames, savePath } = args;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  const headerRow = columns.map(col => newNames[col] || col);
  sheet.addRow(headerRow);

  rows.forEach(row => {
    sheet.addRow(columns.map(col => row[col]));
  });

  await workbook.xlsx.writeFile(savePath);
  return true;
});

ipcMain.handle('save-xlsx', async () => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    properties: ['createDirectory']
  });
  if (result.canceled) return null;
  return result.filePath;
});

app.whenReady().then(createWindow);

