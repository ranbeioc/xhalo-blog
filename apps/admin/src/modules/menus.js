import { apiFetch } from './api-client.js';
import { getLanguage, isZh } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const MENU_LOCALES = [
  ['zh-CN', '中文'],
  ['en', 'English'],
  ['ja', '日本語'],
  ['ko', '한국어']
];

const copy = {
  zh: {
    title: '站点菜单管理',
    intro: '菜单修改先在本地编辑；预览 diff 后保存到测试站会写入 ranbeioc/xhalo-blog-test@main，并同步更新 NexT 菜单配置与触发 Cloudflare Pages 构建。',
    listTitle: '菜单链接结构',
    empty: '菜单结构中没有项目。',
    addTitle: '新增菜单项',
    editTitle: '编辑菜单项',
    defaultLabel: '默认标签',
    path: '路径',
    icon: '图标',
    visible: '可见',
    add: '新增链接',
    update: '更新链接',
    actions: '操作中心',
    previewDiff: '预览菜单 Diff',
    reset: '重置已加载菜单',
    save: '保存到测试站',
    saveHelp: '保存使用一次 GitHub 原子提交，同时更新框架配置和 NexT 菜单配置，并通过 Pages deploy hook 触发测试站重建。',
    moveUp: '上移',
    moveDown: '下移',
    edit: '编辑',
    delete: '删除',
    labelRequired: '请填写至少一个标签和路径。',
    added: '菜单项已在本地新增。',
    updated: '菜单项已在本地更新。',
    resetDone: '菜单已重置为加载来源。',
    diffReady: '菜单 diff 已生成。',
    diffFailed: '预览生成失败',
    saved: '菜单已保存到测试站。',
    saveFailed: '测试菜单保存失败',
    pathLabel: '路径',
    labels: '多语言',
    sourceFile: '配置文件',
    deployTriggered: '已触发 Pages 构建',
    deployNotTriggered: '未触发 Pages 构建'
  },
  en: {
    title: 'Site Menu Manager',
    intro: 'Edit menus locally first. After diff preview, saving to the test site writes ranbeioc/xhalo-blog-test@main, updates the NexT menu config, and triggers a Cloudflare Pages build.',
    listTitle: 'Menu Link Structure',
    empty: 'No menu items are loaded.',
    addTitle: 'Add Menu Item',
    editTitle: 'Edit Menu Item',
    defaultLabel: 'Default Label',
    path: 'Path',
    icon: 'Icon',
    visible: 'Visible',
    add: 'Add Link',
    update: 'Update Link',
    actions: 'Action Center',
    previewDiff: 'Preview Menu Diff',
    reset: 'Reset Loaded Menu',
    save: 'Save to Test Site',
    saveHelp: 'Save creates one GitHub atomic commit, updates framework and NexT menu config, and triggers a Pages rebuild through the deploy hook.',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    edit: 'Edit',
    delete: 'Delete',
    labelRequired: 'Fill at least one label and a path.',
    added: 'Menu item added locally.',
    updated: 'Menu item updated locally.',
    resetDone: 'Menu reset to loaded source.',
    diffReady: 'Menu diff generated.',
    diffFailed: 'Diff preview failed',
    saved: 'Menu saved to the test site.',
    saveFailed: 'Test menu save failed',
    pathLabel: 'Path',
    labels: 'Labels',
    sourceFile: 'Source file',
    deployTriggered: 'Pages build triggered',
    deployNotTriggered: 'Pages build not triggered'
  }
};

function c(key) {
  return (isZh() ? copy.zh : copy.en)[key];
}

export async function fetchSiteMenu() {
  const res = await apiFetch('/api/site/menu');
  if (!res.ok) throw new Error(`Menu API returned status ${res.status}`);
  return await res.json();
}

function emptyMenuItem(order = 0) {
  return {
    id: `menu-${Date.now()}`,
    label: '',
    labels: {},
    path: '/',
    external: false,
    visible: true,
    order,
    icon: ''
  };
}

function normalizeMenuItem(item, index = 0) {
  const labels = item?.labels && typeof item.labels === 'object' ? { ...item.labels } : {};
  const fallback = item?.label || item?.name || labels['zh-CN'] || labels.en || item?.id || '';
  if (fallback && !labels['zh-CN']) labels['zh-CN'] = fallback;
  if (fallback && !labels.en) labels.en = fallback;
  return {
    id: item?.id || slugify(fallback) || `menu-item-${index}`,
    label: item?.label || labels['zh-CN'] || labels.en || fallback,
    labels,
    path: item?.path || '/',
    external: Boolean(item?.external),
    visible: item?.visible !== false,
    order: Number.isInteger(Number(item?.order)) ? Number(item.order) : index * 10,
    icon: item?.icon || ''
  };
}

