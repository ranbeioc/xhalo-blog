const fallbackScaffold = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  release_line: '0.1.x-alpha',
  contract_version: 'v1',
  static_site: 'Cloudflare Pages',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: [
    '/api/health',
    '/api/readiness',
    '/api/scaffold',
    '/api/posts',
    '/api/tasks',
    '/api/drafts/template',
    '/api/drafts/preview',
    '/api/drafts/tasks',
    '/api/drafts/github-plan',
    '/api/drafts/publish',
    '/api/assets/r2-template',
    '/api/assets/r2-preview',
    '/api/assets/r2-signed-upload',
    '/api/assets/r2-upload',
    '/api/assets/r2-upload/:token',
    '/api/assets/r2-tasks',
    '/webhooks/github',
    '/webhooks/deployments/preview',
    '/api/publish/notifications/template',
    '/api/publish/notifications/preview',
    '/api/publish/notifications/tasks',
    '/api/moderation/template',
    '/api/moderation/preview',
    '/api/moderation/tasks',
    '/api/tasks/example'
  ]
};

const fallbackPosts = [
  {
    title: 'Hello xhalo-blog',
    status: 'preview-ready',
    slug: 'hello-xhalo-blog',
    path: 'source/_posts/hello-xhalo-blog.md',
    detail_primary: 'draft/hello-xhalo-blog',
    detail_secondary: 'https://github.com/ranbeioc/xhalo-blog/pull/42'
  },
  {
    title: 'NexT Theme Baseline',
    status: 'example',
    slug: 'next-theme-baseline',
    path: 'examples/next-theme-blog/source/_posts/hello-xhalo-blog.md',
    detail_primary: null,
    detail_secondary: null
  }
];

const fallbackReadiness = {
  items: [
    {
      key: 'admin_api',
      label: 'Admin API request gate',
      status: 'missing',
      note: 'ADMIN_API_SHARED_SECRET is missing.'
    },
    {
      key: 'live_writes',
      label: 'Live write gate',
      status: 'ready',
      note: 'Live write routes remain disabled by default.'
    },
    {
      key: 'github',
      label: 'GitHub PR publishing',
      status: 'partial',
      note: 'Repository env is present but GitHub App env is missing.'
    },
    {
      key: 'r2',
      label: 'R2 assets',
      status: 'missing',
      note: 'R2 bucket binding is missing.'
    },
    {
      key: 'queue',
      label: 'Queue worker',
      status: 'missing',
      note: 'TASK_QUEUE binding is missing.'
    },
    {
      key: 'preview_deployments',
      label: 'Preview deployment reconciliation',
      status: 'missing',
      note: 'PREVIEW_WEBHOOK_SECRET is missing.'
    },
    {
      key: 'turnstile',
      label: 'Turnstile',
      status: 'missing',
      note: 'Turnstile env keys are missing.'
    },
    {
      key: 'access',
      label: 'Cloudflare Access',
      status: 'manual',
      note: 'Verify policy state in Cloudflare dashboard.'
    }
  ]
};

const fallbackTasks = [
  {
    type: 'preview_deployment_webhook',
    status: 'completed',
    detail_primary: 'preview-ready',
    detail_secondary: 'https://preview.example.com/hello-xhalo-blog/',
    updated_at: new Date().toISOString()
  },
  {
    type: 'github_webhook',
    status: 'completed',
    detail_primary: 'merged',
    detail_secondary: 'draft/hello-xhalo-blog',
    updated_at: new Date().toISOString()
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
  task_id: '-',
  branch: '-',
  last_error: '-',
  retry_count: 0,
  updated_at: '-'
};

const fallbackDraftPublish = {
  mode: 'dry-run',
  auth_mode: 'token',
  pull_request: '-'
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
    contentType: 'image/png',
    encoding: 'utf-8',
    cacheControl: 'public, max-age=31536000, immutable'
  },
  fields: ['filename', 'contentType', 'scope', 'postSlug', 'content', 'encoding', 'cacheControl']
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

const fallbackR2Upload = {
  mode: 'dry-run',
  etag: '-',
  uploaded_bytes: 0
};

const fallbackR2SignedUpload = {
  auth_mode: 'hmac',
  upload_url: '-',
  expires_at: '-'
};

const fallbackPublishTemplate = {
  queueBinding: 'TASK_QUEUE',
  defaults: {
    channel: 'cloudflare-pages-preview',
    status: 'preview-ready'
  }
};

const fallbackPublishPreview = {
  queueBinding: 'TASK_QUEUE',
  postSlug: 'hello-xhalo-blog',
  branchName: 'draft/hello-xhalo-blog',
  previewUrl: 'https://preview.example.com/hello-xhalo-blog/',
  channel: 'cloudflare-pages-preview',
  status: 'preview-ready',
  title: 'Preview ready for hello-xhalo-blog',
  message: 'Preview deployment is ready on https://preview.example.com/hello-xhalo-blog/'
};

const fallbackPublishTask = {
  status: 'not queued',
  task_id: '-'
};

const fallbackModerationTemplate = {
  queueBinding: 'TASK_QUEUE',
  defaults: {
    provider: 'waline',
    action: 'flag',
    reason: 'manual-review'
  }
};

const fallbackModerationPreview = {
  queueBinding: 'TASK_QUEUE',
  commentId: 'comment-demo-1',
  provider: 'waline',
  action: 'flag',
  reason: 'manual-review',
  title: 'Moderation review for comment-demo-1',
  message: 'flag comment comment-demo-1 via waline'
};

const fallbackModerationTask = {
  status: 'not queued',
  task_id: '-'
};

const state = {
  adminSecret: '',
  fileMode: window.location.protocol === 'file:',
  posts: fallbackPosts,
  loadedBaseSha: null,
  ownerDirectUpdateEnabled: false,
  publishMode: 'pr_only',
  ownerDirectPublishEnabled: false
};

function loadStoredAdminSecret() {
  try {
    return window.sessionStorage.getItem('xhalo-admin-secret') || '';
  } catch {
    return '';
  }
}

function saveAdminSecret(secret) {
  state.adminSecret = secret;
  try {
    if (secret) {
      window.sessionStorage.setItem('xhalo-admin-secret', secret);
    } else {
      window.sessionStorage.removeItem('xhalo-admin-secret');
    }
  } catch {
    // Ignore storage failures in scaffold mode.
  }
}

function hasAdminSecret() {
  return Boolean(state.adminSecret);
}

let turnstileWidgetId = null;

function initTurnstileWidget(siteKey) {
  const container = document.getElementById('turnstile-widget-container');
  if (!container) return;

  if (!siteKey) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  // Wait if Turnstile library is not fully loaded yet
  if (typeof turnstile === 'undefined') {
    setTimeout(() => initTurnstileWidget(siteKey), 500);
    return;
  }

  // Render widget if not already rendered
  if (turnstileWidgetId === null) {
    try {
      turnstileWidgetId = turnstile.render('#turnstile-widget', {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token) => {
          console.log('Turnstile challenge solved, token received.');
        }
      });
    } catch (err) {
      console.error('Failed to render Turnstile widget:', err);
    }
  }
}

