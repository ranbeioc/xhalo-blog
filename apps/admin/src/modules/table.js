import { t } from './i18n.js';
import { escapeHtml } from './ui.js';

export function renderDataTable({
  id,
  columns,
  rows,
  query = '',
  filter = 'all',
  page = 1,
  pageSize = 10,
  searchPlaceholder = '',
  filterLabel = '',
  allLabel = '',
  emptyText = '',
  filterOptions = [],
  getSearchText = (row) => JSON.stringify(row),
  getFilterValue = () => 'all',
  clientPagination = true,
  showPagination = true
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesQuery = !normalizedQuery || getSearchText(row).toLowerCase().includes(normalizedQuery);
    const rowFilter = getFilterValue(row);
    const matchesFilter = filter === 'all' || rowFilter === filter;
    return matchesQuery && matchesFilter;
  });
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = clientPagination
    ? filteredRows.slice((safePage - 1) * safePageSize, safePage * safePageSize)
    : filteredRows;
  const colgroup = columns.map((column) => (
    `<col style="width:${escapeHtml(column.width || 'auto')}; min-width:${escapeHtml(column.minWidth || '120px')};" />`
  )).join('');
  const header = columns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join('');
  const body = pageRows.length > 0
    ? pageRows.map((row) => `<tr>${columns.map((column) => `<td>${column.render(row)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" class="text-center info-text">${escapeHtml(emptyText || 'No matching data.')}</td></tr>`;
  const options = [
    `<option value="all" ${filter === 'all' ? 'selected' : ''}>${escapeHtml(allLabel || t('all'))}</option>`,
    ...filterOptions.map((option) => (
      `<option value="${escapeHtml(option.value)}" ${filter === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`
    ))
  ].join('');
  const countPage = clientPagination ? safePage : 1;
  const countTotalPages = clientPagination ? totalPages : 1;

  return `
    <div class="table-toolbar" data-table-toolbar="${escapeHtml(id)}">
      <label class="table-search">
        <span>${escapeHtml(t('search'))}</span>
        <input type="search" data-table-search="${escapeHtml(id)}" value="${escapeHtml(query)}" placeholder="${escapeHtml(searchPlaceholder || t('search'))}" />
      </label>
      <label class="table-filter">
        <span>${escapeHtml(filterLabel || t('filter'))}</span>
        <select data-table-filter="${escapeHtml(id)}">${options}</select>
      </label>
      <div class="table-count" aria-live="polite">${escapeHtml(t('tableCount', { count: filteredRows.length, page: countPage, totalPages: countTotalPages }))}</div>
    </div>
    <div class="table-container adaptive-table-container">
      <table class="data-table adaptive-table">
        <colgroup>${colgroup}</colgroup>
        <thead><tr>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${showPagination && clientPagination ? `
      <div class="table-pagination" data-table-pagination="${escapeHtml(id)}">
        <button class="button-small button-secondary" data-table-page="${escapeHtml(id)}" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''}>${escapeHtml(t('previousPage'))}</button>
        <span>${escapeHtml(t('pageOf', { page: safePage, totalPages }))}</span>
        <button class="button-small button-secondary" data-table-page="${escapeHtml(id)}" data-page="${safePage + 1}" ${safePage >= totalPages ? 'disabled' : ''}>${escapeHtml(t('nextPage'))}</button>
      </div>
    ` : ''}
  `;
}

export function bindDataTableControls(container, id, state, draw) {
  const search = container.querySelector(`[data-table-search="${id}"]`);
  if (search && !search.dataset.bound) {
    search.dataset.bound = 'true';
    search.addEventListener('input', (event) => {
      state.query = event.target.value;
      state.page = 1;
      
      const origInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      let newHtml = '';
      Object.defineProperty(container, 'innerHTML', {
        set(val) { newHtml = val; },
        configurable: true
      });
      
      draw();
      
      delete container.innerHTML;
      
      const temp = document.createElement('div');
      temp.innerHTML = newHtml;
      
      const updateEl = (selector) => {
        const oldEl = container.querySelector(selector);
        const newEl = temp.querySelector(selector);
        if (oldEl && newEl) {
          if (oldEl.tagName === 'TBODY') {
             oldEl.innerHTML = newEl.innerHTML;
          } else {
             oldEl.outerHTML = newEl.outerHTML;
          }
        } else if (oldEl && !newEl) {
          oldEl.remove();
        } else if (!oldEl && newEl) {
          container.querySelector('.table-container')?.after(newEl);
        }
      };
      
      updateEl('tbody');
      updateEl('.table-pagination');
      updateEl('.table-count');

      // Re-bind pagination buttons after partial DOM update
      container.querySelectorAll(`[data-table-page="${id}"]`).forEach((button) => {
        button.onclick = () => {
          state.page = Number(button.getAttribute('data-page')) || 1;
          draw();
        };
      });

      // Dispatch event so parent components can re-bind or react
      container.dispatchEvent(new CustomEvent('table:updated', { detail: { id, state } }));
    });
  }

  const filter = container.querySelector(`[data-table-filter="${id}"]`);
  if (filter && !filter.dataset.bound) {
    filter.dataset.bound = 'true';
    filter.addEventListener('change', (event) => {
      state.filter = event.target.value;
      state.page = 1;
      draw();
    });
  }

  container.querySelectorAll(`[data-table-page="${id}"]`).forEach((button) => {
    button.onclick = () => {
      state.page = Number(button.getAttribute('data-page')) || 1;
      draw();
    };
  });
}
