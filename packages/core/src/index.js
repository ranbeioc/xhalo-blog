export const defaultScaffoldMetadata = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  release_line: '0.1.x-alpha',
  contract_version: 'v1',
  static_site: 'Cloudflare Pages',
  worker_entry: 'workers/api/src/index.js',
  queue_binding: 'TASK_QUEUE',
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
  ],
  notes: [
    'Posts and site configuration stay Git-backed.',
    'Read-only D1-backed posts and task status routes are the first Stage 3 prototype slice.',
    'Draft flows now include a token-gated live GitHub branch and PR prototype.',
    'R2 upload flows now include a bounded live object write prototype and a worker-signed upload prototype.',
    'Protected admin-facing routes expect an application-level admin secret in addition to outer Access controls.',
    'Live write routes stay disabled by default until LIVE_WRITES_ENABLED=true is set explicitly.',
    'Publish notification flows remain dry-run prototypes until downstream delivery targets are implemented.',
    'Moderation flows remain dry-run prototypes until the real comment provider and anti-abuse controls are wired.',
    'Dynamic write flows should open pull requests rather than write to main directly.',
    'This API surface is placeholder-only and not a production admin implementation.'
  ]
};

export const requiredConfigSections = [
  'site',
  'theme',
  'social',
  'comments',
  'analytics',
  'features',
  'security'
];

export const requiredEnvKeys = [
  'SITE_URL',
  'LIVE_WRITES_ENABLED',
  'ADMIN_API_SHARED_SECRET',
  'WALINE_SERVER_URL',
  'GOOGLE_ANALYTICS_ID',
  'BAIDU_ANALYTICS_ID',
  'GROWINGIO_PROJECT_ID',
  'CLOUDFLARE_ANALYTICS_TOKEN',
  'CLARITY_PROJECT_ID',
  'FIRESTORE_API_KEY',
  'FIRESTORE_PROJECT_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'ASSETS_PUBLIC_BASE_URL',
  'ASSETS_SIGNING_SECRET',
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'GITHUB_WEBHOOK_SECRET',
  'GITHUB_APP_ID',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_INSTALLATION_ID',
  'PREVIEW_WEBHOOK_SECRET',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY'
];

export const defaultDraftTemplate = {
  fields: ['title', 'slug', 'summary', 'tags', 'category', 'status'],
  defaults: {
    status: 'draft',
    tags: [],
    category: 'notes'
  },
  branchPrefix: 'draft/',
  postDir: 'source/_posts'
};

export const defaultR2UploadTemplate = {
  bucketBinding: 'ASSETS',
  bucketName: 'xhalo-blog-assets',
  keyPrefix: 'uploads',
  publicBaseUrl: 'https://assets.example.com',
  fields: ['filename', 'contentType', 'scope', 'postSlug', 'content', 'encoding', 'cacheControl'],
  defaults: {
    scope: 'uploads',
    contentType: 'image/png',
    encoding: 'utf-8',
    cacheControl: 'public, max-age=31536000, immutable',
    uploadUrlTtlSeconds: 900
  }
};

export const defaultPublishNotificationTemplate = {
  queueBinding: 'TASK_QUEUE',
  channels: ['cloudflare-pages-preview', 'github-pr-comment'],
  defaults: {
    channel: 'cloudflare-pages-preview',
    status: 'preview-ready'
  },
  fields: ['postSlug', 'branchName', 'previewUrl', 'channel', 'status']
};

export const defaultModerationTemplate = {
  queueBinding: 'TASK_QUEUE',
  providers: ['waline'],
  actions: ['approve', 'reject', 'flag'],
  defaults: {
    provider: 'waline',
    action: 'flag',
    reason: 'manual-review'
  },
  fields: ['commentId', 'provider', 'action', 'reason']
};

