import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.resolve('docs');
const ADMIN_SRC_DIR = path.resolve('apps/admin/src');

describe('Admin Test Deployment checks', () => {
  it('/admin route references exist in deployment documentation', () => {
    const runbook = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-staging-preview-runbook.md'), 'utf8');
    const boundary = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-deployment-boundary.md'), 'utf8');
    
    assert.ok(runbook.includes('/admin'), 'Runbook must document the /admin path');
    assert.ok(boundary.includes('/admin'), 'Boundary must document the /admin path');
  });

  it('no documentation requires a separate xhalo-blog-admin Cloudflare Pages project', () => {
    const boundary = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-deployment-boundary.md'), 'utf8');
    assert.ok(boundary.includes('No separate Cloudflare Pages project is required'), 'Boundary doc must state no separate project is required');
  });

  it('admin config has default base API URL settings', () => {
    const config = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'config.js'), 'utf8');
    assert.ok(config.includes('__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__'), 'config.js must contain the replacement placeholder');
  });
});
