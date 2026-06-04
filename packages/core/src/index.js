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

export function nowIso() {
  return new Date().toISOString();
}
