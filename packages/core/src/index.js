export const defaultScaffoldMetadata = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  worker_entry: 'workers/api/src/index.js',
  queue_binding: 'TASK_QUEUE',
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
    '/api/publish/notifications/template',
    '/api/publish/notifications/preview',
    '/api/publish/notifications/tasks',
    '/api/tasks/example'
  ],
  notes: [
    'Posts and site configuration stay Git-backed.',
    'Read-only D1-backed posts and task status routes are the first Stage 3 prototype slice.',
    'Draft flows remain dry-run prototypes until GitHub branch and PR creation is implemented.',
    'R2 upload flows remain dry-run prototypes until signed upload handlers and lifecycle rules exist.',
    'Publish notification flows remain dry-run prototypes until downstream delivery targets are implemented.',
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
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'GITHUB_APP_ID',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_INSTALLATION_ID',
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
  fields: ['filename', 'contentType', 'scope', 'postSlug'],
  defaults: {
    scope: 'uploads',
    contentType: 'image/png'
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
    issues.push('theme.name must stay aligned to next in the Stage 2.5 scaffold');
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
      status: 'published',
      updated_at: nowIso()
    },
    {
      id: 'post-demo-2',
      slug: 'next-theme-baseline',
      title: 'NexT Theme Baseline',
      path: 'examples/next-theme-blog/source/_posts/hello-xhalo-blog.md',
      status: 'example',
      updated_at: nowIso()
    }
  ];
}

export function createFallbackTasks() {
  return [
    {
      id: 'task-demo-1',
      type: 'build_status_poll',
      status: 'pending',
      payload: '{"source":"scaffold"}',
      updated_at: nowIso()
    },
    {
      id: 'task-demo-2',
      type: 'example',
      status: 'queued',
      payload: '{"source":"scaffold"}',
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
  const category = String(input.category || defaultDraftTemplate.defaults.category).trim();
  const status = String(input.status || defaultDraftTemplate.defaults.status).trim();
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  return {
    title,
    slug,
    summary,
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
