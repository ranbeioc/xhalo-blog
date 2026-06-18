const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ko', 'ja'];
const STORAGE_KEY = 'xhalo_admin_lang';

const LANGUAGE_LABELS = {
  en: 'English',
  'zh-CN': '简体中文',
  ko: '한국어',
  ja: '日本語'
};

export const dictionaries = {
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
    writesDisabled: '所有写入默认禁用',
    adminTitle: 'xhalo-blog 管理后台',
    adminSubtitle: '登录后管理内容、媒体、菜单和测试发布流程',
    language: '语言',
    statusHealthy: '正常',
    statusUnhealthy: '异常',
    search: '搜索',
    filter: '筛选',
    all: '全部',
    previousPage: '上一页',
    nextPage: '下一页',
    pageOf: '第 {page} 页 / 共 {totalPages} 页',
    tableCount: '共 {count} 条，当前第 {page} / {totalPages} 页',
    loadingDashboard: '正在加载仪表盘...',
    loadingStats: '正在加载博客统计...',
    loadingPosts: '正在加载文章...',
    loadingEditor: '正在加载 Markdown 编辑器...',
    loadingMedia: '正在加载媒体管理...',
    loadingMenu: '正在加载菜单...',
    loadingConfig: '正在加载 Hexo/NexT 配置...',
    loadingIntegrations: '正在加载 GitHub/Cloudflare 状态...',
    loadingPublishing: '正在加载发布安全中心...',
    loadingAudit: '正在加载审计日志...',
    loadingSettings: '正在加载设置...',
    loginDeploymentMode: '部署模式',
    loginTargetRepo: '目标仓库',
    loginAdminBootstrap: '管理员初始化',
    loginAdminBootstrapValue: '首个 GitHub 登录用户仅在测试模式或显式 bootstrap 模式下成为管理员。',
    loginSecurityGate: '安全 Gate',
    loginSecurityGateValue: '生产直写保持阻断；测试写入仅允许指向 ranbeioc/xhalo-blog-test@main。',
    errorDashboard: '仪表盘加载失败',
    errorPosts: '文章加载失败',
    errorStats: '博客统计加载失败',
    errorConfig: '配置加载失败',
    errorIntegrations: '集成状态加载失败',
    loggedOut: '已退出登录',
    logoutFailed: '退出登录失败',
    working: '处理中...'
  },
  en: {
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
    logout: 'Logout',
    loginGithub: 'Login with GitHub',
    prOnlyMode: 'PR-only Mode',
    writesDisabled: 'All writes are disabled by default',
    adminTitle: 'xhalo-blog Admin',
    adminSubtitle: 'Sign in to manage content, media, menus, and test publishing flows',
    language: 'Language',
    statusHealthy: 'Healthy',
    statusUnhealthy: 'Unhealthy',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    previousPage: 'Previous',
    nextPage: 'Next',
    pageOf: 'Page {page} of {totalPages}',
    tableCount: '{count} total, page {page} of {totalPages}',
    loadingDashboard: 'Loading dashboard...',
    loadingStats: 'Loading blog stats...',
    loadingPosts: 'Loading posts...',
    loadingEditor: 'Loading Markdown editor...',
    loadingMedia: 'Loading media manager...',
    loadingMenu: 'Loading menu...',
    loadingConfig: 'Loading Hexo/NexT config...',
    loadingIntegrations: 'Loading GitHub/Cloudflare status...',
    loadingPublishing: 'Loading publishing safety center...',
    loadingAudit: 'Loading audit logs...',
    loadingSettings: 'Loading settings...',
    loginDeploymentMode: 'Deployment Mode',
    loginTargetRepo: 'Target Repository',
    loginAdminBootstrap: 'Admin Bootstrap',
    loginAdminBootstrapValue: 'The first GitHub login becomes admin only in test mode or explicit bootstrap mode.',
    loginSecurityGate: 'Security Gate',
    loginSecurityGateValue: 'Production direct writes stay blocked; test writes are limited to ranbeioc/xhalo-blog-test@main.',
    errorDashboard: 'Failed to load dashboard',
    errorPosts: 'Failed to load posts',
    errorStats: 'Failed to load blog stats',
    errorConfig: 'Failed to load config',
    errorIntegrations: 'Failed to load integrations',
    loggedOut: 'Logged out',
    logoutFailed: 'Logout failed',
    working: 'Working...'
  }
};

