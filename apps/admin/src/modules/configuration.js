import { apiFetch } from './api-client.js';
import { isZh } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const pluginPackages = {
  feed: 'hexo-generator-feed',
  sitemap: 'hexo-generator-sitemap',
  search: 'hexo-generator-searchdb',
  waline: '@waline/hexo-next',
  mermaid: 'hexo-filter-mermaid-diagrams',
  lazyload: 'hexo-lazyload-image',
  pjax: 'theme-next-pjax'
};

const copy = {
  zh: {
    title: 'Hexo / NexT 配置管理',
    lede: '集中查看和编辑 Hexo 主配置、NexT 主题配置、package 插件依赖和插件开关。保存走 test-only 配置更新 gate。',
    target: '目标',
    files: '配置文件',
    plugins: 'NexT 插件与配置项',
    exists: '存在',
    missing: '缺失',
    saveFile: '保存此文件到测试站',
    saveAll: '保存全部已修改文件',
    install: '安装到 package.json',
    installed: '已安装',
    available: '可安装',
    configTargets: '配置目标',
    packageMissing: 'package.json 不可编辑，无法安装插件。',
    invalidPackage: 'package.json 不是有效 JSON。',
    noChange: '没有检测到可保存的修改。',
    saved: '配置已保存到测试站。',
    saveFailed: '配置保存失败',
    installDone: '插件依赖已加入 package.json，请保存配置。',
    editConfig: '编辑配置'
  },
  en: {
    title: 'Hexo / NexT Configuration',
    lede: 'Review and edit Hexo config, NexT theme config, package plugin dependencies, and plugin toggles. Saves use the test-only config update gate.',
    target: 'Target',
    files: 'Config Files',
    plugins: 'NexT Plugins and Config Keys',
    exists: 'Exists',
    missing: 'Missing',
    saveFile: 'Save This File to Test Site',
    saveAll: 'Save All Modified Files',
    install: 'Install to package.json',
    installed: 'Installed',
    available: 'Available',
    configTargets: 'Config Targets',
    packageMissing: 'package.json is not editable, so plugins cannot be installed.',
    invalidPackage: 'package.json is not valid JSON.',
    noChange: 'No changes detected.',
    saved: 'Config saved to the test site.',
    saveFailed: 'Config save failed',
    installDone: 'Plugin dependency added to package.json. Save the config to commit it.',
    editConfig: 'Edit Config'
  }
};

function c(key) {
  return (isZh() ? copy.zh : copy.en)[key];
}

export async function fetchSiteConfig() {
  const res = await apiFetch('/api/site/config');
  if (!res.ok) throw new Error(`Config API returned status ${res.status}`);
  return await res.json();
}

