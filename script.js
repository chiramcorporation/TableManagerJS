let tablesData = JSON.parse(localStorage.getItem('tablesData')) || {};
let currentTableId = null;

function loadTables() {
  const tablesUl = document.getElementById('tables');
  tablesUl.innerHTML = '';
  Object.keys(tablesData).forEach(tableId => {
    const li = document.createElement('li');
    li.innerHTML = `<button onclick="openTable('${tableId}')">${tablesData[tableId].title}</button>`;
    tablesUl.appendChild(li);
  });
}
loadTables();

function createNewTable() {
  const tableId = `table_${Date.now()}`;
  tablesData[tableId] = {
    title: "New Table",
    columns: ["Column 1", "Column 2"],
    numericColumn: null,
    rows: []
  };
  saveAll();
  openTable(tableId);
}

function openTable(tableId) {
  currentTableId = tableId;
  const tableData = tablesData[tableId];

  document.getElementById('table-title').innerText = tableData.title;
  document.getElementById('table-editor').style.display = 'block';

  const thead = document.querySelector('table thead');
  const tbody = document.querySelector('table tbody');
  const tfoot = document.querySelector('table tfoot');

  thead.innerHTML = '';
  tbody.innerHTML = '';
  tfoot.innerHTML = '';

  // Header
  const headerRow = document.createElement('tr');
  tableData.columns.forEach((col, index) => {
    const th = document.createElement('th');
    th.contentEditable = true;
    th.innerText = col;
    th.dataset.index = index;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Rows
  tableData.rows.forEach(row => {
    const tr = document.createElement('tr');
    tableData.columns.forEach((_, i) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.innerText = row[i] || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  updateNumericColumnSelector();
  renderFooterSum();
}

function addRow() {
  const tbody = document.querySelector('table tbody');
  const tr = document.createElement('tr');
  const colCount = tablesData[currentTableId].columns.length;
  for (let i = 0; i < colCount; i++) {
    const td = document.createElement('td');
    td.contentEditable = true;
    td.innerText = '';
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

function addColumn() {
  const tableData = tablesData[currentTableId];
  const colIndex = tableData.columns.length + 1;
  tableData.columns.push(`Column ${colIndex}`);

  // Add empty cell to all rows
  tableData.rows.forEach(row => {
    row.push('');
  });

  saveAll();
  openTable(currentTableId);
}

function saveTable() {
  const tableData = tablesData[currentTableId];
  tableData.title = document.getElementById('table-title').innerText;

  const headerCells = document.querySelectorAll('table thead th');
  tableData.columns = Array.from(headerCells).map(th => th.innerText);

  const rowElements = document.querySelectorAll('table tbody tr');
  tableData.rows = Array.from(rowElements).map(tr => {
    return Array.from(tr.children).map(td => td.innerText);
  });

  const numericSelect = document.getElementById('numeric-column-selector');
  tableData.numericColumn = numericSelect.value !== '' ? parseInt(numericSelect.value) : null;

  saveAll();
  alert('✅ Table saved!');
  loadTables();
  renderFooterSum();
}

function updateNumericColumnSelector() {
  const tableData = tablesData[currentTableId];
  const selector = document.getElementById('numeric-column-selector');
  selector.innerHTML = '';

  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.text = '-- None --';
  selector.appendChild(noneOption);

  tableData.columns.forEach((col, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = col;
    if (parseInt(tableData.numericColumn) === i) option.selected = true;
    selector.appendChild(option);
  });
}

function updateNumericColumn() {
  renderFooterSum();
}

function renderFooterSum() {
  const tableData = tablesData[currentTableId];
  const tfoot = document.querySelector('table tfoot');
  tfoot.innerHTML = '';
  const tr = document.createElement('tr');

  tableData.columns.forEach((_, i) => {
    const td = document.createElement('td');
    if (parseInt(tableData.numericColumn) === i) {
      const sum = tableData.rows.reduce((total, row) => {
        const val = parseFloat(row[i]);
        return total + (isNaN(val) ? 0 : val);
      }, 0);
      td.innerText = `Total: ${sum}`;
    }
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
}

function deleteCurrentTable() {
  if (!confirm('Delete this table?')) return;
  delete tablesData[currentTableId];
  currentTableId = null;
  saveAll();
  closeEditor();
  loadTables();
}

function closeEditor() {
  document.getElementById('table-editor').style.display = 'none';
}

function saveAll() {
  localStorage.setItem('tablesData', JSON.stringify(tablesData));
}

function exportToJson() {
  const dataStr = JSON.stringify(tablesData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tablesData.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const newData = JSON.parse(e.target.result);
      if (typeof newData === 'object') {
        if (confirm("⚠ This will overwrite existing data. Continue?")) {
          tablesData = newData;
          saveAll();
          loadTables();
          closeEditor();
          alert("✅ Data imported!");
        }
      } else {
        alert("❌ Invalid JSON format.");
      }
    } catch (err) {
      alert("❌ Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
}
