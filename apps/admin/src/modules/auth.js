import { apiFetch } from './api-client.js';
import { ADMIN_API_BASE_URL } from '../config.js';

export async function checkSession() {
  try {
    const res = await apiFetch('/api/auth/session');
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch (err) {
    console.error('Session check failed:', err);
    return { authenticated: false, error: err.message };
  }
}

export async function logout() {
  try {
    const res = await apiFetch('/api/auth/logout', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('Logout failed:', err);
    return false;
  }
}

export function getLoginUrl() {
  return `${ADMIN_API_BASE_URL}/auth/github/start`;
}
