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
    '/api/drafts/direct-publish',
    '/api/drafts/test-direct-publish',
    '/api/posts/source',
    '/api/drafts/direct-update-preview',
    '/api/drafts/direct-update',
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
  'TURNSTILE_SECRET_KEY',
  'PUBLISH_MODE',
  'OWNER_DIRECT_PUBLISH_ENABLED',
  'OWNER_DIRECT_CONFIRMATION_PHRASE',
  'OWNER_DIRECT_UPDATE_ENABLED',
  'OWNER_DIRECT_UPDATE_CONFIRMATION_PHRASE',
  'DEPLOYMENT_ENV',
  'TEST_DIRECT_PUBLISH_ENABLED',
  'TEST_TURNSTILE_BYPASS_ENABLED',
  'TEST_MEDIA_UPLOAD_ENABLED',
  'TEST_MEDIA_UPLOAD_PREFIX',
  'CLOUDFLARE_PAGES_DEPLOY_HOOK_URL',
  'FIRST_GITHUB_LOGIN_ADMIN_ENABLED',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'GITHUB_OAUTH_ALLOWED_LOGINS',
  'ADMIN_SESSION_SECRET',
  'ADMIN_AUTH_BASE_URL',
  'ADMIN_SESSION_COOKIE_NAME',
  'ADMIN_SESSION_TTL_SECONDS'
];

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

  const publishMode = env.PUBLISH_MODE || 'pr_only';
  const ownerDirectPublishEnabled = String(env.OWNER_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';
  const ownerDirectUpdateEnabled = String(env.OWNER_DIRECT_UPDATE_ENABLED || '').toLowerCase() === 'true';
  const oauthEnabled = Boolean(env.GITHUB_OAUTH_CLIENT_ID) && Boolean(env.GITHUB_OAUTH_CLIENT_SECRET) && Boolean(env.ADMIN_SESSION_SECRET);
  const deploymentEnv = env.DEPLOYMENT_ENV || 'development';
  const testDirectPublishEnabled = String(env.TEST_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';
  const firstLoginAdminEnabled = deploymentEnv === 'test' || String(env.FIRST_GITHUB_LOGIN_ADMIN_ENABLED || '').toLowerCase() === 'true';
  const targetOwner = env.GITHUB_OWNER || 'example';
  const targetRepo = env.GITHUB_REPO || 'xhalo-blog';
  const targetBranch = env.GITHUB_BRANCH || 'main';
  const testDirectTargetSafe = !(
    targetOwner.toLowerCase() === 'ranbeioc' &&
    targetRepo.toLowerCase() === 'hexo-blog' &&
    targetBranch.toLowerCase() === 'main'
  );

  return {
    items,
    summary,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    publishMode,
    ownerDirectPublishEnabled,
    ownerDirectUpdateEnabled,
    deploymentEnv,
    testDirectPublishEnabled,
    testDirectTargetRepo: `${targetOwner}/${targetRepo}`,
    testDirectTargetBranch: targetBranch,
    testDirectTargetSafe,
    firstLoginAdminEnabled,
    oauthEnabled,
    liveWritesEnabled
  };
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
