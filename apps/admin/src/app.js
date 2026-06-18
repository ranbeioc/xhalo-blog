/**
 * Main application coordinator for xhalo-blog Admin.
 *
 * Keep first-load code small: route panels are loaded on demand instead of
 * pulling the editor, media manager, audit table, and config tools into the
 * initial module graph.
 */

import { checkSession, logout, getLoginUrl } from './modules/auth.js';
import { renderSidebar, renderTopbar, showToast, getRouteLabel } from './modules/ui.js';
import { applyLocaleToElement, t } from './modules/i18n.js';

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
  const safeRoute = routeLoaders[route] ? route : 'dashboard';
  if (!moduleCache.has(safeRoute)) {
    moduleCache.set(safeRoute, routeLoaders[safeRoute]());
  }
  return moduleCache.get(safeRoute);
}

function navigateTo(route) {
  if (!ROUTES.includes(route) || appState.currentRoute === route) return;
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
      <button class="login-btn-github" id="btn-login-card">${t('loginGithub')}</button>
      <div class="login-card-info">
        <p><strong>${t('loginDeploymentMode')}:</strong> Test / PR-only</p>
        <p><strong>${t('loginTargetRepo')}:</strong> xhalo-blog-test</p>
        <p><strong>${t('loginAdminBootstrap')}:</strong> ${t('loginAdminBootstrapValue')}</p>
        <p><strong>${t('loginSecurityGate')}:</strong> ${t('loginSecurityGateValue')}</p>
      </div>
    </div>
  `;

  container.querySelector('#btn-login-card')?.addEventListener('click', () => {
    window.location.href = getLoginUrl();
  });
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
    applyLocaleToElement(container);
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

async function renderDashboardPanel(container) {
  setLoading(container, t('loadingDashboard'));
  try {
    const { renderDashboard } = await loadRouteModule('dashboard');
    renderDashboard(container, await ensureDashboardData());
  } catch (err) {
    showPanelError(container, t('errorDashboard'), err);
  }
}

async function renderStatsPanel(container) {
  setLoading(container, t('loadingStats'));
  try {
    const { fetchBlogStats, renderBlogStats } = await loadRouteModule('stats');
    renderBlogStats(container, await fetchBlogStats());
  } catch (err) {
    showPanelError(container, t('errorStats'), err);
  }
}

async function renderPostsPanel(container) {
  setLoading(container, t('loadingPosts'));
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
    showPanelError(container, t('errorPosts'), err);
  }
}

async function renderEditorPanel(container) {
  setLoading(container, t('loadingEditor'));
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
    onSaveSuccess: () => showToast(t('working'), 'success')
  });
}

async function renderMediaPanel(container) {
  setLoading(container, t('loadingMedia'));
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('media'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderMediaManager(container, { dashboardData });
}

async function renderMenusPanel(container) {
  setLoading(container, t('loadingMenu'));
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

async function renderConfigurationPanel(container) {
  setLoading(container, t('loadingConfig'));
  try {
    const { fetchSiteConfig, renderSiteConfiguration } = await loadRouteModule('configuration');
    renderSiteConfiguration(container, await fetchSiteConfig());
  } catch (err) {
    showPanelError(container, t('errorConfig'), err);
  }
}

async function renderIntegrationsPanel(container) {
  setLoading(container, t('loadingIntegrations'));
  try {
    const { fetchIntegrationStatus, renderIntegrationsManager } = await loadRouteModule('integrations');
    renderIntegrationsManager(container, await fetchIntegrationStatus());
  } catch (err) {
    showPanelError(container, t('errorIntegrations'), err);
  }
}

async function renderPublishingPanel(container) {
  setLoading(container, t('loadingPublishing'));
  const [module, dashboardData] = await Promise.all([
    loadRouteModule('publishing'),
    ensureDashboardData().catch(() => null)
  ]);
  module.renderPublishingSafetyCenter(container, { dashboardData });
}

async function renderAuditPanel(container) {
  setLoading(container, t('loadingAudit'));
  const { fetchAuditLogs, fetchAuditSummary, renderAuditLogs } = await loadRouteModule('audit');
  try {
    const [logs, summary] = await Promise.all([fetchAuditLogs(), fetchAuditSummary()]);
    renderAuditLogs(container, { logs, summary });
  } catch {
    renderAuditLogs(container, { logs: [], summary: null });
  }
}

async function renderSettingsPanel(container) {
  setLoading(container, t('loadingSettings'));
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
    showToast(t('loggedOut'), 'info');
    render();
  } else {
    showToast(t('logoutFailed'), 'error');
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
  const container = contentArea();
  if (container) {
    const observer = new MutationObserver(() => applyLocaleToElement(container));
    observer.observe(container, { childList: true, subtree: true });
  }
}

document.addEventListener('DOMContentLoaded', init);
