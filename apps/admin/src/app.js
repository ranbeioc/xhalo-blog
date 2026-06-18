/**
 * Main application coordinator for xhalo-blog Admin.
 *
 * Keep first-load code small: route panels are loaded on demand instead of
 * pulling the editor, media manager, audit table, and config tools into the
 * initial module graph.
 */

import { checkSession, logout, getLoginUrl } from './modules/auth.js';
import { renderSidebar, renderTopbar, showToast, getRouteLabel } from './modules/ui.js';
import { t } from './modules/i18n.js';

const ROUTES = [
  'dashboard',
  'stats',
  'posts',
  'editor',
  'media',
  'menus',
  'configuration',
  'integrations',
  'publishing',
  'audit',
  'settings'
];

const routeLoaders = {
  dashboard: () => import('./modules/dashboard.js'),
  stats: () => import('./modules/stats.js'),
  posts: () => import('./modules/posts.js'),
  editor: () => import('./modules/editor.js'),
  media: () => import('./modules/media.js'),
  menus: () => import('./modules/menus.js'),
  configuration: () => import('./modules/configuration.js'),
  integrations: () => import('./modules/integrations.js'),
  publishing: () => import('./modules/publishing.js'),
  audit: () => import('./modules/audit.js'),
  settings: () => import('./modules/settings.js')
};

const moduleCache = new Map();

const appState = {
  currentRoute: 'dashboard',
  session: null,
  dashboardData: null,
  dashboardDataPromise: null,
  postsData: null,
  postsPage: 1,
  postsPageSize: 20,
  selectedPost: null,
  renderToken: 0
};

const sidebar = () => document.getElementById('sidebar');
const topbar = () => document.getElementById('topbar');
const contentArea = () => document.getElementById('content-area');

function loadRouteModule(route) {
  if (!routeLoaders[route]) {
    return loadRouteModule('dashboard');
  }
  if (!moduleCache.has(route)) {
    moduleCache.set(route, routeLoaders[route]());
  }
  return moduleCache.get(route);
}

function navigateTo(route) {
  if (!ROUTES.includes(route)) return;
  if (appState.currentRoute === route) return;
  appState.currentRoute = route;
  window.location.hash = route;
  render();
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '');
  return ROUTES.includes(hash) ? hash : 'dashboard';
}

