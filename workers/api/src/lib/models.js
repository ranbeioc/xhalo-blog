export async function insertTaskRecord(env, task) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  await env.DB.prepare(
    'INSERT INTO tasks (id, type, status, payload, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    task.id,
    task.type,
    task.status,
    JSON.stringify(task.payload),
    null,
    task.created_at,
    task.updated_at
  ).run();

  return true;
}

export async function upsertPostIndexRecord(env, record) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  await env.DB.prepare(
    `INSERT INTO posts_index
    (id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, preview_url, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      path = excluded.path,
      status = excluded.status,
      updated_at = excluded.updated_at,
      published_at = COALESCE(excluded.published_at, posts_index.published_at),
      github_branch = COALESCE(excluded.github_branch, posts_index.github_branch),
      github_pr_url = COALESCE(excluded.github_pr_url, posts_index.github_pr_url),
      preview_url = COALESCE(excluded.preview_url, posts_index.preview_url),
      content = COALESCE(excluded.content, posts_index.content)`
  ).bind(
    record.id,
    record.slug,
    record.title,
    record.path,
    record.status,
    record.created_at,
    record.updated_at,
    record.published_at || null,
    record.github_branch || null,
    record.github_pr_url || null,
    record.preview_url || null,
    record.content || null
  ).run();

  return true;
}

export async function updatePostByBranchOrSlug(env, match = {}, patch = {}) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  const matchClauses = [];
  const matchArgs = [];

  if (match.github_branch) {
    matchClauses.push('github_branch = ?');
    matchArgs.push(match.github_branch);
  }

  if (match.slug) {
    matchClauses.push('slug = ?');
    matchArgs.push(match.slug);
  }

  if (matchClauses.length === 0) return false;

  const setClauses = [];
  const setArgs = [];

  if ('status' in patch) {
    setClauses.push('status = ?');
    setArgs.push(patch.status);
  }
  if ('updated_at' in patch) {
    setClauses.push('updated_at = ?');
    setArgs.push(patch.updated_at);
  }
  if ('github_pr_url' in patch) {
    setClauses.push('github_pr_url = ?');
    setArgs.push(patch.github_pr_url);
  }
  if ('published_at' in patch) {
    setClauses.push('published_at = ?');
    setArgs.push(patch.published_at);
  }
  if ('preview_url' in patch) {
    setClauses.push('preview_url = ?');
    setArgs.push(patch.preview_url);
  }
  if ('previewUrl' in patch) {
    setClauses.push('preview_url = ?');
    setArgs.push(patch.previewUrl);
  }

  if (setClauses.length === 0) return false;

  await env.DB.prepare(
    `UPDATE posts_index SET ${setClauses.join(', ')} WHERE ${matchClauses.join(' OR ')}`
  ).bind(...setArgs, ...matchArgs).run();

  return true;
}

export function parseJsonSafe(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function summarizeTaskRecord(item) {
  const payload = parseJsonSafe(item.payload) || {};
  const reconciliation = payload.reconciliation || {};
  const summary = reconciliation.summary || {};
  const branch = summary.branch || payload.branch || payload.preview?.branchName || null;
  const lastError = item.error || reconciliation.last_error || null;
  const retryCount = reconciliation.retry_count ?? 0;

  return {
    ...item,
    payload,
    branch,
    last_error: lastError,
    retry_count: retryCount,
    detail_primary: summary.outcome || item.status || 'unknown',
    detail_secondary:
      lastError ||
      summary.pull_request?.url ||
      summary.previewUrl ||
      branch ||
      summary.key ||
      summary.channel ||
      summary.commentId ||
      summary.note ||
      null
  };
}

export function summarizePostRecord(item) {
  return {
    ...item,
    detail_primary: item.github_branch || null,
    detail_secondary: item.github_pr_url || null
  };
}