export function renderSiteConfiguration(container, data) {
  const configs = Array.isArray(data?.configs) ? data.configs.map(normalizeConfig) : [];
  const plugins = Array.isArray(data?.pluginCatalog) ? data.pluginCatalog : [];
  let edited = Object.fromEntries(configs.map((file) => [file.path, file.content || '']));
  let actionResultHtml = '';
  let loading = false;

  function packageConfig() {
    return configs.find((file) => file.path === 'package.json');
  }

  function packageJson() {
    const pkg = packageConfig();
    if (!pkg?.editable) return null;
    try {
      return JSON.parse(edited[pkg.path] || '{}');
    } catch {
      return null;
    }
  }

  function isPluginInstalled(plugin) {
    const pkg = packageJson();
    const packageName = pluginPackages[plugin.id] || plugin.name;
    return Boolean(pkg?.dependencies?.[packageName] || pkg?.devDependencies?.[packageName]);
  }

  function installPlugin(pluginId) {
    const pkg = packageConfig();
    const pkgJson = packageJson();
    const packageName = pluginPackages[pluginId];
    if (!pkg?.editable) {
      showToast(c('packageMissing'), 'warning');
      return;
    }
    if (!pkgJson) {
      showToast(c('invalidPackage'), 'error');
      return;
    }
    if (!packageName) return;
    pkgJson.dependencies = { ...(pkgJson.dependencies || {}), [packageName]: pkgJson.dependencies?.[packageName] || 'latest' };
    edited[pkg.path] = `${JSON.stringify(pkgJson, null, 2)}\n`;
    showToast(c('installDone'), 'success');
    draw();
  }

  async function saveConfig(paths) {
    const files = paths
      .map((path) => configs.find((file) => file.path === path))
      .filter(Boolean)
      .filter((file) => file.editable)
      .map((file) => ({ path: file.path, content: edited[file.path] ?? '' }))
      .filter((file) => file.content !== (configs.find((base) => base.path === file.path)?.content || ''));

    if (files.length === 0) {
      showToast(c('noChange'), 'info');
      return;
    }

    loading = true;
    actionResultHtml = '';
    draw();
    try {
      const res = await apiFetch('/api/site/config/test-direct-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.code || 'Config update failed');
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>${escapeHtml(c('saved'))}</strong>
          <code>${escapeHtml(result.targetRepo || '')}@${escapeHtml(result.targetBranch || '')}</code><br/>
          Files: <code>${escapeHtml((result.targetPaths || []).join(', '))}</code>
          ${result.commitSha ? `<br/>Commit: <code>${escapeHtml(result.commitSha.substring(0, 12))}</code>` : ''}
          ${result.pagesDeploy?.triggered ? '<br/><span class="status-badge" data-state="ok">Pages build triggered</span>' : '<br/><span class="status-badge" data-state="warning">Pages build not triggered</span>'}
        </div>
      `;
      showToast(c('saved'), 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('saveFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('saveFailed')}: ${err.message}`, 'error');
    } finally {
      loading = false;
      draw();
    }
  }

  function draw() {
    container.innerHTML = `
      <div class="config-workspace">
        <h2>${escapeHtml(c('title'))}</h2>
        <p class="lede">${escapeHtml(c('lede'))}</p>
        <div class="alert alert-info">
          ${escapeHtml(c('target'))}: <code>${escapeHtml(data?.targetRepo || '')}@${escapeHtml(data?.targetBranch || '')}</code>
        </div>
        <div class="dashboard-grid config-dashboard-grid">
          <div class="card config-files-card">
            <div class="card-title-row">
              <h3>${escapeHtml(c('files'))}</h3>
              <button class="button-small button-secondary" id="btn-save-all-config">${escapeHtml(c('saveAll'))}</button>
            </div>
            <div class="config-file-list">
              ${configs.map((file) => renderConfigFile(file)).join('')}
            </div>
          </div>
          <div class="card config-plugins-card">
            <h3>${escapeHtml(c('plugins'))}</h3>
            <div class="plugin-grid">
              ${plugins.map((plugin) => renderPlugin(plugin)).join('')}
            </div>
          </div>
        </div>
        ${loading ? '<div class="info-text">Working...</div>' : ''}
        ${actionResultHtml}
      </div>
    `;
    bindEvents();
  }

  function renderConfigFile(file) {
    return `
      <details class="config-file" ${file.exists ? '' : 'open'}>
        <summary>
          <strong>${escapeHtml(file.path)}</strong>
          <span class="status-badge" data-state="${file.exists ? 'ok' : 'warning'}">${escapeHtml(file.exists ? c('exists') : c('missing'))}</span>
          ${file.sha ? `<code>${escapeHtml(file.sha.slice(0, 8))}</code>` : ''}
        </summary>
        ${file.exists && file.editable ? `
          <label class="config-editor-label">
            <span>${escapeHtml(c('editConfig'))}</span>
            <textarea class="config-editor" data-config-path="${escapeHtml(file.path)}" spellcheck="false">${escapeHtml(edited[file.path] || '')}</textarea>
          </label>
          <button class="button-small button-secondary btn-save-config-file" data-config-save="${escapeHtml(file.path)}">${escapeHtml(c('saveFile'))}</button>
        ` : file.exists ? `<pre class="config-preview"><code>${escapeHtml(trimPreview(file.content))}</code></pre>` : `<p class="info-text">${escapeHtml(file.error || 'not_found')}</p>`}
      </details>
    `;
  }

  function renderPlugin(plugin) {
    const installed = isPluginInstalled(plugin);
    const packageName = pluginPackages[plugin.id] || plugin.name;
    return `
      <div class="plugin-card">
        <div class="plugin-card-head">
          <strong>${escapeHtml(plugin.name)}</strong>
          <span class="status-badge" data-state="${installed ? 'ok' : 'warning'}">${escapeHtml(installed ? c('installed') : c('available'))}</span>
        </div>
        <span>${escapeHtml(plugin.category)}</span>
        <code>${escapeHtml(packageName || '-')}</code>
        <p class="help-text">${escapeHtml(c('configTargets'))}: ${escapeHtml([...(plugin.configFiles || []), ...(plugin.configKeys || [])].join(', ') || '-')}</p>
        <button class="button-small button-secondary btn-install-plugin" data-plugin-id="${escapeHtml(plugin.id)}" ${installed ? 'disabled' : ''}>${escapeHtml(c('install'))}</button>
      </div>
    `;
  }

  function bindEvents() {
    container.querySelectorAll('[data-config-path]').forEach((input) => {
      input.addEventListener('input', () => {
        edited[input.getAttribute('data-config-path')] = input.value;
      });
    });
    container.querySelectorAll('[data-config-save]').forEach((button) => {
      button.addEventListener('click', () => saveConfig([button.getAttribute('data-config-save')]));
    });
    container.querySelector('#btn-save-all-config')?.addEventListener('click', () => saveConfig(configs.map((file) => file.path)));
    container.querySelectorAll('[data-plugin-id]').forEach((button) => {
      button.addEventListener('click', () => installPlugin(button.getAttribute('data-plugin-id')));
    });
  }

  draw();
}

function normalizeConfig(file) {
  return {
    ...file,
    content: String(file.content || ''),
    editable: file.editable === true && file.exists === true
  };
}

function trimPreview(content) {
  const text = String(content || '');
  return text.length > 4000 ? `${text.slice(0, 4000)}\n\n# ... truncated for Admin preview ...` : text;
}
