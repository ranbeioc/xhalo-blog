import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';

export async function fetchIntegrationStatus() {
  const res = await apiFetch('/api/integrations/status');
  if (!res.ok) throw new Error(`Integrations API returned status ${res.status}`);
  return await res.json();
}

export function renderIntegrationsManager(container, data) {
  const github = data?.github || {};
  const cloudflare = data?.cloudflare || {};
  const gates = data?.writeGates || {};
  container.innerHTML = `
    <div class="integrations-workspace">
      <h2>GitHub / Cloudflare 管理</h2>
      <p class="lede">集中查询当前 GitHub 目标仓库、OAuth、Pages deploy hook、D1、R2、Queue 和写入 gate。敏感值只展示配置状态，不回显 secret。</p>
      <div class="dashboard-grid">
        <div class="card">
          <h3>GitHub</h3>
          ${row('目标仓库', `${github.owner || '-'} / ${github.repo || '-'}`)}
          ${row('目标分支', github.branch || '-')}
          ${row('Token/App 配置', github.tokenConfigured ? '已配置' : '未配置')}
          ${row('OAuth 配置', github.oauthConfigured ? '已配置' : '未配置')}
          ${row('安全测试目标', github.safeTestTarget ? '通过' : '阻断')}
        </div>
        <div class="card">
          <h3>Cloudflare</h3>
          ${row('环境', cloudflare.deploymentEnv || '-')}
          ${row('Pages Deploy Hook', cloudflare.pagesDeployHookConfigured ? '已配置' : '未配置')}
          ${row('Hook 延迟', `${cloudflare.pagesDeployHookDelayMs ?? '-'} ms`)}
          ${row('D1', cloudflare.d1Bound ? '已绑定' : '未绑定')}
          ${row('R2', cloudflare.r2Bound ? '已绑定' : '未绑定')}
          ${row('Queue', cloudflare.queueBound ? '已绑定' : '未绑定')}
        </div>
        <div class="card">
          <h3>写入 Gate</h3>
          ${row('Publish Mode', gates.publishMode || '-')}
          ${row('Live Writes', gates.liveWritesEnabled ? '已开启' : '关闭')}
          ${row('Test Direct Publish', gates.testDirectPublishEnabled ? '已开启' : '关闭')}
          ${row('Production R2 Live Upload', cloudflare.r2LiveWritesEnabled ? '已开启' : '关闭')}
        </div>
      </div>
    </div>
  `;
}

function row(label, value) {
  return `<div class="meta-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}
