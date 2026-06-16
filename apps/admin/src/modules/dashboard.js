import { apiFetch } from './api-client.js';

export async function fetchDashboardData() {
  try {
    const [healthRes, readinessRes] = await Promise.all([
      apiFetch('/api/health').catch(() => null),
      apiFetch('/api/readiness').catch(() => null)
    ]);

    let health = { ok: false, note: 'Offline / connection failed' };
    let readiness = null;

    if (healthRes && healthRes.ok) {
      health = await healthRes.json();
    }
    if (readinessRes && readinessRes.ok) {
      readiness = await readinessRes.json();
    }

    return { health, readiness };
  } catch (err) {
    return {
      health: { ok: false, note: err.message },
      readiness: null
    };
  }
}

export function renderDashboard(container, data) {
  const { health, readiness } = data;

  const healthState = health.ok ? 'ok' : 'error';
  const healthLabel = health.ok ? 'Healthy' : 'Unhealthy';

  let readinessListHtml = '<p class="info-text">Readiness status unavailable. Please login with GitHub or configure legacy secret in Settings.</p>';
  let boundaryHtml = '';

  if (readiness) {
    const items = readiness.items || [];
    readinessListHtml = items.map(item => `
      <div class="readiness-item card">
        <div class="readiness-header">
          <strong class="item-title">${item.label}</strong>
          <span class="status-badge" data-state="${item.status === 'ready' ? 'ok' : item.status === 'partial' ? 'warning' : 'error'}">${item.status}</span>
        </div>
        <p class="item-desc">${item.note || ''}</p>
      </div>
    `).join('');

    boundaryHtml = `
      <div class="card boundary-card">
        <h3>Deployment Boundary & Configuration</h3>
        <div class="meta-grid">
          <div class="meta-row"><span>Publish Mode</span><strong>${readiness.publishMode || 'pr_only'}</strong></div>
          <div class="meta-row"><span>Direct Publish</span><strong class="${readiness.ownerDirectPublishEnabled ? 'text-danger' : 'text-success'}">${readiness.ownerDirectPublishEnabled ? 'Enabled (HIGH RISK)' : 'Disabled (Safe)'}</strong></div>
          <div class="meta-row"><span>Direct Update</span><strong class="${readiness.ownerDirectUpdateEnabled ? 'text-danger' : 'text-success'}">${readiness.ownerDirectUpdateEnabled ? 'Enabled (HIGH RISK)' : 'Disabled (Safe)'}</strong></div>
          <div class="meta-row"><span>Test Direct Publish</span><strong class="${readiness.testDirectPublishEnabled && readiness.testDirectTargetSafe ? 'text-success' : 'text-muted'}">${readiness.testDirectPublishEnabled ? 'Gate enabled' : 'Disabled'}</strong></div>
          <div class="meta-row"><span>Test Target</span><strong>${readiness.testDirectTargetRepo || 'not configured'}@${readiness.testDirectTargetBranch || 'unknown'}</strong></div>
          <div class="meta-row"><span>OAuth Login</span><strong>${readiness.oauthEnabled ? 'Enabled' : 'Disabled'}</strong></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card status-card">
        <h3>System Status</h3>
        <div class="meta-grid">
          <div class="meta-row">
            <span>API Health</span>
            <span class="status-badge" data-state="${healthState}">${healthLabel}</span>
          </div>
          <div class="meta-row">
            <span>Details</span>
            <span>${health.note || 'No description'}</span>
          </div>
        </div>
        
        <div class="alert alert-warning" style="margin-top: 15px;">
          <strong>Production Safety Notice:</strong> Live writes are strictly disabled by default. All article creations generate review Pull Requests rather than modifying the main branch. R2 uploads are executed in dry-run mode.
        </div>
      </div>

      ${boundaryHtml}

      <div class="card readiness-card field-span-2">
        <h3>Service Capabilities</h3>
        <div class="readiness-grid">
          ${readinessListHtml}
        </div>
      </div>
      
      <div class="card limitations-card field-span-2">
        <h3>Known Boundaries & Exclusions</h3>
        <ul class="bullet-list">
          <li><strong>Media Asset Manager</strong> behaves as dry-run only. Image files are analyzed, and Markdown insert snippets are calculated, but no binary upload is sent to R2 storage.</li>
          <li><strong>Site Menu Manager</strong> runs in preview-only mode. Menu changes can be validated locally, but menu config direct updates remain gated.</li>
          <li><strong>Test Direct Publish</strong> requires GitHub admin session, <code>DEPLOYMENT_ENV=test</code>, <code>PUBLISH_MODE=test_direct</code>, and a safe non-production target.</li>
        </ul>
      </div>
    </div>
  `;
}
