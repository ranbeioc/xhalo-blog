import { ADMIN_API_BASE_URL } from '../config.js';
import { renderLanguageOptions, setLanguage, t } from './i18n.js';

export const ROUTES = [
  { id: 'dashboard', labelKey: 'dashboard', icon: 'DB' },
  { id: 'posts', labelKey: 'posts', icon: 'PO' },
  { id: 'editor', labelKey: 'editor', icon: 'ED' },
  { id: 'media', labelKey: 'media', icon: 'ME' },
  { id: 'menus', labelKey: 'menus', icon: 'MN' },
  { id: 'publishing', labelKey: 'publishing', icon: 'PB' },
  { id: 'audit', labelKey: 'audit', icon: 'AU' },
  { id: 'settings', labelKey: 'settings', icon: 'ST' }
];

export function renderSidebar(container, { activeRoute, onNavigate }) {
  const navItems = ROUTES.map((route) => {
    const active = route.id === activeRoute ? 'active' : '';
    return `<li>
      <button class="sidebar-nav-btn ${active}" data-route="${route.id}">
        <span class="sidebar-icon">${route.icon}</span>
        <span class="sidebar-label">${escapeHtml(t(route.labelKey))}</span>
      </button>
    </li>`;
  }).join('');

  container.innerHTML = `
    <div class="sidebar-brand">
      <span class="brand-icon">xB</span>
      <span class="brand-name">xhalo-blog</span>
      <span class="brand-tag">Admin</span>
    </div>
    <nav class="sidebar-nav" aria-label="Admin navigation">
      <ul>${navItems}</ul>
    </nav>
    <div class="sidebar-footer">
      <span class="sidebar-version">v0.1.0-alpha</span>
    </div>
  `;

  container.querySelectorAll('.sidebar-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (onNavigate) onNavigate(route);
    });
  });
}

export function renderTopbar(container, { title, session, onLogin, onLogout, onLanguageChange }) {
  let userHtml = '';

  if (session?.authenticated) {
    const roleLabel = session.user?.isAdmin ? 'admin' : (session.user?.role || 'user');
    const avatarHtml = session.user?.avatarUrl
      ? `<img class="user-avatar" src="${escapeHtml(session.user.avatarUrl)}" alt="Avatar" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color);" />`
      : '';
    userHtml = `
      <div class="topbar-user" style="display: flex; align-items: center; gap: 10px;">
        ${avatarHtml}
        <span class="user-name">${escapeHtml(session.user?.login || session.user?.name || 'User')} · ${escapeHtml(roleLabel)}</span>
        <button class="topbar-btn" id="btn-logout" title="Sign out">${escapeHtml(t('logout'))}</button>
      </div>`;
  } else {
    const apiBase = ADMIN_API_BASE_URL || 'Same Origin';
    userHtml = `
      <div class="topbar-user unauth" style="display: flex; align-items: center; gap: 15px;">
        <span class="api-info-badge" style="font-size: 0.8rem; color: var(--text-muted); padding: 4px 8px; border: 1px dashed var(--border-color); border-radius: 4px;">API: ${escapeHtml(apiBase)}</span>
        <span class="write-warning" style="font-size: 0.85rem; color: var(--yellow);">${escapeHtml(t('writesDisabled'))}</span>
        <button class="topbar-btn login-github-btn" id="btn-login-github" style="background: var(--accent); color: white; border: none; font-weight: 500; padding: 6px 12px; border-radius: 4px;">${escapeHtml(t('loginGithub'))}</button>
      </div>`;
  }

  container.innerHTML = `
    <div class="topbar-left">
      <button class="topbar-menu-btn" id="sidebar-toggle" aria-label="Toggle sidebar">Menu</button>
      <h1 class="topbar-title">${escapeHtml(title)}</h1>
    </div>
    <div class="topbar-right" style="display: flex; align-items: center; gap: 15px;">
      <label class="language-switcher" style="display: flex; align-items: center; gap: 6px;">
        <span>${escapeHtml(t('language'))}</span>
        <select id="admin-language-select">${renderLanguageOptions()}</select>
      </label>
      <span class="env-badge" style="background: rgba(255, 255, 255, 0.1); border: 1px solid var(--border-color);">${escapeHtml(t('prOnlyMode'))}</span>
      ${userHtml}
    </div>
  `;

  const languageSelect = container.querySelector('#admin-language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (event) => {
      setLanguage(event.target.value);
      if (onLanguageChange) onLanguageChange(event.target.value);
    });
  }

  const logoutBtn = container.querySelector('#btn-logout');
  if (logoutBtn && onLogout) logoutBtn.addEventListener('click', onLogout);

  const loginBtn = container.querySelector('#btn-login-github');
  if (loginBtn && onLogin) loginBtn.addEventListener('click', onLogin);

  const toggleBtn = container.querySelector('#sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }
}

export function showToast(message, type = 'info', duration = 4000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getRouteLabel(routeId) {
  const route = ROUTES.find((item) => item.id === routeId);
  return route ? t(route.labelKey) : t('dashboard');
}