function cloneMenu(menu) {
  return structuredClone(Array.isArray(menu) ? menu : []).map(normalizeMenuItem);
}

function displayLabel(item) {
  const language = getLanguage();
  return item.labels?.[language] || item.labels?.['zh-CN'] || item.labels?.en || item.label || item.id;
}

function normalizeLabels(item) {
  const labels = { ...(item.labels || {}) };
  if (item.label && !labels['zh-CN']) labels['zh-CN'] = item.label;
  if (item.label && !labels.en) labels.en = item.label;
  return Object.fromEntries(Object.entries(labels).filter(([, value]) => String(value || '').trim()));
}

export function renderMenuManager(container, { initialMenuData }) {
  const originalMenu = cloneMenu(initialMenuData?.menu);
  let menuItems = cloneMenu(originalMenu);
  let editingIndex = null;
  let draftItem = emptyMenuItem(menuItems.length * 10);
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
        body: JSON.stringify({ menu: menuItems.map(prepareForSubmit) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diff generation failed');
      const diff = data.diff || {};
      diffHtml = `
        <div class="diff-container card">
          <h4>${escapeHtml(c('previewDiff'))}</h4>
          <p>${escapeHtml(c('sourceFile'))}: <code>${escapeHtml(diff.filePath || data.source || '_config.yml')}</code></p>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No menu changes detected.')}</pre>
          </div>
        </div>
      `;
      showToast(c('diffReady'), 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">${escapeHtml(c('diffFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('diffFailed')}: ${err.message}`, 'error');
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
        body: JSON.stringify({ menu: menuItems.map(prepareForSubmit), baseSha: initialMenuData?.sha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.code || 'Test menu update failed');
      const deploy = data.pagesDeploy || {};
      const deployState = deploy.triggered
        ? `<span class="status-badge" data-state="ok">${escapeHtml(c('deployTriggered'))}</span>`
        : `<span class="status-badge" data-state="warning">${escapeHtml(c('deployNotTriggered'))}</span>`;
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>${escapeHtml(c('saved'))}</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          ${escapeHtml(c('sourceFile'))}: <code>${escapeHtml((data.targetPaths || [data.targetPath || '']).join(', '))}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          <br/>${deployState}
          ${deploy.deploymentId ? `<br/>Deployment: <code>${escapeHtml(deploy.deploymentId)}</code>` : ''}
          ${deploy.deploymentUrl ? `<br/>Preview: <a href="${escapeHtml(deploy.deploymentUrl)}" target="_blank" rel="noreferrer">${escapeHtml(deploy.deploymentUrl)}</a>` : ''}
          ${deploy.error ? `<br/><span class="text-danger">Deploy hook error: ${escapeHtml(deploy.error)}</span>` : ''}
        </div>
      `;
      showToast(c('saved'), deploy.triggered ? 'success' : 'warning');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('saveFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('saveFailed')}: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function prepareForSubmit(item) {
    const labels = normalizeLabels(item);
    return {
      ...item,
      label: labels['zh-CN'] || labels.en || item.label || item.id,
      labels,
      external: Boolean(item.external),
      visible: item.visible !== false,
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : 0
    };
  }

  function startEdit(index) {
    editingIndex = index;
    draftItem = normalizeMenuItem(menuItems[index], index);
    draw();
  }

  function deleteMenuItem(index) {
    const deletedName = displayLabel(menuItems[index]) || 'Item';
    menuItems.splice(index, 1);
    normalizeOrder();
    diffHtml = '';
    showToast(`${c('delete')}: ${deletedName}`, 'info');
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
    menuItems = cloneMenu(originalMenu);
    editingIndex = null;
    draftItem = emptyMenuItem(menuItems.length * 10);
    diffHtml = '';
    actionResultHtml = '';
    showToast(c('resetDone'), 'info');
    draw();
  }

  function submitDraft(event) {
    event.preventDefault();
    const normalized = prepareForSubmit({
      ...draftItem,
      id: draftItem.id || slugify(draftItem.label || draftItem.labels?.['zh-CN']),
      order: Number.isInteger(Number(draftItem.order)) ? Number(draftItem.order) : menuItems.length * 10
    });
    if (!normalized.label || !normalized.path) {
      showToast(c('labelRequired'), 'warning');
      return;
    }
    if (editingIndex == null) {
      menuItems.push(normalized);
      showToast(c('added'), 'success');
    } else {
      menuItems[editingIndex] = normalized;
      showToast(c('updated'), 'success');
    }
    normalizeOrder();
    editingIndex = null;
    draftItem = emptyMenuItem(menuItems.length * 10);
    diffHtml = '';
    draw();
  }

  function renderLabels(item) {
    const labels = item.labels || {};
    return Object.entries(labels).length > 0
      ? `<span>${escapeHtml(c('labels'))}: ${Object.entries(labels).map(([locale, value]) => `<code>${escapeHtml(locale)}=${escapeHtml(value)}</code>`).join(' ')}</span>`
      : '';
  }

  function draw() {
    const listHtml = menuItems.length > 0 ? menuItems.map((item, index) => `
      <div class="menu-item-row card">
        <div class="item-info">
          <strong>${escapeHtml(displayLabel(item))}</strong>
          <span>${escapeHtml(c('pathLabel'))}: <code>${escapeHtml(item.path)}</code></span>
          <span>${escapeHtml(c('visible'))}: <code>${item.visible === false ? 'false' : 'true'}</code></span>
          ${item.icon ? `<span>${escapeHtml(c('icon'))}: <code>${escapeHtml(item.icon)}</code></span>` : ''}
          ${renderLabels(item)}
        </div>
        <div class="inline-actions">
          <button class="button-small button-secondary btn-move-up" data-index="${index}">${escapeHtml(c('moveUp'))}</button>
          <button class="button-small button-secondary btn-move-down" data-index="${index}">${escapeHtml(c('moveDown'))}</button>
          <button class="button-small button-secondary btn-edit-item" data-index="${index}">${escapeHtml(c('edit'))}</button>
          <button class="button-small button-danger btn-delete-item" data-index="${index}">${escapeHtml(c('delete'))}</button>
        </div>
      </div>
    `).join('') : `<p class="info-text">${escapeHtml(c('empty'))}</p>`;

    container.innerHTML = `
      <div class="menu-workspace">
        <h2>${escapeHtml(c('title'))}</h2>
        <div class="alert alert-info">${escapeHtml(c('intro'))}</div>

        <div class="menu-layout-grid">
          <div class="card menu-items-list-card">
            <h3>${escapeHtml(c('listTitle'))}</h3>
            <div class="menu-list">${listHtml}</div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);"/>
            <h3>${escapeHtml(editingIndex == null ? c('addTitle') : c('editTitle'))}</h3>
            <form id="menu-item-form" class="inline-form">
              <label><span>${escapeHtml(c('defaultLabel'))}</span><input type="text" id="item-label" value="${escapeHtml(draftItem.label || displayLabel(draftItem) || '')}" placeholder="About" /></label>
              ${MENU_LOCALES.map(([locale, label]) => `
                <label><span>${escapeHtml(label)} ${escapeHtml(c('defaultLabel'))}</span><input type="text" data-label-locale="${escapeHtml(locale)}" value="${escapeHtml(draftItem.labels?.[locale] || '')}" placeholder="${escapeHtml(locale)} label" /></label>
              `).join('')}
              <label><span>${escapeHtml(c('path'))}</span><input type="text" id="item-path" value="${escapeHtml(draftItem.path || '/')}" placeholder="/about/" /></label>
              <label><span>${escapeHtml(c('icon'))}</span><input type="text" id="item-icon" value="${escapeHtml(draftItem.icon || '')}" placeholder="user" /></label>
              <label><span>${escapeHtml(c('visible'))}</span><select id="item-visible"><option value="true" ${draftItem.visible !== false ? 'selected' : ''}>true</option><option value="false" ${draftItem.visible === false ? 'selected' : ''}>false</option></select></label>
              <button type="submit" class="button-secondary" style="margin-top: 10px; width: 100%;">${escapeHtml(editingIndex == null ? c('add') : c('update'))}</button>
            </form>
          </div>

          <div class="menu-preview-actions-card">
            <div class="card operational-card">
              <h3>${escapeHtml(c('actions'))}</h3>
              <button class="button-primary" id="btn-preview-menu-diff" style="width: 100%; margin-bottom: 15px;">${escapeHtml(c('previewDiff'))}</button>
              <button class="button-secondary" id="btn-reset-menu" style="width: 100%; margin-bottom: 15px;">${escapeHtml(c('reset'))}</button>
              <button class="button-primary" id="btn-save-menu-test" style="width: 100%;">${escapeHtml(c('save'))}</button>
              <p class="help-text">${escapeHtml(c('saveHelp'))}</p>
            </div>
            ${loadingState ? `<div class="info-text">${escapeHtml(isZh() ? '处理中...' : 'Working...')}</div>` : ''}
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
      container.querySelectorAll('[data-label-locale]').forEach((input) => {
        input.addEventListener('input', (event) => {
          const locale = event.target.getAttribute('data-label-locale');
          draftItem.labels = { ...(draftItem.labels || {}), [locale]: event.target.value };
        });
      });
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
