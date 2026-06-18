import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml } from './ui.js';

const copy = {
  en: {
    title: 'GitHub / Cloudflare Management',
    lede: 'Review repository targets, OAuth, Pages deploy hooks, D1, R2, Queue bindings, and write gates. Secrets are never rendered in the browser.',
    github: 'GitHub',
    cloudflare: 'Cloudflare',
    gates: 'Write gates',
    targetRepo: 'Target repository',
    targetBranch: 'Target branch',
    token: 'GitHub token or app',
    oauth: 'GitHub OAuth',
    safeTarget: 'Safe test target',
    configured: 'Configured',
    notConfigured: 'Not configured',
    passed: 'Passed',
    blocked: 'Blocked',
    environment: 'Environment',
    pagesHook: 'Pages deploy hook',
    hookDelay: 'Hook delay',
    d1: 'D1 database',
    r2: 'R2 bucket',
    queue: 'Queue binding',
    bound: 'Bound',
    unbound: 'Not bound',
    publishMode: 'Publish mode',
    liveWrites: 'Production live writes',
    testDirect: 'Test direct publish',
    r2Live: 'Production R2 live upload',
    enabled: 'Enabled',
    disabled: 'Disabled'
  },
  'zh-CN': {
    title: 'GitHub / Cloudflare 管理',
    lede: '集中查看仓库目标、OAuth、Pages deploy hook、D1、R2、Queue 绑定和写入 gate。敏感值只显示配置状态，不在浏览器展示 secret。',
    github: 'GitHub',
    cloudflare: 'Cloudflare',
    gates: '写入 Gate',
    targetRepo: '目标仓库',
    targetBranch: '目标分支',
    token: 'GitHub Token 或 App',
    oauth: 'GitHub OAuth',
    safeTarget: '安全测试目标',
    configured: '已配置',
    notConfigured: '未配置',
    passed: '通过',
    blocked: '阻断',
    environment: '环境',
    pagesHook: 'Pages 部署 Hook',
    hookDelay: 'Hook 延迟',
    d1: 'D1 数据库',
    r2: 'R2 存储桶',
    queue: 'Queue 绑定',
    bound: '已绑定',
    unbound: '未绑定',
    publishMode: '发布模式',
    liveWrites: '生产直接写入',
    testDirect: '测试站直接发布',
    r2Live: '生产 R2 直接上传',
    enabled: '已开启',
    disabled: '已关闭'
  },
  ko: {
    title: 'GitHub / Cloudflare 관리',
    lede: '저장소 대상, OAuth, Pages 배포 Hook, D1, R2, Queue 바인딩, 쓰기 게이트를 확인합니다. 비밀 값은 브라우저에 표시하지 않습니다.',
    github: 'GitHub',
    cloudflare: 'Cloudflare',
    gates: '쓰기 게이트',
    targetRepo: '대상 저장소',
    targetBranch: '대상 브랜치',
    token: 'GitHub 토큰 또는 App',
    oauth: 'GitHub OAuth',
    safeTarget: '안전한 테스트 대상',
    configured: '설정됨',
    notConfigured: '미설정',
    passed: '통과',
    blocked: '차단',
    environment: '환경',
    pagesHook: 'Pages 배포 Hook',
    hookDelay: 'Hook 지연',
    d1: 'D1 데이터베이스',
    r2: 'R2 버킷',
    queue: 'Queue 바인딩',
    bound: '바인딩됨',
    unbound: '미바인딩',
    publishMode: '게시 모드',
    liveWrites: '운영 직접 쓰기',
    testDirect: '테스트 직접 게시',
    r2Live: '운영 R2 직접 업로드',
    enabled: '켜짐',
    disabled: '꺼짐'
  },
  ja: {
    title: 'GitHub / Cloudflare 管理',
    lede: 'リポジトリ対象、OAuth、Pages deploy hook、D1、R2、Queue バインディング、書き込みゲートを確認します。シークレット値はブラウザに表示しません。',
    github: 'GitHub',
    cloudflare: 'Cloudflare',
    gates: '書き込みゲート',
    targetRepo: '対象リポジトリ',
    targetBranch: '対象ブランチ',
    token: 'GitHub トークンまたは App',
    oauth: 'GitHub OAuth',
    safeTarget: '安全なテスト対象',
    configured: '設定済み',
    notConfigured: '未設定',
    passed: '合格',
    blocked: 'ブロック',
    environment: '環境',
    pagesHook: 'Pages デプロイ Hook',
    hookDelay: 'Hook 遅延',
    d1: 'D1 データベース',
    r2: 'R2 バケット',
    queue: 'Queue バインディング',
    bound: 'バインド済み',
    unbound: '未バインド',
    publishMode: '公開モード',
    liveWrites: '本番直接書き込み',
    testDirect: 'テスト直接公開',
    r2Live: '本番 R2 直接アップロード',
    enabled: '有効',
    disabled: '無効'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

export async function fetchIntegrationStatus() {
  const res = await apiFetch('/api/integrations/status');
  if (!res.ok) throw new Error(`Integrations API returned status ${res.status}`);
  return await res.json();
}

export function renderIntegrationsManager(container, data) {
  const github = data?.github || {};
  const cloudflare = data?.cloudflare || {};
  const gates = data?.writeGates || {};
  container.innerHTML = `
    <div class="integrations-workspace">
      <h2>${escapeHtml(c('title'))}</h2>
      <p class="lede">${escapeHtml(c('lede'))}</p>
      <div class="dashboard-grid">
        <div class="card">
          <h3>${escapeHtml(c('github'))}</h3>
          ${row(c('targetRepo'), `${github.owner || '-'} / ${github.repo || '-'}`)}
          ${row(c('targetBranch'), github.branch || '-')}
          ${row(c('token'), github.tokenConfigured ? c('configured') : c('notConfigured'))}
          ${row(c('oauth'), github.oauthConfigured ? c('configured') : c('notConfigured'))}
          ${row(c('safeTarget'), github.safeTestTarget ? c('passed') : c('blocked'))}
        </div>
        <div class="card">
          <h3>${escapeHtml(c('cloudflare'))}</h3>
          ${row(c('environment'), cloudflare.deploymentEnv || '-')}
          ${row(c('pagesHook'), cloudflare.pagesDeployHookConfigured ? c('configured') : c('notConfigured'))}
          ${row(c('hookDelay'), `${cloudflare.pagesDeployHookDelayMs ?? '-'} ms`)}
          ${row(c('d1'), cloudflare.d1Bound ? c('bound') : c('unbound'))}
          ${row(c('r2'), cloudflare.r2Bound ? c('bound') : c('unbound'))}
          ${row(c('queue'), cloudflare.queueBound ? c('bound') : c('unbound'))}
        </div>
        <div class="card">
          <h3>${escapeHtml(c('gates'))}</h3>
          ${row(c('publishMode'), gates.publishMode || '-')}
          ${row(c('liveWrites'), gates.liveWritesEnabled ? c('enabled') : c('disabled'))}
          ${row(c('testDirect'), gates.testDirectPublishEnabled ? c('enabled') : c('disabled'))}
          ${row(c('r2Live'), cloudflare.r2LiveWritesEnabled ? c('enabled') : c('disabled'))}
        </div>
      </div>
    </div>
  `;
}

function row(label, value) {
  return `<div class="meta-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}
