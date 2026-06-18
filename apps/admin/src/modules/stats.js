import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml } from './ui.js';

const copy = {
  en: {
    title: 'Blog Data Statistics',
    lede: 'Statistics are read from the configured GitHub source repository and D1 records. They help verify the migrated Hexo/NexT site scale.',
    posts: 'Total posts',
    published: 'Published',
    drafts: 'Drafts',
    categories: 'Categories',
    tags: 'Tags',
    audit: 'Audit events',
    basicInfo: 'Basic Information',
    backend: 'Statistics backend',
    source: 'Source of truth',
    target: 'Target repository',
    generated: 'Generated at',
    publishMedia: 'Publishing and Media',
    tasks: 'Task records',
    mediaAssets: 'Media assets',
    note: 'Notes',
    topCategories: 'Top categories',
    topTags: 'Top tags',
    noData: 'No data available'
  },
  'zh-CN': {
    title: '博客数据统计',
    lede: '统计数据来自当前配置的 GitHub 源仓库和 D1 记录，用于验证 Hexo/NexT 历史迁移后的真实站点规模。',
    posts: '文章总数',
    published: '已发布',
    drafts: '草稿',
    categories: '分类数',
    tags: '标签数',
    audit: '审计事件',
    basicInfo: '基础信息',
    backend: '统计后端',
    source: '数据来源',
    target: '目标仓库',
    generated: '生成时间',
    publishMedia: '发布与媒体',
    tasks: '任务记录',
    mediaAssets: '媒体资产',
    note: '统计说明',
    topCategories: '热门分类',
    topTags: '热门标签',
    noData: '暂无数据'
  },
  ko: {
    title: '블로그 데이터 통계',
    lede: '통계는 현재 설정된 GitHub 원본 저장소와 D1 기록에서 읽습니다. Hexo/NexT 마이그레이션 후 실제 사이트 규모를 검증하는 데 사용합니다.',
    posts: '전체 글',
    published: '게시됨',
    drafts: '초안',
    categories: '카테고리',
    tags: '태그',
    audit: '감사 이벤트',
    basicInfo: '기본 정보',
    backend: '통계 백엔드',
    source: '데이터 기준',
    target: '대상 저장소',
    generated: '생성 시간',
    publishMedia: '게시 및 미디어',
    tasks: '작업 기록',
    mediaAssets: '미디어 자산',
    note: '통계 설명',
    topCategories: '상위 카테고리',
    topTags: '상위 태그',
    noData: '데이터 없음'
  },
  ja: {
    title: 'ブログデータ統計',
    lede: '統計は現在設定されている GitHub ソースリポジトリと D1 レコードから読み込みます。Hexo/NexT 移行後の実サイト規模を検証するために使用します。',
    posts: '記事総数',
    published: '公開済み',
    drafts: '下書き',
    categories: 'カテゴリー',
    tags: 'タグ',
    audit: '監査イベント',
    basicInfo: '基本情報',
    backend: '統計バックエンド',
    source: 'データ基準',
    target: '対象リポジトリ',
    generated: '生成時刻',
    publishMedia: '公開とメディア',
    tasks: 'タスク記録',
    mediaAssets: 'メディア資産',
    note: '統計説明',
    topCategories: '上位カテゴリー',
    topTags: '上位タグ',
    noData: 'データがありません'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

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
      <h2>${escapeHtml(c('title'))}</h2>
      <p class="lede">${escapeHtml(c('lede'))}</p>

      <div class="stats-grid">
        ${metricCard(c('posts'), counts.posts ?? 0, 'GitHub source posts')}
        ${metricCard(c('published'), counts.publishedPosts ?? 0, 'Published posts')}
        ${metricCard(c('drafts'), counts.draftPosts ?? 0, 'Draft posts')}
        ${metricCard(c('categories'), counts.categories ?? 0, 'Categories')}
        ${metricCard(c('tags'), counts.tags ?? 0, 'Tags')}
        ${metricCard(c('audit'), counts.auditEvents ?? 0, 'Audit events')}
      </div>

      <div class="dashboard-grid" style="margin-top: 20px;">
        <div class="card">
          <h3>${escapeHtml(c('basicInfo'))}</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>${escapeHtml(c('backend'))}</span><strong>${escapeHtml(stats?.backend || 'unknown')}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('source'))}</span><strong>${escapeHtml(stats?.sourceOfTruth || 'unknown')}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('target'))}</span><strong>${escapeHtml(stats?.target?.owner || '')}/${escapeHtml(stats?.target?.repo || '')}@${escapeHtml(stats?.target?.baseBranch || '')}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('generated'))}</span><strong>${escapeHtml(stats?.generatedAt || '')}</strong></div>
          </div>
          ${stats?.gitPostsError ? `<div class="alert alert-warning" style="margin-top: 14px;">GitHub scan warning: ${escapeHtml(stats.gitPostsError)}</div>` : ''}
        </div>

        <div class="card">
          <h3>${escapeHtml(c('publishMedia'))}</h3>
          <div class="meta-grid">
            <div class="meta-row"><span>${escapeHtml(c('tasks'))}</span><strong>${escapeHtml(String(counts.tasks ?? 0))}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('mediaAssets'))}</span><strong>${escapeHtml(String(counts.mediaAssets ?? 0))}</strong></div>
            <div class="meta-row"><span>${escapeHtml(c('note'))}</span><span>${escapeHtml(stats?.note || '')}</span></div>
          </div>
        </div>

        <div class="card">
          <h3>${escapeHtml(c('topCategories'))}</h3>
          ${renderNameCountList(topCategories)}
        </div>

        <div class="card">
          <h3>${escapeHtml(c('topTags'))}</h3>
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
  if (!items.length) return `<p class="info-text">${escapeHtml(c('noData'))}</p>`;
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