export function buildProviderReadinessSnapshot(env = {}) {
  const hasGitHubRepoConfig = Boolean(env.GITHUB_OWNER) && Boolean(env.GITHUB_REPO) && Boolean(env.GITHUB_BRANCH);
  const hasGitHubApp = Boolean(env.GITHUB_APP_ID) && Boolean(env.GITHUB_APP_PRIVATE_KEY) && Boolean(env.GITHUB_INSTALLATION_ID);
  const hasGitHubToken = Boolean(env.GITHUB_TOKEN);
  const hasGitHubWebhookSecret = Boolean(env.GITHUB_WEBHOOK_SECRET);
  const hasAdminSecret = Boolean(env.ADMIN_API_SHARED_SECRET);
  const liveWritesEnabled = String(env.LIVE_WRITES_ENABLED || '').toLowerCase() === 'true';
  const hasR2Binding = Boolean(env.ASSETS) && typeof env.ASSETS === 'object';
  const hasR2PublicBaseUrl = Boolean(env.ASSETS_PUBLIC_BASE_URL);
  const hasR2SigningSecret = Boolean(env.ASSETS_SIGNING_SECRET);
  const hasPreviewWebhookSecret = Boolean(env.PREVIEW_WEBHOOK_SECRET);
  const hasQueue = Boolean(env.TASK_QUEUE) && typeof env.TASK_QUEUE.send === 'function';
  const hasTurnstile = Boolean(env.TURNSTILE_SITE_KEY) && Boolean(env.TURNSTILE_SECRET_KEY);

  const items = [
    {
      key: 'admin_api',
      label: 'Admin API request gate',
      status: hasAdminSecret ? 'ready' : 'missing',
      note: hasAdminSecret
        ? 'ADMIN_API_SHARED_SECRET is present for protected admin-facing routes.'
        : 'ADMIN_API_SHARED_SECRET is missing, so protected admin-facing routes should stay unavailable.'
    },
    {
      key: 'live_writes',
      label: 'Live write gate',
      status: liveWritesEnabled ? 'partial' : 'ready',
      note: liveWritesEnabled
        ? 'LIVE_WRITES_ENABLED=true. Keep Cloudflare Access, request verification, and route tests in place.'
        : 'Live write routes remain disabled by default.'
    },
    {
      key: 'github',
      label: 'GitHub PR publishing',
      status: hasGitHubRepoConfig && (hasGitHubApp || hasGitHubToken) && hasGitHubWebhookSecret ? 'ready' : hasGitHubRepoConfig ? 'partial' : 'missing',
      note: hasGitHubRepoConfig
        ? (
          hasGitHubApp
            ? (
              hasGitHubWebhookSecret
                ? 'Repository, GitHub App env, and webhook secret are present.'
                : 'Repository and GitHub App env are present, but the webhook secret is missing.'
            )
            : hasGitHubToken
              ? (
                hasGitHubWebhookSecret
                  ? 'Repository env, fallback GitHub token, and webhook secret are present.'
                  : 'Repository env and fallback GitHub token are present, but the webhook secret is missing.'
              )
              : 'Repository env is present but GitHub App or prototype GitHub token is missing.'
        )
        : 'Repository publishing env is missing.'
    },
    {
      key: 'r2',
      label: 'R2 assets',
      status: hasR2Binding && hasR2PublicBaseUrl && hasR2SigningSecret ? 'ready' : hasR2Binding || hasR2PublicBaseUrl ? 'partial' : 'missing',
      note: hasR2Binding
        ? (
          hasR2PublicBaseUrl
            ? (
              hasR2SigningSecret
                ? 'Bucket binding, public base URL, and signing secret are present.'
                : 'Bucket binding and public base URL are present, but the signing secret is missing.'
            )
            : 'Bucket binding is present but public base URL is missing.'
        )
        : hasR2PublicBaseUrl || hasR2SigningSecret
          ? 'R2 public URL or signing secret is present, but the bucket binding is missing.'
          : 'R2 bucket binding is missing.'
    },
    {
      key: 'queue',
      label: 'Queue worker',
      status: hasQueue ? 'ready' : 'missing',
      note: hasQueue ? 'TASK_QUEUE binding is present.' : 'TASK_QUEUE binding is missing.'
    },
    {
      key: 'preview_deployments',
      label: 'Preview deployment reconciliation',
      status: hasPreviewWebhookSecret ? 'ready' : 'missing',
      note: hasPreviewWebhookSecret ? 'Preview deployment webhook secret is present.' : 'PREVIEW_WEBHOOK_SECRET is missing.'
    },
    {
      key: 'turnstile',
      label: 'Turnstile',
      status: hasTurnstile ? 'ready' : 'missing',
      note: hasTurnstile ? 'Turnstile site and secret keys are present.' : 'Turnstile env keys are missing.'
    },
    {
      key: 'access',
      label: 'Cloudflare Access',
      status: 'manual',
      note: 'Access policy state is not inferred from worker env. Verify it in Cloudflare dashboard.'
    }
  ];

  const summary = {
    ready: items.filter((item) => item.status === 'ready').length,
    partial: items.filter((item) => item.status === 'partial').length,
    missing: items.filter((item) => item.status === 'missing').length,
    manual: items.filter((item) => item.status === 'manual').length
  };

  return { items, summary };
}

