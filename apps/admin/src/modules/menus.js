import { apiFetch } from './api-client.js';
import { showToast } from './ui.js';

export async function fetchSiteMenu() {
  try {
    const res = await apiFetch('/api/site/menu');
    if (!res.ok) throw new Error(`Site menu API returned status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to load site menu, loading fallback demo menu:', err);
    return {
      menu: [
        { name: 'Home', path: '/', icon: 'home' },
        { name: 'Archives', path: '/archives/', icon: 'archive' },
        { name: 'Tags', path: '/tags/', icon: 'tags' }
      ]
    };
  }
}

export function renderMenuManager(container, { initialMenuData }) {
  let menuItems = [...(initialMenuData?.menu || [])];
  let diffHtml = '';
  let loadingState = false;
  let editingIndex = null;
  let newItem = { name: '', path: '', icon: '' };

  async function generateMenuDiff() {
    loadingState = true;
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
          <p>Config file: <code>${diff.filePath || '_config.yml'}</code></p>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No menu changes detected.')}</pre>
          </div>
        </div>
      `;
      showToast('Menu diff generated successfully', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">Failed to generate preview: ${err.message}</div>`;
      showToast(`Failed to generate preview: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function addMenuItem(e) {
    e.preventDefault();
    if (!newItem.name || !newItem.path) {
      showToast('Please fill out Name and Path fields.', 'warning');
      return;
    }
    menuItems.push({ ...newItem });
    newItem = { name: '', path: '', icon: '' };
    diffHtml = '';
    showToast('Menu item added locally', 'success');
    draw();
  }

  function deleteMenuItem(index) {
    const deletedName = menuItems[index]?.name || 'Item';
    menuItems.splice(index, 1);
    diffHtml = '';
    showToast(`Deleted "${deletedName}" locally`, 'info');
    draw();
  }

  function draw() {
    const listHtml = menuItems.length > 0 ? menuItems.map((item, index) => `
      <div class="menu-item-row card">
        <div class="item-info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>Path: <code>${escapeHtml(item.path)}</code></span>
          ${item.icon ? `<span>Icon: <code>${escapeHtml(item.icon)}</code></span>` : ''}
        </div>
        <button class="button-small button-danger btn-delete-item" data-index="${index}">Delete</button>
      </div>
    `).join('') : '<p class="info-text">No items in the menu structure.</p>';

    container.innerHTML = `
      <div class="menu-workspace">
        <h2>Site Menu Manager (Preview-only)</h2>

        <div class="alert alert-info">
          <strong>Preview-only Mode:</strong> Direct persistence of menu changes is restricted. You can reorganize links and preview configuration differences before submitting changes.
        </div>

        <div class="menu-layout-grid">
          <div class="card menu-items-list-card">
            <h3>Menu Link Structure</h3>
            <div class="menu-list">
              ${listHtml}
            </div>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);"/>
            
            <h3>Add Menu Item</h3>
            <form id="add-menu-form" class="inline-form">
              <label>
                <span>Link Name</span>
                <input type="text" id="add-item-name" value="${escapeHtml(newItem.name)}" placeholder="e.g. About" />
              </label>
              <label>
                <span>Target Path</span>
                <input type="text" id="add-item-path" value="${escapeHtml(newItem.path)}" placeholder="e.g. /about/" />
              </label>
              <label>
                <span>Icon Class</span>
                <input type="text" id="add-item-icon" value="${escapeHtml(newItem.icon)}" placeholder="e.g. user" />
              </label>
              <button type="submit" class="button-secondary" style="margin-top: 10px; width: 100%;">Add Link</button>
            </form>
          </div>

          <div class="menu-preview-actions-card">
            <div class="card operational-card">
              <h3>Action Center</h3>
              <button class="button-primary" id="btn-preview-menu-diff" style="width: 100%; margin-bottom: 15px;">Preview Menu Diff</button>
              
              <button class="button-danger" id="btn-direct-menu-update" disabled style="width: 100%;" title="Direct config update is disabled by default">Direct Config Update (Disabled)</button>
              <p class="help-text">Direct config update is disabled by default.</p>
            </div>
            
            ${loadingState ? '<div class="info-text">Generating diff...</div>' : ''}
            ${!loadingState && diffHtml ? diffHtml : ''}
          </div>
        </div>
      </div>
    `;

    // Bind item deletion
    container.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        deleteMenuItem(index);
      });
    });

    // Bind inputs for new item
    const form = container.querySelector('#add-menu-form');
    if (form) {
      form.addEventListener('submit', addMenuItem);
      
      const nameInp = container.querySelector('#add-item-name');
      const pathInp = container.querySelector('#add-item-path');
      const iconInp = container.querySelector('#add-item-icon');

      nameInp.addEventListener('input', (e) => { newItem.name = e.target.value; });
      pathInp.addEventListener('input', (e) => { newItem.path = e.target.value; });
      iconInp.addEventListener('input', (e) => { newItem.icon = e.target.value; });
    }

    const previewBtn = container.querySelector('#btn-preview-menu-diff');
    if (previewBtn) previewBtn.addEventListener('click', generateMenuDiff);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  draw();
}
