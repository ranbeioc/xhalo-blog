/**
 * Shared test utilities for xhalo-blog worker integration tests.
 * Consolidates duplicated helper functions across test files.
 */

/**
 * Create a standard mock env object for worker tests.
 */
export function createMockEnv(overrides = {}) {
  return {
    ADMIN_API_SHARED_SECRET: 'test-admin-secret',
    ADMIN_AUTH_BASE_URL: 'https://test.example.com',
    ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com',
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_TOKEN: 'test-github-token',
    GITHUB_WEBHOOK_SECRET: 'test-webhook-secret',
    PREVIEW_WEBHOOK_SECRET: 'test-preview-secret',
    DEPLOYMENT_ENV: 'staging',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    TEST_MEDIA_UPLOAD_ENABLED: 'true',
    TEST_TURNSTILE_BYPASS: 'true',
    DB: createMockDb(),
    TASK_QUEUE: createMockQueue(),
    GITHUB_FETCH: createMockGithubFetch(),
    ...overrides
  };
}

/**
 * Create a mock D1 database supporting .prepare().bind().first()/.all()/.run().
 */
export function createMockDb(queryResults = {}) {
  const executedQueries = [];
  return {
    _executedQueries: executedQueries,
    prepare(sql) {
      const params = [];
      return {
        bind(...args) {
          params.push(...args);
          return this;
        },
        async first() {
          executedQueries.push({ sql, params: [...params], method: 'first' });
          for (const [pattern, result] of Object.entries(queryResults)) {
            if (sql.includes(pattern)) return result;
          }
          return null;
        },
        async all() {
          executedQueries.push({ sql, params: [...params], method: 'all' });
          for (const [pattern, result] of Object.entries(queryResults)) {
            if (sql.includes(pattern)) return { results: Array.isArray(result) ? result : [] };
          }
          return { results: [] };
        },
        async run() {
          executedQueries.push({ sql, params: [...params], method: 'run' });
          return { success: true, meta: { changes: 1 } };
        }
      };
    }
  };
}

/**
 * Create a mock Cloudflare Queue.
 */
export function createMockQueue() {
  const sent = [];
  return {
    _sent: sent,
    async send(message) {
      sent.push(message);
    }
  };
}

/**
 * Create a mock GitHub fetch function.
 */
export function createMockGithubFetch(responseMap = {}) {
  return async (url, options = {}) => {
    for (const [pattern, handler] of Object.entries(responseMap)) {
      if (url.includes(pattern)) {
        const result = typeof handler === 'function' ? handler(url, options) : handler;
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
    }
    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
  };
}

/**
 * Build standard admin request headers.
 */
export function adminHeaders(overrides = {}) {
  return {
    'x-xhalo-admin-secret': 'test-admin-secret',
    'content-type': 'application/json',
    ...overrides
  };
}

/**
 * Send a JSON request to a worker and parse the response.
 */
export async function requestJson(worker, env, method, path, body = null, headers = {}) {
  const init = {
    method,
    headers: { ...adminHeaders(), ...headers }
  };
  if (body !== null) {
    init.body = JSON.stringify(body);
  }
  const request = new Request(`https://test.example.com${path}`, init);
  const response = await worker.fetch(request, env);
  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

/**
 * Send a raw request to a worker (no JSON parsing).
 */
export async function requestRaw(worker, env, method, path, headers = {}) {
  const request = new Request(`https://test.example.com${path}`, {
    method,
    headers: { ...adminHeaders(), ...headers }
  });
  return worker.fetch(request, env);
}
