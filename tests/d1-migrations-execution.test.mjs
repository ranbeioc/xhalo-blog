import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const migrationsDir = path.resolve('workers/api/migrations');

test('D1 migrations execute sequentially on a fresh database without errors', () => {
  const db = new DatabaseSync(':memory:');

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  assert.ok(files.length >= 6, `Expected at least 6 migration files, found ${files.length}`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Executing the migration should not throw
    assert.doesNotThrow(() => {
      db.exec(sql);
    }, `Migration ${file} failed during execution`);
  }

  // Verify all tables exist
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  ).all().map(row => row.name);

  assert.ok(tables.includes('posts_index'), 'posts_index table must exist');
  assert.ok(tables.includes('site_settings'), 'site_settings table must exist');
  assert.ok(tables.includes('tasks'), 'tasks table must exist');
  assert.ok(tables.includes('audit_logs'), 'audit_logs table must exist');
  assert.ok(tables.includes('admin_users'), 'admin_users table must exist');

  // Verify posts_index columns from 0002 and 0004
  const postsColumns = db.prepare("PRAGMA table_info(posts_index)").all().map(c => c.name);
  assert.ok(postsColumns.includes('content'), 'posts_index must contain content column from 0002');
  assert.ok(postsColumns.includes('preview_url'), 'posts_index must contain preview_url column from 0004');

  // Verify audit_logs columns and indexes from 0005
  const auditColumns = db.prepare("PRAGMA table_info(audit_logs)").all().map(c => c.name);
  assert.ok(auditColumns.includes('timestamp'), 'audit_logs must contain timestamp column from 0005');
  assert.ok(auditColumns.includes('resource'), 'audit_logs must contain resource column from 0005');
  assert.ok(auditColumns.includes('status_code'), 'audit_logs must contain status_code column from 0005');

  // Verify admin_users columns from 0006
  const adminColumns = db.prepare("PRAGMA table_info(admin_users)").all().map(c => c.name);
  assert.ok(adminColumns.includes('login'), 'admin_users must contain login column from 0006');
  assert.ok(adminColumns.includes('role'), 'admin_users must contain role column from 0006');

  // Verify indexes
  const indexes = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
  ).all().map(row => row.name);

  assert.ok(indexes.includes('idx_posts_index_slug'), 'idx_posts_index_slug index must exist');
  assert.ok(indexes.includes('idx_audit_logs_timestamp'), 'idx_audit_logs_timestamp index must exist');
  assert.ok(indexes.includes('idx_admin_users_role'), 'idx_admin_users_role index must exist');

  // Test insert/select roundtrip
  db.exec(`
    INSERT INTO posts_index (id, slug, title, path, status, content, preview_url)
    VALUES ('p1', 'test-post', 'Test Post', 'source/_posts/test.md', 'published', 'Hello world', 'https://example.com/preview');
  `);
  const post = db.prepare("SELECT * FROM posts_index WHERE id = 'p1'").get();
  assert.equal(post.slug, 'test-post');
  assert.equal(post.content, 'Hello world');

  db.exec(`
    INSERT INTO audit_logs (id, timestamp, action, actor, resource, status_code)
    VALUES ('a1', '2026-09-12T00:00:00Z', 'post_publish', 'admin', 'post', 200);
  `);
  const log = db.prepare("SELECT * FROM audit_logs WHERE id = 'a1'").get();
  assert.equal(log.action, 'post_publish');
  assert.equal(log.status_code, 200);
});
