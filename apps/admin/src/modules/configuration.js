import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const PLUGIN_PACKAGES = {
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
  en: {
    title: 'Hexo / NexT Configuration',
    lede: 'Review Hexo, NexT, package dependencies, and plugin settings. Saves use the test-only configuration gate and never write to production.',
    target: 'Target repository',
    files: 'Configuration files',
    plugins: 'NexT plugins and options',
    exists: 'Exists',
    missing: 'Missing',
    saveFile: 'Save configuration file',
    saveAll: 'Save all modified files',
    install: 'Add dependency to package.json',
    installed: 'Dependency installed',
    configured: 'Configured in theme',
    available: 'Available',
    editConfig: 'Edit configuration',
    openConfig: 'Open configuration file',
    packageMissing: 'package.json is not editable, so dependency changes cannot be prepared.',
    invalidPackage: 'package.json is not valid JSON.',
    noChange: 'No modified configuration files were found.',
    saved: 'Configuration saved to the test site.',
    saveFailed: 'Configuration save failed',
    installDone: 'Dependency added to package.json. Save package.json to commit the change.',
    configOnly: 'This option is controlled by the theme configuration file.',
    validationFailed: 'Configuration validation failed',
    working: 'Saving configuration...',
    notInstalledReason: 'No dependency or matching theme option was detected.',
    themeConfigDetected: 'Theme configuration detected',
    packageDetected: 'Dependency detected',
    filesLabel: 'Files',
    deployTriggered: 'Pages build triggered',
    deployNotTriggered: 'Pages build not triggered',
    emptyFile: 'Configuration content cannot be empty.'
  },
  'zh-CN': {
    title: 'Hexo / NexT 配置管理',
    lede: '集中查看和编辑 Hexo 主配置、NexT 主题配置、package 插件依赖和主题功能开关。保存走 test-only 配置更新 gate，不写生产环境。',
    target: '目标仓库',
    files: '配置文件',
    plugins: 'NexT 插件与配置项',
    exists: '存在',
    missing: '缺失',
    saveFile: '保存配置文件',
    saveAll: '保存全部已修改文件',
    install: '添加依赖到 package.json',
    installed: '依赖已安装',
    configured: '主题配置已启用',
    available: '可配置',
    editConfig: '编辑配置',
    openConfig: '打开配置文件',
    packageMissing: 'package.json 当前不可编辑，无法准备依赖变更。',
    invalidPackage: 'package.json 不是有效 JSON。',
    noChange: '没有检测到已修改的配置文件。',
    saved: '配置已保存到测试站。',
    saveFailed: '配置保存失败',
    installDone: '依赖已加入 package.json，请保存 package.json 以提交变更。',
    configOnly: '此功能由主题配置文件控制，请直接编辑主题配置。',
    validationFailed: '配置校验失败',
    working: '正在保存配置...',
    notInstalledReason: '未检测到依赖或对应主题配置项。',
    themeConfigDetected: '已检测到主题配置',
    packageDetected: '已检测到依赖',
    filesLabel: '文件',
    deployTriggered: '已触发 Pages 构建',
    deployNotTriggered: '未触发 Pages 构建',
    emptyFile: '配置内容不能为空。'
  },
  ko: {
    title: 'Hexo / NexT 설정 관리',
    lede: 'Hexo 기본 설정, NexT 테마 설정, package 플러그인 의존성, 테마 기능 옵션을 한곳에서 확인하고 편집합니다. 저장은 test-only 설정 게이트를 사용하며 운영 환경에는 쓰지 않습니다.',
    target: '대상 저장소',
    files: '설정 파일',
    plugins: 'NexT 플러그인 및 옵션',
    exists: '있음',
    missing: '없음',
    saveFile: '설정 파일 저장',
    saveAll: '수정된 파일 모두 저장',
    install: 'package.json에 의존성 추가',
    installed: '의존성 설치됨',
    configured: '테마 설정됨',
    available: '설정 가능',
    editConfig: '설정 편집',
    openConfig: '설정 파일 열기',
    packageMissing: 'package.json을 편집할 수 없어 의존성 변경을 준비할 수 없습니다.',
    invalidPackage: 'package.json이 올바른 JSON이 아닙니다.',
    noChange: '수정된 설정 파일이 없습니다.',
    saved: '설정을 테스트 사이트에 저장했습니다.',
    saveFailed: '설정 저장 실패',
    installDone: '의존성이 package.json에 추가되었습니다. package.json을 저장해야 커밋됩니다.',
    configOnly: '이 기능은 테마 설정 파일에서 제어합니다.',
    validationFailed: '설정 검증 실패',
    working: '설정을 저장하는 중...',
    notInstalledReason: '의존성 또는 일치하는 테마 옵션을 찾지 못했습니다.',
    themeConfigDetected: '테마 설정 감지됨',
    packageDetected: '의존성 감지됨',
    filesLabel: '파일',
    deployTriggered: 'Pages 빌드가 트리거됨',
    deployNotTriggered: 'Pages 빌드가 트리거되지 않음',
    emptyFile: '설정 내용은 비워 둘 수 없습니다.'
  },
  ja: {
    title: 'Hexo / NexT 設定管理',
    lede: 'Hexo 基本設定、NexT テーマ設定、package のプラグイン依存関係、テーマ機能オプションをまとめて確認・編集します。保存は test-only 設定ゲートを使い、本番環境には書き込みません。',
    target: '対象リポジトリ',
    files: '設定ファイル',
    plugins: 'NexT プラグインとオプション',
    exists: '存在',
    missing: 'なし',
    saveFile: '設定ファイルを保存',
    saveAll: '変更済みファイルをすべて保存',
    install: 'package.json に依存関係を追加',
    installed: '依存関係はインストール済み',
    configured: 'テーマで設定済み',
    available: '設定可能',
    editConfig: '設定を編集',
    openConfig: '設定ファイルを開く',
    packageMissing: 'package.json を編集できないため、依存関係の変更を準備できません。',
    invalidPackage: 'package.json は有効な JSON ではありません。',
    noChange: '変更された設定ファイルはありません。',
    saved: '設定をテストサイトに保存しました。',
    saveFailed: '設定の保存に失敗しました',
    installDone: '依存関係を package.json に追加しました。package.json を保存するとコミットされます。',
    configOnly: 'この機能はテーマ設定ファイルで制御します。',
    validationFailed: '設定の検証に失敗しました',
    working: '設定を保存しています...',
    notInstalledReason: '依存関係または対応するテーマ設定項目が見つかりません。',
    themeConfigDetected: 'テーマ設定を検出しました',
    packageDetected: '依存関係を検出しました',
    filesLabel: 'ファイル',
    deployTriggered: 'Pages ビルドを開始しました',
    deployNotTriggered: 'Pages ビルドは開始されていません',
    emptyFile: '設定内容は空にできません。'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
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

  function configContent(path) {
    const file = configs.find((candidate) => candidate.path === path);
    return String(edited[path] || file?.content || '');
  }

  function themeConfigPaths(plugin) {
    return [...new Set([...(plugin.configFiles || []), 'themes/next/_config.yml', '_config.next.yml'])]
      .filter((path) => configs.some((file) => file.path === path));
  }

  function hasConfigKey(plugin) {
    const keys = plugin.configKeys || [];
    if (keys.length === 0) return false;
    return themeConfigPaths(plugin).some((path) => {
      const content = configContent(path);
      return keys.some((key) => new RegExp(`(^|\\n)\\s*#?\\s*${escapeRegExp(key)}\\s*:`, 'i').test(content));
    });
  }

  function pluginDetection(plugin) {
    const pkg = packageJson();
    const packageName = PLUGIN_PACKAGES[plugin.id] || plugin.packageName || '';
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    const packageInstalled = Boolean(packageName && deps[packageName]);
    const configFileInstalled = (plugin.configFiles || []).some((path) => configExists(path));
    const configKeyInstalled = hasConfigKey(plugin);
    const installed = plugin.id === 'next-theme' ? configFileInstalled || packageInstalled : packageInstalled;
    const configured = configFileInstalled || configKeyInstalled;
    const canInstall = Boolean(packageName && !installed);
    const configTarget = pickPluginConfigTarget(plugin);
    return { packageName, packageInstalled, configFileInstalled, configKeyInstalled, installed, configured, canInstall, configTarget };
  }

  function pickPluginConfigTarget(plugin) {
    const direct = [...(plugin.configFiles || []), 'themes/next/_config.yml', '_config.next.yml']
      .find((path) => configs.some((file) => file.path === path && file.exists));
    return direct || configs.find((file) => file.path === 'themes/next/_config.yml')?.path || configs.find((file) => file.path === '_config.next.yml')?.path || '_config.yml';
  }

  function installPlugin(pluginId) {
    const plugin = plugins.find((item) => item.id === pluginId);
    const detection = plugin ? pluginDetection(plugin) : null;
    if (!plugin || !detection) return;
    if (!detection.canInstall) {
      activePath = detection.configTarget || activePath;
      showToast(c('configOnly'), 'info');
      draw();
      return;
    }

    const pkg = packageConfig();
    const pkgJson = packageJson();
    if (!pkg?.editable) {
      showToast(c('packageMissing'), 'warning');
      return;
    }
    if (!pkgJson) {
      showToast(c('invalidPackage'), 'error');
      return;
    }
    pkgJson.dependencies = { ...(pkgJson.dependencies || {}), [detection.packageName]: pkgJson.dependencies?.[detection.packageName] || 'latest' };
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
      actionResultHtml = renderSaveResult(result);
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

  function renderSaveResult(result) {
    const paths = (result.targetPaths || []).join(', ');
    const deployText = result.pagesDeploy?.triggered ? c('deployTriggered') : c('deployNotTriggered');
    const deployState = result.pagesDeploy?.triggered ? 'ok' : 'warning';
    return `
      <div class="alert alert-success">
        <strong>${escapeHtml(c('saved'))}</strong>
        <code>${escapeHtml(result.targetRepo || '')}@${escapeHtml(result.targetBranch || '')}</code><br/>
        ${escapeHtml(c('filesLabel'))}: <code>${escapeHtml(paths)}</code>
        ${result.commitSha ? `<br/>Commit: <code>${escapeHtml(result.commitSha.substring(0, 12))}</code>` : ''}
        <br/><span class="status-badge" data-state="${deployState}">${escapeHtml(deployText)}</span>
      </div>
    `;
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
              <button class="button-small button-secondary" id="btn-save-all-config" ${loading ? 'disabled' : ''}>${escapeHtml(c('saveAll'))}</button>
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
          <button class="button-small button-secondary btn-save-config-file" data-config-save="${escapeHtml(file.path)}" ${loading ? 'disabled' : ''}>${escapeHtml(c('saveFile'))}</button>
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
    const detailParts = [
      detection.packageInstalled ? c('packageDetected') : '',
      detection.configFileInstalled || detection.configKeyInstalled ? c('themeConfigDetected') : ''
    ].filter(Boolean);
    const statusText = detection.installed ? c('installed') : detection.configured ? c('configured') : c('available');
    const statusState = detection.installed ? 'ok' : detection.configured ? 'info' : 'warning';
    const buttonText = detection.canInstall ? c('install') : c('openConfig');
    const targets = [...(plugin.configFiles || []), ...(plugin.configKeys || [])].join(', ') || '-';
    return `
      <div class="plugin-card">
        <div class="plugin-card-head">
          <strong>${escapeHtml(plugin.name)}</strong>
          <span class="status-badge" data-state="${statusState}">${escapeHtml(statusText)}</span>
        </div>
        <span>${escapeHtml(plugin.category || '-')}</span>
        <code>${escapeHtml(detection.packageName || c('configOnly'))}</code>
        <p class="help-text">${escapeHtml(c('target'))}: ${escapeHtml(targets)}</p>
        <p class="help-text">${escapeHtml(detailParts.join(' / ') || c('notInstalledReason'))}</p>
        <button class="button-small button-secondary btn-install-plugin" data-plugin-id="${escapeHtml(plugin.id)}">${escapeHtml(buttonText)}</button>
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
    configs.find((file) => file.path === '_config.next.yml' && file.exists)?.path ||
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
    if (!content.trim()) return `${file.path}: ${copy.en.emptyFile}`;
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
