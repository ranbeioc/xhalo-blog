# Observability & Audit Logging

This document describes the observability infrastructure in the `xhalo-blog` API Worker, including structured logging, audit log persistence, error boundary middleware, and security event tracking.

## 1. Structured Logging

All Worker log output uses structured JSON format for consistent parsing by Cloudflare's log pipeline, Logpush, or third-party log aggregators.

### Log Levels

| Level | Function | Use Case |
|---|---|---|
| `info` | `logInfo(action, fields)` | Normal operations: successful publishes, uploads, webhook processing |
| `warn` | `logWarn(action, fields)` | Unusual conditions: auth rejections, validation failures, degraded states |
| `error` | `logError(action, fields)` | Failures: uncaught exceptions, D1 write failures, GitHub API errors |
| `security` | `logSecurity(action, fields)` | Security events: auth failures, webhook secret mismatches, turnstile rejections |

### Log Entry Structure

```json
{
  "level": "info",
  "action": "draft_publish",
  "timestamp": "2026-06-08T01:30:00.000Z",
  "resource": "post",
  "resource_id": "my-first-post",
  "method": "POST",
  "path": "/api/drafts/publish",
  "duration_ms": 245,
  "detail": {
    "mode": "live",
    "auth_mode": "app",
    "branch_created": true,
    "has_pr": true
  }
}
```

### Using with Cloudflare Logpush

To forward structured logs to an external destination:

1. Enable **Workers Logpush** in the Cloudflare dashboard.
2. Configure a log destination (R2, S3, Datadog, Splunk, etc.).
3. Filter by `ScriptName` to isolate the API Worker logs.
4. Parse JSON from `console.log` / `console.warn` / `console.error` output.

---

## 2. Audit Log Persistence (D1)

All state-changing operations are persisted to the `audit_logs` D1 table for compliance, debugging, and security forensics.

### Schema

Created by migration `0005_create_audit_logs.sql`:

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT,
  resource TEXT,
  resource_id TEXT,
  method TEXT,
  path TEXT,
  status_code INTEGER,
  detail TEXT,
  ip TEXT,
  user_agent TEXT,
  duration_ms REAL,
  error TEXT
);
```

### Indexed Columns

| Index | Columns | Purpose |
|---|---|---|
| `idx_audit_logs_timestamp` | `timestamp` | Chronological queries |
| `idx_audit_logs_action` | `action` | Filter by action type |
| `idx_audit_logs_resource` | `resource, resource_id` | Resource-specific lookups |

### Audited Actions

| Action | Resource | Trigger |
|---|---|---|
| `draft_publish` | `post` | `POST /api/drafts/publish` (live mode) |
| `r2_upload` | `asset` | `POST /api/assets/r2-upload` (live mode) |
| `r2_signed_upload` | `asset` | `PUT /api/assets/r2-upload/:token` |
| `github_webhook` | `webhook` | `POST /webhooks/github` (PR events) |
| `preview_deployment` | `deployment` | `POST /webhooks/deployments/preview` |
| `auth_rejected` | — | Admin route auth failure |
| `turnstile_rejected` | — | Turnstile challenge failure |
| `webhook_auth_failed` | `webhook` | Webhook signature/secret mismatch |
| `uncaught_error` | — | Unhandled exception in fetch handler |

### Reading Audit Logs

```bash
# via API (requires admin auth)
curl -H "x-xhalo-admin-secret: <SECRET>" \
  https://your-worker.example.com/api/audit-logs

# via D1 console
npx wrangler d1 execute <DB_NAME> --command "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20"
```

---

## 3. Error Boundary

The Worker's `fetch` handler is wrapped in a top-level `try/catch` error boundary that:

1. Captures any uncaught exception.
2. Logs the error with full stack trace via `logError('uncaught_error', ...)`.
3. Persists the error to `audit_logs` for post-mortem analysis.
4. Returns a safe `500 Internal Server Error` response with a `request_id` for correlation.

### Error Response Format

```json
{
  "error": "Internal server error.",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

The `request_id` can be correlated with the `audit_logs.id` field in D1 for debugging.

---

## 4. Security Event Logging

Security-relevant events are logged at the `security` level (internally `warn` with `category: 'security'`):

| Event | Trigger | Response |
|---|---|---|
| `auth_rejected` | Invalid or missing admin secret / JWT | 401 |
| `turnstile_rejected` | Invalid Turnstile token | 403 |
| `webhook_auth_failed` | Invalid webhook signature/secret | 403 |

These events include the client's IP address (`cf-connecting-ip`) and User-Agent for forensic analysis.

### Monitoring Recommendations

1. **Alert on `auth_rejected` spikes**: May indicate brute-force attempts.
2. **Alert on `webhook_auth_failed`**: May indicate webhook secret compromise or misconfiguration.
3. **Monitor `uncaught_error` count**: Should always be zero in stable operation.
4. **Track `duration_ms` distribution**: Identify slow mutations or degraded GitHub API performance.

---

## 5. Request Metadata Extraction

Every audit log entry includes metadata extracted from the incoming request:

| Field | Source Header | Description |
|---|---|---|
| `ip` | `cf-connecting-ip` / `x-forwarded-for` | Client IP address |
| `user_agent` | `user-agent` | Client User-Agent string |
| `method` | Request method | HTTP method (GET, POST, PUT, etc.) |
| `path` | Request URL pathname | API route path |

---

## 6. Retention & Cleanup

D1 does not have built-in TTL or automatic cleanup. Operators should periodically prune old audit logs:

```sql
-- Delete audit logs older than 90 days
DELETE FROM audit_logs WHERE timestamp < datetime('now', '-90 days');
```

Consider scheduling this as a Cron Trigger on the Worker or a manual maintenance task.

---

## 7. Migration

### Apply Migration

```bash
npx wrangler d1 migrations apply <DB_NAME>
```

### Rollback

```sql
DROP TABLE IF EXISTS audit_logs;
```
