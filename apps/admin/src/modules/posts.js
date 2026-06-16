import { apiFetch } from './api-client.js';

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
  let searchVal = '';
  
  function draw() {
    const filtered = items.filter(post => 
      (post.title || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (post.slug || '').toLowerCase().includes(searchVal.toLowerCase())
    );

    const bannerHtml = isFallback ? `
      <div class="alert alert-info">
        <strong>Demo Mode:</strong> Live posts API is currently unavailable. Displaying local fallback mock articles.
      </div>
    ` : '';

    const listHtml = filtered.length > 0 ? filtered.map(post => `
      <div class="post-card card" data-slug="${post.slug}">
        <div class="post-header">
          <strong class="post-title">${post.title || post.slug}</strong>
          <span class="status-badge" data-state="${post.status === 'published' ? 'ok' : 'warning'}">${post.status || 'draft'}</span>
        </div>
        <div class="post-meta-details">
          <span>Slug: <code>${post.slug}</code></span>
          <span>Path: <code>${post.filePath || '-'}</code></span>
          ${post.branchName ? `<span>Branch: <code>${post.branchName}</code></span>` : ''}
        </div>
        <div class="post-actions" style="margin-top: 10px;">
          <button class="button-small load-post-btn" data-slug="${post.slug}">Edit Article</button>
          ${post.previewUrl ? `<a href="${post.previewUrl}" target="_blank" class="button-small button-secondary">View Preview</a>` : ''}
        </div>
      </div>
    `).join('') : '<p class="info-text">No articles match your search filter.</p>';

    container.innerHTML = `
      <div class="posts-panel">
        ${bannerHtml}
        <div class="posts-search-bar" style="margin-bottom: 20px;">
          <input type="text" id="posts-search-input" placeholder="Search by title or slug..." value="${searchVal}" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary);" />
        </div>
        <div class="posts-list-grid">
          ${listHtml}
        </div>
      </div>
    `;

    // Bind event listeners
    const searchInput = container.querySelector('#posts-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchVal = e.target.value;
        draw();
        // Refocus and set cursor to end
        const input = container.querySelector('#posts-search-input');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }

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
