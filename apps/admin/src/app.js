const fallbackScaffold = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
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
  task_id: '-'
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
    `<div class="preview-stack"><strong>${item.title || item.slug || 'Untitled'}</strong><span>${item.status || 'unknown'} · ${item.slug || '-'}</span><small class="preview-meta">${[item.path, item.detail_primary, item.detail_secondary].filter(Boolean).join(' · ')}</small></div>`
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
  setText('[data-field="draft-task-status"]', task.status || fallbackDraftTask.status);
  setText('[data-field="draft-task-id"]', task.task_id || fallbackDraftTask.task_id);
}

function renderDraftPublishResult(result) {
  setText('[data-field="draft-publish-mode"]', result.mode || fallbackDraftPublish.mode);
  setText('[data-field="draft-publish-auth-mode"]', result.auth_mode || fallbackDraftPublish.auth_mode);
  setText('[data-field="draft-publish-pr"]', result.pull_request || fallbackDraftPublish.pull_request);
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
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = {
    ...getDraftFormPayload(form),
    ...overrides
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postR2Action(form, endpoint, overrides = {}) {
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = {
    ...getR2FormPayload(form),
    ...overrides
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postPublishAction(form, endpoint) {
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = getPublishFormPayload(form);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return { error: response.status };
  return response.json();
}

async function postModerationAction(form, endpoint) {
  if (window.location.protocol === 'file:') {
    return { mode: 'static' };
  }

  const payload = getModerationFormPayload(form);
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
    : action === 'publish'
      ? 'Publishing draft'
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
    const result = await postDraftAction(form, endpoint, action === 'publish' ? { mode: 'live' } : {});

    if (result?.mode === 'static') {
      renderDraftPreview(fallbackDraftPreview);
      renderDraftTaskResult(fallbackDraftTask);
      renderDraftPublishResult(fallbackDraftPublish);
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
      if (action === 'publish') {
        renderDraftPublishResult({
          mode: result.mode || 'live',
          auth_mode: result.auth_mode || 'token',
          pull_request: result.pull_request?.url || '-'
        });
        renderDraftPreviewStatus('ok', result.mode === 'live' ? 'Publish request completed' : 'Publish dry-run ready');
        return;
      }
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
      const uploadResponse = await fetch(result.upload_url, {
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
  renderHealth(false, 'API not checked');
  renderReadinessStatus('warning', 'Static defaults');
  renderDraftPreviewStatus('warning', 'Static preview');
  renderR2PreviewStatus('warning', 'Static preview');
  renderPublishPreviewStatus('warning', 'Static preview');
  renderModerationPreviewStatus('warning', 'Static preview');

  const draftForm = document.querySelector('[data-role="draft-preview-form"]');
  if (draftForm) {
    draftForm.addEventListener('submit', handleDraftPreviewSubmit);
  }
  const r2Form = document.querySelector('[data-role="r2-preview-form"]');
  if (r2Form) {
    r2Form.addEventListener('submit', handleR2PreviewSubmit);
  }
  const publishForm = document.querySelector('[data-role="publish-preview-form"]');
  if (publishForm) {
    publishForm.addEventListener('submit', handlePublishPreviewSubmit);
  }
  const moderationForm = document.querySelector('[data-role="moderation-preview-form"]');
  if (moderationForm) {
    moderationForm.addEventListener('submit', handleModerationPreviewSubmit);
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
    const readinessResponse = await fetch('/api/readiness');
    const [postsResponse, tasksResponse] = await Promise.all([
      fetch('/api/posts'),
      fetch('/api/tasks')
    ]);
    const draftTemplateResponse = await fetch('/api/drafts/template');
    const r2TemplateResponse = await fetch('/api/assets/r2-template');
    const publishTemplateResponse = await fetch('/api/publish/notifications/template');
    const moderationTemplateResponse = await fetch('/api/moderation/template');

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

    if (readinessResponse.ok) {
      const readiness = await readinessResponse.json();
      renderReadiness(readiness.items);
      const missing = readiness.summary?.missing || 0;
      const partial = readiness.summary?.partial || 0;
      const ready = readiness.summary?.ready || 0;
      const badgeState = missing > 0 ? 'warning' : 'ok';
      renderReadinessStatus(badgeState, `${ready} ready / ${partial} partial / ${missing} missing`);
    } else {
      renderReadinessStatus('warning', `Readiness unavailable (${readinessResponse.status})`);
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
