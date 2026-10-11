/**
 * Chiram Table Manager — Core Script
 * ----------------------------------------------------------------------------
 * Handles table data operations, localStorage sync, formula sums,
 * JSON export/import, and UI animations per THEME.md.
 */

let tablesData = JSON.parse(localStorage.getItem('tablesData')) || {};
let currentTableId = null;

// ============================================================================
// Helper Utilities
// ============================================================================
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function updateStats() {
  const tableKeys = Object.keys(tablesData);
  const totalTables = tableKeys.length;
  let totalRows = 0;
  let activeCols = 0;

  tableKeys.forEach(id => {
    const table = tablesData[id];
    if (table) {
      if (Array.isArray(table.rows)) totalRows += table.rows.length;
      if (id === currentTableId && Array.isArray(table.columns)) {
        activeCols = table.columns.length;
      }
    }
  });

  if (!currentTableId && tableKeys.length > 0) {
    const firstTable = tablesData[tableKeys[0]];
    if (firstTable && Array.isArray(firstTable.columns)) {
      activeCols = firstTable.columns.length;
    }
  }

  const tableCountEl = document.getElementById('stat-table-count');
  const rowCountEl = document.getElementById('stat-row-count');
  const colCountEl = document.getElementById('stat-col-count');

  if (tableCountEl) tableCountEl.innerText = totalTables;
  if (rowCountEl) rowCountEl.innerText = totalRows;
  if (colCountEl) colCountEl.innerText = activeCols;
}

// ============================================================================
// Table List & Navigation
// ============================================================================
function loadTables() {
  const tablesUl = document.getElementById('tables');
  if (!tablesUl) return;
  tablesUl.innerHTML = '';

  const tableKeys = Object.keys(tablesData);
  updateStats();

  if (tableKeys.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state';
    emptyLi.innerHTML = `
      <div class="empty-icon">📊</div>
      <p>No tables created yet. Click <strong>+ Add New Table</strong> above to start managing your data!</p>
    `;
    tablesUl.appendChild(emptyLi);
    return;
  }

  tableKeys.forEach(tableId => {
    const table = tablesData[tableId];
    const rowCount = (table.rows || []).length;
    const colCount = (table.columns || []).length;
    const isActive = tableId === currentTableId;

    const li = document.createElement('li');
    li.className = 'table-card-item';
    li.innerHTML = `
      <button class="table-select-btn ${isActive ? 'active' : ''}" onclick="openTable('${tableId}')">
        <div class="table-card-info">
          <span class="table-card-title">${escapeHtml(table.title || 'Untitled Table')}</span>
          <span class="table-card-meta">${rowCount} ${rowCount === 1 ? 'row' : 'rows'} • ${colCount} ${colCount === 1 ? 'col' : 'cols'}</span>
        </div>
        <span class="table-card-arrow">${isActive ? 'Active ●' : 'Open →'}</span>
      </button>
    `;
    tablesUl.appendChild(li);
  });
}

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
  showToast('✨ New table created!');
}

