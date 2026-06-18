import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const pluginPackages = {
  'next-theme': 'hexo-theme-next',
  feed: 'hexo-generator-feed',
  sitemap: 'hexo-generator-sitemap',
  search: 'hexo-generator-searchdb',
  waline: '@waline/hexo-next',
  math: 'hexo-filter-mathjax',
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
    saveFile: '保存配置文件',
    saveAll: '保存全部已修改文件',
    install: '安装到 package.json',
    installed: '已安装',
    configured: '已配置',
    available: '可安装',
    configOnly: '内置配置项',
    configTargets: '配置目标',
    packageMissing: 'package.json 不可编辑，无法安装插件。',
    invalidPackage: 'package.json 不是有效 JSON。',
    noChange: '没有检测到可保存的修改。',
    saved: '配置已保存到测试站。',
    saveFailed: '配置保存失败',
    installDone: '插件依赖已加入 package.json，请保存配置。',
    installUnavailable: '此项目是 NexT 内置配置项，请直接编辑主题配置文件。',
    validationFailed: '配置校验失败',
    editConfig: '编辑配置',
    working: '处理中...',
    notInstalledReason: '未检测到 package 依赖或主题配置文件。',
    themeConfigDetected: '已检测到主题配置',
    packageDetected: '已检测到依赖',
    packageNeedsSave: 'package.json 已更新，保存后生效。'
  },
  en: {
    title: 'Hexo / NexT Configuration',
    lede: 'Review and edit Hexo config, NexT theme config, package plugin dependencies, and plugin toggles. Saves use the test-only config update gate.',
    target: 'Target',
    files: 'Config Files',
    plugins: 'NexT Plugins and Config Keys',
    exists: 'Exists',
    missing: 'Missing',
    saveFile: 'Save Config File',
    saveAll: 'Save All Modified Files',
    install: 'Install to package.json',
    installed: 'Installed',
    configured: 'Configured',
    available: 'Available',
    configOnly: 'Built-in Config',
    configTargets: 'Config Targets',
    packageMissing: 'package.json is not editable, so plugins cannot be installed.',
    invalidPackage: 'package.json is not valid JSON.',
    noChange: 'No changes detected.',
    saved: 'Config saved to the test site.',
    saveFailed: 'Config save failed',
    installDone: 'Plugin dependency added to package.json. Save the config to commit it.',
    installUnavailable: 'This item is built into NexT config. Edit the theme config file directly.',
    validationFailed: 'Config validation failed',
    editConfig: 'Edit Config',
    working: 'Working...',
    notInstalledReason: 'No package dependency or theme config file detected.',
    themeConfigDetected: 'Theme config detected',
    packageDetected: 'Package dependency detected',
    packageNeedsSave: 'package.json was updated; save to apply.'
  },
  ko: {
    title: 'Hexo / NexT 설정 관리',
    lede: 'Hexo 기본 설정, NexT 테마 설정, package 플러그인 의존성, 플러그인 스위치를 한곳에서 확인하고 편집합니다. 저장은 test-only 설정 업데이트 gate를 사용합니다.',
    target: '대상',
    files: '설정 파일',
    plugins: 'NexT 플러그인 및 설정 항목',
    exists: '존재',
    missing: '없음',
    saveFile: '설정 파일 저장',
    saveAll: '수정된 모든 파일 저장',
    install: 'package.json에 설치',
    installed: '설치됨',
    configured: '설정됨',
    available: '설치 가능',
    configOnly: '내장 설정',
    configTargets: '설정 대상',
    packageMissing: 'package.json을 편집할 수 없어 플러그인을 설치할 수 없습니다.',
    invalidPackage: 'package.json이 유효한 JSON이 아닙니다.',
    noChange: '변경 사항이 없습니다.',
    saved: '설정을 테스트 사이트에 저장했습니다.',
    saveFailed: '설정 저장 실패',
    installDone: '플러그인 의존성을 package.json에 추가했습니다. 적용하려면 설정을 저장하세요.',
    installUnavailable: '이 항목은 NexT 내장 설정입니다. 테마 설정 파일을 직접 편집하세요.',
    validationFailed: '설정 검증 실패',
    editConfig: '설정 편집',
    working: '처리 중...',
    notInstalledReason: 'package 의존성 또는 테마 설정 파일을 감지하지 못했습니다.',
    themeConfigDetected: '테마 설정 감지됨',
    packageDetected: 'package 의존성 감지됨',
    packageNeedsSave: 'package.json이 업데이트되었습니다. 저장하면 적용됩니다.'
  },
  ja: {
    title: 'Hexo / NexT 設定管理',
    lede: 'Hexo 基本設定、NexT テーマ設定、package プラグイン依存関係、プラグインスイッチをまとめて確認・編集します。保存は test-only 設定更新 gate を使用します。',
    target: '対象',
    files: '設定ファイル',
    plugins: 'NexT プラグインと設定項目',
    exists: '存在',
    missing: 'なし',
    saveFile: '設定ファイルを保存',
    saveAll: '変更済みファイルをすべて保存',
    install: 'package.json にインストール',
    installed: 'インストール済み',
    configured: '設定済み',
    available: 'インストール可能',
    configOnly: '組み込み設定',
    configTargets: '設定対象',
    packageMissing: 'package.json を編集できないため、プラグインをインストールできません。',
    invalidPackage: 'package.json が有効な JSON ではありません。',
    noChange: '変更はありません。',
    saved: '設定をテストサイトへ保存しました。',
    saveFailed: '設定保存に失敗しました',
    installDone: 'プラグイン依存関係を package.json に追加しました。適用するには設定を保存してください。',
    installUnavailable: 'この項目は NexT の組み込み設定です。テーマ設定ファイルを直接編集してください。',
    validationFailed: '設定検証に失敗しました',
    editConfig: '設定を編集',
    working: '処理中...',
    notInstalledReason: 'package 依存関係またはテーマ設定ファイルを検出できませんでした。',
    themeConfigDetected: 'テーマ設定を検出しました',
    packageDetected: 'package 依存関係を検出しました',
    packageNeedsSave: 'package.json が更新されました。保存すると適用されます。'
  }
};

