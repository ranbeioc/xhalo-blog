import { apiFetch } from './api-client.js';
import { renderDataTable, bindDataTableControls } from './table.js';
import { escapeHtml } from './ui.js';

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
      total: data.total,
      totalPages: data.totalPages
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
        <strong>演示模式 / Demo Mode:</strong> 真实文章 API 暂不可用，当前显示本地示例文章。
      </div>
    ` : '';

    container.innerHTML = `
      <div class="posts-panel">
        <h2>文章管理 / Posts</h2>
        <p class="lede">按标题、slug、路径或分支搜索文章，按发布状态筛选，并从表格进入编辑。</p>
        <p class="help-text">当前使用服务端分页加载：第 ${page} 页，每页 ${pageSize} 条${total == null ? '' : `，总计 ${total} 条`}。</p>
        ${bannerHtml}
        <div class="card table-card">
          ${renderDataTable({
            id: 'posts',
            rows: items,
            query: tableState.query,
            filter: tableState.filter,
            page: tableState.page,
            pageSize: Math.max(items.length, 1),
            searchPlaceholder: '搜索标题、slug、路径、分支...',
            filterLabel: '状态筛选',
            allLabel: '全部状态',
            emptyText: '没有文章匹配当前搜索或筛选条件。',
            filterOptions: uniqueStatuses(items).map((status) => ({ value: status, label: status })),
            getFilterValue: (post) => post.status || 'draft',
            getSearchText: (post) => [post.title, post.slug, post.status, post.filePath, post.path, post.branchName, post.github_branch].filter(Boolean).join(' '),
            columns: [
              { label: '标题 / Title', minWidth: '220px', render: (post) => `<strong>${escapeHtml(post.title || post.slug || '-')}</strong><br/><code>${escapeHtml(post.slug || '-')}</code>` },
              { label: '状态 / Status', width: '130px', render: (post) => `<span class="status-badge" data-state="${post.status === 'published' ? 'ok' : 'warning'}">${escapeHtml(post.status || 'draft')}</span>` },
              { label: '路径 / Path', minWidth: '240px', render: (post) => `<code>${escapeHtml(post.filePath || post.path || '-')}</code>` },
              { label: '分支 / Branch', minWidth: '160px', render: (post) => `<code>${escapeHtml(post.branchName || post.github_branch || '-')}</code>` },
              { label: '操作 / Actions', width: '190px', render: (post) => `
                <button class="button-small load-post-btn" data-slug="${escapeHtml(post.slug || '')}">编辑文章 / Edit Article</button>
                ${post.previewUrl || post.preview_url ? `<a href="${escapeHtml(post.previewUrl || post.preview_url)}" target="_blank" class="button-small button-secondary">预览 / View Preview</a>` : ''}
              ` }
            ]
          })}
        </div>
        <div class="server-pagination">
          <button class="button-small button-secondary" id="posts-prev-page" ${page <= 1 ? 'disabled' : ''}>上一页数据</button>
          <span>服务端第 ${page} 页${totalPages ? ` / 共 ${totalPages} 页` : ''}</span>
          <button class="button-small button-secondary" id="posts-next-page" ${totalPages && page >= totalPages ? 'disabled' : ''}>下一页数据</button>
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
