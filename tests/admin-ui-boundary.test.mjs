import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_SRC_DIR = path.resolve('apps/admin/src');

function readAllSourceFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readAllSourceFiles(fullPath));
    } else if (/\.(js|html|css)$/.test(entry.name)) {
      results.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf8') });
    }
  }
  return results;
}

describe('Admin UI boundary checks', () => {
  const files = readAllSourceFiles(ADMIN_SRC_DIR);

  it('should not reference the global xhalo-admin Pages project URL', () => {
    for (const file of files) {
      // Match xhalo-admin.pages.dev but NOT xhalo-blog-admin.pages.dev
      const matches = file.content.match(/(?<!blog-)xhalo-admin\.pages\.dev/g);
      assert.strictEqual(
        matches,
        null,
        `Found global xhalo-admin.pages.dev reference in ${file.path}`
      );
    }
  });

  it('should not contain hardcoded concrete API domain URLs (only placeholders allowed)', () => {
    for (const file of files) {
      // Allow placeholder pattern, reject concrete worker URLs
      if (file.path.includes('config.js')) continue; // config.js has the placeholder
      const hasHardcodedWorkerUrl = /https:\/\/[a-z0-9-]+\.workers\.dev/i.test(file.content);
      assert.strictEqual(
        hasHardcodedWorkerUrl,
        false,
        `Found hardcoded worker URL in ${file.path}`
      );
    }
  });

  it('should have config.js with placeholder pattern', () => {
    const configPath = path.join(ADMIN_SRC_DIR, 'config.js');
    assert.ok(fs.existsSync(configPath), 'config.js must exist');
    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes('__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__'), 'config.js must contain placeholder');
  });

  it('should have all expected module files', () => {
    const expectedModules = [
      'api-client.js', 'auth.js', 'dashboard.js', 'posts.js',
      'editor.js', 'media.js', 'menus.js', 'publishing.js',
      'audit.js', 'settings.js', 'ui.js'
    ];
    const modulesDir = path.join(ADMIN_SRC_DIR, 'modules');
    for (const mod of expectedModules) {
      assert.ok(
        fs.existsSync(path.join(modulesDir, mod)),
        `Missing module: ${mod}`
      );
    }
  });
});
