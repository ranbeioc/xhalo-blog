import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';

export async function fetchBlogStats() {
  const res = await apiFetch('/api/blog/stats');
  if (!res.ok) throw new Error(`Stats API returned status ${res.status}`);
  return await res.json();
}

export function renderBlogStats(container, stats) {
  const counts = stats?.counts || {};
  const topCategories = Array.isArray(stats?.topCategories) ? stats.topCategories : [];
  const topTags = Array.isArray(stats?.topTags) ? stats.topTags : [];

  container.innerHTML = `
    <div class="stats-workspace">
      <h2>博客数据统计</h2>
      <p class="lede">统计数据优先来自 GitHub 源仓库的 <code>source/_posts</code>，用于验证历史 Hexo/NexT 内容迁移后的真实站点规模。</p>

      <div class="stats-grid">
        ${metricCard('文章总数', counts.posts ?? 0, 'GitHub source posts')}
        ${metricCard('已发布', counts.publishedPosts ?? 0, 'Published posts')}
        ${metricCard('草稿', counts.draftPosts ?? 0, 'Draft posts')}
        ${metricCard('分类数', counts.categories ?? 0, 'Categories')}
        ${metricCard('标签数', counts.tags ?? 0, 'Tags')}
        ${metricCard('审计事件', counts.auditEvents ?? 0, 'Audit events')}
      </div>

      <div class="dashboard-grid" style="margin-top: 20px;">
        <div class="card">
          <h3>基础信息</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>统计后端</span><strong>${escapeHtml(stats?.backend || 'unknown')}</strong></div>
            <div class="meta-row"><span>数据来源</span><strong>${escapeHtml(stats?.sourceOfTruth || 'unknown')}</strong></div>
            <div class="meta-row"><span>目标仓库</span><strong>${escapeHtml(stats?.target?.owner || '')}/${escapeHtml(stats?.target?.repo || '')}@${escapeHtml(stats?.target?.baseBranch || '')}</strong></div>
            <div class="meta-row"><span>生成时间</span><strong>${escapeHtml(stats?.generatedAt || '')}</strong></div>
          </div>
          ${stats?.gitPostsError ? `<div class="alert alert-warning" style="margin-top: 14px;">GitHub 文章扫描失败：${escapeHtml(stats.gitPostsError)}</div>` : ''}
        </div>

        <div class="card">
          <h3>发布与媒体</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>任务记录</span><strong>${escapeHtml(String(counts.tasks ?? 0))}</strong></div>
            <div class="meta-row"><span>媒体资产</span><strong>${escapeHtml(String(counts.mediaAssets ?? 0))}</strong></div>
            <div class="meta-row"><span>统计说明</span><span>${escapeHtml(stats?.note || '')}</span></div>
          </div>
        </div>

        <div class="card">
          <h3>热门分类</h3>
          ${renderNameCountList(topCategories)}
        </div>

        <div class="card">
          <h3>热门标签</h3>
          ${renderNameCountList(topTags)}
        </div>
      </div>
    </div>
  `;
}

function metricCard(label, value, note) {
  return `
    <div class="card stat-metric-card">
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${escapeHtml(String(value))}</strong>
      <span class="stat-note">${escapeHtml(note)}</span>
    </div>
  `;
}

function renderNameCountList(items) {
  if (!items.length) return '<p class="info-text">暂无数据</p>';
  return `
    <div class="name-count-list">
      ${items.map((item) => `
        <div class="meta-row">
          <span>${escapeHtml(item.name)}</span>
          <strong>${escapeHtml(String(item.count))}</strong>
        </div>
      `).join('')}
    </div>
  `;
}
