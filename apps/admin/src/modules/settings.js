import { ADMIN_API_BASE_URL } from '../config.js';
import { getAdminSecret, saveAdminSecret } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const MASKED = '••••••••••••••••';

const copy = {
  en: {
    title: 'Settings and Workspace Boundary',
    lede: 'Review the Admin API endpoint, target content repository, Pages deployment boundary, and optional local debug fallback.',
    boundary: 'Admin deployment boundary',
    integration: 'Project integration',
    integrationBody: 'Admin UI is built from apps/admin and mounted into the private xhalo-blog-test site at /admin. No separate Cloudflare Pages project is required for the blog admin.',
    frontendRepo: 'Frontend source',
    deploymentTarget: 'Deployment target',
    domain: 'Admin URL',
    buildCommand: 'Private test site build command',
    outputDirectory: 'Private test site output directory',
    api: 'API endpoint configuration',
    apiHelp: 'When Admin is mounted under the Pages site, same-origin /api and /auth requests are proxied to the staging Worker.',
    resolvedApi: 'Resolved API base URL',
    authCallback: 'Auth callback path',
    sessionEndpoint: 'Session endpoint',
    repository: 'Target content repository',
    testTarget: 'Test direct target',
    targetBranch: 'Target branch',
    forbiddenTarget: 'Forbidden target',
    advanced: 'Advanced local debug fallback',
    advancedHelp: 'Use this only for local simulators or legacy smoke tests. The live Admin should use GitHub OAuth administrator sessions.',
    placeholder: 'Enter local debug secret',
    save: 'Save',
    clear: 'Clear',
    status: 'Status',
    secretConfigured: 'Local debug secret is configured.',
    secretMissing: 'No local debug secret is configured.',
    unchanged: 'Local debug secret is unchanged.',
    empty: 'Enter a local debug secret or clear the saved value.',
    saved: 'Local debug secret saved.',
    cleared: 'Local debug secret cleared.'
  },
  'zh-CN': {
    title: '设置与工作区边界',
    lede: '查看 Admin API 端点、目标内容仓库、Pages 部署边界和可选的本地调试兜底配置。',
    boundary: 'Admin 部署边界',
    integration: '项目集成',
    integrationBody: 'Admin UI 从 apps/admin 构建，并挂载到私有 xhalo-blog-test 站点的 /admin 路径。博客后台不需要单独的 Cloudflare Pages 项目。',
    frontendRepo: '前端源码',
    deploymentTarget: '部署目标',
    domain: 'Admin 访问地址',
    buildCommand: '私有测试站构建命令',
    outputDirectory: '私有测试站输出目录',
    api: 'API 端点配置',
    apiHelp: 'Admin 挂载在 Pages 站点下时，同源 /api 和 /auth 请求由 Pages Worker 代理到 staging Worker。',
    resolvedApi: '解析后的 API Base URL',
    authCallback: '认证回调路径',
    sessionEndpoint: '会话查询端点',
    repository: '目标内容仓库',
    testTarget: '测试直发目标',
    targetBranch: '目标分支',
    forbiddenTarget: '禁止目标',
    advanced: '高级本地调试兜底',
    advancedHelp: '仅用于本地模拟器或旧 smoke test。线上 Admin 应使用 GitHub OAuth 管理员会话。',
    placeholder: '输入本地调试 secret',
    save: '保存',
    clear: '清除',
    status: '状态',
    secretConfigured: '已配置本地调试 secret。',
    secretMissing: '未配置本地调试 secret。',
    unchanged: '本地调试 secret 未变化。',
    empty: '请输入本地调试 secret，或清除已保存值。',
    saved: '本地调试 secret 已保存。',
    cleared: '本地调试 secret 已清除。'
  },
  ko: {
    title: '설정 및 작업 영역 경계',
    lede: 'Admin API 엔드포인트, 대상 콘텐츠 저장소, Pages 배포 경계, 선택적 로컬 디버그 대체 설정을 확인합니다.',
    boundary: 'Admin 배포 경계',
    integration: '프로젝트 통합',
    integrationBody: 'Admin UI는 apps/admin에서 빌드되어 비공개 xhalo-blog-test 사이트의 /admin 경로에 마운트됩니다. 블로그 Admin을 위한 별도 Cloudflare Pages 프로젝트는 필요하지 않습니다.',
    frontendRepo: '프런트엔드 소스',
    deploymentTarget: '배포 대상',
    domain: 'Admin URL',
    buildCommand: '비공개 테스트 사이트 빌드 명령',
    outputDirectory: '비공개 테스트 사이트 출력 디렉터리',
    api: 'API 엔드포인트 설정',
    apiHelp: 'Admin이 Pages 사이트 아래에 마운트되면 동일 출처 /api 및 /auth 요청은 Pages Worker를 통해 staging Worker로 프록시됩니다.',
    resolvedApi: '해석된 API Base URL',
    authCallback: '인증 콜백 경로',
    sessionEndpoint: '세션 조회 엔드포인트',
    repository: '대상 콘텐츠 저장소',
    testTarget: '테스트 직접 대상',
    targetBranch: '대상 브랜치',
    forbiddenTarget: '금지 대상',
    advanced: '고급 로컬 디버그 대체',
    advancedHelp: '로컬 시뮬레이터 또는 이전 smoke test에서만 사용하세요. 온라인 Admin은 GitHub OAuth 관리자 세션을 사용해야 합니다.',
    placeholder: '로컬 디버그 secret 입력',
    save: '저장',
    clear: '지우기',
    status: '상태',
    secretConfigured: '로컬 디버그 secret이 설정되어 있습니다.',
    secretMissing: '로컬 디버그 secret이 설정되어 있지 않습니다.',
    unchanged: '로컬 디버그 secret이 변경되지 않았습니다.',
    empty: '로컬 디버그 secret을 입력하거나 저장된 값을 지우세요.',
    saved: '로컬 디버그 secret을 저장했습니다.',
    cleared: '로컬 디버그 secret을 지웠습니다.'
  },
  ja: {
    title: '設定とワークスペース境界',
    lede: 'Admin API エンドポイント、対象コンテンツリポジトリ、Pages デプロイ境界、任意のローカルデバッグ代替設定を確認します。',
    boundary: 'Admin デプロイ境界',
    integration: 'プロジェクト統合',
    integrationBody: 'Admin UI は apps/admin からビルドされ、非公開 xhalo-blog-test サイトの /admin にマウントされます。ブログ Admin 用の別 Cloudflare Pages プロジェクトは不要です。',
    frontendRepo: 'フロントエンドソース',
    deploymentTarget: 'デプロイ対象',
    domain: 'Admin URL',
    buildCommand: '非公開テストサイトのビルドコマンド',
    outputDirectory: '非公開テストサイトの出力ディレクトリ',
    api: 'API エンドポイント設定',
    apiHelp: 'Admin が Pages サイト配下にマウントされる場合、同一オリジンの /api と /auth は Pages Worker から staging Worker へプロキシされます。',
    resolvedApi: '解決済み API Base URL',
    authCallback: '認証コールバックパス',
    sessionEndpoint: 'セッション照会エンドポイント',
    repository: '対象コンテンツリポジトリ',
    testTarget: 'テスト直接公開対象',
    targetBranch: '対象ブランチ',
    forbiddenTarget: '禁止対象',
    advanced: '高度なローカルデバッグ代替',
    advancedHelp: 'ローカルシミュレーターまたは旧 smoke test のみに使用します。オンライン Admin は GitHub OAuth 管理者セッションを使用してください。',
    placeholder: 'ローカルデバッグ secret を入力',
    save: '保存',
    clear: 'クリア',
    status: '状態',
    secretConfigured: 'ローカルデバッグ secret は設定済みです。',
    secretMissing: 'ローカルデバッグ secret は未設定です。',
    unchanged: 'ローカルデバッグ secret は変更されていません。',
    empty: 'ローカルデバッグ secret を入力するか保存済み値をクリアしてください。',
    saved: 'ローカルデバッグ secret を保存しました。',
    cleared: 'ローカルデバッグ secret をクリアしました。'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

export function renderSettings(container, { dashboardData }) {
  const configUrl = ADMIN_API_BASE_URL || window.location.origin;
  const hasSecret = Boolean(getAdminSecret());
  const readiness = dashboardData?.readiness || {};
  const targetRepo = readiness.testDirectTargetRepo || 'ranbeioc/xhalo-blog-test';
  const targetBranch = readiness.testDirectTargetBranch || 'main';

  container.innerHTML = `
    <div class="settings-workspace">
      <h2>${escapeHtml(c('title'))}</h2>
      <p class="lede">${escapeHtml(c('lede'))}</p>
      <div class="settings-grid">
        <div class="card boundary-info-card">
          <h3>${escapeHtml(c('boundary'))}</h3>
          <div class="alert alert-info">
            <strong>${escapeHtml(c('integration'))}:</strong> ${escapeHtml(c('integrationBody'))}
          </div>
          <div class="meta-grid">
            ${row(c('frontendRepo'), 'ranbeioc/xhalo-blog/apps/admin')}
            ${row(c('deploymentTarget'), 'xhalo-blog-test')}
            ${row(c('domain'), 'https://xhalo-blog-test.pages.dev/admin')}
            ${row(c('buildCommand'), 'npm ci && npm run build')}
            ${row(c('outputDirectory'), 'public')}
          </div>
        </div>
        <div class="card api-endpoints-card">
          <h3>${escapeHtml(c('api'))}</h3>
          <p class="help-text">${escapeHtml(c('apiHelp'))}</p>
          <div class="meta-grid">
            ${row(c('resolvedApi'), configUrl)}
            ${row(c('authCallback'), '/auth/github/callback')}
            ${row(c('sessionEndpoint'), '/api/auth/session')}
          </div>
        </div>
        <div class="card repo-settings-card">
          <h3>${escapeHtml(c('repository'))}</h3>
          <div class="meta-grid">
            ${row(c('testTarget'), targetRepo)}
            ${row(c('targetBranch'), targetBranch)}
            ${row(c('forbiddenTarget'), 'ranbeioc/hexo-blog@main')}
          </div>
        </div>
        <details class="card advanced-debug-card">
          <summary>${escapeHtml(c('advanced'))}</summary>
          <div class="details-content">
            <p class="help-text">${escapeHtml(c('advancedHelp'))}</p>
            <div class="settings-secret-row">
              <input type="password" id="input-admin-secret" class="form-input" placeholder="${escapeHtml(c('placeholder'))}" value="${hasSecret ? MASKED : ''}" />
              <button id="btn-save-secret" class="button-secondary">${escapeHtml(c('save'))}</button>
              <button id="btn-clear-secret" class="button-secondary">${escapeHtml(c('clear'))}</button>
            </div>
            <p id="secret-status-text" class="help-text">${escapeHtml(c('status'))}: ${escapeHtml(hasSecret ? c('secretConfigured') : c('secretMissing'))}</p>
          </div>
        </details>
      </div>
    </div>
  `;

  bindSecretControls(container);
}

function bindSecretControls(container) {
  const inputSecret = container.querySelector('#input-admin-secret');
  const btnSave = container.querySelector('#btn-save-secret');
  const btnClear = container.querySelector('#btn-clear-secret');
  const statusText = container.querySelector('#secret-status-text');

  btnSave?.addEventListener('click', () => {
    const val = inputSecret.value.trim();
    if (val === MASKED) {
      showToast(c('unchanged'), 'info');
      return;
    }
    if (!val) {
      showToast(c('empty'), 'warning');
      return;
    }
    saveAdminSecret(val);
    statusText.textContent = `${c('status')}: ${c('secretConfigured')}`;
    inputSecret.value = MASKED;
    showToast(c('saved'), 'success');
  });

  btnClear?.addEventListener('click', () => {
    saveAdminSecret('');
    statusText.textContent = `${c('status')}: ${c('secretMissing')}`;
    inputSecret.value = '';
    showToast(c('cleared'), 'info');
  });
}

function row(label, value) {
  return `<div class="meta-row"><span>${escapeHtml(label)}</span><code>${escapeHtml(String(value))}</code></div>`;
}