function openTable(tableId) {
  currentTableId = tableId;
  const tableData = tablesData[tableId];
  if (!tableData) return;

  const titleEl = document.getElementById('table-title');
  if (titleEl) titleEl.innerText = tableData.title || 'Untitled Table';

  const editorEl = document.getElementById('table-editor');
  if (editorEl) {
    editorEl.style.display = 'block';
    editorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const thead = document.querySelector('table thead');
  const tbody = document.querySelector('table tbody');
  const tfoot = document.querySelector('table tfoot');

  if (thead) thead.innerHTML = '';
  if (tbody) tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  // Render Header
  if (thead) {
    const headerRow = document.createElement('tr');
    (tableData.columns || []).forEach((col, index) => {
      const th = document.createElement('th');
      th.contentEditable = true;
      th.innerText = col;
      th.dataset.index = index;
      th.title = 'Click to edit column header';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
  }

  // Render Rows
  if (tbody) {
    (tableData.rows || []).forEach(row => {
      const tr = document.createElement('tr');
      (tableData.columns || []).forEach((_, i) => {
        const td = document.createElement('td');
        td.contentEditable = true;
        td.innerText = row[i] || '';
        td.title = 'Click to edit cell value';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  updateNumericColumnSelector();
  renderFooterSum();
  loadTables();
  updateStats();
}

// ============================================================================
// Row & Column Operations
// ============================================================================
function addRow() {
  if (!currentTableId || !tablesData[currentTableId]) return;
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  const colCount = tablesData[currentTableId].columns.length;
  for (let i = 0; i < colCount; i++) {
    const td = document.createElement('td');
    td.contentEditable = true;
    td.innerText = '';
    td.title = 'Click to edit cell value';
    tr.appendChild(td);
  }
  tbody.appendChild(tr);

  // Focus the first newly created cell
  const firstCell = tr.querySelector('td');
  if (firstCell) firstCell.focus();
}

function addColumn() {
  if (!currentTableId || !tablesData[currentTableId]) return;
  const tableData = tablesData[currentTableId];
  const colIndex = tableData.columns.length + 1;
  tableData.columns.push(`Column ${colIndex}`);

  // Add empty cell to all existing rows
  tableData.rows.forEach(row => {
    row.push('');
  });

  saveAll();
  openTable(currentTableId);
  showToast(`➕ Added Column ${colIndex}`);
}

// ============================================================================
// Save, Calculations & Delete
// ============================================================================
function saveTable() {
  if (!currentTableId || !tablesData[currentTableId]) return;
  const tableData = tablesData[currentTableId];

  const titleEl = document.getElementById('table-title');
  if (titleEl) {
    tableData.title = titleEl.innerText.trim() || 'Untitled Table';
  }

  const headerCells = document.querySelectorAll('table thead th');
  tableData.columns = Array.from(headerCells).map(th => th.innerText.trim() || 'Column');

  const rowElements = document.querySelectorAll('table tbody tr');
  tableData.rows = Array.from(rowElements).map(tr => {
    return Array.from(tr.children).map(td => td.innerText.trim());
  });

  const numericSelect = document.getElementById('numeric-column-selector');
  if (numericSelect) {
    tableData.numericColumn = numericSelect.value !== '' ? parseInt(numericSelect.value, 10) : null;
  }

  saveAll();
  loadTables();
  renderFooterSum();
  updateStats();
  showToast('💾 Table successfully saved!');
}

function updateNumericColumnSelector() {
  if (!currentTableId || !tablesData[currentTableId]) return;
  const tableData = tablesData[currentTableId];
  const selector = document.getElementById('numeric-column-selector');
  if (!selector) return;

  selector.innerHTML = '';

  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.text = '-- None (No Sum) --';
  selector.appendChild(noneOption);

  tableData.columns.forEach((col, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = `${col} (Column ${i + 1})`;
    if (parseInt(tableData.numericColumn, 10) === i) option.selected = true;
    selector.appendChild(option);
  });
}

function updateNumericColumn() {
  renderFooterSum();
}

function renderFooterSum() {
  if (!currentTableId || !tablesData[currentTableId]) return;
  const tableData = tablesData[currentTableId];
  const tfoot = document.querySelector('table tfoot');
  if (!tfoot) return;

  tfoot.innerHTML = '';
  const tr = document.createElement('tr');

  const numericSelect = document.getElementById('numeric-column-selector');
  const activeNumericCol = numericSelect && numericSelect.value !== ''
    ? parseInt(numericSelect.value, 10)
    : (tableData.numericColumn !== null ? parseInt(tableData.numericColumn, 10) : null);

  // Read live rows from DOM or saved data
  const rowElements = document.querySelectorAll('table tbody tr');
  const liveRows = rowElements.length > 0
    ? Array.from(rowElements).map(row => Array.from(row.children).map(td => td.innerText.trim()))
    : tableData.rows || [];

  (tableData.columns || []).forEach((_, i) => {
    const td = document.createElement('td');
    if (activeNumericCol === i) {
      const sum = liveRows.reduce((total, row) => {
        const raw = row[i] ? row[i].replace(/[^0-9.-]+/g, '') : '';
        const val = parseFloat(raw);
        return total + (isNaN(val) ? 0 : val);
      }, 0);
      td.innerHTML = `<strong>Total:</strong> ${sum.toLocaleString()}`;
    } else {
      td.innerText = i === 0 ? 'Summary' : '';
    }
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
}

function deleteCurrentTable() {
  if (!currentTableId) return;
  if (!confirm('Are you sure you want to delete this table?')) return;

  delete tablesData[currentTableId];
  currentTableId = null;
  saveAll();
  closeEditor();
  loadTables();
  updateStats();
  showToast('🗑 Table deleted.');
}

function closeEditor() {
  const editorEl = document.getElementById('table-editor');
  if (editorEl) editorEl.style.display = 'none';
  currentTableId = null;
  loadTables();
}

function saveAll() {
  localStorage.setItem('tablesData', JSON.stringify(tablesData));
}

// ============================================================================
// JSON Import / Export
// ============================================================================
function exportToJson() {
  const dataStr = JSON.stringify(tablesData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `tablesData_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇ Data exported to JSON.');
}

function importFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const newData = JSON.parse(e.target.result);
      if (typeof newData === 'object' && newData !== null) {
        if (confirm("⚠ This will overwrite existing local tables. Continue?")) {
          tablesData = newData;
          saveAll();
          loadTables();
          closeEditor();
          updateStats();
          showToast('✅ Data successfully imported!');
        }
      } else {
        alert("❌ Invalid JSON format.");
      }
    } catch (err) {
      alert("❌ Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be re-selected if desired
  event.target.value = '';
}

// ============================================================================
// 10. Scroll-Reveal Observer per THEME.md
// ============================================================================
function initScrollReveal() {
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }
}

// ============================================================================
// App Initialization
// ============================================================================
function initApp() {
  loadTables();
  initScrollReveal();
  updateStats();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
