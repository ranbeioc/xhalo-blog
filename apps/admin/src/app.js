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
  // Sidebar
  renderSidebar(sidebar(), {
    activeRoute: appState.currentRoute,
    onNavigate: navigateTo
  });

  // Topbar
  renderTopbar(topbar(), {
    title: getRouteLabel(appState.currentRoute),
    session: appState.session,
    onLogout: handleLogout
  });

  // Content
  renderContent();
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

  // Fetch dashboard data for reuse across panels
  try {
    appState.dashboardData = await fetchDashboardData();
  } catch (err) {
    console.warn('Initial dashboard fetch failed:', err);
  }

  // Initial render
  render();
}

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
