const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ko', 'ja'];
const STORAGE_KEY = 'xhalo_admin_lang';

const LANGUAGE_LABELS = {
  en: 'English',
  'zh-CN': '简体中文',
  ko: '한국어',
  ja: '日本語'
};

const en = {
  dashboard: 'Dashboard',
  stats: 'Blog Stats',
  posts: 'Posts',
  editor: 'Editor',
  media: 'Media',
  menus: 'Menus',
  configuration: 'Hexo/NexT Config',
  integrations: 'GitHub/Cloudflare',
  publishing: 'Publishing',
  audit: 'Audit Logs',
  settings: 'Settings',
  logout: 'Sign out',
  loginGithub: 'Sign in with GitHub',
  prOnlyMode: 'PR-only mode',
  writesDisabled: 'Write actions are gated by default',
  adminTitle: 'xhalo-blog Admin',
  adminSubtitle: 'Manage posts, media, menus, configuration, and test publishing from one verified workspace.',
  language: 'Language',
  roleAdmin: 'Admin',
  roleUser: 'User',
  apiEndpoint: 'API endpoint',
  sameOrigin: 'Same origin',
  statusHealthy: 'Healthy',
  statusUnhealthy: 'Needs attention',
  statusUnknown: 'Unknown',
  search: 'Search',
  filter: 'Filter',
  all: 'All',
  previousPage: 'Previous',
  nextPage: 'Next',
  pageOf: 'Page {page} of {totalPages}',
  tableCount: '{count} total, page {page} of {totalPages}',
  loadingDashboard: 'Loading dashboard...',
  loadingStats: 'Loading blog statistics...',
  loadingPosts: 'Loading posts...',
  loadingEditor: 'Loading Markdown editor...',
  loadingMedia: 'Loading media manager...',
  loadingMenu: 'Loading menu manager...',
  loadingConfig: 'Loading Hexo/NexT configuration...',
  loadingIntegrations: 'Loading GitHub and Cloudflare status...',
  loadingPublishing: 'Loading publishing safety center...',
  loadingAudit: 'Loading audit logs...',
  loadingSettings: 'Loading settings...',
  loginDeploymentMode: 'Deployment mode',
  loginTargetRepo: 'Target repository',
  loginAdminBootstrap: 'Admin bootstrap',
  loginAdminBootstrapValue: 'The first GitHub login can become an administrator only in test mode or when bootstrap is explicitly enabled.',
  loginSecurityGate: 'Security gate',
  loginSecurityGateValue: 'Production direct writes remain blocked. Test writes are limited to ranbeioc/xhalo-blog-test@main.',
  errorDashboard: 'Failed to load dashboard',
  errorPosts: 'Failed to load posts',
  errorStats: 'Failed to load blog statistics',
  errorConfig: 'Failed to load configuration',
  errorIntegrations: 'Failed to load integrations',
  loggedOut: 'Signed out',
  logoutFailed: 'Sign out failed',
  working: 'Working...',
  previewHome: 'Preview Home',
  operationSucceeded: 'Operation completed',
  operationFailed: 'Operation failed',
  unavailable: 'Unavailable',
  ready: 'Ready'
};

