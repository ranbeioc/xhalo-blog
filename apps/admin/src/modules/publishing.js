export function renderPublishingSafetyCenter(container, { dashboardData }) {
  const readiness = dashboardData?.readiness;
  const health = dashboardData?.health;

  const getGateStatusBadge = (enabled) => {
    return enabled 
      ? '<span class="status-badge" data-state="error">Enabled (HIGH RISK)</span>'
      : '<span class="status-badge" data-state="ok">Gated (Safe)</span>';
  };

  container.innerHTML = `
    <div class="publishing-workspace">
      <h2>Publishing Safety Center</h2>
      <p class="lede">Review active write gates, security enforcement layers, and operational parameters for content publishing.</p>

      <div class="alert alert-info" style="margin-bottom: 25px;">
        <strong>Safety Baseline:</strong> The system enforces a strict "Branch & PR" workflow by default. Production write access to repository configurations or databases is blocked.
      </div>

      <div class="publishing-grid">
        <div class="card safety-matrix-card field-span-2">
          <h3>Active Operations Safety Matrix</h3>
          <div class="table-container">
            <table class="safety-table">
              <thead>
                <tr>
                  <th>Capability / Target</th>
                  <th>Workflow Enforcement</th>
                  <th>Safety Gate Status</th>
                  <th>Action Mode</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Draft Article Publishing</strong></td>
                  <td>Generate branch and open GitHub PR</td>
                  <td>${getGateStatusBadge(readiness?.ownerDirectPublishEnabled)}</td>
                  <td><code>PR-only</code></td>
                </tr>
                <tr>
                  <td><strong>Existing Article Updates</strong></td>
                  <td>Fetch source, check diff, generate PR</td>
                  <td>${getGateStatusBadge(readiness?.ownerDirectUpdateEnabled)}</td>
                  <td><code>PR-only</code></td>
                </tr>
                <tr>
                  <td><strong>Media Uploads (R2)</strong></td>
                  <td>Dry-run index calculation</td>
                  <td>${getGateStatusBadge(readiness?.liveWritesEnabled)}</td>
                  <td><code>Dry-run Only</code></td>
                </tr>
                <tr>
                  <td><strong>Site Menu Config</strong></td>
                  <td>Local validation and diff preview</td>
                  <td>${getGateStatusBadge(readiness?.ownerDirectConfigUpdateEnabled)}</td>
                  <td><code>Preview Only</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card security-layers-card">
          <h3>Security Layers</h3>
          <div class="meta-grid">
            <div class="meta-row">
              <span>Cloudflare Access</span>
              <span class="status-badge" data-state="ok">Active</span>
            </div>
            <div class="meta-row">
              <span>Turnstile CAPTCHA</span>
              <span class="status-badge" data-state="${readiness?.turnstileSiteKey ? 'ok' : 'warning'}">
                ${readiness?.turnstileSiteKey ? 'Active' : 'Bypassed (Staging)'}
              </span>
            </div>
            <div class="meta-row">
              <span>Audit Logging (D1)</span>
              <span class="status-badge" data-state="ok">Active</span>
            </div>
          </div>
        </div>

        <div class="card gated-actions-card">
          <h3>Gated Controls</h3>
          <p class="help-text">Direct changes to production main branch require environment secret modification on Cloudflare. These cannot be overridden from the interface.</p>
          <div class="btn-col" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
            <button class="button-danger" disabled title="Direct publish to main requires OWNER_DIRECT_PUBLISH_ENABLED=true">Enable Direct Publish</button>
            <button class="button-danger" disabled title="Direct update requires OWNER_DIRECT_UPDATE_ENABLED=true">Enable Direct Update</button>
            <button class="button-danger" disabled title="Direct config update requires OWNER_DIRECT_CONFIG_UPDATE_ENABLED=true">Enable Direct Config Update</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
