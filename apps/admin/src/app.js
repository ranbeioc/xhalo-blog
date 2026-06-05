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
    '/api/drafts/tasks',
    '/api/drafts/github-plan',
    '/api/assets/r2-template',
    '/api/assets/r2-preview',
    '/api/assets/r2-tasks',
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

const fallbackDraftTask = {
  status: 'not queued',
  task_id: '-'
};

const fallbackDraftPlan = {
  actions: [
    { type: 'create_branch', summary: 'Create draft/stage-3-prototype-post from main' },
    { type: 'write_post_file', summary: 'Write source/_posts/stage-3-prototype-post.md with generated front matter' },
    { type: 'commit_changes', summary: 'Commit draft changes with "feat(posts): add draft stage-3-prototype-post"' },
    { type: 'open_pull_request', summary: 'Open PR "Add draft: Stage 3 Prototype Post" into main' },
    { type: 'verify_preview_deployment', summary: 'Wait for the preview deployment and validate the draft URL before merge' }
  ]
};

const fallbackR2Template = {
  bucketBinding: 'ASSETS',
  bucketName: 'xhalo-blog-assets',
  keyPrefix: 'uploads',
  publicBaseUrl: 'https://assets.example.com',
  defaults: {
    scope: 'uploads',
    contentType: 'image/png'
  },
  fields: ['filename', 'contentType', 'scope', 'postSlug']
};

const fallbackR2Preview = {
  bucketBinding: 'ASSETS',
  bucketName: 'xhalo-blog-assets',
  objectKey: 'uploads/2026/06/05/hero-image.png',
  publicUrl: 'https://assets.example.com/uploads/2026/06/05/hero-image.png',
  contentType: 'image/png',
  scope: 'uploads'
};

