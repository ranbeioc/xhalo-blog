import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';

export async function fetchDashboardData() {
  try {
    const [healthRes, readinessRes, statsRes, auditSummaryRes] = await Promise.all([
      apiFetch('/api/health').catch(() => null),
      apiFetch('/api/readiness').catch(() => null),
      apiFetch('/api/blog/stats').catch(() => null),
      apiFetch('/api/audit-logs/summary').catch(() => null)
    ]);

    const health = healthRes && healthRes.ok
      ? await healthRes.json()
      : { ok: false, note: 'Offline / connection failed' };
    const readiness = readinessRes && readinessRes.ok ? await readinessRes.json() : null;
    const stats = statsRes && statsRes.ok ? await statsRes.json() : null;
    const auditSummary = auditSummaryRes && auditSummaryRes.ok ? await auditSummaryRes.json() : null;

    return { health, readiness, stats, auditSummary };
  } catch (err) {
    return {
      health: { ok: false, note: err.message },
      readiness: null,
      stats: null,
      auditSummary: null
    };
  }
}

export function renderDashboard(container, data) {
  const { health, readiness, stats, auditSummary } = data;
  const healthState = health.ok ? 'ok' : 'error';
  const healthLabel = health.ok ? 'Healthy' : 'Unhealthy';

  const readinessListHtml = readiness?.items?.length
    ? readiness.items.map((item) => `
      <div class="readiness-item card">
        <div class="readiness-header">
          <strong class="item-title">${escapeHtml(item.label)}</strong>
          <span class="status-badge" data-state="${item.status === 'ready' ? 'ok' : item.status === 'partial' ? 'warning' : 'error'}">${escapeHtml(item.status)}</span>
        </div>
        <p class="item-desc">${escapeHtml(item.note || '')}</p>
      </div>
    `).join('')
    : '<p class="info-text">Readiness status unavailable. Please login with GitHub or configure legacy secret in Settings.</p>';

  const statsCards = renderStatsCards(stats, auditSummary);

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card status-card">
        <h3>System Status</h3>
        <div class="meta-grid">
          <div class="meta-row"><span>API Health</span><span class="status-badge" data-state="${healthState}">${healthLabel}</span></div>
          <div class="meta-row"><span>Details</span><span>${escapeHtml(health.note || 'No description')}</span></div>
          <div class="meta-row"><span>First GitHub Admin</span><strong>${readiness?.deploymentEnv === 'test' ? 'Test bootstrap allowed' : 'Production bootstrap disabled by default'}</strong></div>
        </div>
        <div class="alert alert-warning" style="margin-top: 15px;">
          <strong>Production Safety Notice:</strong> Production direct writes, production R2 live upload, and <code>hexo-blog@main</code> writes remain blocked.
        </div>
      </div>

      <div class="card boundary-card">
        <h3>Security Gate Status</h3>
        <div class="meta-grid">
          <div class="meta-row"><span>Publish Mode</span><strong>${escapeHtml(readiness?.publishMode || 'pr_only')}</strong></div>
          <div class="meta-row"><span>Test Direct Publish</span><strong class="${readiness?.testDirectPublishEnabled && readiness?.testDirectTargetSafe ? 'text-success' : 'text-muted'}">${readiness?.testDirectPublishEnabled ? 'Gate enabled' : 'Disabled'}</strong></div>
          <div class="meta-row"><span>Test Target</span><strong>${escapeHtml(readiness?.testDirectTargetRepo || 'not configured')}@${escapeHtml(readiness?.testDirectTargetBranch || 'unknown')}</strong></div>
          <div class="meta-row"><span>OAuth Login</span><strong>${readiness?.oauthEnabled ? 'Enabled' : 'Disabled'}</strong></div>
        </div>
      </div>

      <div class="card field-span-2">
        <h3>Blog Data and Operations</h3>
        <div class="readiness-grid">${statsCards}</div>
      </div>

      <div class="card readiness-card field-span-2">
        <h3>Service Capabilities</h3>
        <div class="readiness-grid">${readinessListHtml}</div>
      </div>

      <div class="card limitations-card field-span-2">
        <h3>Known Boundaries & Exclusions</h3>
        <ul class="bullet-list">
          <li><strong>Media Asset Manager</strong> supports dry-run planning and test-only signed upload when <code>TEST_MEDIA_UPLOAD_ENABLED=true</code>.</li>
          <li><strong>Site Menu Manager</strong> supports local CRUD, diff preview, and test-only save to the configured test target.</li>
          <li><strong>Test Direct Publish</strong> requires GitHub admin session, <code>DEPLOYMENT_ENV=test</code>, <code>PUBLISH_MODE=test_direct</code>, and a safe non-production target.</li>
        </ul>
      </div>
    </div>
  `;
}

function renderStatsCards(stats, auditSummary) {
  const cards = [
    ['Posts', stats?.counts?.posts ?? 0, 'Indexed blog posts'],
    ['Published', stats?.counts?.publishedPosts ?? 0, 'Published records'],
    ['Media', stats?.counts?.mediaAssets ?? 0, 'Recorded media assets'],
    ['Tasks', stats?.counts?.tasks ?? 0, 'Publish or upload tasks'],
    ['Audit Events', auditSummary?.total ?? 0, 'Recent administrative events'],
    ['Failed Events', auditSummary?.failed ?? 0, 'Non-2xx audit records']
  ];

  return cards.map(([label, value, note]) => `
    <div class="readiness-item card">
      <div class="readiness-header">
        <strong class="item-title">${escapeHtml(label)}</strong>
        <span class="status-badge" data-state="ok">${escapeHtml(String(value))}</span>
      </div>
      <p class="item-desc">${escapeHtml(note)}</p>
    </div>
  `).join('');
}
