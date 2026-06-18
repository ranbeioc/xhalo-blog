const SUPPORTED_LANGUAGES = ['zh-CN', 'en'];
const STORAGE_KEY = 'xhalo_admin_lang';

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
    adminSubtitle: '登录后进入内容、媒体、菜单和测试发布工作台',
    language: '语言',
    statusHealthy: '正常',
    statusUnhealthy: '异常'
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
    writesDisabled: 'All write actions are disabled by default',
    adminTitle: 'xhalo-blog Admin',
    adminSubtitle: 'Sign in to access content, media, menu, and test publishing tools',
    language: 'Language',
    statusHealthy: 'Healthy',
    statusUnhealthy: 'Unhealthy'
  }
};

function normalizeLanguage(value) {
  if (value === 'zh' || value === 'zh-CN') return 'zh-CN';
  if (value === 'en' || value === 'en-US' || value === 'en-GB') return 'en';
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

export function setLanguage(language) {
  const normalized = normalizeLanguage(language) || 'zh-CN';
  localStorage.setItem(STORAGE_KEY, normalized);
  return normalized;
}

export function t(key) {
  const language = getLanguage();
  return dictionaries[language]?.[key] || dictionaries.en[key] || key;
}

export function renderLanguageOptions() {
  const language = getLanguage();
  return SUPPORTED_LANGUAGES.map((code) => (
    `<option value="${code}" ${code === language ? 'selected' : ''}>${code}</option>`
  )).join('');
}
