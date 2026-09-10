/**
 * Core package entry point and barrel export.
 * Submodules:
 * - scaffold.js: Scaffold config, readiness snapshot (testDirectPublishEnabled, testDirectTargetRepo, testDirectTargetBranch, testDirectTargetSafe)
 * - drafts.js: Draft models, normalization, frontmatter, and GitHub write planning
 * - r2-assets.js: R2 asset uploads, moderation, and notification templates
 * - diff.js: Unified diff generator and YAML/markdown document parsing
 */
export * from './scaffold.js';
export * from './drafts.js';
export * from './r2-assets.js';
export * from './diff.js';
export * from './github-publishing.js';
export * from './auth-github-oauth.js';
export * from './media-assets.js';
export * from './site-menu.js';

import { nowIso } from './diff.js';

export function buildQueueTaskEnvelope(body = {}) {
  return {
    type: body.type || 'unknown',
    stage: body.stage || '3-prototype',
    created_at: body.created_at || nowIso(),
    idempotency_key: body.idempotency_key || '',
    payload: body
  };
}

export function createFallbackPosts() {
  return [
    {
      id: 'post-demo-1',
      slug: 'hello-xhalo-blog',
      title: 'Hello xhalo-blog',
      path: 'source/_posts/hello-xhalo-blog.md',
      status: 'preview-ready',
      updated_at: nowIso(),
      github_branch: 'draft/hello-xhalo-blog',
      github_pr_url: 'https://github.com/ranbeioc/xhalo-blog/pull/42'
    },
    {
      id: 'post-demo-2',
      slug: 'next-theme-baseline',
      title: 'NexT Theme Baseline',
      path: 'examples/next-theme-blog/source/_posts/hello-xhalo-blog.md',
      status: 'example',
      updated_at: nowIso(),
      github_branch: null,
      github_pr_url: null
    }
  ];
}

export function createFallbackTasks() {
  return [
    {
      id: 'task-demo-1',
      type: 'build_status_poll',
      status: 'pending',
      payload: '{"reconciliation":{"summary":{"outcome":"polling","provider":"cloudflare-pages"}}}',
      updated_at: nowIso()
    },
    {
      id: 'task-demo-2',
      type: 'preview_deployment_webhook',
      status: 'completed',
      payload: '{"reconciliation":{"summary":{"outcome":"preview-ready","previewUrl":"https://preview.example.com/hello-xhalo-blog/","postSlug":"hello-xhalo-blog"}}}',
      updated_at: nowIso()
    }
  ];
}