export function createJsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

export function getScaffoldMetadata(overrides = {}) {
  return {
    ...defaultScaffoldMetadata,
    ...overrides
  };
}

export function validateScaffoldConfig(config) {
  const issues = [];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['Config root must be a JSON object.'];
  }

  for (const section of requiredConfigSections) {
    if (!(section in config)) issues.push(`Missing config section: ${section}`);
  }

  if (typeof config.site?.title !== 'string' || config.site.title.length === 0) {
    issues.push('site.title must be a non-empty string');
  }

  if (typeof config.site?.url !== 'string' || !config.site.url.startsWith('https://')) {
    issues.push('site.url must be an https URL placeholder');
  }

  if (config.theme?.name !== 'next') {
    issues.push('theme.name must be present as a non-empty string');
  }

  if (config.theme?.adapter !== 'hexo-next') {
    issues.push('theme.adapter must default to hexo-next in the current scaffold');
  }

  if (!Array.isArray(config.theme?.menu) || config.theme.menu.length === 0) {
    issues.push('theme.menu must be a non-empty array');
  }

  if (typeof config.comments?.serverUrl !== 'string') {
    issues.push('comments.serverUrl must be present as a string');
  }

  if (typeof config.features?.postAssetFolder !== 'boolean') {
    issues.push('features.postAssetFolder must be a boolean');
  }

  if (typeof config.security?.turnstile !== 'boolean' || typeof config.security?.access !== 'boolean') {
    issues.push('security.turnstile and security.access must be booleans');
  }

  return issues;
}

