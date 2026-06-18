import { escapeHtml } from './ui.js';

export function renderDataTable({
  id,
  columns,
  rows,
  query = '',
  filter = 'all',
  page = 1,
  pageSize = 10,
  searchPlaceholder = '搜索...',
  filterLabel = '筛选',
  allLabel = '全部',
  emptyText = '没有匹配的数据。',
  filterOptions = [],
  getSearchText = (row) => JSON.stringify(row),
  getFilterValue = () => 'all'
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesQuery = !normalizedQuery || getSearchText(row).toLowerCase().includes(normalizedQuery);
    const rowFilter = getFilterValue(row);
    const matchesFilter = filter === 'all' || rowFilter === filter;
    return matchesQuery && matchesFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const colgroup = columns.map((column) => (
    `<col style="width:${escapeHtml(column.width || 'auto')}; min-width:${escapeHtml(column.minWidth || '120px')};" />`
  )).join('');
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = pageRows.length > 0
    ? pageRows.map((row) => `<tr>${columns.map((column) => `<td>${column.render(row)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" class="text-center info-text">${escapeHtml(emptyText)}</td></tr>`;
  const options = [
    `<option value="all" ${filter === 'all' ? 'selected' : ''}>${escapeHtml(allLabel)}</option>`,
    ...filterOptions.map((option) => (
      `<option value="${escapeHtml(option.value)}" ${filter === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`
    ))
  ].join('');

  return `
    <div class="table-toolbar" data-table-toolbar="${escapeHtml(id)}">
      <label class="table-search">
        <span>搜索</span>
        <input type="search" data-table-search="${escapeHtml(id)}" value="${escapeHtml(query)}" placeholder="${escapeHtml(searchPlaceholder)}" />
      </label>
      <label class="table-filter">
        <span>${escapeHtml(filterLabel)}</span>
        <select data-table-filter="${escapeHtml(id)}">${options}</select>
      </label>
      <div class="table-count">共 ${filteredRows.length} 条，当前第 ${safePage} / ${totalPages} 页</div>
    </div>
    <div class="table-container adaptive-table-container">
      <table class="data-table adaptive-table">
        <colgroup>${colgroup}</colgroup>
        <thead><tr>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="table-pagination" data-table-pagination="${escapeHtml(id)}">
      <button class="button-small button-secondary" data-table-page="${escapeHtml(id)}" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''}>上一页</button>
      <span>第 ${safePage} 页 / 共 ${totalPages} 页</span>
      <button class="button-small button-secondary" data-table-page="${escapeHtml(id)}" data-page="${safePage + 1}" ${safePage >= totalPages ? 'disabled' : ''}>下一页</button>
    </div>
  `;
}

export function bindDataTableControls(container, id, state, draw) {
  const search = container.querySelector(`[data-table-search="${id}"]`);
  if (search) {
    search.addEventListener('input', (event) => {
      state.query = event.target.value;
      state.page = 1;
      draw();
      const next = container.querySelector(`[data-table-search="${id}"]`);
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }

  const filter = container.querySelector(`[data-table-filter="${id}"]`);
  if (filter) {
    filter.addEventListener('change', (event) => {
      state.filter = event.target.value;
      state.page = 1;
      draw();
    });
  }

  container.querySelectorAll(`[data-table-page="${id}"]`).forEach((button) => {
    button.addEventListener('click', () => {
      state.page = Number(button.getAttribute('data-page')) || 1;
      draw();
    });
  });
}
