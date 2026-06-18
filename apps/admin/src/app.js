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
import { fetchBlogStats, renderBlogStats } from './modules/stats.js';
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
  const validRoutes = ['dashboard', 'stats', 'posts', 'editor', 'media', 'menus', 'publishing', 'audit', 'settings'];
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
        <p><strong>部署模式 / Deployment Mode:</strong> Test / PR-only</p>
        <p><strong>目标仓库 / Target Repository:</strong> xhalo-blog-test</p>
        <p><strong>管理员初始化 / Admin Bootstrap:</strong> 首个 GitHub 登录用户仅可在测试模式或显式 bootstrap 模式下成为管理员。</p>
        <p><strong>安全 Gate / Security Gate:</strong> 所有生产直写均被阻断；测试写入仅指向 <code>ranbeioc/xhalo-blog-test@main</code>。</p>
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
    case 'stats':
      await renderStatsPanel(container);
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
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>正在加载仪表盘 / Loading dashboard&hellip;</p></div>';
  try {
    appState.dashboardData = await fetchDashboardData();
    renderDashboard(container, appState.dashboardData);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">仪表盘加载失败 / Failed to load dashboard: ${err.message}</div>`;
  }
}

async function renderPostsPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>正在加载文章 / Loading posts&hellip;</p></div>';
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
    container.innerHTML = `<div class="alert alert-error">文章加载失败 / Failed to load posts: ${err.message}</div>`;
  }
}

async function renderStatsPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>正在加载博客统计 / Loading blog stats&hellip;</p></div>';
  try {
    const stats = await fetchBlogStats();
    renderBlogStats(container, stats);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">博客统计加载失败 / Failed to load blog stats: ${err.message}</div>`;
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
      showToast('草稿保存成功 / Draft saved successfully', 'success');
    }
  });
}

function renderMediaPanel(container) {
  renderMediaManager(container, {
    dashboardData: appState.dashboardData
  });
}

async function renderMenusPanel(container) {
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>正在加载菜单 / Loading menu&hellip;</p></div>';
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
  container.innerHTML = '<div class="loading-splash"><div class="spinner"></div><p>正在加载审计日志 / Loading audit logs&hellip;</p></div>';
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
    showToast('已退出登录 / Logged out', 'info');
    render();
  } else {
    showToast('退出登录失败 / Logout failed', 'error');
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
