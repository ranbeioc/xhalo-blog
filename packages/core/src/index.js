export const defaultScaffoldMetadata = {
  repo: 'xhalo-blog',
  stage: '3-prototype',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  worker_entry: 'workers/api/src/index.js',
  queue_binding: 'TASK_QUEUE',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: ['/api/health', '/api/scaffold', '/api/posts', '/api/tasks', '/api/tasks/example'],
  notes: [
    'Posts and site configuration stay Git-backed.',
    'Read-only D1-backed posts and task status routes are the first Stage 3 prototype slice.',
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

export function nowIso() {
  return new Date().toISOString();
}
