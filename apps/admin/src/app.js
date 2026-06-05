const fallbackScaffold = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: [
    '/api/health',
    '/api/scaffold',
    '/api/posts',
    '/api/tasks',
    '/api/drafts/template',
    '/api/drafts/preview',
    '/api/tasks/example'
  ]
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

const fallbackDraftTemplate = {
  branchPrefix: 'draft/',
  postDir: 'source/_posts',
  defaults: {
    status: 'draft',
    category: 'notes'
  },
  fields: ['title', 'slug', 'summary', 'tags', 'category', 'status']
};

const fallbackDraftPreview = {
  branchName: 'draft/stage-3-prototype-post',
  baseBranch: 'main',
  filePath: 'source/_posts/stage-3-prototype-post.md',
  commitMessage: 'feat(posts): add draft stage-3-prototype-post',
  pullRequestTitle: 'Add draft: Stage 3 Prototype Post',
  repository: 'example/xhalo-blog',
  frontMatter: {
    title: 'Stage 3 Prototype Post',
    summary: 'Draft metadata preview',
    categories: ['notes'],
    tags: ['cloudflare', 'stage3'],
    status: 'draft'
  }
};

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

function renderDraftPreviewStatus(state, note) {
  const badge = document.querySelector('[data-field="draft-preview-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = state;
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

function renderDraftTemplate(template) {
  setText('[data-field="draft-branch-prefix"]', template.branchPrefix || fallbackDraftTemplate.branchPrefix);
  setText('[data-field="draft-post-dir"]', template.postDir || fallbackDraftTemplate.postDir);
  setText('[data-field="draft-default-status"]', template.defaults?.status || fallbackDraftTemplate.defaults.status);

  renderCollection(
    '[data-field="draft-fields"]',
    Array.isArray(template.fields) ? template.fields : fallbackDraftTemplate.fields,
    (field) => `<strong>${field}</strong><span>draft field</span>`
  );
}

function renderDraftPreview(preview) {
  setText('[data-field="draft-preview-branch"]', preview.branchName || fallbackDraftPreview.branchName);
  setText('[data-field="draft-preview-path"]', preview.filePath || fallbackDraftPreview.filePath);
  setText('[data-field="draft-preview-repo"]', preview.repository || fallbackDraftPreview.repository);
  setText('[data-field="draft-preview-pr-title"]', preview.pullRequestTitle || fallbackDraftPreview.pullRequestTitle);
  setText('[data-field="draft-preview-commit"]', preview.commitMessage || fallbackDraftPreview.commitMessage);
  setText('[data-field="draft-preview-base"]', preview.baseBranch || fallbackDraftPreview.baseBranch);

  const frontMatter = document.querySelector('[data-field="draft-preview-front-matter"]');
  if (frontMatter) {
    frontMatter.textContent = JSON.stringify(preview.frontMatter || fallbackDraftPreview.frontMatter, null, 2);
  }
}

function getDraftFormPayload(form) {
  const formData = new FormData(form);
  const tags = String(formData.get('tags') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    title: String(formData.get('title') || '').trim(),
    slug: String(formData.get('slug') || '').trim(),
    summary: String(formData.get('summary') || '').trim(),
    tags,
    category: String(formData.get('category') || '').trim(),
    status: String(formData.get('status') || '').trim()
  };
}

async function handleDraftPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  renderDraftPreviewStatus('warning', 'Generating preview');

  if (window.location.protocol === 'file:') {
    renderDraftPreview(fallbackDraftPreview);
    renderDraftPreviewStatus('warning', 'Static preview');
    return;
  }

  try {
    const payload = getDraftFormPayload(form);
    const response = await fetch('/api/drafts/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      renderDraftPreviewStatus('warning', `Preview failed (${response.status})`);
      return;
    }

    const result = await response.json();
    if (result.preview) {
      renderDraftPreview(result.preview);
      renderDraftPreviewStatus('ok', 'Preview ready');
    } else {
      renderDraftPreviewStatus('warning', 'Preview payload missing');
    }
  } catch {
    renderDraftPreviewStatus('warning', 'Static preview');
  }
}

async function loadScaffoldData() {
  renderScaffold(fallbackScaffold);
  renderPosts(fallbackPosts);
  renderTasks(fallbackTasks);
  renderDraftTemplate(fallbackDraftTemplate);
  renderDraftPreview(fallbackDraftPreview);
  renderHealth(false, 'API not checked');
  renderDraftPreviewStatus('warning', 'Static preview');

  const draftForm = document.querySelector('[data-role="draft-preview-form"]');
  if (draftForm) {
    draftForm.addEventListener('submit', handleDraftPreviewSubmit);
  }

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
    const draftTemplateResponse = await fetch('/api/drafts/template');

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

    if (draftTemplateResponse.ok) {
      const draftTemplate = await draftTemplateResponse.json();
      if (draftTemplate.template) renderDraftTemplate(draftTemplate.template);
      renderDraftPreviewStatus('ok', 'API preview ready');
    } else {
      renderDraftPreviewStatus('warning', `Preview unavailable (${draftTemplateResponse.status})`);
    }
  } catch {
    renderHealth(false, 'Static-only preview');
    renderDraftPreviewStatus('warning', 'Static preview');
  }
}

loadScaffoldData();