dictionaries.ko = {
  dashboard: '대시보드',
  stats: '블로그 통계',
  posts: '문서',
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
  prOnlyMode: 'PR-only 모드',
  writesDisabled: '모든 쓰기는 기본적으로 비활성화됩니다',
  adminTitle: 'xhalo-blog 관리자',
  adminSubtitle: '로그인 후 콘텐츠, 미디어, 메뉴, 테스트 게시 흐름을 관리합니다',
  language: '언어',
  statusHealthy: '정상',
  statusUnhealthy: '비정상',
  search: '검색',
  filter: '필터',
  all: '전체',
  previousPage: '이전',
  nextPage: '다음',
  pageOf: '{page} / {totalPages} 페이지',
  tableCount: '총 {count}개, {page} / {totalPages} 페이지',
  loadingDashboard: '대시보드를 불러오는 중...',
  loadingStats: '블로그 통계를 불러오는 중...',
  loadingPosts: '문서를 불러오는 중...',
  loadingEditor: 'Markdown 편집기를 불러오는 중...',
  loadingMedia: '미디어 관리자를 불러오는 중...',
  loadingMenu: '메뉴를 불러오는 중...',
  loadingConfig: 'Hexo/NexT 설정을 불러오는 중...',
  loadingIntegrations: 'GitHub/Cloudflare 상태를 불러오는 중...',
  loadingPublishing: '게시 안전 센터를 불러오는 중...',
  loadingAudit: '감사 로그를 불러오는 중...',
  loadingSettings: '설정을 불러오는 중...',
  loginDeploymentMode: '배포 모드',
  loginTargetRepo: '대상 저장소',
  loginAdminBootstrap: '관리자 부트스트랩',
  loginAdminBootstrapValue: '첫 GitHub 로그인은 테스트 모드 또는 명시적 bootstrap 모드에서만 관리자가 됩니다.',
  loginSecurityGate: '보안 Gate',
  loginSecurityGateValue: '프로덕션 직접 쓰기는 차단되며, 테스트 쓰기는 ranbeioc/xhalo-blog-test@main 으로 제한됩니다.',
  errorDashboard: '대시보드 불러오기 실패',
  errorPosts: '문서 불러오기 실패',
  errorStats: '블로그 통계 불러오기 실패',
  errorConfig: '설정 불러오기 실패',
  errorIntegrations: '통합 상태 불러오기 실패',
  loggedOut: '로그아웃되었습니다',
  logoutFailed: '로그아웃 실패',
  working: '처리 중...'
};

dictionaries.ja = {
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
  loginGithub: 'GitHubでログイン',
  prOnlyMode: 'PR-only モード',
  writesDisabled: 'すべての書き込みは既定で無効です',
  adminTitle: 'xhalo-blog 管理画面',
  adminSubtitle: 'ログイン後、コンテンツ、メディア、メニュー、テスト公開フローを管理します',
  language: '言語',
  statusHealthy: '正常',
  statusUnhealthy: '異常',
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
  loadingMenu: 'メニューを読み込み中...',
  loadingConfig: 'Hexo/NexT 設定を読み込み中...',
  loadingIntegrations: 'GitHub/Cloudflare 状態を読み込み中...',
  loadingPublishing: '公開安全センターを読み込み中...',
  loadingAudit: '監査ログを読み込み中...',
  loadingSettings: '設定を読み込み中...',
  loginDeploymentMode: 'デプロイモード',
  loginTargetRepo: '対象リポジトリ',
  loginAdminBootstrap: '管理者ブートストラップ',
  loginAdminBootstrapValue: '最初の GitHub ログインは、テストモードまたは明示的な bootstrap モードでのみ管理者になります。',
  loginSecurityGate: 'セキュリティ Gate',
  loginSecurityGateValue: '本番への直接書き込みはブロックされ、テスト書き込みは ranbeioc/xhalo-blog-test@main に限定されます。',
  errorDashboard: 'ダッシュボードの読み込みに失敗しました',
  errorPosts: '記事の読み込みに失敗しました',
  errorStats: 'ブログ統計の読み込みに失敗しました',
  errorConfig: '設定の読み込みに失敗しました',
  errorIntegrations: '統合状態の読み込みに失敗しました',
  loggedOut: 'ログアウトしました',
  logoutFailed: 'ログアウトに失敗しました',
  working: '処理中...'
};

function normalizeLanguage(value) {
  if (value === 'zh' || value === 'zh-CN' || value === 'zh-Hans' || value === 'zh-SG') return 'zh-CN';
  if (value === 'en' || value === 'en-US' || value === 'en-GB') return 'en';
  if (value === 'ko' || value === 'ko-KR') return 'ko';
  if (value === 'ja' || value === 'ja-JP') return 'ja';
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

export function localizeInlineText(value) {
  const text = String(value || '');
  if (!text.includes(' / ')) return text;
  const parts = text.split(' / ');
  if (parts.length !== 2) return text;
  const [left, right] = parts;
  const leftHasCjk = /[\u3400-\u9fff]/.test(left);
  const rightHasCjk = /[\u3400-\u9fff]/.test(right);
  const leftHasLatin = /[A-Za-z]/.test(left);
  const rightHasLatin = /[A-Za-z]/.test(right);
  if (getLanguage() === 'zh-CN') {
    return leftHasCjk ? left : text;
  }
  if (rightHasLatin && !rightHasCjk) return right;
  if (leftHasLatin && !leftHasCjk) return left;
  return text;
}

export function applyLocaleToElement(root) {
  if (!root) return;
  const ignoredTags = new Set(['CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.includes(' / ')) return NodeFilter.FILTER_REJECT;
      let parent = node.parentElement;
      while (parent) {
        if (ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    node.nodeValue = localizeInlineText(node.nodeValue);
  }
}

export function renderLanguageOptions() {
  const language = getLanguage();
  return SUPPORTED_LANGUAGES.map((code) => (
    `<option value="${code}" ${code === language ? 'selected' : ''}>${LANGUAGE_LABELS[code] || code}</option>`
  )).join('');
}
