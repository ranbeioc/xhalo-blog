import { ADMIN_API_BASE_URL } from '../config.js';
import { getAdminSecret, saveAdminSecret } from './api-client.js';

export function renderSettings(container, { dashboardData }) {
  const configUrl = ADMIN_API_BASE_URL || window.location.origin;
  const hasSecret = Boolean(getAdminSecret());

  container.innerHTML = `
    <div class="settings-workspace">
      <h2>Settings & Workspace Boundary</h2>
      <p class="lede">View current API endpoints, target repository settings, and frontend deployment boundaries.</p>

      <div class="settings-grid" style="margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div class="card boundary-info-card">
          <h3>Admin Pages Deployment Boundary</h3>
          <div class="alert alert-info">
            <strong>Project Integration:</strong> The Admin UI is built from <code>apps/admin</code> and served as part of the <code>xhalo-blog</code> project, preferably under <code>/admin</code>. No separate Cloudflare Pages project is required for the blog admin.
          </div>
          <div class="meta-grid">
            <div class="meta-row"><span>Frontend Repository</span><strong>ranbeioc/xhalo-blog/apps/admin</strong></div>
            <div class="meta-row"><span>Deployment Target</span><strong>xhalo-blog</strong></div>
            <div class="meta-row"><span>Domain Specification</span><strong>https://&lt;preview-id&gt;.xhalo-blog.pages.dev/admin</strong></div>
          </div>
        </div>

        <div class="card api-endpoints-card">
          <h3>API Endpoint Configuration</h3>
          <p class="help-text">Inject configurations during build time using the <code>XHALO_ADMIN_API_BASE_URL</code> environment variable on Cloudflare Pages.</p>
          <div class="meta-grid">
            <div class="meta-row"><span>Resolved API Base URL</span><code>${configUrl}</code></div>
            <div class="meta-row"><span>Auth callback path</span><code>/auth/github/callback</code></div>
            <div class="meta-row"><span>Session query endpoint</span><code>/api/auth/session</code></div>
          </div>
        </div>

        <div class="card repo-settings-card">
          <h3>Target Content Repository</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>Repository Owner</span><strong>ranbeioc</strong></div>
            <div class="meta-row"><span>Repository Name</span><strong>hexo-blog</strong></div>
            <div class="meta-row"><span>Default Branch</span><strong>main</strong></div>
          </div>
        </div>

        <!-- Advanced / Debug Section (Legacy Secret Fallback) -->
        <details class="card advanced-debug-card" style="cursor: pointer; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px;">
          <summary style="font-weight: 600; font-size: 1.1rem; outline: none; margin-bottom: 10px;">🛠️ Advanced / Debug Settings (Legacy)</summary>
          <div class="details-content" style="cursor: default; margin-top: 15px;">
            <p class="help-text" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
              <strong>Legacy / Debug Mode:</strong> You can configure a fallback admin shared secret to bypass GitHub OAuth session requirements. This is reserved for legacy workflows and local emulators.
            </p>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="password" id="input-admin-secret" class="form-input" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-input); color: var(--text-color);" placeholder="Enter legacy secret..." value="${hasSecret ? '••••••••••••••••' : ''}" />
              <button id="btn-save-secret" class="btn btn-primary" style="padding: 8px 16px;">Save</button>
              <button id="btn-clear-secret" class="btn btn-secondary" style="padding: 8px 16px;">Clear</button>
            </div>
            <p id="secret-status-text" style="margin-top: 10px; font-size: 0.85rem; font-weight: 500; color: ${hasSecret ? 'var(--color-success)' : 'var(--text-muted)'};">
              Status: ${hasSecret ? 'Legacy secret is currently configured.' : 'No legacy secret configured.'}
            </p>
          </div>
        </details>
      </div>
    </div>
  `;

  // Attach event listeners for the debug secret section
  const inputSecret = container.querySelector('#input-admin-secret');
  const btnSave = container.querySelector('#btn-save-secret');
  const btnClear = container.querySelector('#btn-clear-secret');
  const statusText = container.querySelector('#secret-status-text');

  if (btnSave && inputSecret) {
    btnSave.addEventListener('click', () => {
      const val = inputSecret.value.trim();
      if (val === '••••••••••••••••') {
        alert('Secret unchanged.');
        return;
      }
      if (!val) {
        alert('Please enter a secret value or click Clear.');
        return;
      }
      saveAdminSecret(val);
      statusText.style.color = 'var(--color-success)';
      statusText.textContent = 'Status: Legacy secret is currently configured.';
      inputSecret.value = '••••••••••••••••';
      alert('Legacy secret saved successfully.');
    });
  }

  if (btnClear && inputSecret) {
    btnClear.addEventListener('click', () => {
      saveAdminSecret('');
      statusText.style.color = 'var(--text-muted)';
      statusText.textContent = 'Status: No legacy secret configured.';
      inputSecret.value = '';
      alert('Legacy secret cleared.');
    });
  }
}
