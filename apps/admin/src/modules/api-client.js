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

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status || 0;
    this.code = options.code || 'NETWORK_ERROR';
    this.details = options.details || null;
  }
}

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

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('You are currently offline. Please check your network connection.', {
      status: 0,
      code: 'CLIENT_OFFLINE'
    });
  }

  const url = `${ADMIN_API_BASE_URL}${path}`;
  const timeoutMs = init.timeoutMs || 30000;
  let timeoutId = null;
  let signal = init.signal;
  if (!signal && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    signal = controller.signal;
  }

  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers,
      signal
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
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const isTimeout = err.name === 'AbortError' || String(err.message || '').includes('timed out');
    throw new ApiError(
      isTimeout ? `Request timed out after ${timeoutMs}ms.` : (err.message || 'Network request failed.'),
      {
        status: 0,
        code: isTimeout ? 'REQUEST_TIMEOUT' : 'FETCH_ERROR',
        details: err
      }
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function setTurnstileWidgetId(id) {
  turnstileWidgetId = id;
}

export function getTurnstileWidgetId() {
  return turnstileWidgetId;
}
