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
          <h4>菜单配置 Diff 预览</h4>
          <p>配置文件：<code>${escapeHtml(diff.filePath || data.source || '_config.yml')}</code></p>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No menu changes detected.')}</pre>
          </div>
        </div>
      `;
      showToast('菜单 diff 已生成', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">预览生成失败：${escapeHtml(err.message)}</div>`;
      showToast(`预览生成失败：${err.message}`, 'error');
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
      const deploy = data.pagesDeploy || {};
      const deployState = deploy.triggered
        ? '<span class="status-badge" data-state="ok">已触发 Pages 构建</span>'
        : '<span class="status-badge" data-state="warning">未触发 Pages 构建</span>';
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>已保存到测试站：</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          文件：<code>${escapeHtml((data.targetPaths || [data.targetPath || '']).join(', '))}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          <br/>部署：${deployState}
          ${deploy.deploymentId ? `<br/>Deployment: <code>${escapeHtml(deploy.deploymentId)}</code>` : ''}
          ${deploy.deploymentUrl ? `<br/>Preview: <a href="${escapeHtml(deploy.deploymentUrl)}" target="_blank" rel="noreferrer">${escapeHtml(deploy.deploymentUrl)}</a>` : ''}
          ${deploy.error ? `<br/><span class="text-danger">Deploy hook error: ${escapeHtml(deploy.error)}</span>` : ''}
        </div>
      `;
      showToast(deploy.triggered ? '菜单已保存，并已触发 Pages 构建' : '菜单已保存，但 Pages 构建未触发', deploy.triggered ? 'success' : 'warning');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">测试菜单保存失败：${escapeHtml(err.message)}</div>`;
      showToast(`测试菜单保存失败：${err.message}`, 'error');
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
    showToast(`已在本地删除 "${deletedName}"`, 'info');
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
    showToast('菜单已重置为加载来源', 'info');
    draw();
  }

  function submitDraft(event) {
    event.preventDefault();
    if (!draftItem.label || !draftItem.path) {
      showToast('请填写标签和路径', 'warning');
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
      showToast('菜单项已在本地新增', 'success');
    } else {
      menuItems[editingIndex] = normalized;
      showToast('菜单项已在本地更新', 'success');
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
          <span>路径：<code>${escapeHtml(item.path)}</code></span>
          <span>可见：<code>${item.visible === false ? 'false' : 'true'}</code></span>
          ${item.icon ? `<span>图标：<code>${escapeHtml(item.icon)}</code></span>` : ''}
        </div>
        <div class="inline-actions">
          <button class="button-small button-secondary btn-move-up" data-index="${index}">上移</button>
          <button class="button-small button-secondary btn-move-down" data-index="${index}">下移</button>
          <button class="button-small button-secondary btn-edit-item" data-index="${index}">编辑</button>
          <button class="button-small button-danger btn-delete-item" data-index="${index}">删除</button>
        </div>
      </div>
    `).join('') : '<p class="info-text">菜单结构中没有项目。</p>';

    container.innerHTML = `
      <div class="menu-workspace">
        <h2>站点菜单管理</h2>
        <div class="alert alert-info">
          <strong>测试站持久化：</strong> 菜单修改先在本地编辑；预览 diff 后点击“保存到测试站”会写入 <code>ranbeioc/xhalo-blog-test@main</code> 并触发 Cloudflare Pages 构建。生产写入仍保持禁用。
        </div>

        <div class="menu-layout-grid">
          <div class="card menu-items-list-card">
            <h3>菜单链接结构</h3>
            <div class="menu-list">${listHtml}</div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);"/>
            <h3>${editingIndex == null ? '新增菜单项' : '编辑菜单项'}</h3>
            <form id="menu-item-form" class="inline-form">
              <label><span>标签</span><input type="text" id="item-label" value="${escapeHtml(draftItem.label || draftItem.name || '')}" placeholder="例如：关于" /></label>
              <label><span>路径</span><input type="text" id="item-path" value="${escapeHtml(draftItem.path || '/')}" placeholder="例如：/about/" /></label>
              <label><span>图标</span><input type="text" id="item-icon" value="${escapeHtml(draftItem.icon || '')}" placeholder="例如：user" /></label>
              <label><span>可见</span><select id="item-visible"><option value="true" ${draftItem.visible !== false ? 'selected' : ''}>true</option><option value="false" ${draftItem.visible === false ? 'selected' : ''}>false</option></select></label>
              <button type="submit" class="button-secondary" style="margin-top: 10px; width: 100%;">${editingIndex == null ? '新增链接' : '更新链接'}</button>
            </form>
          </div>

          <div class="menu-preview-actions-card">
            <div class="card operational-card">
              <h3>操作中心</h3>
              <button class="button-primary" id="btn-preview-menu-diff" style="width: 100%; margin-bottom: 15px;">预览菜单 Diff</button>
              <button class="button-secondary" id="btn-reset-menu" style="width: 100%; margin-bottom: 15px;">重置已加载菜单</button>
              <button class="button-primary" id="btn-save-menu-test" style="width: 100%;">保存到测试站</button>
              <p class="help-text">保存会使用一次 GitHub 原子提交同时更新框架配置和 NexT 菜单配置，并通过 Pages deploy hook 触发测试站重建。</p>
            </div>
            ${loadingState ? '<div class="info-text">处理中...</div>' : ''}
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