function c(key) {
  const language = getLanguage();
  const localeKey = language === 'zh-CN' ? 'zh' : language;
  return copy[localeKey]?.[key] || copy.en[key] || copy.zh[key] || key;
}

export async function fetchSiteConfig() {
  const res = await apiFetch('/api/site/config');
  if (!res.ok) throw new Error(`Config API returned status ${res.status}`);
  return await res.json();
}

export function renderSiteConfiguration(container, data) {
  const configs = Array.isArray(data?.configs) ? data.configs.map(normalizeConfig) : [];
  const plugins = Array.isArray(data?.pluginCatalog) ? data.pluginCatalog : [];
  let activePath = pickInitialConfigPath(configs);
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

  function configExists(path) {
    return configs.some((file) => file.path === path && file.exists);
  }

  function hasConfigKey(key) {
    const needle = `${key}:`;
    return configs.some((file) => file.exists && String(edited[file.path] || file.content || '').includes(needle));
  }

  function pluginDetection(plugin) {
    const pkg = packageJson();
    const packageName = pluginPackages[plugin.id] || plugin.packageName || '';
    const packageInstalled = Boolean(pkg?.dependencies?.[packageName] || pkg?.devDependencies?.[packageName]);
    const configFileInstalled = (plugin.configFiles || []).some((path) => configExists(path));
    const configKeyInstalled = (plugin.configKeys || []).some((key) => hasConfigKey(key));
    const configOnly = !packageName && (plugin.configKeys || []).length > 0;
    const installed = plugin.id === 'next-theme'
      ? packageInstalled || configFileInstalled
      : packageInstalled;
    return {
      packageName,
      installed,
      configured: configFileInstalled || configKeyInstalled,
      configOnly,
      packageInstalled,
      configFileInstalled,
      configKeyInstalled
    };
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
    if (!packageName) {
      showToast(c('installUnavailable'), 'info');
      return;
    }
    pkgJson.dependencies = { ...(pkgJson.dependencies || {}), [packageName]: pkgJson.dependencies?.[packageName] || 'latest' };
    edited[pkg.path] = `${JSON.stringify(pkgJson, null, 2)}\n`;
    activePath = pkg.path;
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
      actionResultHtml = `<div class="alert alert-info">${escapeHtml(c('noChange'))}</div>`;
      showToast(c('noChange'), 'info');
      draw();
      return;
    }

    const validationError = validateConfigFiles(files);
    if (validationError) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('validationFailed'))}: ${escapeHtml(validationError)}</div>`;
      showToast(`${c('validationFailed')}: ${validationError}`, 'error');
      draw();
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
      for (const file of files) {
        const base = configs.find((candidate) => candidate.path === file.path);
        if (base) base.content = file.content;
      }
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
    const activeFile = configs.find((file) => file.path === activePath) || configs[0];
    container.innerHTML = `
      <div class="config-workspace">
        <h2>${escapeHtml(c('title'))}</h2>
        <p class="lede">${escapeHtml(c('lede'))}</p>
        <div class="alert alert-info">
          ${escapeHtml(c('target'))}: <code>${escapeHtml(data?.targetRepo || '')}@${escapeHtml(data?.targetBranch || '')}</code>
        </div>
        <div class="config-layout">
          <div class="card config-tabs-card">
            <div class="card-title-row">
              <h3>${escapeHtml(c('files'))}</h3>
              <button class="button-small button-secondary" id="btn-save-all-config">${escapeHtml(c('saveAll'))}</button>
            </div>
            <div class="config-tab-list" role="tablist">
              ${configs.map((file) => renderConfigTab(file)).join('')}
            </div>
            ${activeFile ? renderActiveConfig(activeFile) : `<p class="info-text">${escapeHtml(c('missing'))}</p>`}
          </div>
          <div class="card config-plugins-card">
            <h3>${escapeHtml(c('plugins'))}</h3>
            <div class="plugin-grid">
              ${plugins.map((plugin) => renderPlugin(plugin)).join('')}
            </div>
          </div>
        </div>
        ${loading ? `<div class="info-text">${escapeHtml(c('working'))}</div>` : ''}
        ${actionResultHtml}
      </div>
    `;
    bindEvents();
  }

  function renderConfigTab(file) {
    const active = file.path === activePath ? 'active' : '';
    return `
      <button class="config-tab ${active}" data-config-tab="${escapeHtml(file.path)}" role="tab" aria-selected="${active ? 'true' : 'false'}">
        <span>${escapeHtml(file.path)}</span>
        <span class="status-badge" data-state="${file.exists ? 'ok' : 'warning'}">${escapeHtml(file.exists ? c('exists') : c('missing'))}</span>
      </button>
    `;
  }

  function renderActiveConfig(file) {
    if (file.exists && file.editable) {
      return `
        <div class="config-tab-panel">
          <div class="config-tab-meta">
            <strong>${escapeHtml(file.path)}</strong>
            ${file.sha ? `<code>${escapeHtml(file.sha.slice(0, 8))}</code>` : ''}
          </div>
          <label class="config-editor-label">
            <span>${escapeHtml(c('editConfig'))}</span>
            <textarea class="config-editor config-editor-full" data-config-path="${escapeHtml(file.path)}" spellcheck="false">${escapeHtml(edited[file.path] || '')}</textarea>
          </label>
          <button class="button-small button-secondary btn-save-config-file" data-config-save="${escapeHtml(file.path)}">${escapeHtml(c('saveFile'))}</button>
        </div>
      `;
    }
    if (file.exists) {
      return `<pre class="config-preview"><code>${escapeHtml(trimPreview(file.content))}</code></pre>`;
    }
    return `<p class="info-text">${escapeHtml(file.error || 'not_found')}</p>`;
  }

  function renderPlugin(plugin) {
    const detection = pluginDetection(plugin);
    const details = [
      detection.packageInstalled ? c('packageDetected') : '',
      detection.configFileInstalled || detection.configKeyInstalled ? c('themeConfigDetected') : ''
    ].filter(Boolean).join(' · ');
    const statusText = detection.installed ? c('installed') : detection.configured ? c('configured') : c('available');
    const statusState = detection.installed ? 'ok' : detection.configured ? 'info' : 'warning';
    const buttonText = detection.installed ? c('installed') : detection.configOnly ? c('configOnly') : c('install');
    const disabled = detection.installed || detection.configOnly;
    return `
      <div class="plugin-card">
        <div class="plugin-card-head">
          <strong>${escapeHtml(plugin.name)}</strong>
          <span class="status-badge" data-state="${statusState}">${escapeHtml(statusText)}</span>
        </div>
        <span>${escapeHtml(plugin.category)}</span>
        <code>${escapeHtml(detection.packageName || '-')}</code>
        <p class="help-text">${escapeHtml(c('configTargets'))}: ${escapeHtml([...(plugin.configFiles || []), ...(plugin.configKeys || [])].join(', ') || '-')}</p>
        <p class="help-text">${escapeHtml(details || c('notInstalledReason'))}</p>
        <button class="button-small button-secondary btn-install-plugin" data-plugin-id="${escapeHtml(plugin.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(buttonText)}</button>
      </div>
    `;
  }

  function bindEvents() {
    container.querySelectorAll('[data-config-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        activePath = button.getAttribute('data-config-tab');
        draw();
      });
    });
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

function pickInitialConfigPath(configs) {
  return configs.find((file) => file.path === 'themes/next/_config.yml' && file.exists)?.path ||
    configs.find((file) => file.path === '_config.yml')?.path ||
    configs[0]?.path ||
    '';
}

function normalizeConfig(file) {
  return {
    ...file,
    content: String(file.content || ''),
    editable: file.editable === true && file.exists === true
  };
}

function validateConfigFiles(files) {
  for (const file of files) {
    const content = String(file.content || '');
    if (!content.trim()) return `${file.path} is empty.`;
    if (file.path === 'package.json') {
      try {
        JSON.parse(content);
      } catch (err) {
        return `package.json: ${err.message}`;
      }
    }
  }
  return '';
}

function trimPreview(content) {
  const text = String(content || '');
  return text.length > 4000 ? `${text.slice(0, 4000)}\n\n# ... truncated for Admin preview ...` : text;
}
