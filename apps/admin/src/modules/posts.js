import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { renderDataTable, bindDataTableControls } from './table.js';
import { escapeHtml } from './ui.js';

const fallbackCopy = {
  zh: {
    title: '文章管理',
    lede: '按标题、slug、路径或分支搜索文章，按发布状态筛选，并从表格进入编辑。',
    demo: '真实文章 API 暂不可用，当前显示本地示例文章。',
    pageInfo: '服务端分页：第 {page} 页，每页 {pageSize} 条{total}。',
    total: '，总计 {total} 条',
    search: '搜索标题、slug、路径、分支...',
    filter: '状态筛选',
    all: '全部状态',
    empty: '没有文章匹配当前搜索或筛选条件。',
    titleColumn: '标题',
    status: '状态',
    path: '路径',
    branch: '分支',
    actions: '操作',
    edit: '编辑文章',
    preview: '预览',
    prev: '上一页数据',
    next: '下一页数据',
    serverPage: '服务端第 {page} 页{totalPages}'
  },
  en: {
    title: 'Post Management',
    lede: 'Search posts by title, slug, path, or branch, filter by status, and open a row in the editor.',
    demo: 'The real posts API is unavailable; local demo posts are shown.',
    pageInfo: 'Server pagination: page {page}, {pageSize} items per page{total}.',
    total: ', {total} total',
    search: 'Search title, slug, path, branch...',
    filter: 'Status filter',
    all: 'All statuses',
    empty: 'No posts match the current search or filter.',
    titleColumn: 'Title',
    status: 'Status',
    path: 'Path',
    branch: 'Branch',
    actions: 'Actions',
    edit: 'Edit Article',
    preview: 'Preview',
    prev: 'Previous Page',
    next: 'Next Page',
    serverPage: 'Server page {page}{totalPages}'
  },
  ko: {
    title: '문서 관리',
    lede: '제목, slug, 경로, 브랜치로 문서를 검색하고 상태로 필터링한 뒤 표에서 편집기로 이동합니다.',
    demo: '실제 문서 API를 사용할 수 없어 로컬 데모 문서를 표시합니다.',
    pageInfo: '서버 페이지네이션: {page} 페이지, 페이지당 {pageSize}개{total}.',
    total: ', 총 {total}개',
    search: '제목, slug, 경로, 브랜치 검색...',
    filter: '상태 필터',
    all: '모든 상태',
    empty: '현재 검색 또는 필터 조건과 일치하는 문서가 없습니다.',
    titleColumn: '제목',
    status: '상태',
    path: '경로',
    branch: '브랜치',
    actions: '작업',
    edit: '문서 편집',
    preview: '미리보기',
    prev: '이전 페이지',
    next: '다음 페이지',
    serverPage: '서버 {page} 페이지{totalPages}'
  },
  ja: {
    title: '記事管理',
    lede: 'タイトル、slug、パス、ブランチで記事を検索し、状態でフィルターして、表からエディターへ移動します。',
    demo: '実際の記事 API を利用できないため、ローカルのデモ記事を表示しています。',
    pageInfo: 'サーバーページネーション: {page} ページ、1ページ {pageSize} 件{total}。',
    total: '、合計 {total} 件',
    search: 'タイトル、slug、パス、ブランチを検索...',
    filter: '状態フィルター',
    all: 'すべての状態',
    empty: '現在の検索またはフィルター条件に一致する記事はありません。',
    titleColumn: 'タイトル',
    status: '状態',
    path: 'パス',
    branch: 'ブランチ',
    actions: '操作',
    edit: '記事を編集',
    preview: 'プレビュー',
    prev: '前のページ',
    next: '次のページ',
    serverPage: 'サーバー {page} ページ{totalPages}'
  }
};

function c(key) {
  const language = getLanguage();
  const localeKey = language === 'zh-CN' ? 'zh' : language;
  return fallbackCopy[localeKey]?.[key] || fallbackCopy.en[key] || fallbackCopy.zh[key] || key;
}

function interpolate(template, params) {
  return Object.entries(params).reduce((value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)), template);
}

