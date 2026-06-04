export const defaultScaffoldMetadata = {
  repo: 'xhalo-blog',
  stage: '2.5',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  worker_entry: 'workers/api/src/index.js',
  queue_binding: 'TASK_QUEUE',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: ['/api/health', '/api/scaffold', '/api/posts', '/api/tasks/example'],
  notes: [
    'Posts and site configuration stay Git-backed.',
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
    stage: body.stage || '2.5',
    created_at: body.created_at || nowIso(),
    idempotency_key: body.idempotency_key || '',
    payload: body
  };
}

export function nowIso() {
  return new Date().toISOString();
}
