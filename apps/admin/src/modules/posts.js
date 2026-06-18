import { apiFetch } from './api-client.js';
import { renderDataTable, bindDataTableControls } from './table.js';
import { escapeHtml } from './ui.js';

export async function fetchPosts() {
  try {
    const res = await apiFetch('/api/posts');
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    const data = await res.json();
    return { items: data.items || [], isFallback: false };
  } catch (err) {
    console.warn('Failed to fetch posts, loading fallback demo data:', err);
    // Fallback demo data
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
    return { items: fallbackItems, isFallback: true };
  }
}

export function renderPostsList(container, { items, isFallback, onSelectPost }) {
  const tableState = { query: '', filter: 'all', page: 1 };
  
  function draw() {
    const bannerHtml = isFallback ? `
      <div class="alert alert-info">
        <strong>演示模式 / Demo Mode:</strong> 实时文章 API 暂不可用，当前显示本地示例文章。
      </div>
    ` : '';

    container.innerHTML = `
      <div class="posts-panel">
        <h2>文章管理 / Posts</h2>
        <p class="lede">按标题、slug、路径或分支搜索文章，按发布状态筛选，并从表格中进入编辑。</p>
        ${bannerHtml}
        <div class="card table-card">
          ${renderDataTable({
            id: 'posts',
            rows: items,
            query: tableState.query,
            filter: tableState.filter,
            page: tableState.page,
            pageSize: 8,
            searchPlaceholder: '搜索标题、slug、路径、分支...',
            filterLabel: '状态筛选',
            allLabel: '全部状态',
            emptyText: '没有文章匹配当前搜索或筛选条件。',
            filterOptions: uniqueStatuses(items).map((status) => ({ value: status, label: status })),
            getFilterValue: (post) => post.status || 'draft',
            getSearchText: (post) => [post.title, post.slug, post.status, post.filePath, post.branchName].filter(Boolean).join(' '),
            columns: [
              { label: '标题 / Title', minWidth: '220px', render: (post) => `<strong>${escapeHtml(post.title || post.slug || '-')}</strong><br/><code>${escapeHtml(post.slug || '-')}</code>` },
              { label: '状态 / Status', width: '130px', render: (post) => `<span class="status-badge" data-state="${post.status === 'published' ? 'ok' : 'warning'}">${escapeHtml(post.status || 'draft')}</span>` },
              { label: '路径 / Path', minWidth: '240px', render: (post) => `<code>${escapeHtml(post.filePath || post.path || '-')}</code>` },
              { label: '分支 / Branch', minWidth: '160px', render: (post) => `<code>${escapeHtml(post.branchName || post.github_branch || '-')}</code>` },
              { label: '操作 / Actions', width: '190px', render: (post) => `
                <button class="button-small load-post-btn" data-slug="${escapeHtml(post.slug || '')}">编辑文章 / Edit Article</button>
                ${post.previewUrl ? `<a href="${escapeHtml(post.previewUrl)}" target="_blank" class="button-small button-secondary">预览 / View Preview</a>` : ''}
              ` }
            ]
          })}
        </div>
      </div>
    `;

    bindDataTableControls(container, 'posts', tableState, draw);

    container.querySelectorAll('.load-post-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slug = e.target.getAttribute('data-slug');
        const selected = items.find(post => post.slug === slug);
        if (selected && onSelectPost) {
          onSelectPost(selected);
        }
      });
    });
  }

  draw();
}

function uniqueStatuses(items) {
  return Array.from(new Set(items.map((post) => post.status || 'draft'))).sort();
}
