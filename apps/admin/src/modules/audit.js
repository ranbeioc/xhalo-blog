import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml } from './ui.js';
import { renderDataTable, bindDataTableControls } from './table.js';

const copy = {
  en: {
    title: 'Read-Only Audit Logs',
    lede: 'Review recent admin actions, authentication requests, write attempts, and security gate rejections.',
    total: 'Total events',
    failed: 'Failed events',
    backend: 'Backend',
    search: 'Search action, resource, path, or error...',
    filter: 'Status code filter',
    all: 'All status codes',
    empty: 'No audit logs match the current filters.',
    action: 'Action',
    status: 'Status',
    resource: 'Resource',
    resourceId: 'Resource ID',
    requestPath: 'Request path',
    duration: 'Duration',
    timestamp: 'Timestamp',
    error: 'Error details'
  },
  'zh-CN': {
    title: '只读审计日志',
    lede: '查看近期管理操作、认证请求、写入尝试和安全门控拒绝记录。',
    total: '事件总数',
    failed: '失败事件',
    backend: '后端',
    search: '搜索 action、资源、路径或错误...',
    filter: '状态码筛选',
    all: '全部状态码',
    empty: '没有审计日志匹配当前筛选条件。',
    action: '动作',
    status: '状态',
    resource: '资源',
    resourceId: '资源 ID',
    requestPath: '请求路径',
    duration: '耗时',
    timestamp: '时间',
    error: '错误详情'
  },
  ko: {
    title: '읽기 전용 감사 로그',
    lede: '최근 관리 작업, 인증 요청, 쓰기 시도, 보안 게이트 거부 기록을 확인합니다.',
    total: '전체 이벤트',
    failed: '실패 이벤트',
    backend: '백엔드',
    search: '작업, 리소스, 경로, 오류 검색...',
    filter: '상태 코드 필터',
    all: '모든 상태 코드',
    empty: '현재 필터와 일치하는 감사 로그가 없습니다.',
    action: '작업',
    status: '상태',
    resource: '리소스',
    resourceId: '리소스 ID',
    requestPath: '요청 경로',
    duration: '소요 시간',
    timestamp: '시간',
    error: '오류 상세'
  },
  ja: {
    title: '読み取り専用監査ログ',
    lede: '最近の管理操作、認証リクエスト、書き込み試行、セキュリティゲート拒否を確認します。',
    total: 'イベント総数',
    failed: '失敗イベント',
    backend: 'バックエンド',
    search: 'action、リソース、パス、エラーを検索...',
    filter: 'ステータスコードフィルター',
    all: 'すべてのステータスコード',
    empty: '現在のフィルターに一致する監査ログはありません。',
    action: '操作',
    status: '状態',
    resource: 'リソース',
    resourceId: 'リソース ID',
    requestPath: 'リクエストパス',
    duration: '所要時間',
    timestamp: '時刻',
    error: 'エラー詳細'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

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
        <h2>${escapeHtml(c('title'))}</h2>
        <p class="lede">${escapeHtml(c('lede'))}</p>

        <div class="readiness-grid" style="margin-top: 20px;">
          <div class="readiness-item card"><strong>${escapeHtml(c('total'))}</strong><span class="status-badge" data-state="ok">${escapeHtml(String(summary?.total ?? logs.length))}</span></div>
          <div class="readiness-item card"><strong>${escapeHtml(c('failed'))}</strong><span class="status-badge" data-state="${summary?.failed ? 'warning' : 'ok'}">${escapeHtml(String(summary?.failed ?? 0))}</span></div>
          <div class="readiness-item card"><strong>${escapeHtml(c('backend'))}</strong><span class="status-badge" data-state="ok">${escapeHtml(summary?.backend || 'unknown')}</span></div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          ${renderDataTable({
            id: 'audit',
            rows: logs,
            query: tableState.query,
            filter: tableState.filter,
            page: tableState.page,
            pageSize: 12,
            searchPlaceholder: c('search'),
            filterLabel: c('filter'),
            allLabel: c('all'),
            emptyText: c('empty'),
            filterOptions: uniqueStatusCodes(logs).map((status) => ({ value: status, label: status })),
            getFilterValue: (log) => String(log.status_code || '-'),
            getSearchText: (log) => JSON.stringify(log),
            columns: [
              { label: c('action'), minWidth: '190px', render: (log) => `<code>${escapeHtml(log.action || '-')}</code>` },
              { label: c('status'), width: '110px', render: (log) => `<code>${escapeHtml(log.status_code ? String(log.status_code) : '-')}</code>` },
              { label: c('resource'), minWidth: '150px', render: (log) => `<code>${escapeHtml(log.resource || '-')}</code>` },
              { label: c('resourceId'), minWidth: '170px', render: (log) => `<code>${escapeHtml(log.resource_id || '-')}</code>` },
              { label: c('requestPath'), minWidth: '230px', render: (log) => `<code>${escapeHtml(log.method || '-')} ${escapeHtml(log.path || '-')}</code>` },
              { label: c('duration'), width: '120px', render: (log) => escapeHtml(log.duration_ms ? `${log.duration_ms}ms` : '-') },
              { label: c('timestamp'), minWidth: '190px', render: (log) => escapeHtml(log.timestamp ? new Date(log.timestamp).toLocaleString() : '-') },
              { label: c('error'), minWidth: '220px', render: (log) => `<span class="text-danger">${escapeHtml(log.error || '-')}</span>` }
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
