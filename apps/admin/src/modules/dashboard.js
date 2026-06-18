import { apiFetch } from './api-client.js';
import { getLanguage, t } from './i18n.js';
import { escapeHtml } from './ui.js';

const FAST_PANEL_TIMEOUT_MS = 1200;
const OPTIONAL_STATS_TIMEOUT_MS = 900;

const copy = {
  en: {
    systemStatus: 'System Status',
    apiHealth: 'API health',
    details: 'Details',
    firstAdmin: 'First GitHub admin',
    bootstrapAllowed: 'Test bootstrap allowed',
    bootstrapDisabled: 'Production bootstrap disabled by default',
    safetyNotice: 'Production writes, production R2 live upload, and hexo-blog@main writes remain blocked.',
    gateStatus: 'Security Gate Status',
    publishMode: 'Publish mode',
    testDirect: 'Test direct publish',
    testTarget: 'Test target',
    oauthLogin: 'OAuth login',
    enabled: 'Enabled',
    disabled: 'Disabled',
    dataTitle: 'Blog Data and Operations',
    statsDeferred: 'Detailed statistics are loaded from the Blog Stats page. The dashboard keeps first paint fast by avoiding full GitHub scans.',
    capabilities: 'Service Capabilities',
    capabilityUnavailable: 'Capability status is unavailable. Sign in with GitHub or verify the staging API configuration.',
    boundaries: 'Known Boundaries',
    boundaryMedia: 'Media Manager supports dry-run planning and test-only signed upload when the test gate is enabled.',
    boundaryMenu: 'Menu Manager supports local validation, diff preview, and saving to the private test site.',
    boundaryPublish: 'Test Direct Publish requires a GitHub admin session, test environment, test_direct mode, and a safe non-production target.',
    posts: 'Posts',
    published: 'Published',
    media: 'Media',
    tasks: 'Tasks',
    auditEvents: 'Audit events',
    failedEvents: 'Failed events',
    indexedPosts: 'Indexed source posts',
    publishedRecords: 'Published records',
    mediaRecords: 'Recorded media assets',
    taskRecords: 'Publish or upload tasks',
    auditRecords: 'Recent administrative events',
    failedRecords: 'Non-2xx audit records'
  },
  'zh-CN': {
    systemStatus: '系统状态',
    apiHealth: 'API 健康状态',
    details: '详情',
    firstAdmin: '首个 GitHub 管理员',
    bootstrapAllowed: '测试环境允许初始化',
    bootstrapDisabled: '生产环境默认禁用初始化',
    safetyNotice: '生产写入、生产 R2 实时上传和 hexo-blog@main 写入均保持阻断。',
    gateStatus: '安全门控状态',
    publishMode: '发布模式',
    testDirect: '测试直发',
    testTarget: '测试目标',
    oauthLogin: 'OAuth 登录',
    enabled: '已启用',
    disabled: '已禁用',
    dataTitle: '博客数据与操作',
    statsDeferred: '详细统计由“博客统计”页面分页加载；仪表盘避免全量 GitHub 扫描以保证首屏速度。',
    capabilities: '服务能力',
    capabilityUnavailable: '能力状态不可用。请使用 GitHub 登录，或检查 staging API 配置。',
    boundaries: '已知边界',
    boundaryMedia: '媒体管理支持 dry-run 规划；测试门控开启后支持 test-only 签名上传。',
    boundaryMenu: '菜单管理支持本地校验、diff 预览，并保存到私有测试站。',
    boundaryPublish: '测试直发需要 GitHub 管理员会话、测试环境、test_direct 模式和安全的非生产目标。',
    posts: '文章',
    published: '已发布',
    media: '媒体',
    tasks: '任务',
    auditEvents: '审计事件',
    failedEvents: '失败事件',
    indexedPosts: '已索引源文章',
    publishedRecords: '发布记录',
    mediaRecords: '媒体资产记录',
    taskRecords: '发布或上传任务',
    auditRecords: '近期管理事件',
    failedRecords: '非 2xx 审计记录'
  },
  ko: {
    systemStatus: '시스템 상태',
    apiHealth: 'API 상태',
    details: '상세 정보',
    firstAdmin: '첫 GitHub 관리자',
    bootstrapAllowed: '테스트 환경에서 초기화 허용',
    bootstrapDisabled: '프로덕션에서는 기본적으로 초기화 비활성화',
    safetyNotice: '프로덕션 쓰기, 프로덕션 R2 실시간 업로드, hexo-blog@main 쓰기는 계속 차단됩니다.',
    gateStatus: '보안 게이트 상태',
    publishMode: '게시 모드',
    testDirect: '테스트 직접 게시',
    testTarget: '테스트 대상',
    oauthLogin: 'OAuth 로그인',
    enabled: '활성화됨',
    disabled: '비활성화됨',
    dataTitle: '블로그 데이터 및 작업',
    statsDeferred: '상세 통계는 블로그 통계 페이지에서 페이지 단위로 로드됩니다. 대시보드는 첫 화면 속도를 위해 전체 GitHub 스캔을 피합니다.',
    capabilities: '서비스 기능',
    capabilityUnavailable: '기능 상태를 사용할 수 없습니다. GitHub로 로그인하거나 staging API 설정을 확인하세요.',
    boundaries: '확인된 경계',
    boundaryMedia: '미디어 관리는 dry-run 계획을 지원하며, 테스트 게이트가 켜진 경우 test-only 서명 업로드를 지원합니다.',
    boundaryMenu: '메뉴 관리는 로컬 검증, diff 미리보기, 비공개 테스트 사이트 저장을 지원합니다.',
    boundaryPublish: '테스트 직접 게시는 GitHub 관리자 세션, 테스트 환경, test_direct 모드, 안전한 비프로덕션 대상이 필요합니다.',
    posts: '글',
    published: '게시됨',
    media: '미디어',
    tasks: '작업',
    auditEvents: '감사 이벤트',
    failedEvents: '실패 이벤트',
    indexedPosts: '색인된 원본 글',
    publishedRecords: '게시 기록',
    mediaRecords: '미디어 자산 기록',
    taskRecords: '게시 또는 업로드 작업',
    auditRecords: '최근 관리 이벤트',
    failedRecords: '2xx가 아닌 감사 기록'
  },
  ja: {
    systemStatus: 'システム状態',
    apiHealth: 'API 状態',
    details: '詳細',
    firstAdmin: '最初の GitHub 管理者',
    bootstrapAllowed: 'テスト環境では初期化を許可',
    bootstrapDisabled: '本番では初期化を既定で無効化',
    safetyNotice: '本番書き込み、本番 R2 ライブアップロード、hexo-blog@main への書き込みは引き続きブロックされます。',
    gateStatus: 'セキュリティゲート状態',
    publishMode: '公開モード',
    testDirect: 'テスト直接公開',
    testTarget: 'テスト対象',
    oauthLogin: 'OAuth ログイン',
    enabled: '有効',
    disabled: '無効',
    dataTitle: 'ブログデータと操作',
    statsDeferred: '詳細統計はブログ統計ページでページ単位に読み込みます。ダッシュボードは初回表示を速くするため GitHub 全量スキャンを避けます。',
    capabilities: 'サービス機能',
    capabilityUnavailable: '機能状態を取得できません。GitHub でログインするか、staging API 設定を確認してください。',
    boundaries: '既知の境界',
    boundaryMedia: 'メディア管理は dry-run 計画をサポートし、テストゲート有効時は test-only 署名アップロードをサポートします。',
    boundaryMenu: 'メニュー管理はローカル検証、diff プレビュー、非公開テストサイトへの保存をサポートします。',
    boundaryPublish: 'テスト直接公開には GitHub 管理者セッション、テスト環境、test_direct モード、安全な非本番対象が必要です。',
    posts: '記事',
    published: '公開済み',
    media: 'メディア',
    tasks: 'タスク',
    auditEvents: '監査イベント',
    failedEvents: '失敗イベント',
    indexedPosts: '索引済みソース記事',
    publishedRecords: '公開記録',
    mediaRecords: 'メディア資産記録',
    taskRecords: '公開またはアップロードタスク',
    auditRecords: '最近の管理イベント',
    failedRecords: '非 2xx 監査記録'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

export async function fetchDashboardData() {
  const [health, readiness, stats, auditSummary] = await Promise.all([
    fetchJsonOrNull('/api/health', FAST_PANEL_TIMEOUT_MS),
    fetchJsonOrNull('/api/readiness', FAST_PANEL_TIMEOUT_MS),
    fetchJsonOrNull('/api/blog/stats', OPTIONAL_STATS_TIMEOUT_MS),
    fetchJsonOrNull('/api/audit-logs/summary', OPTIONAL_STATS_TIMEOUT_MS)
  ]);

  return {
    health: health || { ok: false, note: 'Offline or connection failed' },
    readiness,
    stats,
    auditSummary
  };
}

async function fetchJsonOrNull(path, timeoutMs) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await apiFetch(path, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export function renderDashboard(container, data) {
  const { health, readiness, stats, auditSummary } = data;
  const healthState = health.ok ? 'ok' : 'error';
  const healthLabel = health.ok ? t('statusHealthy') : t('statusUnhealthy');
  const homeUrl = `${window.location.origin}/`;

  const readinessListHtml = readiness?.items?.length
    ? readiness.items.map((item) => `
      <div class="readiness-item card">
        <div class="readiness-header">
          <strong class="item-title">${escapeHtml(item.label)}</strong>
          <span class="status-badge" data-state="${item.status === 'ready' ? 'ok' : item.status === 'partial' ? 'warning' : 'error'}">${escapeHtml(item.status)}</span>
        </div>
        <p class="item-desc">${escapeHtml(item.note || '')}</p>
      </div>
    `).join('')
    : `<p class="info-text">${escapeHtml(c('capabilityUnavailable'))}</p>`;

  container.innerHTML = `
    <div class="dashboard-workspace">
      <div class="dashboard-heading-row">
        <div>
          <h2>${escapeHtml(t('dashboard'))}</h2>
          <p class="lede">${escapeHtml(c('dataTitle'))}</p>
        </div>
        <a class="button-primary" href="${escapeHtml(homeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t('previewHome'))}</a>
      </div>

      <div class="dashboard-grid">
        <div class="card status-card">
          <h3>${escapeHtml(c('systemStatus'))}</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>${escapeHtml(c('apiHealth'))}</span><span class="status-badge" data-state="${healthState}">${escapeHtml(healthLabel)}</span></div>
            <div class="meta-row"><span>${escapeHtml(c('details'))}</span><span>${escapeHtml(health.note || t('statusUnknown'))}</span></div>
            <div class="meta-row"><span>${escapeHtml(c('firstAdmin'))}</span><strong>${escapeHtml(readiness?.deploymentEnv === 'test' ? c('bootstrapAllowed') : c('bootstrapDisabled'))}</strong></div>
          </div>
          <div class="alert alert-warning" style="margin-top: 15px;"><strong>${escapeHtml(c('gateStatus'))}:</strong> ${escapeHtml(c('safetyNotice'))}</div>
        </div>

        <div class="card boundary-card">
          <h3>${escapeHtml(c('gateStatus'))}</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>${escapeHtml(c('publishMode'))}</span><strong>${escapeHtml(readiness?.publishMode || 'pr_only')}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('testDirect'))}</span><strong class="${readiness?.testDirectPublishEnabled && readiness?.testDirectTargetSafe ? 'text-success' : 'text-muted'}">${escapeHtml(readiness?.testDirectPublishEnabled ? c('enabled') : c('disabled'))}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('testTarget'))}</span><strong>${escapeHtml(readiness?.testDirectTargetRepo || 'not configured')}@${escapeHtml(readiness?.testDirectTargetBranch || 'unknown')}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('oauthLogin'))}</span><strong>${escapeHtml(readiness?.oauthEnabled ? c('enabled') : c('disabled'))}</strong></div>
          </div>
        </div>

        <div class="card field-span-2">
          <h3>${escapeHtml(c('dataTitle'))}</h3>
          ${stats ? '' : `<p class="info-text">${escapeHtml(c('statsDeferred'))}</p>`}
          <div class="readiness-grid">${renderStatsCards(stats, auditSummary)}</div>
        </div>

        <div class="card readiness-card field-span-2">
          <h3>${escapeHtml(c('capabilities'))}</h3>
          <div class="readiness-grid">${readinessListHtml}</div>
        </div>

        <div class="card limitations-card field-span-2">
          <h3>${escapeHtml(c('boundaries'))}</h3>
          <ul class="bullet-list">
            <li>${escapeHtml(c('boundaryMedia'))}</li>
            <li>${escapeHtml(c('boundaryMenu'))}</li>
            <li>${escapeHtml(c('boundaryPublish'))}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderStatsCards(stats, auditSummary) {
  const cards = [
    [c('posts'), stats?.counts?.posts ?? 0, c('indexedPosts')],
    [c('published'), stats?.counts?.publishedPosts ?? 0, c('publishedRecords')],
    [c('media'), stats?.counts?.mediaAssets ?? 0, c('mediaRecords')],
    [c('tasks'), stats?.counts?.tasks ?? 0, c('taskRecords')],
    [c('auditEvents'), auditSummary?.total ?? 0, c('auditRecords')],
    [c('failedEvents'), auditSummary?.failed ?? 0, c('failedRecords')]
  ];

  return cards.map(([label, value, note]) => `
    <div class="readiness-item card">
      <div class="readiness-header">
        <strong class="item-title">${escapeHtml(label)}</strong>
        <span class="status-badge" data-state="ok">${escapeHtml(String(value))}</span>
      </div>
      <p class="item-desc">${escapeHtml(note)}</p>
    </div>
  `).join('');
}
