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
  const healthLabel = health.ok ? '正常 / Healthy' : '异常 / Unhealthy';

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
    : '<p class="info-text">能力状态不可用，请使用 GitHub 登录或在设置中配置 legacy secret。</p>';

  const statsCards = renderStatsCards(stats, auditSummary);

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card status-card">
        <h3>系统状态 / System Status</h3>
        <div class="meta-grid">
          <div class="meta-row"><span>API 健康 / API Health</span><span class="status-badge" data-state="${healthState}">${healthLabel}</span></div>
          <div class="meta-row"><span>详情 / Details</span><span>${escapeHtml(health.note || 'No description')}</span></div>
          <div class="meta-row"><span>首登 GitHub 管理员 / First GitHub Admin</span><strong>${readiness?.deploymentEnv === 'test' ? '测试环境允许 bootstrap / Test bootstrap allowed' : '生产默认禁用 / Production bootstrap disabled by default'}</strong></div>
        </div>
        <div class="alert alert-warning" style="margin-top: 15px;">
          <strong>生产安全提示 / Production Safety Notice:</strong> 生产直接写入、生产 R2 live upload、<code>hexo-blog@main</code> 写入均保持阻断。
        </div>
      </div>

      <div class="card boundary-card">
        <h3>安全 Gate 状态 / Security Gate Status</h3>
        <div class="meta-grid">
          <div class="meta-row"><span>发布模式 / Publish Mode</span><strong>${escapeHtml(readiness?.publishMode || 'pr_only')}</strong></div>
          <div class="meta-row"><span>测试直发 / Test Direct Publish</span><strong class="${readiness?.testDirectPublishEnabled && readiness?.testDirectTargetSafe ? 'text-success' : 'text-muted'}">${readiness?.testDirectPublishEnabled ? 'Gate enabled / 已启用' : 'Disabled / 已禁用'}</strong></div>
          <div class="meta-row"><span>测试目标 / Test Target</span><strong>${escapeHtml(readiness?.testDirectTargetRepo || 'not configured')}@${escapeHtml(readiness?.testDirectTargetBranch || 'unknown')}</strong></div>
          <div class="meta-row"><span>OAuth 登录 / OAuth Login</span><strong>${readiness?.oauthEnabled ? 'Enabled / 已启用' : 'Disabled / 已禁用'}</strong></div>
        </div>
      </div>

      <div class="card field-span-2">
        <h3>博客数据与操作 / Blog Data and Operations</h3>
        <div class="readiness-grid">${statsCards}</div>
      </div>

      <div class="card readiness-card field-span-2">
        <h3>服务能力 / Service Capabilities</h3>
        <div class="readiness-grid">${readinessListHtml}</div>
      </div>

      <div class="card limitations-card field-span-2">
        <h3>已知边界 / Known Boundaries & Exclusions</h3>
        <ul class="bullet-list">
          <li><strong>Media Asset Manager / 媒体资产管理</strong> 支持 dry-run 规划，并在 <code>TEST_MEDIA_UPLOAD_ENABLED=true</code> 时允许 test-only signed upload。</li>
          <li><strong>Site Menu Manager / 站点菜单管理</strong> 支持本地增删改、diff preview 和保存到测试目标。</li>
          <li><strong>Test Direct Publish / 测试直发</strong> 需要 GitHub 管理员会话、<code>DEPLOYMENT_ENV=test</code>、<code>PUBLISH_MODE=test_direct</code> 和安全的非生产目标。</li>
        </ul>
      </div>
    </div>
  `;
}

function renderStatsCards(stats, auditSummary) {
  const cards = [
    ['文章 / Posts', stats?.counts?.posts ?? 0, '已索引博客文章 / Indexed blog posts'],
    ['已发布 / Published', stats?.counts?.publishedPosts ?? 0, '发布记录 / Published records'],
    ['媒体 / Media', stats?.counts?.mediaAssets ?? 0, '媒体资产记录 / Recorded media assets'],
    ['任务 / Tasks', stats?.counts?.tasks ?? 0, '发布或上传任务 / Publish or upload tasks'],
    ['审计事件 / Audit Events', auditSummary?.total ?? 0, '近期管理事件 / Recent administrative events'],
    ['失败事件 / Failed Events', auditSummary?.failed ?? 0, '非 2xx 审计记录 / Non-2xx audit records']
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