const fallbackR2Task = {
  status: 'not queued',
  task_id: '-'
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

function renderR2PreviewStatus(state, note) {
  const badge = document.querySelector('[data-field="r2-preview-status"]');
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

function renderDraftTaskResult(task) {
  setText('[data-field="draft-task-status"]', task.status || fallbackDraftTask.status);
  setText('[data-field="draft-task-id"]', task.task_id || fallbackDraftTask.task_id);
}

function renderDraftPlan(plan) {
  renderCollection(
    '[data-field="draft-plan-actions"]',
    Array.isArray(plan.actions) ? plan.actions : fallbackDraftPlan.actions,
    (action) => `<strong>${action.type || 'unknown'}</strong><span>${action.summary || 'No summary available'}</span>`
  );
}

function renderR2Template(template) {
  setText('[data-field="r2-bucket-binding"]', template.bucketBinding || fallbackR2Template.bucketBinding);
  setText('[data-field="r2-bucket-name"]', template.bucketName || fallbackR2Template.bucketName);
  setText('[data-field="r2-key-prefix"]', template.keyPrefix || fallbackR2Template.keyPrefix);
  setText('[data-field="r2-public-base-url"]', template.publicBaseUrl || fallbackR2Template.publicBaseUrl);
}

function renderR2Preview(preview) {
  setText('[data-field="r2-object-key"]', preview.objectKey || fallbackR2Preview.objectKey);
  setText('[data-field="r2-public-url"]', preview.publicUrl || fallbackR2Preview.publicUrl);
  setText('[data-field="r2-content-type"]', preview.contentType || fallbackR2Preview.contentType);
  setText('[data-field="r2-scope"]', preview.scope || fallbackR2Preview.scope);
}

function renderR2TaskResult(task) {
  setText('[data-field="r2-task-status"]', task.status || fallbackR2Task.status);
  setText('[data-field="r2-task-id"]', task.task_id || fallbackR2Task.task_id);
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

function getR2FormPayload(form) {
  const formData = new FormData(form);
  return {
    filename: String(formData.get('filename') || '').trim(),
    contentType: String(formData.get('contentType') || '').trim(),
    scope: String(formData.get('scope') || '').trim(),
    postSlug: String(formData.get('postSlug') || '').trim()
  };
}

async function postDraftAction(form, endpoint) {
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = getDraftFormPayload(form);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postR2Action(form, endpoint) {
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = getR2FormPayload(form);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

function prependTask(task) {
  const list = document.querySelector('[data-field="tasks-preview"]');
  if (!list) return;

  const node = document.createElement('li');
  node.innerHTML = `<strong>${task.type || 'unknown'}</strong><span>${task.status || 'queued'}</span>`;
  list.prepend(node);
}

async function handleDraftPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = event.submitter?.value || 'preview';
  const statusText = action === 'queue'
    ? 'Queueing task'
    : action === 'plan'
      ? 'Building plan'
      : 'Generating preview';
  renderDraftPreviewStatus('warning', statusText);

  try {
    const endpoint = action === 'queue'
      ? '/api/drafts/tasks'
      : action === 'plan'
        ? '/api/drafts/github-plan'
        : '/api/drafts/preview';
    const result = await postDraftAction(form, endpoint);

    if (result?.mode === 'static') {
      renderDraftPreview(fallbackDraftPreview);
      renderDraftTaskResult(fallbackDraftTask);
      renderDraftPreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.error) {
      renderDraftPreviewStatus('warning', `${action === 'queue' ? 'Queue failed' : 'Preview failed'} (${result.error})`);
      return;
    }

    if (result.preview) {
      renderDraftPreview(result.preview);
    }

    if (result.plan) {
      renderDraftPlan(result.plan);
      renderDraftPreviewStatus('ok', 'Plan ready');
      return;
    }

    if (action === 'queue') {
      renderDraftTaskResult({
        status: result.queued ? 'queued' : 'queue failed',
        task_id: result.task_id || '-'
      });
      prependTask({
        type: result.task_type || 'draft_preview',
        status: result.queued ? 'queued' : 'unknown'
      });
      renderDraftPreviewStatus('ok', 'Task queued');
      return;
    }

    renderDraftPreviewStatus('ok', 'Preview ready');
  } catch {
    renderDraftPreviewStatus('warning', 'Static preview');
  }
}

async function handleR2PreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = event.submitter?.value || 'preview';
  renderR2PreviewStatus('warning', action === 'queue' ? 'Queueing upload' : 'Generating upload preview');

  try {
    const endpoint = action === 'queue' ? '/api/assets/r2-tasks' : '/api/assets/r2-preview';
    const result = await postR2Action(form, endpoint);

    if (result?.mode === 'static') {
      renderR2Preview(fallbackR2Preview);
      renderR2TaskResult(fallbackR2Task);
      renderR2PreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.error) {
      renderR2PreviewStatus('warning', `${action === 'queue' ? 'Upload queue failed' : 'Upload preview failed'} (${result.error})`);
      return;
    }

    if (result.preview) {
      renderR2Preview(result.preview);
    }

    if (action === 'queue') {
      renderR2TaskResult({
        status: result.queued ? 'queued' : 'queue failed',
        task_id: result.task_id || '-'
      });
      prependTask({
        type: result.task_type || 'r2_upload_preview',
        status: result.queued ? 'queued' : 'unknown'
      });
      renderR2PreviewStatus('ok', 'Upload task queued');
      return;
    }

    renderR2PreviewStatus('ok', 'Upload preview ready');
  } catch {
    renderR2PreviewStatus('warning', 'Static preview');
  }
}

async function loadScaffoldData() {
  renderScaffold(fallbackScaffold);
  renderPosts(fallbackPosts);
  renderTasks(fallbackTasks);
  renderDraftTemplate(fallbackDraftTemplate);
  renderDraftPreview(fallbackDraftPreview);
  renderDraftTaskResult(fallbackDraftTask);
  renderDraftPlan(fallbackDraftPlan);
  renderR2Template(fallbackR2Template);
  renderR2Preview(fallbackR2Preview);
  renderR2TaskResult(fallbackR2Task);
  renderHealth(false, 'API not checked');
  renderDraftPreviewStatus('warning', 'Static preview');
  renderR2PreviewStatus('warning', 'Static preview');

  const draftForm = document.querySelector('[data-role="draft-preview-form"]');
  if (draftForm) {
    draftForm.addEventListener('submit', handleDraftPreviewSubmit);
  }
  const r2Form = document.querySelector('[data-role="r2-preview-form"]');
  if (r2Form) {
    r2Form.addEventListener('submit', handleR2PreviewSubmit);
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
    const r2TemplateResponse = await fetch('/api/assets/r2-template');

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

    if (r2TemplateResponse.ok) {
      const r2Template = await r2TemplateResponse.json();
      if (r2Template.template) renderR2Template(r2Template.template);
      renderR2PreviewStatus('ok', 'Upload preview ready');
    } else {
      renderR2PreviewStatus('warning', `Upload unavailable (${r2TemplateResponse.status})`);
    }
  } catch {
    renderHealth(false, 'Static-only preview');
    renderDraftPreviewStatus('warning', 'Static preview');
    renderR2PreviewStatus('warning', 'Static preview');
  }
}

loadScaffoldData();