export const dictionaries = {
  en,
  'zh-CN': {
    dashboard: '仪表盘',
    stats: '博客统计',
    posts: '文章',
    editor: '编辑器',
    media: '媒体',
    menus: '菜单',
    configuration: 'Hexo/NexT 配置',
    integrations: 'GitHub/Cloudflare',
    publishing: '发布',
    audit: '审计日志',
    settings: '设置',
    logout: '退出登录',
    loginGithub: '使用 GitHub 登录',
    prOnlyMode: 'PR-only 模式',
    writesDisabled: '写入操作默认受安全门控保护',
    adminTitle: 'xhalo-blog 管理后台',
    adminSubtitle: '在一个经过验证的工作区内管理文章、媒体、菜单、配置和测试发布。',
    language: '语言',
    roleAdmin: '管理员',
    roleUser: '用户',
    apiEndpoint: 'API 端点',
    sameOrigin: '同源代理',
    statusHealthy: '正常',
    statusUnhealthy: '需要处理',
    statusUnknown: '未知',
    search: '搜索',
    filter: '筛选',
    all: '全部',
    previousPage: '上一页',
    nextPage: '下一页',
    pageOf: '第 {page} 页 / 共 {totalPages} 页',
    tableCount: '共 {count} 条，第 {page} / {totalPages} 页',
    loadingDashboard: '正在加载仪表盘...',
    loadingStats: '正在加载博客统计...',
    loadingPosts: '正在加载文章...',
    loadingEditor: '正在加载 Markdown 编辑器...',
    loadingMedia: '正在加载媒体管理...',
    loadingMenu: '正在加载菜单管理...',
    loadingConfig: '正在加载 Hexo/NexT 配置...',
    loadingIntegrations: '正在加载 GitHub 和 Cloudflare 状态...',
    loadingPublishing: '正在加载发布安全中心...',
    loadingAudit: '正在加载审计日志...',
    loadingSettings: '正在加载设置...',
    loginDeploymentMode: '部署模式',
    loginTargetRepo: '目标仓库',
    loginAdminBootstrap: '管理员初始化',
    loginAdminBootstrapValue: '首个 GitHub 登录用户仅在测试模式或显式启用初始化时可成为管理员。',
    loginSecurityGate: '安全门控',
    loginSecurityGateValue: '生产直写保持阻断；测试写入仅允许指向 ranbeioc/xhalo-blog-test@main。',
    errorDashboard: '仪表盘加载失败',
    errorPosts: '文章加载失败',
    errorStats: '博客统计加载失败',
    errorConfig: '配置加载失败',
    errorIntegrations: '集成状态加载失败',
    loggedOut: '已退出登录',
    logoutFailed: '退出登录失败',
    working: '处理中...',
    previewHome: '预览主页',
    operationSucceeded: '操作已完成',
    operationFailed: '操作失败',
    unavailable: '不可用',
    ready: '就绪'
  },
  ko: {
    dashboard: '대시보드',
    stats: '블로그 통계',
    posts: '글',
    editor: '편집기',
    media: '미디어',
    menus: '메뉴',
    configuration: 'Hexo/NexT 설정',
    integrations: 'GitHub/Cloudflare',
    publishing: '게시',
    audit: '감사 로그',
    settings: '설정',
    logout: '로그아웃',
    loginGithub: 'GitHub로 로그인',
    prOnlyMode: 'PR 전용 모드',
    writesDisabled: '쓰기 작업은 기본적으로 안전 게이트로 보호됩니다',
    adminTitle: 'xhalo-blog 관리자',
    adminSubtitle: '검증된 작업 공간에서 글, 미디어, 메뉴, 설정, 테스트 게시를 관리합니다.',
    language: '언어',
    roleAdmin: '관리자',
    roleUser: '사용자',
    apiEndpoint: 'API 엔드포인트',
    sameOrigin: '동일 출처 프록시',
    statusHealthy: '정상',
    statusUnhealthy: '확인 필요',
    statusUnknown: '알 수 없음',
    search: '검색',
    filter: '필터',
    all: '전체',
    previousPage: '이전',
    nextPage: '다음',
    pageOf: '{page} / {totalPages} 페이지',
    tableCount: '총 {count}개, {page} / {totalPages} 페이지',
    loadingDashboard: '대시보드를 불러오는 중...',
    loadingStats: '블로그 통계를 불러오는 중...',
    loadingPosts: '글 목록을 불러오는 중...',
    loadingEditor: 'Markdown 편집기를 불러오는 중...',
    loadingMedia: '미디어 관리자를 불러오는 중...',
    loadingMenu: '메뉴 관리자를 불러오는 중...',
    loadingConfig: 'Hexo/NexT 설정을 불러오는 중...',
    loadingIntegrations: 'GitHub 및 Cloudflare 상태를 불러오는 중...',
    loadingPublishing: '게시 안전 센터를 불러오는 중...',
    loadingAudit: '감사 로그를 불러오는 중...',
    loadingSettings: '설정을 불러오는 중...',
    loginDeploymentMode: '배포 모드',
    loginTargetRepo: '대상 저장소',
    loginAdminBootstrap: '관리자 초기화',
    loginAdminBootstrapValue: '첫 GitHub 로그인 사용자는 테스트 모드 또는 명시적 초기화 모드에서만 관리자가 될 수 있습니다.',
    loginSecurityGate: '보안 게이트',
    loginSecurityGateValue: '프로덕션 직접 쓰기는 차단됩니다. 테스트 쓰기는 ranbeioc/xhalo-blog-test@main 으로 제한됩니다.',
    errorDashboard: '대시보드 로드 실패',
    errorPosts: '글 로드 실패',
    errorStats: '블로그 통계 로드 실패',
    errorConfig: '설정 로드 실패',
    errorIntegrations: '연동 상태 로드 실패',
    loggedOut: '로그아웃되었습니다',
    logoutFailed: '로그아웃 실패',
    working: '처리 중...',
    previewHome: '홈 미리보기',
    operationSucceeded: '작업이 완료되었습니다',
    operationFailed: '작업 실패',
    unavailable: '사용할 수 없음',
    ready: '준비됨'
  },
  ja: {
    dashboard: 'ダッシュボード',
    stats: 'ブログ統計',
    posts: '記事',
    editor: 'エディター',
    media: 'メディア',
    menus: 'メニュー',
    configuration: 'Hexo/NexT 設定',
    integrations: 'GitHub/Cloudflare',
    publishing: '公開',
    audit: '監査ログ',
    settings: '設定',
    logout: 'ログアウト',
    loginGithub: 'GitHub でログイン',
    prOnlyMode: 'PR 専用モード',
    writesDisabled: '書き込み操作は既定で安全ゲートにより保護されます',
    adminTitle: 'xhalo-blog 管理画面',
    adminSubtitle: '検証済みの作業領域で記事、メディア、メニュー、設定、テスト公開を管理します。',
    language: '言語',
    roleAdmin: '管理者',
    roleUser: 'ユーザー',
    apiEndpoint: 'API エンドポイント',
    sameOrigin: '同一オリジンプロキシ',
    statusHealthy: '正常',
    statusUnhealthy: '確認が必要',
    statusUnknown: '不明',
    search: '検索',
    filter: 'フィルター',
    all: 'すべて',
    previousPage: '前へ',
    nextPage: '次へ',
    pageOf: '{page} / {totalPages} ページ',
    tableCount: '合計 {count} 件、{page} / {totalPages} ページ',
    loadingDashboard: 'ダッシュボードを読み込み中...',
    loadingStats: 'ブログ統計を読み込み中...',
    loadingPosts: '記事を読み込み中...',
    loadingEditor: 'Markdown エディターを読み込み中...',
    loadingMedia: 'メディア管理を読み込み中...',
    loadingMenu: 'メニュー管理を読み込み中...',
    loadingConfig: 'Hexo/NexT 設定を読み込み中...',
    loadingIntegrations: 'GitHub と Cloudflare の状態を読み込み中...',
    loadingPublishing: '公開安全センターを読み込み中...',
    loadingAudit: '監査ログを読み込み中...',
    loadingSettings: '設定を読み込み中...',
    loginDeploymentMode: 'デプロイモード',
    loginTargetRepo: '対象リポジトリ',
    loginAdminBootstrap: '管理者初期化',
    loginAdminBootstrapValue: '最初の GitHub ログインユーザーは、テストモードまたは明示的な初期化モードでのみ管理者になれます。',
    loginSecurityGate: 'セキュリティゲート',
    loginSecurityGateValue: '本番への直接書き込みはブロックされます。テスト書き込みは ranbeioc/xhalo-blog-test@main に限定されます。',
    errorDashboard: 'ダッシュボードの読み込みに失敗しました',
    errorPosts: '記事の読み込みに失敗しました',
    errorStats: 'ブログ統計の読み込みに失敗しました',
    errorConfig: '設定の読み込みに失敗しました',
    errorIntegrations: '連携状態の読み込みに失敗しました',
    loggedOut: 'ログアウトしました',
    logoutFailed: 'ログアウトに失敗しました',
    working: '処理中...',
    previewHome: 'ホームをプレビュー',
    operationSucceeded: '操作が完了しました',
    operationFailed: '操作に失敗しました',
    unavailable: '利用できません',
    ready: '準備完了'
  }
};

