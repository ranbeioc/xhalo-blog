import { nowIso } from '../../../../packages/core/src/index.js';

export function createStructuredLog(level, action, fields = {}) {
  return {
    level,
    action,
    timestamp: nowIso(),
    ...fields
  };
}

export function logInfo(action, fields = {}) {
  const entry = createStructuredLog('info', action, fields);
  console.log(JSON.stringify(entry));
  return entry;
}

export function logWarn(action, fields = {}) {
  const entry = createStructuredLog('warn', action, fields);
  console.warn(JSON.stringify(entry));
  return entry;
}

export function logError(action, fields = {}) {
  const entry = createStructuredLog('error', action, fields);
  console.error(JSON.stringify(entry));
  return entry;
}

export function logSecurity(action, fields = {}) {
  return logWarn(action, { ...fields, category: 'security' });
}

export function extractRequestMeta(request) {
  return {
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
    user_agent: request.headers.get('user-agent') || null,
    method: request.method,
    path: new URL(request.url).pathname
  };
}

export async function insertAuditLog(env, entry) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, timestamp, action, actor, resource, resource_id, method, path, status_code, detail, ip, user_agent, duration_ms, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      entry.id || crypto.randomUUID(),
      entry.timestamp || nowIso(),
      entry.action,
      entry.actor || null,
      entry.resource || null,
      entry.resource_id || null,
      entry.method || null,
      entry.path || null,
      entry.status_code || null,
      typeof entry.detail === 'object' ? JSON.stringify(entry.detail) : (entry.detail || null),
      entry.ip || null,
      entry.user_agent || null,
      entry.duration_ms || null,
      entry.error || null
    ).run();
    return true;
  } catch (err) {
    console.error(JSON.stringify(createStructuredLog('error', 'audit_log_write_failed', { error: err.message })));
    return false;
  }
}
