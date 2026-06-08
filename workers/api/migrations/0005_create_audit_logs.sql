-- Migration: create audit_logs table for mutation tracking and security event logging
-- All state-changing operations (publish, upload, webhook) are recorded here.
-- Rollback: DROP TABLE IF EXISTS audit_logs;
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