function normalizeLanguage(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  const lower = normalized.toLowerCase();
  if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg') return 'zh-CN';
  if (lower === 'en' || lower === 'en-us' || lower === 'en-gb') return 'en';
  if (lower === 'ko' || lower === 'ko-kr') return 'ko';
  if (lower === 'ja' || lower === 'ja-jp') return 'ja';
  return null;
}

export function getLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizeLanguage(params.get('lang'));
  if (fromUrl) {
    localStorage.setItem(STORAGE_KEY, fromUrl);
    return fromUrl;
  }

  const fromStorage = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  if (fromStorage) return fromStorage;

  const browserLanguage = normalizeLanguage(navigator.language);
  return browserLanguage || 'zh-CN';
}

export function isZh() {
  return getLanguage() === 'zh-CN';
}

export function setLanguage(language) {
  const normalized = normalizeLanguage(language) || 'en';
  localStorage.setItem(STORAGE_KEY, normalized);
  return normalized;
}

export function t(key, params = {}) {
  const language = getLanguage();
  const template = dictionaries[language]?.[key] || dictionaries.en[key] || key;
  return Object.entries(params).reduce(
    (value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)),
    template
  );
}

export function pick(values) {
  const language = getLanguage();
  if (typeof values === 'string') return values;
  return values?.[language] || values?.en || values?.['zh-CN'] || '';
}

export function applyLocaleToElement(root) {
  if (!root) return;
  root.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (key) node.textContent = t(key);
  });
}

export function renderLanguageOptions() {
  const language = getLanguage();
  return SUPPORTED_LANGUAGES.map((code) => (
    `<option value="${code}" ${code === language ? 'selected' : ''}>${LANGUAGE_LABELS[code] || code}</option>`
  )).join('');
}