export function parseEnvExample(content) {
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

export function validateEnvExample(content) {
  const env = parseEnvExample(content);
  const issues = [];

  for (const key of requiredEnvKeys) {
    if (!(key in env)) issues.push(`Missing env key: ${key}`);
  }

  if (env.SITE_URL && !env.SITE_URL.startsWith('https://')) {
    issues.push('SITE_URL must use an https placeholder');
  }

  if (env.GITHUB_REPO && env.GITHUB_REPO !== 'xhalo-blog') {
    issues.push('GITHUB_REPO must stay aligned to xhalo-blog in the scaffold');
  }

  if (env.GITHUB_BRANCH && env.GITHUB_BRANCH !== 'main') {
    issues.push('GITHUB_BRANCH must default to main');
  }

  if ('LIVE_WRITES_ENABLED' in env && !['', 'false', 'true'].includes(String(env.LIVE_WRITES_ENABLED).toLowerCase())) {
    issues.push('LIVE_WRITES_ENABLED must be blank, false, or true');
  }

  return issues;
}

export function buildQueueTaskEnvelope(body = {}) {
  return {
    type: body.type || 'unknown',
    stage: body.stage || '3-prototype',
    created_at: body.created_at || nowIso(),
    idempotency_key: body.idempotency_key || '',
    payload: body
  };
}

export function createFallbackPosts() {
  return [
    {
      id: 'post-demo-1',
      slug: 'hello-xhalo-blog',
      title: 'Hello xhalo-blog',
      path: 'source/_posts/hello-xhalo-blog.md',
      status: 'preview-ready',
      updated_at: nowIso(),
      github_branch: 'draft/hello-xhalo-blog',
      github_pr_url: 'https://github.com/ranbeioc/xhalo-blog/pull/42'
    },
    {
      id: 'post-demo-2',
      slug: 'next-theme-baseline',
      title: 'NexT Theme Baseline',
      path: 'examples/next-theme-blog/source/_posts/hello-xhalo-blog.md',
      status: 'example',
      updated_at: nowIso(),
      github_branch: null,
      github_pr_url: null
    }
  ];
}

export function createFallbackTasks() {
  return [
    {
      id: 'task-demo-1',
      type: 'build_status_poll',
      status: 'pending',
      payload: '{"reconciliation":{"summary":{"outcome":"polling","provider":"cloudflare-pages"}}}',
      updated_at: nowIso()
    },
    {
      id: 'task-demo-2',
      type: 'preview_deployment_webhook',
      status: 'completed',
      payload: '{"reconciliation":{"summary":{"outcome":"preview-ready","previewUrl":"https://preview.example.com/hello-xhalo-blog/","postSlug":"hello-xhalo-blog"}}}',
      updated_at: nowIso()
    }
  ];
}

export function slugifyTitle(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function normalizeDraftInput(input = {}) {
  const title = String(input.title || '').trim();
  const slug = String(input.slug || slugifyTitle(title)).trim() || 'untitled-draft';
  const summary = String(input.summary || '').trim();
  const body = String(input.body || '').trim();
  const category = String(input.category || defaultDraftTemplate.defaults.category).trim();
  const status = String(input.status || defaultDraftTemplate.defaults.status).trim();
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  return {
    title,
    slug,
    summary,
    body,
    category,
    status,
    tags
  };
}

export function buildDraftFrontMatter(input = {}) {
  const draft = normalizeDraftInput(input);
  return {
    title: draft.title,
    date: nowIso(),
    updated: nowIso(),
    tags: draft.tags,
    categories: [draft.category],
    summary: draft.summary,
    status: draft.status
  };
}

export function buildDraftFilePath(input = {}) {
  const draft = normalizeDraftInput(input);
  return `${defaultDraftTemplate.postDir}/${draft.slug}.md`;
}

function serializeFrontMatterValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `\n${value.map((item) => `  - ${String(item)}`).join('\n')}`;
  }

  if (typeof value === 'string') {
    if (value.length === 0) return '""';
    if (/^[a-zA-Z0-9._/-]+$/.test(value)) return value;
    return JSON.stringify(value);
  }

  return JSON.stringify(value);
}

export function buildDraftMarkdownDocument(input = {}) {
  const draft = normalizeDraftInput(input);
  const frontMatter = buildDraftFrontMatter(draft);
  const frontMatterLines = Object.entries(frontMatter).map(([key, value]) => `${key}: ${serializeFrontMatterValue(value)}`);
  const body = draft.body || draft.summary || 'Draft body placeholder.';

  return `---\n${frontMatterLines.join('\n')}\n---\n\n${body}\n`;
}

export function buildDraftBranchName(input = {}) {
  const draft = normalizeDraftInput(input);
  return `${defaultDraftTemplate.branchPrefix}${draft.slug}`;
}

export function buildPullRequestPreview(input = {}, options = {}) {
  const draft = normalizeDraftInput(input);
  const branchName = buildDraftBranchName(draft);
  const filePath = buildDraftFilePath(draft);
  const repoOwner = options.repoOwner || 'example';
  const repoName = options.repoName || 'xhalo-blog';
  const baseBranch = options.baseBranch || 'main';

  return {
    draft,
    branchName,
    baseBranch,
    filePath,
    frontMatter: buildDraftFrontMatter(draft),
    commitMessage: `feat(posts): add draft ${draft.slug}`,
    pullRequestTitle: `Add draft: ${draft.title || draft.slug}`,
    repository: `${repoOwner}/${repoName}`
  };
}

