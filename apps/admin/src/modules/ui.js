/**
 * ui.js – Shared layout utilities: sidebar navigation, panel routing,
 * topbar rendering, and common UI helpers.
 */

// ── Route definitions ────────────────────────────────────────────────────────
export const ROUTES = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '📊' },
  { id: 'posts',      label: 'Posts',         icon: '📝' },
  { id: 'editor',     label: 'Editor',        icon: '✏️' },
  { id: 'media',      label: 'Media',         icon: '🖼️' },
  { id: 'menus',      label: 'Menus',         icon: '🗂️' },
  { id: 'publishing', label: 'Publishing',    icon: '🛡️' },
  { id: 'audit',      label: 'Audit Logs',    icon: '📋' },
  { id: 'settings',   label: 'Settings',      icon: '⚙️' }
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function renderSidebar(container, { activeRoute, onNavigate }) {
  const navItems = ROUTES.map(route => {
    const active = route.id === activeRoute ? 'active' : '';
    return `<li>
      <button class="sidebar-nav-btn ${active}" data-route="${route.id}">
        <span class="sidebar-icon">${route.icon}</span>
        <span class="sidebar-label">${route.label}</span>
      </button>
    </li>`;
  }).join('');

  container.innerHTML = `
    <div class="sidebar-brand">
      <span class="brand-icon">✦</span>
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

  container.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (onNavigate) onNavigate(route);
    });
  });
}

// ── Topbar ───────────────────────────────────────────────────────────────────
export function renderTopbar(container, { title, session, onLogout }) {
  const userHtml = session?.authenticated
    ? `<div class="topbar-user">
         <span class="user-name">${escapeHtml(session.login || session.user || 'User')}</span>
         <button class="topbar-btn" id="btn-logout" title="Sign out">Logout</button>
       </div>`
    : `<div class="topbar-user">
         <span class="user-name guest">Guest</span>
       </div>`;

  container.innerHTML = `
    <div class="topbar-left">
      <button class="topbar-menu-btn" id="sidebar-toggle" aria-label="Toggle sidebar">☰</button>
      <h1 class="topbar-title">${escapeHtml(title)}</h1>
    </div>
    <div class="topbar-right">
      <span class="env-badge">staging</span>
      ${userHtml}
    </div>
  `;

  const logoutBtn = container.querySelector('#btn-logout');
  if (logoutBtn && onLogout) {
    logoutBtn.addEventListener('click', onLogout);
  }

  const toggleBtn = container.querySelector('#sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }
}

// ── Toast notifications ──────────────────────────────────────────────────────
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

// ── Utility ──────────────────────────────────────────────────────────────────
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getRouteLabel(routeId) {
  const route = ROUTES.find(r => r.id === routeId);
  return route ? route.label : 'Dashboard';
}
