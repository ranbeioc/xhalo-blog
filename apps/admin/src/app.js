const fallbackScaffold = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: ['/api/health', '/api/scaffold', '/api/posts', '/api/tasks', '/api/tasks/example']
};

const fallbackPosts = [
  {
    title: 'Hello xhalo-blog',
    status: 'published',
    slug: 'hello-xhalo-blog'
  },
  {
    title: 'NexT Theme Baseline',
    status: 'example',
    slug: 'next-theme-baseline'
  }
];

const fallbackTasks = [
  {
    type: 'build_status_poll',
    status: 'pending'
  },
  {
    type: 'example',
    status: 'queued'
  }
];

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderScaffold(data) {
  setText('[data-field="repo"]', data.repo || fallbackScaffold.repo);
  setText('[data-field="stage"]', data.stage || fallbackScaffold.stage);
  setText('[data-field="mode"]', data.mode || fallbackScaffold.mode);
  setText('[data-field="static-site"]', data.static_site || fallbackScaffold.static_site);
  setText('[data-field="queue-name"]', data.queue_name || fallbackScaffold.queue_name);

  const list = document.querySelector('[data-field="expected-paths"]');
  if (list) {
    list.innerHTML = '';
    const paths = Array.isArray(data.expected_paths) ? data.expected_paths : fallbackScaffold.expected_paths;
    for (const path of paths) {
      const item = document.createElement('li');
      item.innerHTML = `<code>${path}</code>`;
      list.appendChild(item);
    }
  }
}

function renderCollection(selector, items, formatItem) {
  const list = document.querySelector(selector);
  if (!list) return;

  list.innerHTML = '';
  for (const item of items) {
    const node = document.createElement('li');
    node.innerHTML = formatItem(item);
    list.appendChild(node);
  }
}

function renderHealth(ok, note) {
  const badge = document.querySelector('[data-field="health-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = ok ? 'ok' : 'warning';
}

function renderPosts(items) {
  renderCollection('[data-field="posts-preview"]', items, (item) => (
    `<strong>${item.title || item.slug || 'Untitled'}</strong><span>${item.status || 'unknown'} · ${item.slug || '-'}</span>`
  ));
}

function renderTasks(items) {
  renderCollection('[data-field="tasks-preview"]', items, (item) => (
    `<strong>${item.type || 'unknown'}</strong><span>${item.status || 'unknown'}</span>`
  ));
}

async function loadScaffoldData() {
  renderScaffold(fallbackScaffold);
  renderPosts(fallbackPosts);
  renderTasks(fallbackTasks);
  renderHealth(false, 'API not checked');

  if (window.location.protocol === 'file:') {
    renderHealth(false, 'Static-only preview');
    return;
  }

  try {
    const [healthResponse, scaffoldResponse] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/scaffold')
    ]);
    const [postsResponse, tasksResponse] = await Promise.all([
      fetch('/api/posts'),
      fetch('/api/tasks')
    ]);

    if (healthResponse.ok) {
      const health = await healthResponse.json();
      renderHealth(Boolean(health.ok), health.ok ? 'API reachable' : 'API returned non-ok payload');
    } else {
      renderHealth(false, `Health check failed (${healthResponse.status})`);
    }

    if (scaffoldResponse.ok) {
      const scaffold = await scaffoldResponse.json();
      renderScaffold(scaffold);
    }

    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      if (Array.isArray(posts.items) && posts.items.length > 0) renderPosts(posts.items);
    }

    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      if (Array.isArray(tasks.items) && tasks.items.length > 0) renderTasks(tasks.items);
    }
  } catch {
    renderHealth(false, 'Static-only preview');
  }
}

loadScaffoldData();
