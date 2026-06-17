/**
 * Main application coordinator for xhalo-blog Admin.
 *
 * Coordinates sidebar navigation, route-based panel rendering, session
 * lifecycle, and module integration.
 */

import { ADMIN_API_BASE_URL } from './config.js';
import { apiFetch, hasAdminSecret, getAdminSecret, saveAdminSecret } from './modules/api-client.js';
import { checkSession, logout, getLoginUrl } from './modules/auth.js';
import { renderSidebar, renderTopbar, showToast, getRouteLabel } from './modules/ui.js';
import { fetchDashboardData, renderDashboard } from './modules/dashboard.js';
import { fetchPosts, renderPostsList } from './modules/posts.js';
import { renderEditor } from './modules/editor.js';
import { renderMediaManager } from './modules/media.js';
import { fetchSiteMenu, renderMenuManager } from './modules/menus.js';
import { renderPublishingSafetyCenter } from './modules/publishing.js';
import { fetchAuditLogs, fetchAuditSummary, renderAuditLogs } from './modules/audit.js';
import { renderSettings } from './modules/settings.js';
import { t } from './modules/i18n.js';

void ADMIN_API_BASE_URL;
void apiFetch;
void hasAdminSecret;
void getAdminSecret;
void saveAdminSecret;

const appState = {
  currentRoute: 'dashboard',
  session: null,
  dashboardData: null,
  postsData: null,
  selectedPost: null
};

const sidebar = () => document.getElementById('sidebar');
const topbar = () => document.getElementById('topbar');
const contentArea = () => document.getElementById('content-area');

function navigateTo(route) {
  appState.currentRoute = route;
  window.location.hash = route;
  render();
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '');
  const validRoutes = ['dashboard', 'posts', 'editor', 'media', 'menus', 'publishing', 'audit', 'settings'];
  return validRoutes.includes(hash) ? hash : 'dashboard';
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
    renderContent();
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
        <p><strong>Deployment Mode:</strong> Test / PR-only</p>
        <p><strong>Target Repository:</strong> xhalo-blog-test</p>
        <p><strong>Admin Bootstrap:</strong> First GitHub login may become admin only in test mode or explicit bootstrap mode.</p>
        <p><strong>Security Gate:</strong> All direct production writes are blocked. Test writes target only <code>ranbeioc/xhalo-blog-test@main</code>.</p>
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

  switch (appState.currentRoute) {
    case 'dashboard':
      await renderDashboardPanel(container);
      break;
    case 'posts':
      await renderPostsPanel(container);
      break;
    case 'editor':
      renderEditorPanel(container);
      break;
    case 'media':
      renderMediaPanel(container);
      break;
    case 'menus':
      await renderMenusPanel(container);
      break;
    case 'publishing':
      renderPublishingPanel(container);
      break;
    case 'audit':
      await renderAuditPanel(container);
      break;
    case 'settings':
      renderSettingsPanel(container);
      break;
    default:
      await renderDashboardPanel(container);
  }
}

async function renderDashboardPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>Loading dashboard&hellip;</p></div>';
  try {
    appState.dashboardData = await fetchDashboardData();
    renderDashboard(container, appState.dashboardData);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load dashboard: ${err.message}</div>`;
  }
}

async function renderPostsPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>Loading posts&hellip;</p></div>';
  try {
    appState.postsData = await fetchPosts();
    renderPostsList(container, {
      ...appState.postsData,
      onSelectPost: (post) => {
        appState.selectedPost = post;
        navigateTo('editor');
      }
    });
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load posts: ${err.message}</div>`;
  }
}

function renderEditorPanel(container) {
  renderEditor(container, {
    initialPost: appState.selectedPost
      ? {
          title: appState.selectedPost.title || '',
          slug: appState.selectedPost.slug || '',
          category: appState.selectedPost.category || '',
          tags: appState.selectedPost.tags || '',
          body: appState.selectedPost.body || '',
          sha: appState.selectedPost.sha || ''
        }
      : undefined,
    dashboardData: appState.dashboardData,
    onSaveSuccess: () => {
      showToast('Draft saved successfully', 'success');
    }
  });
}

function renderMediaPanel(container) {
  renderMediaManager(container, {
    dashboardData: appState.dashboardData
  });
}

async function renderMenusPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>Loading menu&hellip;</p></div>';
  try {
    const menuData = await fetchSiteMenu();
    renderMenuManager(container, { initialMenuData: menuData, dashboardData: appState.dashboardData });
  } catch {
    renderMenuManager(container, { initialMenuData: { menu: [] }, dashboardData: appState.dashboardData });
  }
}

function renderPublishingPanel(container) {
  renderPublishingSafetyCenter(container, {
    dashboardData: appState.dashboardData
  });
}

async function renderAuditPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>Loading audit logs&hellip;</p></div>';
  try {
    const [logs, summary] = await Promise.all([fetchAuditLogs(), fetchAuditSummary()]);
    renderAuditLogs(container, { logs, summary });
  } catch {
    renderAuditLogs(container, { logs: [], summary: null });
  }
}

function renderSettingsPanel(container) {
  renderSettings(container, {
    dashboardData: appState.dashboardData
  });
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
    showToast('Logged out', 'info');
    render();
  } else {
    showToast('Logout failed', 'error');
  }
}

async function init() {
  appState.currentRoute = getRouteFromHash();

  window.addEventListener('hashchange', () => {
    appState.currentRoute = getRouteFromHash();
    render();
  });

  await initSession();

  if (appState.session && appState.session.authenticated) {
    try {
      appState.dashboardData = await fetchDashboardData();
    } catch (err) {
      console.warn('Initial dashboard fetch failed:', err);
    }
  }

  render();
}

document.addEventListener('DOMContentLoaded', init);
