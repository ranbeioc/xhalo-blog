import { apiFetch } from './api-client.js';
import { escapeHtml, showToast } from './ui.js';

export async function fetchSiteMenu() {
  const res = await apiFetch('/api/site/menu');
  if (!res.ok) throw new Error(`Menu API returned status ${res.status}`);
  return await res.json();
}

function emptyMenuItem(order = 0) {
  return {
    id: `menu-${Date.now()}`,
    label: '',
    path: '/',
    external: false,
    visible: true,
    order,
    icon: ''
  };
}

export function renderMenuManager(container, { initialMenuData }) {
  const originalMenu = Array.isArray(initialMenuData?.menu) ? structuredClone(initialMenuData.menu) : [];
  let menuItems = structuredClone(originalMenu);
  let editingIndex = null;
  let draftItem = emptyMenuItem(menuItems.length);
  let diffHtml = '';
  let actionResultHtml = '';
  let loadingState = false;

  function normalizeOrder() {
    menuItems = menuItems.map((item, index) => ({ ...item, order: index * 10 }));
  }

  async function generateMenuDiff() {
    loadingState = true;
    diffHtml = '';
    draw();
    try {
      const res = await apiFetch('/api/site/menu/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuItems })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diff generation failed');
      const diff = data.diff || {};
      diffHtml = `
        <div class="diff-container card">
          <h4>Menu Configuration Diff Preview</h4>
          <p>Config file: <code>${escapeHtml(diff.filePath || data.source || '_config.yml')}</code></p>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No menu changes detected.')}</pre>
          </div>
        </div>
      `;
      showToast('Menu diff generated successfully', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">Failed to generate preview: ${escapeHtml(err.message)}</div>`;
      showToast(`Failed to generate preview: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function saveMenuToTest() {
    loadingState = true;
    actionResultHtml = '';
    draw();
    try {
      const res = await apiFetch('/api/site/menu/test-direct-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuItems, baseSha: initialMenuData?.sha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.code || 'Test menu update failed');
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>Saved to test target:</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          Path: <code>${escapeHtml(data.targetPath || '')}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
        </div>
      `;
      showToast('Menu saved to test target', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Test menu save failed: ${escapeHtml(err.message)}</div>`;
      showToast(`Test menu save failed: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function startEdit(index) {
    editingIndex = index;
    draftItem = { ...menuItems[index] };
    draw();
  }

  function deleteMenuItem(index) {
    const deletedName = menuItems[index]?.label || menuItems[index]?.name || 'Item';
    menuItems.splice(index, 1);
    normalizeOrder();
    diffHtml = '';
    showToast(`Deleted "${deletedName}" locally`, 'info');
    draw();
  }

  function moveMenuItem(index, delta) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= menuItems.length) return;
    const [item] = menuItems.splice(index, 1);
    menuItems.splice(nextIndex, 0, item);
    normalizeOrder();
    diffHtml = '';
    draw();
  }

  function resetMenu() {
    menuItems = structuredClone(originalMenu);
    editingIndex = null;
    draftItem = emptyMenuItem(menuItems.length);
    diffHtml = '';
    actionResultHtml = '';
    showToast('Menu reset to loaded source', 'info');
    draw();
  }

  function submitDraft(event) {
    event.preventDefault();
    if (!draftItem.label || !draftItem.path) {
      showToast('Please fill out Label and Path fields.', 'warning');
      return;
    }
    const normalized = {
      ...draftItem,
      id: draftItem.id || slugify(draftItem.label),
      external: Boolean(draftItem.external),
      visible: draftItem.visible !== false,
      order: Number.isInteger(Number(draftItem.order)) ? Number(draftItem.order) : menuItems.length * 10
    };
    if (editingIndex == null) {
      menuItems.push(normalized);
      showToast('Menu item added locally', 'success');
    } else {
      menuItems[editingIndex] = normalized;
      showToast('Menu item updated locally', 'success');
    }
    normalizeOrder();
    editingIndex = null;
    draftItem = emptyMenuItem(menuItems.length);
    diffHtml = '';
    draw();
  }

  function draw() {
    const listHtml = menuItems.length > 0 ? menuItems.map((item, index) => `
      <div class="menu-item-row card">
        <div class="item-info">
          <strong>${escapeHtml(item.label || item.name || item.id)}</strong>
          <span>Path: <code>${escapeHtml(item.path)}</code></span>
          <span>Visible: <code>${item.visible === false ? 'false' : 'true'}</code></span>
          ${item.icon ? `<span>Icon: <code>${escapeHtml(item.icon)}</code></span>` : ''}
        </div>
        <div class="inline-actions">
          <button class="button-small button-secondary btn-move-up" data-index="${index}">Up</button>
          <button class="button-small button-secondary btn-move-down" data-index="${index}">Down</button>
          <button class="button-small button-secondary btn-edit-item" data-index="${index}">Edit</button>
          <button class="button-small button-danger btn-delete-item" data-index="${index}">Delete</button>
        </div>
      </div>
    `).join('') : '<p class="info-text">No items in the menu structure.</p>';

    container.innerHTML = `
      <div class="menu-workspace">
        <h2>Site Menu Manager</h2>
        <div class="alert alert-info">
          <strong>Test-only persistence:</strong> Menu CRUD is local until you preview a diff or save through <code>/api/site/menu/test-direct-update</code>. Production config writes remain blocked.
        </div>

        <div class="menu-layout-grid">
          <div class="card menu-items-list-card">
            <h3>Menu Link Structure</h3>
            <div class="menu-list">${listHtml}</div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);"/>
            <h3>${editingIndex == null ? 'Add Menu Item' : 'Edit Menu Item'}</h3>
            <form id="menu-item-form" class="inline-form">
              <label><span>Label</span><input type="text" id="item-label" value="${escapeHtml(draftItem.label || draftItem.name || '')}" placeholder="e.g. About" /></label>
              <label><span>Path</span><input type="text" id="item-path" value="${escapeHtml(draftItem.path || '/')}" placeholder="e.g. /about/" /></label>
              <label><span>Icon</span><input type="text" id="item-icon" value="${escapeHtml(draftItem.icon || '')}" placeholder="e.g. user" /></label>
              <label><span>Visible</span><select id="item-visible"><option value="true" ${draftItem.visible !== false ? 'selected' : ''}>true</option><option value="false" ${draftItem.visible === false ? 'selected' : ''}>false</option></select></label>
              <button type="submit" class="button-secondary" style="margin-top: 10px; width: 100%;">${editingIndex == null ? 'Add Link' : 'Update Link'}</button>
            </form>
          </div>

          <div class="menu-preview-actions-card">
            <div class="card operational-card">
              <h3>Action Center</h3>
              <button class="button-primary" id="btn-preview-menu-diff" style="width: 100%; margin-bottom: 15px;">Preview Menu Diff</button>
              <button class="button-secondary" id="btn-reset-menu" style="width: 100%; margin-bottom: 15px;">Reset Loaded Menu</button>
              <button class="button-primary" id="btn-save-menu-test" style="width: 100%;">Save to Test</button>
              <p class="help-text">Save to Test targets the configured test repository only; direct production config update remains disabled.</p>
            </div>
            ${loadingState ? '<div class="info-text">Working...</div>' : ''}
            ${actionResultHtml}
            ${diffHtml}
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.btn-delete-item').forEach((btn) => {
      btn.addEventListener('click', () => deleteMenuItem(Number(btn.getAttribute('data-index'))));
    });
    container.querySelectorAll('.btn-edit-item').forEach((btn) => {
      btn.addEventListener('click', () => startEdit(Number(btn.getAttribute('data-index'))));
    });
    container.querySelectorAll('.btn-move-up').forEach((btn) => {
      btn.addEventListener('click', () => moveMenuItem(Number(btn.getAttribute('data-index')), -1));
    });
    container.querySelectorAll('.btn-move-down').forEach((btn) => {
      btn.addEventListener('click', () => moveMenuItem(Number(btn.getAttribute('data-index')), 1));
    });

    const form = container.querySelector('#menu-item-form');
    if (form) {
      form.addEventListener('submit', submitDraft);
      for (const [key, selector] of Object.entries({ label: '#item-label', path: '#item-path', icon: '#item-icon', visible: '#item-visible' })) {
        const input = container.querySelector(selector);
        input?.addEventListener('input', (event) => {
          draftItem[key] = key === 'visible' ? event.target.value === 'true' : event.target.value;
        });
        input?.addEventListener('change', (event) => {
          draftItem[key] = key === 'visible' ? event.target.value === 'true' : event.target.value;
        });
      }
    }

    container.querySelector('#btn-preview-menu-diff')?.addEventListener('click', generateMenuDiff);
    container.querySelector('#btn-reset-menu')?.addEventListener('click', resetMenu);
    container.querySelector('#btn-save-menu-test')?.addEventListener('click', saveMenuToTest);
  }

  draw();
}

function slugify(value) {
  return String(value || 'menu-item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'menu-item';
}