function setLoading(container, message) {
  container.innerHTML = `
    <div class="loading-splash">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

function showPanelError(container, title, err) {
  container.innerHTML = `<div class="alert alert-error">${title}: ${escapeError(err)}</div>`;
}

function escapeError(err) {
  const value = err?.message || String(err || 'Unknown error');
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render() {
  const isAuth = appState.session && appState.session.authenticated;

  if (isAuth) {
    document.body.classList.remove('unauthenticated');
    renderSidebar(sidebar(), {
      activeRoute: appState.currentRoute,
      onNavigate: navigateTo
    });
    renderTopbar(topbar(), {
      title: getRouteLabel(appState.currentRoute),
      session: appState.session,
      onLogin: () => {
        window.location.href = getLoginUrl();
      },
      onLogout: handleLogout,
      onLanguageChange: render
    });
    void renderContent();
  } else {
    document.body.classList.add('unauthenticated');
    renderLoginScreen();
  }
}

function renderLoginScreen() {
  const container = contentArea();
  if (!container) return;

  container.innerHTML = `
    <div class="login-card">
      <div class="login-card-brand">
        <span class="brand-icon">xB</span>
        <h2 class="login-card-title">${t('adminTitle')}</h2>
        <p class="login-card-subtitle">${t('adminSubtitle')}</p>
      </div>
      <button class="login-btn-github" id="btn-login-card">
        ${t('loginGithub')}
      </button>
      <div class="login-card-info">
        <p><strong>部署模式 / Deployment Mode:</strong> Test / PR-only</p>
        <p><strong>目标仓库 / Target Repository:</strong> xhalo-blog-test</p>
        <p><strong>管理员初始化 / Admin Bootstrap:</strong> 首个 GitHub 登录用户仅可在测试模式或显式 bootstrap 模式下成为管理员。</p>
        <p><strong>安全 Gate / Security Gate:</strong> 生产直写保持阻断；测试写入仅允许指向 <code>ranbeioc/xhalo-blog-test@main</code>。</p>
      </div>
    </div>
  `;

  const btn = container.querySelector('#btn-login-card');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = getLoginUrl();
    });
  }
}

async function renderContent() {
  const container = contentArea();
  if (!container) return;

  const route = appState.currentRoute;
  const token = ++appState.renderToken;

  try {
    switch (route) {
      case 'dashboard':
        await renderDashboardPanel(container);
        break;
      case 'posts':
        await renderPostsPanel(container);
        break;
      case 'stats':
        await renderStatsPanel(container);
        break;
      case 'editor':
        await renderEditorPanel(container);
        break;
      case 'media':
        await renderMediaPanel(container);
        break;
      case 'menus':
        await renderMenusPanel(container);
        break;
      case 'configuration':
        await renderConfigurationPanel(container);
        break;
      case 'integrations':
        await renderIntegrationsPanel(container);
        break;
      case 'publishing':
        await renderPublishingPanel(container);
        break;
      case 'audit':
        await renderAuditPanel(container);
        break;
      case 'settings':
        await renderSettingsPanel(container);
        break;
      default:
        await renderDashboardPanel(container);
    }
  } finally {
    if (token !== appState.renderToken) return;
  }
}

async function ensureDashboardData() {
  if (appState.dashboardData) return appState.dashboardData;
  if (!appState.dashboardDataPromise) {
    appState.dashboardDataPromise = loadRouteModule('dashboard')
      .then((module) => module.fetchDashboardData())
      .then((data) => {
        appState.dashboardData = data;
        return data;
      })
      .catch((err) => {
        appState.dashboardDataPromise = null;
        throw err;
      });
  }
  return appState.dashboardDataPromise;
}

async function renderConfigurationPanel(container) {
  setLoading(container, '正在加载 Hexo/NexT 配置 / Loading Hexo/NexT config...');
  try {
    const { fetchSiteConfig, renderSiteConfiguration } = await loadRouteModule('configuration');
    const config = await fetchSiteConfig();
    renderSiteConfiguration(container, config);
  } catch (err) {
    showPanelError(container, '配置加载失败 / Failed to load config', err);
  }
}

async function renderIntegrationsPanel(container) {
  setLoading(container, '正在加载 GitHub/Cloudflare 状态 / Loading integration status...');
  try {
    const { fetchIntegrationStatus, renderIntegrationsManager } = await loadRouteModule('integrations');
    const status = await fetchIntegrationStatus();
    renderIntegrationsManager(container, status);
  } catch (err) {
    showPanelError(container, '集成状态加载失败 / Failed to load integrations', err);
  }
}

async function renderDashboardPanel(container) {
  setLoading(container, '正在加载仪表盘 / Loading dashboard...');
  try {
    const { renderDashboard } = await loadRouteModule('dashboard');
    renderDashboard(container, await ensureDashboardData());
  } catch (err) {
    showPanelError(container, '仪表盘加载失败 / Failed to load dashboard', err);
  }
}

async function renderPostsPanel(container) {
  setLoading(container, '正在加载文章 / Loading posts...');
  try {
    const { fetchPosts, renderPostsList } = await loadRouteModule('posts');
    appState.postsData = await fetchPosts({ page: appState.postsPage, pageSize: appState.postsPageSize });
    renderPostsList(container, {
      ...appState.postsData,
      onPageChange: (page) => {
        appState.postsPage = page;
        void renderPostsPanel(container);
      },
      onSelectPost: (post) => {
        appState.selectedPost = post;
        navigateTo('editor');
      }
    });
  } catch (err) {
    showPanelError(container, '文章加载失败 / Failed to load posts', err);
  }
}

async function renderStatsPanel(container) {
  setLoading(container, '正在加载博客统计 / Loading blog stats...');
  try {
    const { fetchBlogStats, renderBlogStats } = await loadRouteModule('stats');
    const stats = await fetchBlogStats();
    renderBlogStats(container, stats);
  } catch (err) {
    showPanelError(container, '博客统计加载失败 / Failed to load blog stats', err);
  }
}

async function renderEditorPanel(container) {
  setLoading(container, '正在加载 Markdown 编辑器 / Loading Markdown editor...');
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('editor'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderEditor(container, {
    initialPost: appState.selectedPost
      ? {
          title: appState.selectedPost.title || '',
          slug: appState.selectedPost.slug || '',
          category: appState.selectedPost.category || '',
          tags: appState.selectedPost.tags || '',
          body: appState.selectedPost.body || '',
          sha: appState.selectedPost.sha || '',
          filePath: appState.selectedPost.filePath || appState.selectedPost.path || ''
        }
      : undefined,
    dashboardData,
    onSaveSuccess: () => {
      showToast('草稿保存成功 / Draft saved successfully', 'success');
    }
  });
}

async function renderMediaPanel(container) {
  setLoading(container, '正在加载媒体管理 / Loading media manager...');
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('media'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderMediaManager(container, { dashboardData });
}

async function renderMenusPanel(container) {
  setLoading(container, '正在加载菜单 / Loading menu...');
  const { fetchSiteMenu, renderMenuManager } = await loadRouteModule('menus');
  try {
    const [menuData, dashboardData] = await Promise.all([
      fetchSiteMenu(),
      ensureDashboardData().catch(() => null)
    ]);
    renderMenuManager(container, { initialMenuData: menuData, dashboardData });
  } catch {
    renderMenuManager(container, { initialMenuData: { menu: [] }, dashboardData: appState.dashboardData });
  }
}

async function renderPublishingPanel(container) {
  setLoading(container, '正在加载发布安全中心 / Loading publishing safety center...');
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('publishing'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderPublishingSafetyCenter(container, { dashboardData });
}

async function renderAuditPanel(container) {
  setLoading(container, '正在加载审计日志 / Loading audit logs...');
  const { fetchAuditLogs, fetchAuditSummary, renderAuditLogs } = await loadRouteModule('audit');
  try {
    const [logs, summary] = await Promise.all([fetchAuditLogs(), fetchAuditSummary()]);
    renderAuditLogs(container, { logs, summary });
  } catch {
    renderAuditLogs(container, { logs: [], summary: null });
  }
}

async function renderSettingsPanel(container) {
  setLoading(container, '正在加载设置 / Loading settings...');
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('settings'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderSettings(container, { dashboardData });
}

async function initSession() {
  try {
    appState.session = await checkSession();
  } catch {
    appState.session = { authenticated: false };
  }
}

async function handleLogout() {
  const ok = await logout();
  if (ok) {
    appState.session = { authenticated: false };
    appState.dashboardData = null;
    appState.dashboardDataPromise = null;
    showToast('已退出登录 / Logged out', 'info');
    render();
  } else {
    showToast('退出登录失败 / Logout failed', 'error');
  }
}

function preloadLikelyRoutes() {
  const run = () => {
    if (!appState.session?.authenticated) return;
    void loadRouteModule('dashboard');
    void loadRouteModule('posts');
    void loadRouteModule('stats');
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 1200);
  }
}

async function init() {
  appState.currentRoute = getRouteFromHash();

  window.addEventListener('hashchange', () => {
    appState.currentRoute = getRouteFromHash();
    render();
  });

  await initSession();
  render();
  preloadLikelyRoutes();
}

document.addEventListener('DOMContentLoaded', init);
