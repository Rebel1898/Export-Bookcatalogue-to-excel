const { app, BrowserWindow, dialog, ipcMain,shell} = require('electron');
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


ipcMain.handle("open-ruleset", async () => {
    const filePath = path.join(__dirname, "config", "rules.json");
    console.log(filePath);
    if (!fs.existsSync(filePath)) {
        throw new Error("El archivo rules.json todavía no existe.");
    }
    const error = await shell.openPath(filePath);

    if (error) {
        throw new Error(error);
    }
    return true;
});
   
  
//load-open
const rulesPath = () => path.join(path.join(__dirname, "config", "rules.json"));
function readRules() {
  try {
    console.log(JSON.parse(fs.readFileSync(rulesPath(), 'utf8')));
    return JSON.parse(fs.readFileSync(rulesPath(), 'utf8'));
  } catch {
    return []; // el archivo no existe todavía o está vacío
  }
}

ipcMain.handle('load-rules', () => readRules());

ipcMain.handle('save-rule', (event, rule) => {
  const rules = readRules();
  rules.push(rule);
  fs.writeFileSync(rulesPath(), JSON.stringify(rules, null, 2), 'utf8');
  return rules;
});

let ruleSetWin = null;

ipcMain.handle('applyRule', () => {
    const rules = readRules();
    const ruleset = rules;

    if (!currentColumns.length) {
        throw new Error('Primero debes cargar un CSV');
    }

    const cols = currentColumns.slice();
    const newNames = {};
    const fields = ruleset.fields || [];

    console.log('Aplicando ruleset:', ruleset.ruleName);
    fields.forEach(f => {
        const pos = cols.indexOf(f.field);
        if (pos === -1) return;

        if (f.action === 'rename') {
            newNames[f.field] = f.newName;
            console.log('Renombrar:', f.field, '->', f.newName);
        }

        if (f.action === 'delete') {
            cols.splice(pos, 1);
            console.log('Eliminar:', f.field);
        }
    });

    return {
        columns: cols,
        newNames
    };
});

let currentColumns = [];

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
     currentColumns = headers;
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