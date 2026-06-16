import { ADMIN_API_BASE_URL } from '../config.js';

export function renderSettings(container, { dashboardData }) {
  const readiness = dashboardData?.readiness;
  const configUrl = ADMIN_API_BASE_URL || window.location.origin;

  container.innerHTML = `
    <div class="settings-workspace">
      <h2>Settings & Workspace Boundary</h2>
      <p class="lede">View current API endpoints, target repository settings, and frontend deployment boundaries.</p>

      <div class="settings-grid" style="margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div class="card boundary-info-card">
          <h3>Admin Pages Deployment Boundary</h3>
          <div class="alert alert-info">
            <strong>Project Isolation:</strong> This administration panel is bound exclusively to the <code>xhalo-blog-admin</code> project and deploys from the <code>apps/admin</code> workspace of the <code>ranbeioc/xhalo-blog</code> repository. It is completely isolated from the global <code>xhalo-admin</code> administrative tool.
          </div>
          <div class="meta-grid">
            <div class="meta-row"><span>Frontend Repository</span><strong>ranbeioc/xhalo-blog/apps/admin</strong></div>
            <div class="meta-row"><span>Deployment Target</span><strong>xhalo-blog-admin</strong></div>
            <div class="meta-row"><span>Domain Specification</span><strong>https://&lt;preview&gt;.xhalo-blog-admin.pages.dev</strong></div>
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
      </div>
    </div>
  `;
}
