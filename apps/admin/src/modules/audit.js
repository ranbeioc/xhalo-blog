import { apiFetch } from './api-client.js';

export async function fetchAuditLogs() {
  try {
    const res = await apiFetch('/api/audit-logs');
    if (!res.ok) throw new Error(`Audit API returned status ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.warn('Failed to load audit logs:', err);
    return [];
  }
}

export function renderAuditLogs(container, { logs }) {
  const rowsHtml = logs.length > 0 ? logs.map(log => `
    <tr>
      <td><code>${escapeHtml(log.action || '-')}</code></td>
      <td><code>${escapeHtml(log.status_code ? String(log.status_code) : '-')}</code></td>
      <td><code>${escapeHtml(log.resource || '-')}</code></td>
      <td><code>${escapeHtml(log.resource_id || '-')}</code></td>
      <td><code>${escapeHtml(log.method || '-')} ${escapeHtml(log.path || '-')}</code></td>
      <td>${escapeHtml(log.duration_ms ? `${log.duration_ms}ms` : '-')}</td>
      <td>${escapeHtml(log.timestamp ? new Date(log.timestamp).toLocaleString() : '-')}</td>
      <td class="text-danger">${escapeHtml(log.error || '-')}</td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="8" class="text-center info-text">No audit logs retrieved. Admin secret required.</td>
    </tr>
  `;

  container.innerHTML = `
    <div class="audit-workspace">
      <h2>Read-Only Audit Logs</h2>
      <p class="lede">Review recent administrative activities, authentication requests, and write attempts in D1 storage.</p>
      
      <div class="card table-card" style="margin-top: 20px;">
        <div class="table-container">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Status</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>Request Path</th>
                <th>Duration</th>
                <th>Timestamp</th>
                <th>Error details</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
