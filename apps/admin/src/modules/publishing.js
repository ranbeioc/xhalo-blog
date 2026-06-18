import { renderDataTable, bindDataTableControls } from './table.js';

export function renderPublishingSafetyCenter(container, { dashboardData }) {
  const readiness = dashboardData?.readiness;
  const health = dashboardData?.health;
  void health;
  const tableState = { query: '', filter: 'all', page: 1 };

  const getGateStatusBadge = (enabled) => {
    return enabled 
      ? '<span class="status-badge" data-state="error">Enabled (HIGH RISK)</span>'
      : '<span class="status-badge" data-state="ok">Gated (Safe)</span>';
  };

  const rows = [
    {
      capability: '草稿文章发布 / Draft Article Publishing',
      workflow: '生成分支并打开 GitHub PR / Generate branch and open GitHub PR',
      gate: readiness?.ownerDirectPublishEnabled,
      mode: 'PR-only'
    },
    {
      capability: '已有文章更新 / Existing Article Updates',
      workflow: '拉取源码、检查 diff、生成 PR / Fetch source, check diff, generate PR',
      gate: readiness?.ownerDirectUpdateEnabled,
      mode: 'PR-only'
    },
    {
      capability: '媒体上传 / Media Uploads (R2)',
      workflow: 'Dry-run 索引计算；测试环境可 signed upload',
      gate: readiness?.liveWritesEnabled,
      mode: 'Dry-run Only'
    },
    {
      capability: '站点菜单配置 / Site Menu Config',
      workflow: '本地校验与 diff 预览 / Local validation and diff preview',
      gate: readiness?.ownerDirectConfigUpdateEnabled,
      mode: 'Preview Only'
    }
  ];

  function draw() {
    container.innerHTML = `
      <div class="publishing-workspace">
        <h2>发布安全中心 / Publishing Safety Center</h2>
        <p class="lede">查看内容发布的写入 gate、安全层和运行参数。</p>

        <div class="alert alert-info" style="margin-bottom: 25px;">
          <strong>安全基线 / Safety Baseline:</strong> 默认执行严格的 Branch & PR 工作流，生产仓库配置和数据库写入保持阻断。
        </div>

        <div class="publishing-grid">
          <div class="card safety-matrix-card field-span-2">
            <h3>操作安全矩阵 / Active Operations Safety Matrix</h3>
            ${renderDataTable({
              id: 'publishing-safety',
              rows,
              query: tableState.query,
              filter: tableState.filter,
              page: tableState.page,
              pageSize: 4,
              searchPlaceholder: '搜索能力、工作流、模式...',
              filterLabel: 'gate 筛选',
              allLabel: '全部 gate',
              filterOptions: [
                { value: 'safe', label: 'Gated / 安全阻断' },
                { value: 'risk', label: 'Enabled / 高风险启用' }
              ],
              getFilterValue: (row) => row.gate ? 'risk' : 'safe',
              getSearchText: (row) => `${row.capability} ${row.workflow} ${row.mode}`,
              columns: [
                { label: '能力 / Capability', minWidth: '230px', render: (row) => `<strong>${row.capability}</strong>` },
                { label: '工作流约束 / Workflow Enforcement', minWidth: '260px', render: (row) => row.workflow },
                { label: '安全 gate / Safety Gate Status', minWidth: '170px', render: (row) => getGateStatusBadge(row.gate) },
                { label: '动作模式 / Action Mode', width: '140px', render: (row) => `<code>${row.mode}</code>` }
              ]
            })}
          </div>

          <div class="card security-layers-card">
            <h3>安全层 / Security Layers</h3>
            <div class="meta-grid">
              <div class="meta-row">
                <span>Cloudflare Access</span>
                <span class="status-badge" data-state="ok">Active / 已启用</span>
              </div>
              <div class="meta-row">
                <span>Turnstile CAPTCHA</span>
                <span class="status-badge" data-state="${readiness?.turnstileSiteKey ? 'ok' : 'warning'}">
                  ${readiness?.turnstileSiteKey ? 'Active / 已启用' : 'Bypassed (Staging) / 测试绕过'}
                </span>
              </div>
              <div class="meta-row">
                <span>Audit Logging (D1)</span>
                <span class="status-badge" data-state="ok">Active / 已启用</span>
              </div>
            </div>
          </div>

          <div class="card gated-actions-card">
            <h3>受控开关 / Gated Controls</h3>
            <p class="help-text">生产 main 分支直接写入必须通过 Cloudflare 环境变量显式开启，不能从界面绕过。</p>
            <div class="btn-col" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
              <button class="button-danger" disabled title="Direct publish to main requires OWNER_DIRECT_PUBLISH_ENABLED=true">启用直接发布 / Enable Direct Publish</button>
              <button class="button-danger" disabled title="Direct update requires OWNER_DIRECT_UPDATE_ENABLED=true">启用直接更新 / Enable Direct Update</button>
              <button class="button-danger" disabled title="Direct config update requires OWNER_DIRECT_CONFIG_UPDATE_ENABLED=true">启用配置直写 / Enable Direct Config Update</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindDataTableControls(container, 'publishing-safety', tableState, draw);
  }

  draw();
}
