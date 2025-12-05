document.addEventListener("DOMContentLoaded", () => {

    const widthColumn = "150";
    const btnSelect = document.getElementById('btnSelect');
    const btnExport = document.getElementById('btnExport');


    const renameModal = document.getElementById("renameModal");
    const renameInput = document.getElementById("renameInput");
    const renameSave = document.getElementById("renameSave");
    const renameCancel = document.getElementById("renameCancel");

    let table = null;
    let originalRows = [];
    let columnToRename = null;


    const undoStack = [];


    function snapshotColumns() {
        if (!table) return [];
        return table.getColumns().map(c => ({
            field: c.getField(),
            title: c.getDefinition().title,
            headerSort: true
        }));
    }


    function pushUndoSnapshot() {
        undoStack.push({
            type: "snapshot",
            columns: snapshotColumns()
        });
    }


    function pushUndoColumnOrder() {
        undoStack.push({
            type: "move",
            order: table.getColumns().map(c => c.getField())
        });
    }


    function undo() {
        if (!table || undoStack.length === 0) return;

        const action = undoStack.pop();

        switch (action.type) {
            case "snapshot":
                const defs = action.columns.map(col => ({
                    field: col.field,
                    title: col.title,
                    headerSort: true,
                    width: widthColumn,
                    headerMenu: [
                        {
                            label: "Renombrar columna",
                            action: (e, column) => {
                                columnToRename = column;
                                renameInput.value = column.getDefinition().title;
                                renameModal.style.display = "flex";
                                renameInput.focus();
                            }
                        },
                        {
                            label: "Eliminar columna",
                            action: (e, column) => {
                                pushUndoSnapshot();
                                column.delete();
                                table.redraw(true);
                            }
                        }
                    ]
                }));

                const tableData = table.getData();
                table.setColumns(defs);
                table.replaceData(tableData);
                table.redraw(true);
                break;

            case "move":
                const targetOrder = action.order;
                targetOrder.forEach((field, idx) => {
                    const col = table.getColumn(field);
                    if (col) table.moveColumn(col, idx);
                });
                table.redraw(true);
                break;
        }
    }


    document.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key.toLowerCase() === "z") {
            e.preventDefault();
            undo();
        }
    });


    function closeRenameModal() {
        renameModal.style.display = "none";
        columnToRename = null;
    }

    renameSave.addEventListener("click", () => {
        if (!columnToRename) return closeRenameModal();
        const newName = renameInput.value.trim();
        if (!newName) return closeRenameModal();

        pushUndoSnapshot(); 

        columnToRename.updateDefinition({ title: newName });
        table.redraw(true);
        closeRenameModal();
    });

    renameCancel.addEventListener("click", closeRenameModal);


    btnSelect.addEventListener('click', async () => {
        const filePath = await window.api.selectCSV();
        if (!filePath) return;

        const data = await window.api.readCSV(filePath);
        originalRows = data.rows;

        undoStack.length = 0;

        const columns = data.columns.map(col => ({
            field: col,
            title: col,
            width: widthColumn,
            headerSort: true,
            headerMenu: [
                {
                    label: "Renombrar columna",
                    action: (e, column) => {
                        columnToRename = column;
                        renameInput.value = column.getDefinition().title;
                        renameModal.style.display = "flex";
                        renameInput.focus();
                    }
                },
                {
                    label: "Eliminar columna",
                    action: (e, column) => {
                        pushUndoSnapshot();
                        column.delete();
                        table.redraw(true);
                    }
                }
            ]
        }));

        table = new Tabulator("#table", {
            data: originalRows,
            columns,
            movableColumns: true,
            height: "600px"
        });

       

        table.on("columnMoveStart", () => {
            pushUndoColumnOrder();
        });

        document.getElementById("btnAddColumn").disabled = false;
    });

  
    btnExport.addEventListener("click", async () => {
        if (!table) return alert("Primero carga un CSV.");

        const orderedColumns = table.getColumns().map(c => c.getField());
        const newNames = {};

        table.getColumns().forEach(c => {
            newNames[c.getField()] = c.getDefinition().title;
        });

        const savePath = await window.api.saveXLSX(); 
        if (!savePath) return;

        await window.api.exportXLSX({
            rows: originalRows,
            columns: orderedColumns,
            newNames,
            savePath
        });

        alert("Archivo XLSX generado.");
    });


    const btnAddColumn = document.getElementById("btnAddColumn");

btnAddColumn.addEventListener("click", () => {
  if (!table) return;


  const newField = "col_" + Date.now();


  const newCol = {
    field: newField,
    title: "Nueva columna",
    headerSort: true,
    headerWordWrap: true,
    width: "fitData",
    headerMenu: [
      {
        label: "Renombrar columna",
        action: (e, column) => {
          columnToRename = column;
          renameInput.value = column.getDefinition().title;
          renameModal.style.display = "flex";
          renameInput.focus();
        }
      },
      {
        label: "Eliminar columna",
        action: (e, column) => {
          pushUndoSnapshot();
          column.delete();
          table.redraw(true);
        }
      }
    ],
    headerFormatter: function(cell){
      const title = cell.getColumn().getDefinition().title;
      const div = document.createElement("div");
      div.style.whiteSpace = "normal";
      div.style.wordBreak = "break-word";
      div.style.textAlign = "center";
      div.innerText = title;
      return div;
    }
  };


  table.addColumn(newCol, true); 
});

});
