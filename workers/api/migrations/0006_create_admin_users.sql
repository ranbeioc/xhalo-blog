CREATE TABLE IF NOT EXISTS admin_users (
  login TEXT PRIMARY KEY,
  github_id TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  bootstrap_source TEXT NOT NULL DEFAULT 'github_first_login',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
