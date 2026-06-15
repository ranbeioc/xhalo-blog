import { ADMIN_API_BASE_URL } from '../config.js';

export function getAdminSecret() {
  return localStorage.getItem('xhalo_admin_secret') || '';
}

export function saveAdminSecret(secret) {
  if (secret) {
    localStorage.setItem('xhalo_admin_secret', secret);
  } else {
    localStorage.removeItem('xhalo_admin_secret');
  }
}

export function hasAdminSecret() {
  return Boolean(getAdminSecret());
}

export function getAdminHeaders() {
  const headers = {};
  const secret = getAdminSecret();
  if (secret) {
    headers['x-xhalo-admin-secret'] = secret;
  }
  return headers;
}

let turnstileWidgetId = null;

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const secret = getAdminSecret();
  if (secret) {
    headers.set('x-xhalo-admin-secret', secret);
  }

  if (typeof turnstile !== 'undefined') {
    try {
      const token = turnstile.getResponse();
      if (token) {
        headers.set('x-xhalo-turnstile-token', token);
      }
    } catch (e) {
      // Ignore Turnstile fetch errors
    }
  }

  const url = `${ADMIN_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers
  });

  // Reset Turnstile widget if verification failed
  if (response.status === 403 && typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
    try {
      const body = await response.clone().json();
      if (body?.error?.includes('Turnstile')) {
        turnstile.reset();
        console.warn('Turnstile token rejected. Resetting widget.');
      }
    } catch (e) {
      // Ignore
    }
  }

  return response;
}

export function setTurnstileWidgetId(id) {
  turnstileWidgetId = id;
}

export function getTurnstileWidgetId() {
  return turnstileWidgetId;
}
