import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';

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

export async function fetchAuditSummary() {
  try {
    const res = await apiFetch('/api/audit-logs/summary');
    if (!res.ok) throw new Error(`Audit summary API returned status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to load audit summary:', err);
    return null;
  }
}

export function renderAuditLogs(container, { logs, summary }) {
  let query = '';

  function draw() {
    const normalized = query.trim().toLowerCase();
    const filteredLogs = normalized
      ? logs.filter((log) => JSON.stringify(log).toLowerCase().includes(normalized))
      : logs;

    const rowsHtml = filteredLogs.length > 0 ? filteredLogs.map((log) => `
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
      <tr><td colspan="8" class="text-center info-text">No audit logs match the current filter.</td></tr>
    `;

    container.innerHTML = `
      <div class="audit-workspace">
        <h2>Read-Only Audit Logs</h2>
        <p class="lede">Review recent administrative activities, authentication requests, write attempts, and gate rejections.</p>

        <div class="readiness-grid" style="margin-top: 20px;">
          <div class="readiness-item card"><strong>Total Events</strong><span class="status-badge" data-state="ok">${escapeHtml(String(summary?.total ?? logs.length))}</span></div>
          <div class="readiness-item card"><strong>Failed Events</strong><span class="status-badge" data-state="${summary?.failed ? 'warning' : 'ok'}">${escapeHtml(String(summary?.failed ?? 0))}</span></div>
          <div class="readiness-item card"><strong>Backend</strong><span class="status-badge" data-state="ok">${escapeHtml(summary?.backend || 'unknown')}</span></div>
        </div>

        <div class="card" style="margin-top: 20px;">
          <label>
            <span>Filter by action, status, resource, path, or error</span>
            <input type="search" id="audit-filter" value="${escapeHtml(query)}" placeholder="e.g. test_direct_publish, 403, media" />
          </label>
        </div>

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
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const filter = container.querySelector('#audit-filter');
    if (filter) {
      filter.addEventListener('input', (event) => {
        query = event.target.value;
        draw();
      });
    }
  }

  draw();
}
