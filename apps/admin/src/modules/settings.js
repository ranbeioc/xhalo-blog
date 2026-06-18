import { ADMIN_API_BASE_URL } from '../config.js';
import { getAdminSecret, saveAdminSecret } from './api-client.js';
import { showToast } from './ui.js';

export function renderSettings(container, { dashboardData }) {
  const configUrl = ADMIN_API_BASE_URL || window.location.origin;
  const hasSecret = Boolean(getAdminSecret());
  const readiness = dashboardData?.readiness || {};
  const targetRepo = readiness.testDirectTargetRepo || 'ranbeioc/xhalo-blog-test';
  const targetBranch = readiness.testDirectTargetBranch || 'main';

  container.innerHTML = `
    <div class="settings-workspace">
      <h2>设置与工作区边界 / Settings & Workspace Boundary</h2>
      <p class="lede">查看当前 API 端点、目标仓库设置和前端部署边界。</p>

      <div class="settings-grid" style="margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div class="card boundary-info-card">
          <h3>Admin Pages 部署边界 / Admin Pages Deployment Boundary</h3>
          <div class="alert alert-info">
            <strong>项目集成 / Project Integration:</strong> Admin UI 从 <code>apps/admin</code> 构建，并作为 <code>xhalo-blog</code> 项目的一部分挂载在 <code>/admin</code>。博客后台不需要单独 Cloudflare Pages 项目。No separate Cloudflare Pages project is required for the blog admin.
          </div>
          <div class="meta-grid">
            <div class="meta-row"><span>前端仓库 / Frontend Repository</span><strong>ranbeioc/xhalo-blog/apps/admin</strong></div>
            <div class="meta-row"><span>部署目标 / Deployment Target</span><strong>xhalo-blog-test</strong></div>
            <div class="meta-row"><span>域名路径 / Domain Specification</span><strong>https://xhalo-blog-test.pages.dev/admin</strong></div>
            <div class="meta-row"><span>Pages 构建命令 / Pages Build Command</span><code>npm run build:test-pages</code></div>
            <div class="meta-row"><span>Pages 输出目录 / Pages Output Directory</span><code>dist/pages</code></div>
          </div>
        </div>

        <div class="card api-endpoints-card">
          <h3>API 端点配置 / API Endpoint Configuration</h3>
          <p class="help-text">通过 Cloudflare Pages 的 <code>XHALO_ADMIN_API_BASE_URL</code> 环境变量在构建时注入配置。</p>
          <div class="meta-grid">
            <div class="meta-row"><span>解析后的 API Base URL / Resolved API Base URL</span><code>${configUrl}</code></div>
            <div class="meta-row"><span>认证回调路径 / Auth callback path</span><code>/auth/github/callback</code></div>
            <div class="meta-row"><span>会话查询端点 / Session query endpoint</span><code>/api/auth/session</code></div>
          </div>
        </div>

        <div class="card repo-settings-card">
          <h3>目标内容仓库 / Target Content Repository</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>测试直发目标 / Test Direct Target</span><strong>${targetRepo}</strong></div>
            <div class="meta-row"><span>目标分支 / Target Branch</span><strong>${targetBranch}</strong></div>
            <div class="meta-row"><span>禁止目标 / Forbidden Target</span><strong>ranbeioc/hexo-blog@main</strong></div>
          </div>
        </div>

        <!-- Advanced / Debug Section (Legacy Secret Fallback) -->
        <details class="card advanced-debug-card" style="cursor: pointer; padding: 15px; border: 1px solid var(--border-color); border-radius: 8px;">
          <summary style="font-weight: 600; font-size: 1.1rem; outline: none; margin-bottom: 10px;">高级调试设置 / Advanced / Debug Settings (Legacy)</summary>
          <div class="details-content" style="cursor: default; margin-top: 15px;">
            <p class="help-text" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
              <strong>Legacy / Debug Mode:</strong> 可配置 fallback admin shared secret，用于 legacy 流程或本地模拟器；正式线上应优先使用 GitHub OAuth 管理员会话。
            </p>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="password" id="input-admin-secret" class="form-input" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-input); color: var(--text-color);" placeholder="输入 legacy secret..." value="${hasSecret ? '••••••••••••••••' : ''}" />
              <button id="btn-save-secret" class="btn btn-primary" style="padding: 8px 16px;">保存 / Save</button>
              <button id="btn-clear-secret" class="btn btn-secondary" style="padding: 8px 16px;">清除 / Clear</button>
            </div>
            <p id=\"secret-status-text\" style=\"margin-top: 10px; font-size: 0.85rem; font-weight: 500; color: ${hasSecret ? 'var(--green)' : 'var(--text-muted)'};\">
              状态 / Status: ${hasSecret ? 'Legacy secret is currently configured.' : 'No legacy secret configured.'}
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
        showToast('Secret 未变化 / Secret unchanged.', 'info');
        return;
      }
      if (!val) {
        showToast('请输入 secret 或点击清除 / Please enter a secret value or click Clear.', 'warning');
        return;
      }
      saveAdminSecret(val);
      statusText.style.color = 'var(--green)';
      statusText.textContent = '状态 / Status: Legacy secret is currently configured.';
      inputSecret.value = '••••••••••••••••';
      showToast('Legacy secret 已保存 / Legacy secret saved successfully.', 'success');
    });
  }

  if (btnClear && inputSecret) {
    btnClear.addEventListener('click', () => {
      saveAdminSecret('');
      statusText.style.color = 'var(--text-muted)';
      statusText.textContent = '状态 / Status: No legacy secret configured.';
      inputSecret.value = '';
      showToast('Legacy secret 已清除 / Legacy secret cleared.', 'info');
    });
  }
}
