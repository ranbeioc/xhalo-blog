/**
 * app.js – Main application coordinator for xhalo-blog Admin.
 *
 * Orchestrates sidebar navigation, route-based panel rendering,
 * session lifecycle, and module integration.
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
import { fetchAuditLogs, renderAuditLogs } from './modules/audit.js';
import { renderSettings } from './modules/settings.js';

// ── Application state ──────────────────────────────────────────────────────
const appState = {
  currentRoute: 'dashboard',
  session: null,
  dashboardData: null,
  postsData: null,
  selectedPost: null
};

// ── DOM references ─────────────────────────────────────────────────────────
const sidebar = () => document.getElementById('sidebar');
const topbar = () => document.getElementById('topbar');
const contentArea = () => document.getElementById('content-area');

// ── Route handling ─────────────────────────────────────────────────────────
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

// ── Rendering ──────────────────────────────────────────────────────────────
function render() {
  const isAuth = appState.session && appState.session.authenticated;

  if (isAuth) {
    document.body.classList.remove('unauthenticated');

    // Sidebar
    renderSidebar(sidebar(), {
      activeRoute: appState.currentRoute,
      onNavigate: navigateTo
    });

    // Topbar
    renderTopbar(topbar(), {
      title: getRouteLabel(appState.currentRoute),
      session: appState.session,
      onLogin: () => {
        window.location.href = getLoginUrl();
      },
      onLogout: handleLogout
    });

    // Content
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
        <span class="brand-icon">✦</span>
        <h2 class="login-card-title">xhalo-blog Admin</h2>
        <p class="login-card-subtitle">Sign in to access your administrative workbench</p>
      </div>
      <button class="login-btn-github" id="btn-login-card">
        <svg style="width: 20px; height: 20px; fill: currentColor; vertical-align: middle; margin-right: 8px;" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
          <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        Login with GitHub
      </button>
      <div class="login-card-info">
        <p><strong>Deployment Mode:</strong> Staging / PR-only</p>
        <p><strong>Target Repository:</strong> xhalo-blog-test</p>
        <p><strong>Security Gate:</strong> All direct production writes are blocked. Operations generate Pull Requests for manual review.</p>
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
      renderMenusPanel(container);
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

// ── Panel renderers ────────────────────────────────────────────────────────

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
    renderMenuManager(container, { initialMenuData: menuData });
  } catch (err) {
    renderMenuManager(container, { initialMenuData: { menu: [] } });
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
    const logs = await fetchAuditLogs();
    renderAuditLogs(container, { logs });
  } catch (err) {
    renderAuditLogs(container, { logs: [] });
  }
}

function renderSettingsPanel(container) {
  renderSettings(container, {
    dashboardData: appState.dashboardData
  });
}

// ── Session lifecycle ──────────────────────────────────────────────────────
async function initSession() {
  try {
    const session = await checkSession();
    appState.session = session;
  } catch (err) {
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

// ── Initialization ─────────────────────────────────────────────────────────
async function init() {
  // Determine initial route from URL hash
  appState.currentRoute = getRouteFromHash();

  // Listen for hash changes (back/forward navigation)
  window.addEventListener('hashchange', () => {
    appState.currentRoute = getRouteFromHash();
    render();
  });

  // Initialize session in background
  await initSession();

  // Fetch dashboard data for reuse across panels if authenticated
  if (appState.session && appState.session.authenticated) {
    try {
      appState.dashboardData = await fetchDashboardData();
    } catch (err) {
      console.warn('Initial dashboard fetch failed:', err);
    }
  }

  // Initial render
  render();
}

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