export function buildDraftTaskPrototype(input = {}, options = {}) {
  const preview = buildPullRequestPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'draft_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export function sanitizeAssetSegment(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

export function normalizeR2UploadInput(input = {}) {
  const filename = sanitizeAssetSegment(input.filename || 'upload.png');
  const contentType = String(input.contentType || defaultR2UploadTemplate.defaults.contentType).trim();
  const scope = String(input.scope || defaultR2UploadTemplate.defaults.scope).trim() || defaultR2UploadTemplate.defaults.scope;
  const postSlug = String(input.postSlug || '').trim();

  return {
    filename,
    contentType,
    scope,
    postSlug: postSlug ? slugifyTitle(postSlug) : ''
  };
}

export function buildR2ObjectKey(input = {}, options = {}) {
  const normalized = normalizeR2UploadInput(input);
  const date = options.date || new Date();
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  if (normalized.postSlug) {
    return `posts/${normalized.postSlug}/${yyyy}-${mm}-${dd}-${normalized.filename}`;
  }

  return `${normalized.scope}/${yyyy}/${mm}/${dd}/${normalized.filename}`;
}

export function buildR2UploadPreview(input = {}, options = {}) {
  const normalized = normalizeR2UploadInput(input);
  const objectKey = buildR2ObjectKey(normalized, options);
  const publicBaseUrl = options.publicBaseUrl || defaultR2UploadTemplate.publicBaseUrl;

  return {
    bucketBinding: options.bucketBinding || defaultR2UploadTemplate.bucketBinding,
    bucketName: options.bucketName || defaultR2UploadTemplate.bucketName,
    objectKey,
    publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`,
    contentType: normalized.contentType,
    scope: normalized.scope,
    postSlug: normalized.postSlug || null,
    filename: normalized.filename
  };
}

export function buildR2UploadTaskPrototype(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'r2_upload_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export function buildR2UploadWritePlan(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const encoding = String(input.encoding || defaultR2UploadTemplate.defaults.encoding).trim() || defaultR2UploadTemplate.defaults.encoding;
  const cacheControl = String(input.cacheControl || defaultR2UploadTemplate.defaults.cacheControl).trim() || defaultR2UploadTemplate.defaults.cacheControl;

  return {
    preview,
    actions: [
      {
        type: 'derive_object_key',
        summary: `Resolve ${preview.objectKey} under ${preview.bucketName}`,
        payload: {
          bucketBinding: preview.bucketBinding,
          bucketName: preview.bucketName,
          objectKey: preview.objectKey
        }
      },
      {
        type: 'write_object',
        summary: `Write ${preview.filename} to ${preview.objectKey} with ${preview.contentType}`,
        payload: {
          contentType: preview.contentType,
          encoding,
          cacheControl
        }
      },
      {
        type: 'verify_public_url',
        summary: `Verify the uploaded object on ${preview.publicUrl}`,
        payload: {
          publicUrl: preview.publicUrl
        }
      }
    ]
  };
}

export function buildR2SignedUploadPlan(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const ttlSeconds = Number(options.ttlSeconds || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds) || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds;

  return {
    preview,
    ttlSeconds,
    actions: [
      {
        type: 'derive_object_key',
        summary: `Resolve ${preview.objectKey} under ${preview.bucketName}`,
        payload: {
          bucketBinding: preview.bucketBinding,
          bucketName: preview.bucketName,
          objectKey: preview.objectKey
        }
      },
      {
        type: 'sign_upload_url',
        summary: `Issue a short-lived signed worker upload URL for ${preview.objectKey}`,
        payload: {
          ttlSeconds,
          method: 'PUT',
          pathPrefix: '/api/assets/r2-upload/'
        }
      },
      {
        type: 'browser_put_upload',
        summary: `PUT the asset bytes to the signed upload URL with ${preview.contentType}`,
        payload: {
          contentType: preview.contentType,
          publicUrl: preview.publicUrl,
          adminHeader: 'x-xhalo-admin-secret'
        }
      },
      {
        type: 'verify_public_url',
        summary: `Verify the uploaded object on ${preview.publicUrl}`,
        payload: {
          publicUrl: preview.publicUrl
        }
      }
    ]
  };
}

export function normalizePublishNotificationInput(input = {}) {
  const postSlug = String(input.postSlug || 'hello-xhalo-blog').trim();
  const branchName = String(input.branchName || `draft/${slugifyTitle(postSlug) || 'hello-xhalo-blog'}`).trim();
  const previewUrl = String(input.previewUrl || `https://preview.example.com/${slugifyTitle(postSlug) || 'hello-xhalo-blog'}/`).trim();
  const channel = String(input.channel || defaultPublishNotificationTemplate.defaults.channel).trim();
  const status = String(input.status || defaultPublishNotificationTemplate.defaults.status).trim();

  return {
    postSlug: slugifyTitle(postSlug) || 'hello-xhalo-blog',
    branchName,
    previewUrl,
    channel,
    status
  };
}

export function buildPublishNotificationPreview(input = {}, options = {}) {
  const normalized = normalizePublishNotificationInput(input);
  return {
    queueBinding: options.queueBinding || defaultPublishNotificationTemplate.queueBinding,
    postSlug: normalized.postSlug,
    branchName: normalized.branchName,
    previewUrl: normalized.previewUrl,
    channel: normalized.channel,
    status: normalized.status,
    title: `Preview ready for ${normalized.postSlug}`,
    message: `Preview deployment is ready on ${normalized.previewUrl}`
  };
}

export function buildPublishNotificationTaskPrototype(input = {}, options = {}) {
  const preview = buildPublishNotificationPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'publish_notification_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export function normalizeModerationInput(input = {}) {
  const commentId = String(input.commentId || 'comment-demo-1').trim();
  const provider = String(input.provider || defaultModerationTemplate.defaults.provider).trim();
  const action = String(input.action || defaultModerationTemplate.defaults.action).trim();
  const reason = String(input.reason || defaultModerationTemplate.defaults.reason).trim();

  return {
    commentId,
    provider,
    action,
    reason
  };
}

export function buildModerationPreview(input = {}, options = {}) {
  const normalized = normalizeModerationInput(input);
  return {
    queueBinding: options.queueBinding || defaultModerationTemplate.queueBinding,
    commentId: normalized.commentId,
    provider: normalized.provider,
    action: normalized.action,
    reason: normalized.reason,
    title: `Moderation review for ${normalized.commentId}`,
    message: `${normalized.action} comment ${normalized.commentId} via ${normalized.provider}`
  };
}

export function buildModerationTaskPrototype(input = {}, options = {}) {
  const preview = buildModerationPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'moderation_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export function buildGitHubWritePlan(input = {}, options = {}) {
  const preview = buildPullRequestPreview(input, options);

  return {
    repository: preview.repository,
    branchName: preview.branchName,
    baseBranch: preview.baseBranch,
    filePath: preview.filePath,
    actions: [
      {
        type: 'create_branch',
        summary: `Create ${preview.branchName} from ${preview.baseBranch}`,
        payload: {
          repository: preview.repository,
          baseBranch: preview.baseBranch,
          branchName: preview.branchName
        }
      },
      {
        type: 'write_post_file',
        summary: `Write ${preview.filePath} with generated front matter`,
        payload: {
          filePath: preview.filePath,
          frontMatter: preview.frontMatter
        }
      },
      {
        type: 'commit_changes',
        summary: `Commit draft changes with "${preview.commitMessage}"`,
        payload: {
          commitMessage: preview.commitMessage
        }
      },
      {
        type: 'open_pull_request',
        summary: `Open PR "${preview.pullRequestTitle}" into ${preview.baseBranch}`,
        payload: {
          repository: preview.repository,
          title: preview.pullRequestTitle,
          baseBranch: preview.baseBranch,
          headBranch: preview.branchName
        }
      },
      {
        type: 'verify_preview_deployment',
        summary: 'Wait for the preview deployment and validate the draft URL before merge',
        payload: {
          provider: 'cloudflare-pages',
          branchName: preview.branchName
        }
      }
    ]
  };
}

export function nowIso() {
  return new Date().toISOString();
}