async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  if (hasAdminSecret()) headers.set('x-xhalo-admin-secret', state.adminSecret);

  if (typeof turnstile !== 'undefined') {
    try {
      const token = turnstile.getResponse();
      if (token) {
        headers.set('x-xhalo-turnstile-token', token);
      }
    } catch (e) {
      // Ignore Turnstile client-side query errors
    }
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  // If Turnstile verification failed, reset the widget to force a re-challenge
  if (response.status === 403 && typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
    try {
      const body = await response.clone().json();
      if (body?.error?.includes('Turnstile')) {
        turnstile.reset(turnstileWidgetId);
      }
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  // For POST/PUT requests, reset Turnstile to prepare a fresh token for the next action
  if ((init.method === 'POST' || init.method === 'PUT') && typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
    try {
      turnstile.reset(turnstileWidgetId);
    } catch (e) {
      // Ignore
    }
  }

  return response;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function syncProtectedActionState() {
  const locked = !state.fileMode && !hasAdminSecret();
  for (const button of document.querySelectorAll('[data-protected-action]')) {
    button.disabled = locked;
  }
}

function renderOperatorGuard(status, note, liveWrites = 'disabled by default') {
  const badge = document.querySelector('[data-field="operator-guard-status"]');
  if (badge) {
    badge.textContent = status;
    badge.dataset.state = hasAdminSecret() || state.fileMode ? 'ok' : 'warning';
  }
  setText('[data-field="operator-access-mode"]', hasAdminSecret() ? 'request secret present' : 'Cloudflare Access + request secret');
  setText('[data-field="operator-live-writes"]', liveWrites);
  setText('[data-field="operator-guard-note"]', note);
  syncProtectedActionState();
}

function renderScaffold(data) {
  setText('[data-field="repo"]', data.repo || fallbackScaffold.repo);
  setText('[data-field="stage"]', data.stage || fallbackScaffold.stage);
  setText('[data-field="mode"]', data.mode || fallbackScaffold.mode);
  setText('[data-field="release-line"]', data.release_line || fallbackScaffold.release_line);
  setText('[data-field="contract-version"]', data.contract_version || fallbackScaffold.contract_version);
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

function renderReadinessStatus(state, note) {
  const badge = document.querySelector('[data-field="readiness-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = state;
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

function renderPublishPreviewStatus(state, note) {
  const badge = document.querySelector('[data-field="publish-preview-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = state;
}

function renderModerationPreviewStatus(state, note) {
  const badge = document.querySelector('[data-field="moderation-preview-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = state;
}

function renderPosts(items) {
  renderCollection('[data-field="posts-preview"]', items, (item) => (
    `<a href="#" class="post-preview-item" data-slug="${item.slug}" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
      <div class="preview-stack">
        <strong>${item.title || item.slug || 'Untitled'}</strong>
        <span>${item.status || 'unknown'} · ${item.slug || '-'}</span>
        <small class="preview-meta">${[item.path, item.detail_primary, item.detail_secondary].filter(Boolean).join(' · ')}</small>
      </div>
    </a>`
  ));
}

function renderTasks(items) {
  renderCollection('[data-field="tasks-preview"]', items, (item) => (
    `<div class="preview-stack"><strong>${item.type || 'unknown'}</strong><span>${item.status || 'unknown'}${item.updated_at ? ` · ${item.updated_at}` : ''}</span><small class="preview-meta">${[item.detail_primary, item.detail_secondary].filter(Boolean).join(' · ')}</small></div>`
  ));
}

function renderReadiness(items) {
  renderCollection(
    '[data-field="readiness-items"]',
    Array.isArray(items) ? items : fallbackReadiness.items,
    (item) => `<strong>${item.label || item.key || 'unknown'}</strong><span>${item.status || 'unknown'} · ${item.note || 'No note available'}</span>`
  );
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
  setText('[data-field="draft-task-status"]', task.status || 'not queued');
  setText('[data-field="draft-task-id"]', task.task_id || task.id || '-');
  setText('[data-field="draft-task-branch"]', task.branch || '-');
  setText('[data-field="draft-task-error"]', task.last_error || task.error || '-');
  setText('[data-field="draft-task-retry-count"]', String(task.retry_count ?? 0));
  setText('[data-field="draft-task-updated-at"]', task.updated_at || '-');
}

function renderDraftPublishResult(result) {
  setText('[data-field="draft-publish-mode"]', result.mode || fallbackDraftPublish.mode);
  setText('[data-field="draft-publish-auth-mode"]', result.auth_mode || fallbackDraftPublish.auth_mode);
  
  const prEl = document.querySelector('[data-field="draft-publish-pr"]');
  if (prEl) {
    const prUrl = result.pull_request || fallbackDraftPublish.pull_request;
    if (prUrl && prUrl.startsWith('http')) {
      prEl.innerHTML = `<a href="${prUrl}" target="_blank" class="pr-link">${prUrl}</a>`;
    } else {
      prEl.textContent = prUrl || '-';
    }
  }
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

function renderR2UploadResult(result) {
  setText('[data-field="r2-upload-mode"]', result.mode || fallbackR2Upload.mode);
  setText('[data-field="r2-upload-etag"]', result.etag || fallbackR2Upload.etag);
  setText('[data-field="r2-upload-bytes"]', String(result.uploaded_bytes ?? fallbackR2Upload.uploaded_bytes));
}

function renderR2SignedUploadResult(result) {
  setText('[data-field="r2-signed-auth-mode"]', result.auth_mode || fallbackR2SignedUpload.auth_mode);
  setText('[data-field="r2-signed-upload-url"]', result.upload_url || fallbackR2SignedUpload.upload_url);
  setText('[data-field="r2-signed-expires-at"]', result.expires_at || fallbackR2SignedUpload.expires_at);
}

function renderPublishTemplate(template) {
  setText('[data-field="publish-queue-binding"]', template.queueBinding || fallbackPublishTemplate.queueBinding);
  setText('[data-field="publish-channel"]', template.defaults?.channel || fallbackPublishTemplate.defaults.channel);
}

function renderPublishPreview(preview) {
  setText('[data-field="publish-title"]', preview.title || fallbackPublishPreview.title);
  setText('[data-field="publish-channel-output"]', preview.channel || fallbackPublishPreview.channel);
  setText('[data-field="publish-preview-url"]', preview.previewUrl || fallbackPublishPreview.previewUrl);
  setText('[data-field="publish-status-output"]', preview.status || fallbackPublishPreview.status);
  const message = document.querySelector('[data-field="publish-message"]');
  if (message) {
    message.textContent = preview.message || fallbackPublishPreview.message;
  }
}

function renderPublishTaskResult(task) {
  setText('[data-field="publish-task-status"]', task.status || fallbackPublishTask.status);
  setText('[data-field="publish-task-id"]', task.task_id || fallbackPublishTask.task_id);
}

function renderModerationTemplate(template) {
  setText('[data-field="moderation-queue-binding"]', template.queueBinding || fallbackModerationTemplate.queueBinding);
  setText('[data-field="moderation-provider"]', template.defaults?.provider || fallbackModerationTemplate.defaults.provider);
}

function renderModerationPreview(preview) {
  setText('[data-field="moderation-title"]', preview.title || fallbackModerationPreview.title);
  setText('[data-field="moderation-action"]', preview.action || fallbackModerationPreview.action);
  setText('[data-field="moderation-comment-id"]', preview.commentId || fallbackModerationPreview.commentId);
  setText('[data-field="moderation-reason"]', preview.reason || fallbackModerationPreview.reason);
  const message = document.querySelector('[data-field="moderation-message"]');
  if (message) {
    message.textContent = preview.message || fallbackModerationPreview.message;
  }
}

function renderModerationTaskResult(task) {
  setText('[data-field="moderation-task-status"]', task.status || fallbackModerationTask.status);
  setText('[data-field="moderation-task-id"]', task.task_id || fallbackModerationTask.task_id);
}

function getDraftFormPayload(form) {
  const formData = new FormData(form);
  const tags = String(formData.get('tags') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const categories = String(formData.get('categories') || formData.get('category') || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    title: String(formData.get('title') || '').trim(),
    slug: String(formData.get('slug') || '').trim(),
    summary: String(formData.get('summary') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    date: String(formData.get('date') || '').trim(),
    updated: String(formData.get('updated') || '').trim(),
    tags,
    categories,
    category: categories[0] || '',
    status: String(formData.get('status') || '').trim()
  };
}

function getR2FormPayload(form) {
  const formData = new FormData(form);
  return {
    filename: String(formData.get('filename') || '').trim(),
    contentType: String(formData.get('contentType') || '').trim(),
    scope: String(formData.get('scope') || '').trim(),
    postSlug: String(formData.get('postSlug') || '').trim(),
    content: String(formData.get('content') || ''),
    encoding: String(formData.get('encoding') || '').trim(),
    cacheControl: String(formData.get('cacheControl') || '').trim()
  };
}

function buildR2UploadRequestBody(payload) {
  if (String(payload.encoding || '').trim().toLowerCase() === 'base64') {
    const binary = atob(payload.content || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  return new TextEncoder().encode(payload.content || '');
}

function getPublishFormPayload(form) {
  const formData = new FormData(form);
  return {
    postSlug: String(formData.get('postSlug') || '').trim(),
    branchName: String(formData.get('branchName') || '').trim(),
    previewUrl: String(formData.get('previewUrl') || '').trim(),
    channel: String(formData.get('channel') || '').trim(),
    status: String(formData.get('status') || '').trim()
  };
}

function getModerationFormPayload(form) {
  const formData = new FormData(form);
  return {
    commentId: String(formData.get('commentId') || '').trim(),
    provider: String(formData.get('provider') || '').trim(),
    action: String(formData.get('action') || '').trim(),
    reason: String(formData.get('reason') || '').trim()
  };
}

async function postDraftAction(form, endpoint, overrides = {}) {
  if (state.fileMode) {
    return { mode: 'static' };
  }
  if (!hasAdminSecret()) {
    return { error: 401, locked: true };
  }

  const payload = {
    ...getDraftFormPayload(form),
    ...overrides
  };
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        return { error: errData.error, details: errData.details, status: response.status };
      }
    } catch {}
    return { error: `HTTP ${response.status}`, status: response.status };
  }
  return response.json();
}

async function postR2Action(form, endpoint, overrides = {}) {
  if (state.fileMode) {
    return { mode: 'static' };
  }
  if (!hasAdminSecret()) {
    return { error: 401, locked: true };
  }

  const payload = {
    ...getR2FormPayload(form),
    ...overrides
  };
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postPublishAction(form, endpoint) {
  if (state.fileMode) {
    return { mode: 'static' };
  }
  if (!hasAdminSecret()) {
    return { error: 401, locked: true };
  }

  const payload = getPublishFormPayload(form);
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postModerationAction(form, endpoint) {
  if (state.fileMode) {
    return { mode: 'static' };
  }
  if (!hasAdminSecret()) {
    return { error: 401, locked: true };
  }

  const payload = getModerationFormPayload(form);
  const response = await apiFetch(endpoint, {
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

function handleOperatorGuardSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const secret = String(formData.get('adminSecret') || '').trim();
  saveAdminSecret(secret);
  renderOperatorGuard(
    secret ? 'Secret loaded' : 'Secret required',
    secret
      ? 'Protected routes can now be queried from this session. Keep Cloudflare Access enabled as the outer gate.'
      : 'Protected routes stay locked until the admin secret is provided. This is still an inner gate, not a substitute for Cloudflare Access.'
  );
  loadScaffoldData();
}

function clearOperatorGuardSecret() {
  saveAdminSecret('');
  const input = document.querySelector('[data-role="operator-guard-form"] input[name="adminSecret"]');
  if (input) input.value = '';
  renderOperatorGuard(
    'Secret required',
    'Protected routes stay locked until the admin secret is provided. This is still an inner gate, not a substitute for Cloudflare Access.'
  );
  loadScaffoldData();
}

function handlePostClick(event) {
  const itemLink = event.target.closest('.post-preview-item');
  if (!itemLink) return;
  event.preventDefault();

  const slug = itemLink.dataset.slug;
  if (!slug || !state.posts) return;

  const post = state.posts.find(p => p.slug === slug);
  if (!post) return;

  const form = document.querySelector('[data-role="draft-preview-form"]');
  if (form) {
    const titleInput = form.querySelector('input[name="title"]');
    const slugInput = form.querySelector('input[name="slug"]');
    const summaryText = form.querySelector('textarea[name="summary"]');
    const statusInput = form.querySelector('input[name="status"]');
    const bodyTextarea = form.querySelector('textarea[name="body"]');

    if (titleInput) titleInput.value = post.title || '';
    if (slugInput) slugInput.value = post.slug || '';
    if (statusInput) statusInput.value = post.status || '';
    if (summaryText) summaryText.value = post.summary || `Front matter loaded for ${post.slug}. Click Generate Preview to sync plan actions.`;

    if (bodyTextarea) {
      let bodyContent = post.content || '';
      if (bodyContent.startsWith('---')) {
        const parts = bodyContent.split('---');
        if (parts.length >= 3) {
          bodyContent = parts.slice(2).join('---').trim();
        }
      }
      bodyTextarea.value = bodyContent || post.summary || '';
    }

    updateRealtimePreview();

    const submitter = form.querySelector('button[value="preview"]');
    if (submitter) {
      submitter.click();
    }
  }
}

/**
 * Render a safe subset of Markdown to HTML.
 * All HTML is escaped FIRST, then safe Markdown patterns are applied.
 * This prevents XSS attacks including script injection, img onerror, and javascript: protocol.
 *
 * Supported: headers, paragraphs, bold, italic, inline code, fenced code blocks,
 * unordered/ordered lists, links (https/http/mailto only), line breaks.
 */
function renderSafeMarkdown(markdown) {
  if (!markdown || !markdown.trim()) return '';

  // Step 1: Escape ALL HTML entities
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const escaped = escapeHtml(markdown);

  // Step 2: Extract fenced code blocks before other processing
  const codeBlocks = [];
  let processed = escaped.replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/g, (_, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `\x00CODEBLOCK_${index}\x00`;
  });

  // Step 3: Process inline elements
  // Inline code (before bold/italic to avoid conflicts)
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (single asterisk, not inside bold)
  processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Links — ONLY allow safe protocols (https, http, mailto)
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      const trimmedUrl = url.trim();
      if (/^https?:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)) {
        return `<a href="${trimmedUrl}" rel="noopener noreferrer">${text}</a>`;
      }
      // Reject dangerous protocols (javascript:, data:, vbscript:, etc.)
      return `${text} (${trimmedUrl})`;
    }
  );

  // Step 4: Process block elements line by line
  const lines = processed.split('\n');
  const outputBlocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }
  let paragraphLines = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      outputBlocks.push(`<p>${paragraphLines.join('<br>')}</p>`);
      paragraphLines = [];
    }
  }

  function flushList() {
    if (currentList) {
      const tag = currentList.type;
      outputBlocks.push(`<${tag}>${currentList.items.map(i => `<li>${i}</li>`).join('')}</${tag}>`);
      currentList = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Code block placeholder
    const codeMatch = trimmed.match(/^\x00CODEBLOCK_(\d+)\x00$/);
    if (codeMatch) {
      flushParagraph();
      flushList();
      outputBlocks.push(codeBlocks[parseInt(codeMatch[1], 10)]);
      continue;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      const level = headerMatch[1].length;
      outputBlocks.push(`<h${level}>${headerMatch[2]}</h${level}>`);
      continue;
    }

    // Unordered list items
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Ordered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Empty line = paragraph break
    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Regular text — accumulate into paragraph
    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return outputBlocks.join('\n');
}

function updateRealtimePreview() {
  const form = document.querySelector('[data-role="draft-preview-form"]');
  if (!form) return;
  const bodyText = form.querySelector('textarea[name="body"]')?.value || '';
  const previewDiv = document.querySelector('[data-field="draft-preview-html"]');
  if (previewDiv) {
    previewDiv.innerHTML = renderSafeMarkdown(bodyText) || '<p>No content preview available.</p>';
  }
}

async function handleDraftPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = event.submitter?.value || 'preview';

  const directPanel = document.getElementById('direct-publish-status-panel');
  if (directPanel) directPanel.style.display = 'none';

  const updatePanel = document.getElementById('direct-update-status-panel');
  if (updatePanel) updatePanel.style.display = 'none';

  if (action === 'direct-update') {
    const check = document.getElementById('direct-update-confirm-check');
    if (!check || !check.checked) {
      renderDraftPreviewStatus('warning', 'Direct update requires checkbox confirmation.');
      return;
    }
    const phrase = document.getElementById('direct-update-confirm-phrase');
    if (!phrase || phrase.value.trim() !== 'DIRECT UPDATE EXISTING POST') {
      renderDraftPreviewStatus('warning', 'Direct update requires typed confirmation phrase matching "DIRECT UPDATE EXISTING POST".');
      return;
    }
    if (!state.loadedBaseSha) {
      renderDraftPreviewStatus('warning', 'Please load an existing article from main first.');
      return;
    }

    renderDraftPreviewStatus('warning', 'Executing direct update...');

    try {
      const result = await postDraftAction(form, '/api/drafts/direct-update', {
        status: 'published',
        baseSha: state.loadedBaseSha,
        confirmationPhrase: phrase.value.trim()
      });

      if (result?.locked) {
        renderDraftPreviewStatus('warning', 'Admin secret required');
        return;
      }

      if (result?.error) {
        let errMsg = result.error;
        if (result.details && Array.isArray(result.details)) {
          errMsg += `: ${result.details.join(', ')}`;
        }
        renderDraftPreviewStatus('warning', `Action failed: ${errMsg}`);
        return;
      }

      if (result.ok) {
        renderDraftPreviewStatus('ok', 'Existing post updated on main. Cloudflare Pages build may start automatically.');
        if (updatePanel) updatePanel.style.display = 'block';
        setText('[data-field="direct-update-sha"]', result.commitSha || '-');
        const commitUrlEl = document.querySelector('[data-field="direct-update-commit-url"]');
        if (commitUrlEl) {
          if (result.commitUrl) {
            commitUrlEl.innerHTML = `<a href="${result.commitUrl}" target="_blank" class="pr-link">${result.commitUrl}</a>`;
          } else {
            commitUrlEl.textContent = '-';
          }
        }
        setText('[data-field="direct-update-repo"]', result.targetRepo || '-');
        setText('[data-field="direct-update-branch"]', result.targetBranch || 'main');
        setText('[data-field="direct-update-path"]', result.targetPath || '-');
        setText('[data-field="direct-update-old-sha"]', result.oldSha || '-');
        setText('[data-field="direct-update-audit-id"]', result.auditId || '-');
        setText('[data-field="direct-update-updated-at"]', new Date().toISOString());

        loadScaffoldData();
      }
    } catch (e) {
      console.error(e);
      renderDraftPreviewStatus('warning', 'Action failed');
    }
    return;
  }

  if (action === 'direct-publish') {
    const check = document.getElementById('direct-publish-confirm-check');
    if (!check || !check.checked) {
      renderDraftPreviewStatus('warning', 'Direct publish requires checkbox confirmation.');
      return;
    }
    const phrase = document.getElementById('direct-publish-confirm-phrase');
    if (!phrase || phrase.value.trim() !== 'DIRECT PUBLISH TO MAIN') {
      renderDraftPreviewStatus('warning', 'Direct publish requires typed confirmation phrase matching "DIRECT PUBLISH TO MAIN".');
      return;
    }

    renderDraftPreviewStatus('warning', 'Executing direct publish...');

    try {
      const result = await postDraftAction(form, '/api/drafts/direct-publish', {
        status: 'published',
        confirmationPhrase: phrase.value.trim()
      });

      if (result?.locked) {
        renderDraftPreviewStatus('warning', 'Admin secret required');
        return;
      }

      if (result?.error) {
        let errMsg = result.error;
        if (result.details && Array.isArray(result.details)) {
          errMsg += `: ${result.details.join(', ')}`;
        }
        renderDraftPreviewStatus('warning', `Action failed: ${errMsg}`);
        return;
      }

      if (result.ok) {
        renderDraftPreviewStatus('ok', 'Direct commit created on main. Cloudflare Pages build may start automatically.');
        if (directPanel) directPanel.style.display = 'block';
        setText('[data-field="direct-publish-sha"]', result.commitSha || '-');
        const commitUrlEl = document.querySelector('[data-field="direct-publish-commit-url"]');
        if (commitUrlEl) {
          if (result.commitUrl) {
            commitUrlEl.innerHTML = `<a href="${result.commitUrl}" target="_blank" class="pr-link">${result.commitUrl}</a>`;
          } else {
            commitUrlEl.textContent = '-';
          }
        }
        setText('[data-field="direct-publish-repo"]', result.targetRepo || '-');
        setText('[data-field="direct-publish-branch"]', result.targetBranch || 'main');
        setText('[data-field="direct-publish-path"]', result.targetPath || '-');
        setText('[data-field="direct-publish-audit-id"]', result.auditId || '-');
        setText('[data-field="direct-publish-created-at"]', new Date().toISOString());

        loadScaffoldData();
      }
    } catch (e) {
      console.error(e);
      renderDraftPreviewStatus('warning', 'Action failed');
    }
    return;
  }

  if (action === 'publish') {
    const checkbox = form.querySelector('input[name="ownerApprovedWindow"]');
    if (!checkbox || !checkbox.checked) {
      renderDraftPreviewStatus('warning', 'Owner-approved PR-only write window confirmation is required.');
      return;
    }
  }

  const statusText = action === 'queue'
    ? 'Queueing task'
    : action === 'publish'
      ? 'Creating review PR'
    : action === 'plan'
      ? 'Building plan'
      : 'Generating preview';
  renderDraftPreviewStatus('warning', statusText);

  try {
    const endpoint = action === 'queue'
      ? '/api/drafts/tasks'
      : action === 'publish'
        ? '/api/drafts/publish'
      : action === 'plan'
        ? '/api/drafts/github-plan'
        : '/api/drafts/preview';
    const result = await postDraftAction(form, endpoint, 
      action === 'publish' 
        ? { mode: 'live' } 
        : {}
    );

    if (result?.mode === 'static') {
      renderDraftPreview(fallbackDraftPreview);
      renderDraftTaskResult(fallbackDraftTask);
      renderDraftPublishResult(fallbackDraftPublish);
      renderDraftPreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.locked) {
      renderDraftPreviewStatus('warning', 'Admin secret required');
      return;
    }

    if (result?.error) {
      let errMsg = result.error;
      if (result.details && Array.isArray(result.details)) {
        errMsg += `: ${result.details.join(', ')}`;
      }
      renderDraftPreviewStatus('warning', `Action failed: ${errMsg}`);
      return;
    }

    if (result.preview) {
      renderDraftPreview(result.preview);
    }

    if (result.plan) {
      renderDraftPlan(result.plan);
    }

    if (action === 'publish' || action === 'queue') {
      const taskId = result.task_id;
      if (taskId) {
        renderDraftTaskResult({
          status: 'queued',
          task_id: taskId,
          branch: '-',
          last_error: '-',
          retry_count: 0,
          updated_at: '-'
        });
        prependTask({
          type: result.task_type || (action === 'publish' ? 'draft_publish' : 'draft_preview'),
          status: 'queued'
        });
        renderDraftPreviewStatus('warning', `Polling task status (${taskId})...`);
        
        let pollCount = 0;
        const maxPolls = 30; // 60 seconds max
        const intervalId = setInterval(async () => {
          pollCount++;
          if (pollCount > maxPolls) {
            clearInterval(intervalId);
            renderDraftPreviewStatus('warning', 'Polling timed out');
            return;
          }
          try {
            const res = await apiFetch(`/api/tasks/${taskId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.task) {
                const task = data.task;
                renderDraftTaskResult(task);
                
                if (task.status === 'completed' || task.status === 'succeeded') {
                  clearInterval(intervalId);
                  const summary = task.payload?.reconciliation?.summary || {};
                  const prUrl = summary.pull_request?.url || task.detail_secondary || '-';
                  renderDraftPublishResult({
                    mode: 'live',
                    auth_mode: summary.auth_mode || 'token',
                    pull_request: prUrl
                  });
                  renderDraftPreviewStatus('ok', 'Review PR created (Owner manual review required)');
                  loadScaffoldData();
                } else if (task.status === 'failed') {
                  clearInterval(intervalId);
                  renderDraftPreviewStatus('warning', `Action failed: ${task.last_error || task.error || 'unknown task error'}`);
                }
              }
            }
          } catch (e) {
            console.error('Error polling task:', e);
          }
        }, 2000);
      } else {
        if (result.plan) {
          renderDraftPublishResult({
            mode: result.mode || 'live',
            auth_mode: result.auth_mode || 'token',
            pull_request: result.pull_request?.url || '-'
          });
          renderDraftPreviewStatus('ok', result.mode === 'live' ? 'Review PR created (Owner manual review required)' : 'Publish dry-run ready');
          loadScaffoldData();
        }
      }
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
  const statusText = action === 'queue'
    ? 'Queueing upload'
    : action === 'signed'
      ? 'Uploading via signed URL'
    : action === 'publish'
      ? 'Uploading object to R2'
      : 'Generating upload preview';
  renderR2PreviewStatus('warning', statusText);

  try {
    const endpoint = action === 'queue'
      ? '/api/assets/r2-tasks'
      : action === 'signed'
        ? '/api/assets/r2-signed-upload'
      : action === 'publish'
        ? '/api/assets/r2-upload'
        : '/api/assets/r2-preview';
    const result = await postR2Action(form, endpoint, action === 'publish' || action === 'signed' ? { mode: 'live' } : {});

    if (result?.mode === 'static') {
      renderR2Preview(fallbackR2Preview);
      renderR2TaskResult(fallbackR2Task);
      renderR2UploadResult(fallbackR2Upload);
      renderR2SignedUploadResult(fallbackR2SignedUpload);
      renderR2PreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.locked) {
      renderR2PreviewStatus('warning', 'Admin secret required');
      return;
    }

    if (result?.error) {
      renderR2PreviewStatus('warning', `${action === 'queue' ? 'Upload queue failed' : action === 'publish' ? 'Live upload failed' : action === 'signed' ? 'Signed upload failed' : 'Upload preview failed'} (${result.error})`);
      return;
    }

    if (result.preview) {
      renderR2Preview(result.preview);
    }

    if (action === 'signed') {
      renderR2SignedUploadResult({
        auth_mode: result.auth_mode || 'hmac',
        upload_url: result.upload_url || '-',
        expires_at: result.expires_at || '-'
      });
      const payload = getR2FormPayload(form);
      const uploadResponse = await apiFetch(result.upload_url, {
        method: 'PUT',
        headers: {
          'content-type': payload.contentType || 'application/octet-stream'
        },
        body: buildR2UploadRequestBody(payload)
      });
      const uploadResult = uploadResponse.ok ? await uploadResponse.json() : { error: uploadResponse.status };
      if (!uploadResponse.ok || uploadResult.error) {
        renderR2PreviewStatus('warning', `Signed upload PUT failed (${uploadResult.error || uploadResponse.status})`);
        return;
      }
      renderR2UploadResult({
        mode: uploadResult.mode || 'signed-upload',
        etag: uploadResult.etag || '-',
        uploaded_bytes: uploadResult.uploaded_bytes ?? 0
      });
      prependTask({
        type: 'r2_upload_signed',
        status: 'completed'
      });
      renderR2PreviewStatus('ok', 'Signed upload completed');
      return;
    }

    if (action === 'publish') {
      renderR2UploadResult({
        mode: result.mode || 'live',
        etag: result.etag || '-',
        uploaded_bytes: result.uploaded_bytes ?? 0
      });
      renderR2PreviewStatus('ok', result.mode === 'live' ? 'Live upload completed' : 'Upload dry-run ready');
      return;
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

async function handlePublishPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = event.submitter?.value || 'preview';
  renderPublishPreviewStatus('warning', action === 'queue' ? 'Queueing notification' : 'Generating notification preview');

  try {
    const endpoint = action === 'queue'
      ? '/api/publish/notifications/tasks'
      : '/api/publish/notifications/preview';
    const result = await postPublishAction(form, endpoint);

    if (result?.mode === 'static') {
      renderPublishPreview(fallbackPublishPreview);
      renderPublishTaskResult(fallbackPublishTask);
      renderPublishPreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.locked) {
      renderPublishPreviewStatus('warning', 'Admin secret required');
      return;
    }

    if (result?.error) {
      renderPublishPreviewStatus('warning', `${action === 'queue' ? 'Notification queue failed' : 'Notification preview failed'} (${result.error})`);
      return;
    }

    if (result.preview) {
      renderPublishPreview(result.preview);
    }

    if (action === 'queue') {
      renderPublishTaskResult({
        status: result.queued ? 'queued' : 'queue failed',
        task_id: result.task_id || '-'
      });
      prependTask({
        type: result.task_type || 'publish_notification_preview',
        status: result.queued ? 'queued' : 'unknown'
      });
      renderPublishPreviewStatus('ok', 'Notification task queued');
      return;
    }

    renderPublishPreviewStatus('ok', 'Notification preview ready');
  } catch {
    renderPublishPreviewStatus('warning', 'Static preview');
  }
}

async function handleModerationPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = event.submitter?.value || 'preview';
  renderModerationPreviewStatus('warning', action === 'queue' ? 'Queueing moderation' : 'Generating moderation preview');

  try {
    const endpoint = action === 'queue'
      ? '/api/moderation/tasks'
      : '/api/moderation/preview';
    const result = await postModerationAction(form, endpoint);

    if (result?.mode === 'static') {
      renderModerationPreview(fallbackModerationPreview);
      renderModerationTaskResult(fallbackModerationTask);
      renderModerationPreviewStatus('warning', 'Static preview');
      return;
    }

    if (result?.locked) {
      renderModerationPreviewStatus('warning', 'Admin secret required');
      return;
    }

    if (result?.error) {
      renderModerationPreviewStatus('warning', `${action === 'queue' ? 'Moderation queue failed' : 'Moderation preview failed'} (${result.error})`);
      return;
    }

    if (result.preview) {
      renderModerationPreview(result.preview);
    }

    if (action === 'queue') {
      renderModerationTaskResult({
        status: result.queued ? 'queued' : 'queue failed',
        task_id: result.task_id || '-'
      });
      prependTask({
        type: result.task_type || 'moderation_preview',
        status: result.queued ? 'queued' : 'unknown'
      });
      renderModerationPreviewStatus('ok', 'Moderation task queued');
      return;
    }

    renderModerationPreviewStatus('ok', 'Moderation preview ready');
  } catch {
    renderModerationPreviewStatus('warning', 'Static preview');
  }
}

async function loadScaffoldData() {
  const requestId = crypto.randomUUID();
  state.lastRequestId = requestId;
  renderScaffold(fallbackScaffold);
  renderReadiness(fallbackReadiness.items);
  renderPosts(fallbackPosts);
  renderTasks(fallbackTasks);
  renderDraftTemplate(fallbackDraftTemplate);
  renderDraftPreview(fallbackDraftPreview);
  renderDraftTaskResult(fallbackDraftTask);
  renderDraftPublishResult(fallbackDraftPublish);
  renderDraftPlan(fallbackDraftPlan);
  renderR2Template(fallbackR2Template);
  renderR2Preview(fallbackR2Preview);
  renderR2TaskResult(fallbackR2Task);
  renderR2UploadResult(fallbackR2Upload);
  renderR2SignedUploadResult(fallbackR2SignedUpload);
  renderPublishTemplate(fallbackPublishTemplate);
  renderPublishPreview(fallbackPublishPreview);
  renderPublishTaskResult(fallbackPublishTask);
  renderModerationTemplate(fallbackModerationTemplate);
  renderModerationPreview(fallbackModerationPreview);
  renderModerationTaskResult(fallbackModerationTask);
  renderOperatorGuard(
    hasAdminSecret() ? 'Secret loaded' : 'Secret required',
    hasAdminSecret()
      ? 'Protected routes can now be queried from this session. Keep Cloudflare Access enabled as the outer gate.'
      : 'Protected routes stay locked until the admin secret is provided. This is still an inner gate, not a substitute for Cloudflare Access.'
  );
  renderHealth(false, 'API not checked');
  renderReadinessStatus('warning', 'Static defaults');
  renderDraftPreviewStatus('warning', 'Static preview');
  renderR2PreviewStatus('warning', 'Static preview');
  renderPublishPreviewStatus('warning', 'Static preview');
  renderModerationPreviewStatus('warning', 'Static preview');

  const operatorForm = document.querySelector('[data-role="operator-guard-form"]');
  if (operatorForm && !operatorForm.dataset.bound) {
    operatorForm.addEventListener('submit', handleOperatorGuardSubmit);
    operatorForm.dataset.bound = 'true';
  }
  const clearButton = document.querySelector('[data-role="clear-admin-secret"]');
  if (clearButton && !clearButton.dataset.bound) {
    clearButton.addEventListener('click', clearOperatorGuardSecret);
    clearButton.dataset.bound = 'true';
  }
  const secretInput = document.querySelector('[data-role="operator-guard-form"] input[name="adminSecret"]');
  if (secretInput && secretInput.value !== state.adminSecret) {
    secretInput.value = state.adminSecret;
  }

  const draftForm = document.querySelector('[data-role="draft-preview-form"]');
  if (draftForm && !draftForm.dataset.bound) {
    draftForm.addEventListener('submit', handleDraftPreviewSubmit);

    const validateOwnerDirectPublishUI = () => {
      const check = document.getElementById('direct-publish-confirm-check');
      const phrase = document.getElementById('direct-publish-confirm-phrase');
      const btn = document.getElementById('btn-owner-direct-publish');
      if (check && phrase && btn) {
        const isChecked = check.checked;
        const isPhraseValid = phrase.value.trim() === 'DIRECT PUBLISH TO MAIN';
        btn.disabled = !(isChecked && isPhraseValid);
      }
    };

     const directCheck = document.getElementById('direct-publish-confirm-check');
    const directPhrase = document.getElementById('direct-publish-confirm-phrase');
    if (directCheck) {
      directCheck.addEventListener('change', validateOwnerDirectPublishUI);
    }
    if (directPhrase) {
      directPhrase.addEventListener('input', validateOwnerDirectPublishUI);
    }

    const validateOwnerDirectUpdateUI = () => {
      const check = document.getElementById('direct-update-confirm-check');
      const phrase = document.getElementById('direct-update-confirm-phrase');
      const btn = document.getElementById('btn-owner-direct-update');
      if (check && phrase && btn) {
        const isChecked = check.checked;
        const isPhraseValid = phrase.value.trim() === 'DIRECT UPDATE EXISTING POST';
        btn.disabled = !(isChecked && isPhraseValid);
      }
    };

    const updateCheck = document.getElementById('direct-update-confirm-check');
    const updatePhrase = document.getElementById('direct-update-confirm-phrase');
    if (updateCheck) {
      updateCheck.addEventListener('change', validateOwnerDirectUpdateUI);
    }
    if (updatePhrase) {
      updatePhrase.addEventListener('input', validateOwnerDirectUpdateUI);
    }

    const btnLoad = document.getElementById('btn-load-existing');
    if (btnLoad) {
      btnLoad.addEventListener('click', async () => {
        const slugInput = document.getElementById('load-existing-slug');
        if (!slugInput || !slugInput.value.trim()) {
          renderDraftPreviewStatus('warning', 'Please enter a slug to load.');
          return;
        }
        renderDraftPreviewStatus('warning', 'Loading article from main...');
        try {
          const res = await apiFetch(`/api/posts/source?slug=${encodeURIComponent(slugInput.value.trim())}`);
          if (!res.ok) {
            const errData = await res.json();
            renderDraftPreviewStatus('warning', `Failed to load article: ${errData.error || res.statusText}`);
            return;
          }
          const data = await res.json();
          if (data.ok) {
            const titleInput = draftForm.querySelector('input[name="title"]');
            if (titleInput) titleInput.value = data.frontmatter.title || '';
            const slugEditorInput = draftForm.querySelector('input[name="slug"]');
            if (slugEditorInput) slugEditorInput.value = data.slug || '';
            const summaryInput = draftForm.querySelector('textarea[name="summary"]');
            if (summaryInput) summaryInput.value = data.frontmatter.summary || '';
            const bodyInput = draftForm.querySelector('textarea[name="body"]');
            if (bodyInput) bodyInput.value = data.body || '';
            const categoriesInput = draftForm.querySelector('input[name="categories"]');
            if (categoriesInput) categoriesInput.value = (data.frontmatter.categories || []).join(', ');
            const tagsInput = draftForm.querySelector('input[name="tags"]');
            if (tagsInput) tagsInput.value = (data.frontmatter.tags || []).join(', ');

            state.loadedBaseSha = data.sha;

            const metaContainer = document.getElementById('existing-article-meta');
            if (metaContainer) metaContainer.style.display = 'block';
            setText('#existing-article-path', data.targetPath || '-');
            setText('#existing-article-sha', data.sha || '-');
            setText('#existing-article-loaded-at', new Date().toLocaleTimeString());

            const diffBtn = document.getElementById('btn-preview-update-diff');
            if (diffBtn) diffBtn.style.display = 'inline-block';

            renderDraftPreviewStatus('ok', 'Article loaded successfully from main.');
            updateRealtimePreview();
          }
        } catch (err) {
          console.error(err);
          renderDraftPreviewStatus('warning', 'Failed to load article.');
        }
      });
    }

    const btnDiff = document.getElementById('btn-preview-update-diff');
    if (btnDiff) {
      btnDiff.addEventListener('click', async () => {
        if (!state.loadedBaseSha) {
          renderDraftPreviewStatus('warning', 'Load an article first.');
          return;
        }

        renderDraftPreviewStatus('warning', 'Generating update diff...');
        try {
          const payload = getDraftFormPayload(draftForm);
          payload.baseSha = state.loadedBaseSha;

          const res = await apiFetch('/api/drafts/direct-update-preview', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ input: payload })
          });

          if (!res.ok) {
            const errData = await res.json();
            renderDraftPreviewStatus('warning', `Failed to generate diff: ${errData.error || res.statusText}`);
            return;
          }

          const data = await res.json();
          if (data.ok) {
            const diffPanel = document.getElementById('diff-preview-panel');
            if (diffPanel) diffPanel.style.display = 'block';

            setText('[data-field="diff-target-path"]', data.targetPath || '-');
            setText('[data-field="diff-base-sha"]', data.baseSha || '-');
            setText('[data-field="diff-added-lines"]', data.diffSummary?.addedLines || '0');
            setText('[data-field="diff-removed-lines"]', data.diffSummary?.removedLines || '0');
            setText('[data-field="diff-frontmatter-changed"]', data.diffSummary?.frontmatterChanged ? 'Yes' : 'No');
            setText('[data-field="diff-body-changed"]', data.diffSummary?.bodyChanged ? 'Yes' : 'No');
            
            const diffTextEl = document.querySelector('[data-field="diff-text"]');
            if (diffTextEl) diffTextEl.textContent = data.diffText || '-';

            const directUpdateSection = document.getElementById('owner-direct-update-section');
            if (directUpdateSection && state.publishMode === 'owner_direct' && state.ownerDirectPublishEnabled === true && state.ownerDirectUpdateEnabled === true) {
              directUpdateSection.style.display = 'block';
            }

            renderDraftPreviewStatus('ok', 'Diff preview generated.');
          }
        } catch (err) {
          console.error(err);
          renderDraftPreviewStatus('warning', 'Failed to generate diff.');
        }
      });
    }

    const bodyTextarea = draftForm.querySelector('textarea[name="body"]');
    if (bodyTextarea) {
      bodyTextarea.addEventListener('input', updateRealtimePreview);
    }
    draftForm.dataset.bound = 'true';
  }
  const r2Form = document.querySelector('[data-role="r2-preview-form"]');
  if (r2Form && !r2Form.dataset.bound) {
    r2Form.addEventListener('submit', handleR2PreviewSubmit);
    r2Form.dataset.bound = 'true';
  }
  const publishForm = document.querySelector('[data-role="publish-preview-form"]');
  if (publishForm && !publishForm.dataset.bound) {
    publishForm.addEventListener('submit', handlePublishPreviewSubmit);
    publishForm.dataset.bound = 'true';
  }
  const moderationForm = document.querySelector('[data-role="moderation-preview-form"]');
  if (moderationForm && !moderationForm.dataset.bound) {
    moderationForm.addEventListener('submit', handleModerationPreviewSubmit);
    moderationForm.dataset.bound = 'true';
  }

  const postsPreviewList = document.querySelector('[data-field="posts-preview"]');
  if (postsPreviewList && !postsPreviewList.dataset.bound) {
    postsPreviewList.addEventListener('click', handlePostClick);
    postsPreviewList.dataset.bound = 'true';
  }

  if (state.fileMode) {
    renderHealth(false, 'Static-only preview');
    return;
  }

  try {
    const [healthResponse, scaffoldResponse] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/scaffold')
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

    if (!hasAdminSecret()) {
      renderReadinessStatus('warning', 'Admin secret required');
      renderDraftPreviewStatus('warning', 'Admin secret required');
      renderR2PreviewStatus('warning', 'Admin secret required');
      renderPublishPreviewStatus('warning', 'Admin secret required');
      renderModerationPreviewStatus('warning', 'Admin secret required');
      return;
    }

    const readinessResponse = await apiFetch('/api/readiness');
    const [postsResponse, tasksResponse] = await Promise.all([
      apiFetch('/api/posts'),
      apiFetch('/api/tasks')
    ]);
    const draftTemplateResponse = await apiFetch('/api/drafts/template');
    const r2TemplateResponse = await apiFetch('/api/assets/r2-template');
    const publishTemplateResponse = await apiFetch('/api/publish/notifications/template');
    const moderationTemplateResponse = await apiFetch('/api/moderation/template');

    if (state.lastRequestId !== requestId) return;

    if (readinessResponse.ok) {
      const readiness = await readinessResponse.json();
      renderReadiness(readiness.items);

      state.publishMode = readiness.publishMode || 'pr_only';
      state.ownerDirectPublishEnabled = readiness.ownerDirectPublishEnabled === true;
      state.ownerDirectUpdateEnabled = readiness.ownerDirectUpdateEnabled === true;

      const directPublishSection = document.getElementById('owner-direct-publish-section');
      if (directPublishSection) {
        if (state.publishMode === 'owner_direct' && state.ownerDirectPublishEnabled === true) {
          directPublishSection.style.display = 'block';
        } else {
          directPublishSection.style.display = 'none';
        }
      }
      const missing = readiness.summary?.missing || 0;
      const partial = readiness.summary?.partial || 0;
      const ready = readiness.summary?.ready || 0;
      const badgeState = missing > 0 ? 'warning' : 'ok';
      renderReadinessStatus(badgeState, `${ready} ready / ${partial} partial / ${missing} missing`);
      const liveWrites = readiness.items?.find((item) => item.key === 'live_writes')?.note || 'disabled by default';
      renderOperatorGuard('Secret loaded', 'Protected routes can now be queried from this session. Keep Cloudflare Access enabled as the outer gate.', liveWrites);

      if (readiness.turnstileSiteKey) {
        initTurnstileWidget(readiness.turnstileSiteKey);
      } else {
        const container = document.getElementById('turnstile-widget-container');
        if (container) container.style.display = 'none';
      }
    } else {
      renderReadinessStatus('warning', `Readiness unavailable (${readinessResponse.status})`);
    }

    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      state.posts = posts.items || [];
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

    if (publishTemplateResponse.ok) {
      const publishTemplate = await publishTemplateResponse.json();
      if (publishTemplate.template) renderPublishTemplate(publishTemplate.template);
      renderPublishPreviewStatus('ok', 'Notification preview ready');
    } else {
      renderPublishPreviewStatus('warning', `Notification unavailable (${publishTemplateResponse.status})`);
    }

    if (moderationTemplateResponse.ok) {
      const moderationTemplate = await moderationTemplateResponse.json();
      if (moderationTemplate.template) renderModerationTemplate(moderationTemplate.template);
      renderModerationPreviewStatus('ok', 'Moderation preview ready');
    } else {
      renderModerationPreviewStatus('warning', `Moderation unavailable (${moderationTemplateResponse.status})`);
    }
  } catch {
    renderHealth(false, 'Static-only preview');
    renderReadinessStatus('warning', 'Static defaults');
    renderDraftPreviewStatus('warning', 'Static preview');
    renderR2PreviewStatus('warning', 'Static preview');
    renderPublishPreviewStatus('warning', 'Static preview');
    renderModerationPreviewStatus('warning', 'Static preview');
  }
}

loadScaffoldData();

// ── OAuth Session Handlers ──────────────────────────────────────────────────
const btnCheckSession = document.getElementById('btn-check-session');
const btnGithubLogout = document.getElementById('btn-github-logout');
const btnGithubLogin = document.getElementById('btn-github-login');

async function checkOAuthSession() {
  try {
    const res = await fetch('/api/auth/session', { headers: getAdminHeaders() });
    const data = await res.json();
    const sessionStatusEl = document.querySelector('[data-field="oauth-session-status"]');
    const userInfoEl = document.getElementById('oauth-user-info');
    const loggedInUserEl = document.querySelector('[data-field="oauth-logged-in-user"]');

    if (data.authenticated && data.user) {
      sessionStatusEl.textContent = 'Authenticated';
      sessionStatusEl.closest('.meta-row')?.querySelector('.status-badge')?.setAttribute('data-state', 'ok');
      loggedInUserEl.textContent = `${data.user.name} (@${data.user.login})`;
      userInfoEl.style.display = '';
      btnGithubLogout.style.display = '';
      btnGithubLogin.style.display = 'none';
    } else {
      sessionStatusEl.textContent = 'Not logged in';
      userInfoEl.style.display = 'none';
      btnGithubLogout.style.display = 'none';
      btnGithubLogin.style.display = '';
    }
  } catch {
    // Ignore fetch errors silently
  }
}

if (btnCheckSession) {
  btnCheckSession.addEventListener('click', checkOAuthSession);
}

if (btnGithubLogout) {
  btnGithubLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await checkOAuthSession();
    } catch {
      // Ignore
    }
  });
}

// Auto-check session on load
checkOAuthSession();

// ── Media Asset Manager Handlers ────────────────────────────────────────────
const mediaForm = document.querySelector('[data-role="media-preview-form"]');
const mediaResultEl = document.getElementById('media-preview-result');
const btnCopySnippet = document.getElementById('btn-copy-media-snippet');

if (mediaForm) {
  mediaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(mediaForm);
    const payload = {
      slug: formData.get('slug'),
      filename: formData.get('filename'),
      contentType: formData.get('contentType'),
      storageTarget: formData.get('storageTarget'),
      size: parseInt(formData.get('size') || '0', 10),
      label: formData.get('label') || ''
    };

    try {
      const res = await fetch('/api/assets/media-preview', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Media preview error: ${data.error || 'Unknown error'}`);
        return;
      }

      const asset = data.asset || {};
      document.querySelector('[data-field="media-safe-filename"]').textContent = asset.filename || '-';
      document.querySelector('[data-field="media-target-path"]').textContent = asset.targetPath || '-';
      document.querySelector('[data-field="media-storage-result"]').textContent = asset.storageTarget || '-';
      document.querySelector('[data-field="media-markdown-snippet"]').textContent = asset.markdownSnippet || '-';
      mediaResultEl.style.display = '';
    } catch (err) {
      alert(`Media preview failed: ${err.message}`);
    }
  });
}

if (btnCopySnippet) {
  btnCopySnippet.addEventListener('click', () => {
    const snippetEl = document.querySelector('[data-field="media-markdown-snippet"]');
    if (snippetEl && navigator.clipboard) {
      navigator.clipboard.writeText(snippetEl.textContent).then(() => {
        btnCopySnippet.textContent = '✅ Copied!';
        setTimeout(() => { btnCopySnippet.textContent = '📋 Copy snippet'; }, 2000);
      });
    }
  });
}

// ── Site Menu Manager Handlers ──────────────────────────────────────────────
const btnLoadMenu = document.getElementById('btn-load-menu');
const menuCurrentDisplay = document.getElementById('menu-current-display');
const menuItemsContainer = document.getElementById('menu-items-container');
const menuEditForm = document.querySelector('[data-role="menu-edit-form"]');
const btnPreviewMenuDiff = document.getElementById('btn-preview-menu-diff');
const menuDiffResult = document.getElementById('menu-diff-result');

let currentMenuItems = [];
let currentMenuSha = '';

function renderMenuItems(items) {
  if (!menuItemsContainer) return;
  if (!items || items.length === 0) {
    menuItemsContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">No menu items found.</p>';
    return;
  }
  menuItemsContainer.innerHTML = items.map((item, i) => `
    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border);">
      <span style="font-weight: 600; min-width: 24px; color: var(--text-secondary);">${i + 1}.</span>
      <span style="flex: 1;">${escapeHtml(item.label || item.name || '-')}</span>
      <code style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(item.path || item.url || '-')}</code>
      <button type="button" class="button-secondary" style="padding: 2px 8px; font-size: 0.75rem;" data-remove-menu="${i}">✕</button>
    </div>
  `).join('');

  // Bind remove buttons
  menuItemsContainer.querySelectorAll('[data-remove-menu]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-remove-menu'), 10);
      currentMenuItems.splice(idx, 1);
      renderMenuItems(currentMenuItems);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

if (btnLoadMenu) {
  btnLoadMenu.addEventListener('click', async () => {
    try {
      btnLoadMenu.disabled = true;
      btnLoadMenu.textContent = 'Loading...';
      const res = await fetch('/api/site/menu', { headers: getAdminHeaders() });
      const data = await res.json();
      if (!res.ok) {
        alert(`Menu load error: ${data.error || 'Unknown error'}`);
        return;
      }

      document.querySelector('[data-field="menu-config-source"]').textContent = data.source || '-';
      document.querySelector('[data-field="menu-config-sha"]').textContent = data.sha ? data.sha.substring(0, 12) : '-';

      currentMenuItems = Array.isArray(data.menu) ? [...data.menu] : [];
      currentMenuSha = data.sha || '';
      renderMenuItems(currentMenuItems);
      menuCurrentDisplay.style.display = '';
    } catch (err) {
      alert(`Menu load failed: ${err.message}`);
    } finally {
      btnLoadMenu.disabled = false;
      btnLoadMenu.textContent = 'Load Current Menu';
    }
  });
}

if (menuEditForm) {
  menuEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(menuEditForm);
    const newItem = {
      label: formData.get('label'),
      path: formData.get('path'),
      icon: formData.get('icon') || undefined
    };
    currentMenuItems.push(newItem);
    renderMenuItems(currentMenuItems);
    menuEditForm.reset();
  });
}

if (btnPreviewMenuDiff) {
  btnPreviewMenuDiff.addEventListener('click', async () => {
    try {
      btnPreviewMenuDiff.disabled = true;
      btnPreviewMenuDiff.textContent = 'Generating...';
      const res = await fetch('/api/site/menu/preview', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: currentMenuItems })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Menu preview error: ${data.error || 'Unknown error'}`);
        return;
      }

      document.querySelector('[data-field="menu-diff-output"]').textContent = data.diff || '(no changes)';
      menuDiffResult.style.display = '';
    } catch (err) {
      alert(`Menu preview failed: ${err.message}`);
    } finally {
      btnPreviewMenuDiff.disabled = false;
      btnPreviewMenuDiff.textContent = 'Generate Diff Preview';
    }
  });
}
