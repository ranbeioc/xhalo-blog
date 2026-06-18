import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';
import { renderDataTable, bindDataTableControls } from './table.js';

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
  const tableState = { query: '', filter: 'all', page: 1 };

  function draw() {
    container.innerHTML = `
      <div class="audit-workspace">
        <h2>只读审计日志 / Read-Only Audit Logs</h2>
        <p class="lede">查看近期管理操作、认证请求、写入尝试和安全 gate 拒绝记录。</p>

        <div class="readiness-grid" style="margin-top: 20px;">
          <div class="readiness-item card"><strong>事件总数 / Total Events</strong><span class="status-badge" data-state="ok">${escapeHtml(String(summary?.total ?? logs.length))}</span></div>
          <div class="readiness-item card"><strong>失败事件 / Failed Events</strong><span class="status-badge" data-state="${summary?.failed ? 'warning' : 'ok'}">${escapeHtml(String(summary?.failed ?? 0))}</span></div>
          <div class="readiness-item card"><strong>后端 / Backend</strong><span class="status-badge" data-state="ok">${escapeHtml(summary?.backend || 'unknown')}</span></div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          ${renderDataTable({
            id: 'audit',
            rows: logs,
            query: tableState.query,
            filter: tableState.filter,
            page: tableState.page,
            pageSize: 12,
            searchPlaceholder: '搜索 action、资源、路径、错误...',
            filterLabel: '状态码筛选',
            allLabel: '全部状态码',
            emptyText: '没有审计日志匹配当前筛选条件。',
            filterOptions: uniqueStatusCodes(logs).map((status) => ({ value: status, label: status })),
            getFilterValue: (log) => String(log.status_code || '-'),
            getSearchText: (log) => JSON.stringify(log),
            columns: [
              { label: '动作 / Action', minWidth: '190px', render: (log) => `<code>${escapeHtml(log.action || '-')}</code>` },
              { label: '状态 / Status', width: '110px', render: (log) => `<code>${escapeHtml(log.status_code ? String(log.status_code) : '-')}</code>` },
              { label: '资源 / Resource', minWidth: '150px', render: (log) => `<code>${escapeHtml(log.resource || '-')}</code>` },
              { label: '资源 ID', minWidth: '170px', render: (log) => `<code>${escapeHtml(log.resource_id || '-')}</code>` },
              { label: '请求路径 / Request Path', minWidth: '230px', render: (log) => `<code>${escapeHtml(log.method || '-')} ${escapeHtml(log.path || '-')}</code>` },
              { label: '耗时 / Duration', width: '120px', render: (log) => escapeHtml(log.duration_ms ? `${log.duration_ms}ms` : '-') },
              { label: '时间 / Timestamp', minWidth: '190px', render: (log) => escapeHtml(log.timestamp ? new Date(log.timestamp).toLocaleString() : '-') },
              { label: '错误 / Error details', minWidth: '220px', render: (log) => `<span class="text-danger">${escapeHtml(log.error || '-')}</span>` }
            ]
          })}
        </div>
      </div>
    `;

    bindDataTableControls(container, 'audit', tableState, draw);
  }

  draw();
}

function uniqueStatusCodes(logs) {
  return Array.from(new Set(logs.map((log) => String(log.status_code || '-')))).sort();
}