export async function fetchPosts({ page = 1, pageSize = 20 } = {}) {
  try {
    const query = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    const res = await apiFetch(`/api/posts?${query.toString()}`);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    const data = await res.json();
    return {
      items: data.items || [],
      isFallback: data.backend === 'fallback',
      page: data.page || page,
      pageSize: data.pageSize || pageSize,
      total: Number.isFinite(Number(data.total)) ? Number(data.total) : null,
      totalPages: Number.isFinite(Number(data.totalPages)) ? Number(data.totalPages) : null
    };
  } catch (err) {
    console.warn('Failed to fetch posts, loading fallback demo data:', err);
    const fallbackItems = [
      {
        title: 'Welcome to xhalo-blog (Demo)',
        slug: 'hello-xhalo-blog',
        status: 'published',
        filePath: 'source/_posts/hello-xhalo-blog.md',
        branchName: 'main',
        previewUrl: ''
      },
      {
        title: 'Decoupled Cloudflare Architecture (Demo)',
        slug: 'decoupled-cloudflare-workers',
        status: 'preview-ready',
        filePath: 'source/_posts/decoupled-cloudflare-workers.md',
        branchName: 'draft/decoupled-cloudflare-workers',
        previewUrl: 'https://staging.example.com/decoupled-cloudflare-workers/'
      }
    ];
    return { items: fallbackItems, isFallback: true, page, pageSize, total: fallbackItems.length, totalPages: 1 };
  }
}

export function renderPostsList(container, { items, isFallback, page = 1, pageSize = 20, total = null, totalPages = null, onSelectPost, onPageChange }) {
  const tableState = { query: '', filter: 'all', page: 1 };

  function draw() {
    const bannerHtml = isFallback ? `
      <div class="alert alert-info">
        <strong>Demo Mode:</strong> ${escapeHtml(c('demo'))}
      </div>
    ` : '';
    const totalSuffix = total == null ? '' : interpolate(c('total'), { total });
    const pageInfo = interpolate(c('pageInfo'), { page, pageSize, total: totalSuffix });
    const serverTotalPages = totalPages ? ` / ${totalPages}` : '';

    container.innerHTML = `
      <div class="posts-panel">
        <h2>${escapeHtml(c('title'))}</h2>
        <p class="lede">${escapeHtml(c('lede'))}</p>
        <p class="help-text">${escapeHtml(pageInfo)}</p>
        ${bannerHtml}
        <div class="card table-card">
          ${renderDataTable({
            id: 'posts',
            rows: items,
            query: tableState.query,
            filter: tableState.filter,
            page: tableState.page,
            pageSize: Math.max(items.length, 1),
            clientPagination: false,
            showPagination: false,
            searchPlaceholder: c('search'),
            filterLabel: c('filter'),
            allLabel: c('all'),
            emptyText: c('empty'),
            filterOptions: uniqueStatuses(items).map((status) => ({ value: status, label: status })),
            getFilterValue: (post) => post.status || 'draft',
            getSearchText: (post) => [post.title, post.slug, post.status, post.filePath, post.path, post.branchName, post.github_branch].filter(Boolean).join(' '),
            columns: [
              { label: c('titleColumn'), minWidth: '220px', render: (post) => `<strong>${escapeHtml(post.title || post.slug || '-')}</strong><br/><code>${escapeHtml(post.slug || '-')}</code>` },
              { label: c('status'), width: '130px', render: (post) => `<span class="status-badge" data-state="${post.status === 'published' ? 'ok' : 'warning'}">${escapeHtml(post.status || 'draft')}</span>` },
              { label: c('path'), minWidth: '240px', render: (post) => `<code>${escapeHtml(post.filePath || post.path || '-')}</code>` },
              { label: c('branch'), minWidth: '160px', render: (post) => `<code>${escapeHtml(post.branchName || post.github_branch || '-')}</code>` },
              { label: c('actions'), width: '190px', render: (post) => `
                <button class="button-small load-post-btn" data-slug="${escapeHtml(post.slug || '')}">${escapeHtml(c('edit'))}</button>
                ${post.previewUrl || post.preview_url ? `<a href="${escapeHtml(post.previewUrl || post.preview_url)}" target="_blank" class="button-small button-secondary">${escapeHtml(c('preview'))}</a>` : ''}
              ` }
            ]
          })}
        </div>
        <div class="server-pagination">
          <button class="button-small button-secondary" id="posts-prev-page" ${page <= 1 ? 'disabled' : ''}>${escapeHtml(c('prev'))}</button>
          <span>${escapeHtml(interpolate(c('serverPage'), { page, totalPages: serverTotalPages }))}</span>
          <button class="button-small button-secondary" id="posts-next-page" ${totalPages && page >= totalPages ? 'disabled' : ''}>${escapeHtml(c('next'))}</button>
        </div>
      </div>
    `;

    bindDataTableControls(container, 'posts', tableState, draw);

    container.querySelectorAll('.load-post-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const slug = event.target.getAttribute('data-slug');
        const selected = items.find((post) => post.slug === slug);
        if (selected && onSelectPost) onSelectPost(selected);
      });
    });
    container.querySelector('#posts-prev-page')?.addEventListener('click', () => onPageChange?.(Math.max(1, page - 1)));
    container.querySelector('#posts-next-page')?.addEventListener('click', () => onPageChange?.(page + 1));
  }

  draw();
}

function uniqueStatuses(items) {
  return Array.from(new Set(items.map((post) => post.status || 'draft'))).sort();
}
