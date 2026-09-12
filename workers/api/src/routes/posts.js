import {
  createJsonResponse,
  createFallbackPosts,
  defaultDraftTemplate,
  firstTestArticleTemplate,
  nowIso,
  getGitHubRepository,
  hasGitHubAppConfig,
  createDraftFileCommit,
  createDirectMainCommit,
  createDirectMainUpsertCommit,
  createDirectMainUpdateCommit,
  getPostFileFromMain,
  listPostFilesFromMain,
  generateUnifiedDiff,
  buildDraftMarkdownDocument,
  buildPullRequestPreview,
  buildDraftTaskPrototype,
  buildGitHubWritePlan,
  buildDraftPublishTaskPrototype,
  validateDraftInput,
  validateDraftPath,
  validateDraftSlug,
  verifySessionCookie
} from '../../../../packages/core/src/index.js';
import {
  extractRequestMeta,
  insertAuditLog,
  logWarn
} from '../lib/logger.js';
import { buildHexoPostUrl } from '../lib/deploy-hooks.js';
import {
  upsertPostIndexRecord,
  summarizePostRecord
} from '../lib/models.js';
import { guardTestDirectPublish, triggerDeployAfterCommit, enqueueTask } from '../lib/routes-shared.js';

function validatePublishInput(input) {
  return validateDraftInput(input);
}

export async function handlePostRoutes(request, env, url, method, requestStart, context) {
  const { isTestDirectPublishEnabled, isForbiddenProductionContentTarget, isLiveWritesEnabled, rejectLiveWriteDisabled, readJsonBody } = context;

  if (url.pathname === '/api/posts') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    const requestedLimit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 20, 100));
    const requestedPage = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const offset = (requestedPage - 1) * requestedLimit;
    try {
      const gitItems = await listPostFilesFromMain(env, { branch: getGitHubRepository(env).baseBranch, limit: 500 });
      if (gitItems.length > 0) {
        const pagedItems = gitItems.slice(offset, offset + requestedLimit);
        return createJsonResponse({
          items: pagedItems.map(summarizePostRecord),
          backend: 'github',
          source_of_truth: 'git',
          count: pagedItems.length,
          page: requestedPage,
          pageSize: requestedLimit,
          total: gitItems.length,
          totalPages: Math.max(1, Math.ceil(gitItems.length / requestedLimit)),
          note: 'GitHub source/_posts listing from the configured test repository.'
        });
      }
    } catch (err) {
      logWarn('posts_git_listing_failed', { error: err.message, status: err.status || null });
    }

    let items = null;
    if (env.DB && typeof env.DB.prepare === 'function') {
      try {
        const result = await env.DB.prepare(
          'SELECT id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, preview_url, content FROM posts_index ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ? OFFSET ?'
        ).bind(requestedLimit, offset).all();
        items = result.results || null;
      } catch { items = null; }
    }

    const d1Items = Array.isArray(items) && items.length > 0 ? items : null;
    const fallbackItems = createFallbackPosts();
    return createJsonResponse({
      items: d1Items ? d1Items.map(summarizePostRecord) : fallbackItems.slice(offset, offset + requestedLimit).map(summarizePostRecord),
      backend: d1Items ? 'd1' : 'fallback',
      source_of_truth: 'git',
      page: requestedPage,
      pageSize: requestedLimit,
      total: d1Items ? null : fallbackItems.length,
      totalPages: d1Items ? null : Math.max(1, Math.ceil(fallbackItems.length / requestedLimit)),
      note: d1Items ? 'Read-only posts_index prototype.' : 'GitHub listing and D1 posts_index unavailable; showing fallback examples.'
    });
  }

  if (url.pathname === '/api/posts/source' && method === 'GET') {
    const slug = url.searchParams.get('slug');
    const slugErrors = validateDraftSlug(slug);
    if (slugErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
    }

    try {
      const targetPath = url.searchParams.get('targetPath') || undefined;
      const postData = await getPostFileFromMain(env, { slug, filePath: targetPath });
      const repository = getGitHubRepository(env);
      return createJsonResponse({
        ok: true,
        slug: postData.slug,
        targetRepo: `${repository.owner}/${repository.repo}`,
        targetBranch: repository.baseBranch,
        targetPath: postData.filePath,
        sha: postData.sha,
        frontmatter: postData.frontmatter,
        body: postData.body,
        raw: postData.raw
      });
    } catch (err) {
      if (err.status === 404) {
        return createJsonResponse({
          error: 'Target post not found.',
          code: 'TARGET_NOT_FOUND'
        }, { status: 404 });
      }
      if (err.status === 400 && err.code === 'OWNER_DIRECT_MAIN_REQUIRED') {
        return createJsonResponse({
          error: err.message,
          code: err.code
        }, { status: 400 });
      }
      return createJsonResponse({
        error: `Failed to fetch file from GitHub: ${err.message}`,
        code: 'GITHUB_FETCH_FAILED'
      }, { status: 500 });
    }
  }

  if (url.pathname === '/api/drafts/direct-update-preview' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }

    const slugErrors = validateDraftSlug(input.slug);
    if (slugErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
    }

    const pathErrors = validateDraftPath(input);
    if (pathErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
    }

    if (!input.body || String(input.body).trim().length === 0) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
    }

    if (Array.isArray(input)) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
    }

    try {
      const postData = await getPostFileFromMain(env, { slug: input.slug, filePath: input.targetPath || input.filePath });
      const updatedMarkdown = buildDraftMarkdownDocument(input);
      const diff = generateUnifiedDiff(postData.raw, updatedMarkdown, `${input.slug}.md`);

      const previewHtml = updatedMarkdown.split('\n\n').map(p => {
        let text = p.trim();
        if (!text) return '';
        if (text.startsWith('#')) {
          const level = text.match(/^#+/)[0].length;
          const cleanText = text.replace(/^#+\s*/, '');
          return `<h${level}>${cleanText}</h${level}>`;
        }
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        return `<p>${text}</p>`;
      }).filter(Boolean).join('\n');

      return createJsonResponse({
        ok: true,
        mode: 'owner_direct_update_preview',
        targetPath: postData.filePath,
        baseSha: postData.sha,
        diffSummary: {
          addedLines: diff.addedLines,
          removedLines: diff.removedLines,
          frontmatterChanged: diff.frontmatterChanged,
          bodyChanged: diff.bodyChanged
        },
        diffText: diff.diffText,
        previewHtml
      });
    } catch (err) {
      if (err.status === 404) {
        return createJsonResponse({
          error: 'Target post not found.',
          code: 'TARGET_NOT_FOUND'
        }, { status: 404 });
      }
      return createJsonResponse({
        error: `Failed to fetch file from GitHub: ${err.message}`,
        code: 'GITHUB_FETCH_FAILED'
      }, { status: 500 });
    }
  }

  if (url.pathname === '/api/drafts/direct-update' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }

    const publishMode = env.PUBLISH_MODE || 'pr_only';
    const ownerDirectPublishEnabled = String(env.OWNER_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';
    const ownerDirectUpdateEnabled = String(env.OWNER_DIRECT_UPDATE_ENABLED || '').toLowerCase() === 'true';

    if (publishMode !== 'owner_direct' || !ownerDirectPublishEnabled || !ownerDirectUpdateEnabled) {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 403,
        duration_ms: Date.now() - requestStart,
        error: 'Owner direct update is disabled.',
        detail: { code: 'OWNER_DIRECT_UPDATE_DISABLED' }
      });
      return createJsonResponse({
        error: 'Owner direct update is disabled.',
        code: 'OWNER_DIRECT_UPDATE_DISABLED'
      }, { status: 403 });
    }

    const expectedPhrase = env.OWNER_DIRECT_UPDATE_CONFIRMATION_PHRASE || 'DIRECT UPDATE EXISTING POST';
    if (!input.confirmationPhrase || input.confirmationPhrase !== expectedPhrase) {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Invalid confirmation phrase.',
        detail: { code: 'INVALID_CONFIRMATION' }
      });
      return createJsonResponse({
        error: 'Invalid confirmation phrase.',
        code: 'INVALID_CONFIRMATION'
      }, { status: 400 });
    }

    if (!input.baseSha) {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Missing required field: baseSha',
        detail: { code: 'MISSING_BASE_SHA' }
      });
      return createJsonResponse({
        error: 'Missing required field: baseSha',
        code: 'MISSING_BASE_SHA'
      }, { status: 400 });
    }

    const slugErrors = validateDraftSlug(input.slug);
    if (slugErrors.length > 0) {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Validation failed.',
        detail: { code: 'VALIDATION_FAILED', errors: slugErrors }
      });
      return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
    }

    const pathErrors = validateDraftPath(input);
    if (pathErrors.length > 0) {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Validation failed.',
        detail: { code: 'PATH_VALIDATION_FAILED', errors: pathErrors }
      });
      return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
    }

    if (!input.body || String(input.body).trim().length === 0) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
    }

    if (Array.isArray(input)) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
    }

    const repository = getGitHubRepository(env);
    if (repository.baseBranch !== 'main') {
      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Owner direct publish requires GITHUB_BRANCH=main.',
        detail: { code: 'OWNER_DIRECT_MAIN_REQUIRED' }
      });
      return createJsonResponse({
        error: 'Owner direct publish requires GITHUB_BRANCH=main.',
        code: 'OWNER_DIRECT_MAIN_REQUIRED'
      }, { status: 400 });
    }

    const filePath = `source/_posts/${input.slug}.md`;
    const auditId = crypto.randomUUID();
    const updatedMarkdown = buildDraftMarkdownDocument(input);
    const commitMessage = `[owner-direct-update] update post: ${input.title}`;

    try {
      let oldRaw = '';
      try {
        const existingPost = await getPostFileFromMain(env, { slug: input.slug, filePath: input.targetPath || input.filePath });
        oldRaw = existingPost.raw;
      } catch (existingErr) {
        // ignore
      }

      const diff = generateUnifiedDiff(oldRaw, updatedMarkdown, `${input.slug}.md`);

      const commitResult = await createDirectMainUpdateCommit(env, {
        branch: repository.baseBranch,
        filePath,
        content: updatedMarkdown,
        baseSha: input.baseSha,
        commitMessage
      });

      const persisted = await upsertPostIndexRecord(env, {
        id: input.slug,
        slug: input.slug,
        title: input.title,
        path: filePath,
        status: 'published',
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: nowIso(),
        github_branch: repository.baseBranch,
        github_pr_url: null,
        preview_url: null,
        content: updatedMarkdown
      });

      await insertAuditLog(env, {
        action: 'owner_direct_update',
        ...extractRequestMeta(request),
        resource: 'post',
        resource_id: input.slug,
        status_code: 200,
        duration_ms: Date.now() - requestStart,
        detail: {
          mode: 'owner_direct_update',
          target_repo: `${repository.owner}/${repository.repo}`,
          target_branch: repository.baseBranch,
          target_path: filePath,
          old_sha: input.baseSha,
          new_commit_sha: commitResult.commitSha,
          audit_id: auditId,
          diffSummary: {
            addedLines: diff.addedLines,
            removedLines: diff.removedLines,
            frontmatterChanged: diff.frontmatterChanged,
            bodyChanged: diff.bodyChanged
          }
        }
      });

      return createJsonResponse({
        ok: true,
        mode: 'owner_direct_update',
        targetRepo: `${repository.owner}/${repository.repo}`,
        targetBranch: repository.baseBranch,
        targetPath: filePath,
        oldSha: input.baseSha,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        auditId,
        message: 'Existing post updated on main. Cloudflare Pages build may start automatically.'
      });
    } catch (err) {
      const isStale = err.code === 'STALE_BASE_SHA' || err.status === 409;
      const isNotFound = err.code === 'TARGET_NOT_FOUND' || err.status === 404;
      const statusCode = isStale ? 409 : isNotFound ? 404 : 500;
      const errCode = isStale ? 'STALE_BASE_SHA' : isNotFound ? 'TARGET_NOT_FOUND' : 'COMMIT_FAILED';

      await insertAuditLog(env, {
        action: 'owner_direct_update_failed',
        ...extractRequestMeta(request),
        status_code: statusCode,
        duration_ms: Date.now() - requestStart,
        error: err.message,
        detail: { code: errCode }
      });

      return createJsonResponse({
        error: err.message,
        code: errCode
      }, { status: statusCode });
    }
  }

  if (url.pathname === '/api/drafts/template') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    return createJsonResponse({
      template: defaultDraftTemplate,
      note: 'Stage 3 draft metadata prototype. No real GitHub write happens here.'
    });
  }

  if (url.pathname === '/api/drafts/preview' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }
    const validationErrors = validatePublishInput(input);
    if (validationErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }
    const preview = buildPullRequestPreview(input, {
      repoOwner: env.GITHUB_OWNER || 'example',
      repoName: env.GITHUB_REPO || 'xhalo-blog',
      baseBranch: env.GITHUB_BRANCH || 'main'
    });

    return createJsonResponse({
      preview,
      note: 'Stage 3 draft and PR preview only. No branch or PR has been created.'
    });
  }

  if (url.pathname === '/api/drafts/tasks' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }
    const validationErrors = validatePublishInput(input);
    if (validationErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }
    const prototype = buildDraftTaskPrototype(input, {
      repoOwner: env.GITHUB_OWNER || 'example',
      repoName: env.GITHUB_REPO || 'xhalo-blog',
      baseBranch: env.GITHUB_BRANCH || 'main',
      stage: '3-prototype'
    });

    const { error: queueError, persisted } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    return createJsonResponse({
      queued: true,
      persisted,
      task_id: prototype.taskRecord.id,
      task_type: prototype.taskRecord.type,
      preview: prototype.preview,
      note: 'Dry-run draft task queued. No GitHub branch or PR has been created.'
    });
  }

  if (url.pathname === '/api/drafts/github-plan' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }
    const validationErrors = validatePublishInput(input);
    if (validationErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }
    const plan = buildGitHubWritePlan(input, {
      repoOwner: env.GITHUB_OWNER || 'example',
      repoName: env.GITHUB_REPO || 'xhalo-blog',
      baseBranch: env.GITHUB_BRANCH || 'main'
    });

    return createJsonResponse({
      preview: buildPullRequestPreview(input, {
        repoOwner: env.GITHUB_OWNER || 'example',
        repoName: env.GITHUB_REPO || 'xhalo-blog',
        baseBranch: env.GITHUB_BRANCH || 'main'
      }),
      plan,
      note: 'Dry-run GitHub operation plan only. No branch, commit, or PR has been created.'
    });
  }

  if (url.pathname === '/api/drafts/publish' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }
    const validationErrors = validatePublishInput(input);
    if (validationErrors.length > 0) {
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }
    const mode = input.mode === 'live' ? 'live' : 'dry-run';
    const repository = getGitHubRepository(env);
    const preview = buildPullRequestPreview(input, {
      repoOwner: repository.owner,
      repoName: repository.repo,
      baseBranch: repository.baseBranch
    });
    const plan = buildGitHubWritePlan(input, {
      repoOwner: repository.owner,
      repoName: repository.repo,
      baseBranch: repository.baseBranch
    });

    if (mode !== 'live') {
      return createJsonResponse({
        mode,
        auth_mode: hasGitHubAppConfig(env) ? 'app' : env.GITHUB_TOKEN ? 'token' : 'none',
        preview,
        plan,
        note: 'Dry-run draft publish only. No branch, commit, or PR has been created.'
      });
    }

    if (!isLiveWritesEnabled(env)) {
      return rejectLiveWriteDisabled();
    }

    const prototype = buildDraftPublishTaskPrototype(input, {
      repoOwner: repository.owner,
      repoName: repository.repo,
      baseBranch: repository.baseBranch,
      stage: '4-release-candidate'
    });

    const markdown = buildDraftMarkdownDocument(input);

    const persisted = await upsertPostIndexRecord(env, {
      id: preview.draft.slug,
      slug: preview.draft.slug,
      title: preview.draft.title || preview.draft.slug,
      path: preview.filePath,
      status: 'queued',
      created_at: nowIso(),
      updated_at: nowIso(),
      github_branch: preview.branchName,
      github_pr_url: null,
      content: markdown
    });

    const { error: queueError, persisted: persistedTask } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    const authMode = hasGitHubAppConfig(env) ? 'app' : env.GITHUB_TOKEN ? 'token' : 'none';

    await insertAuditLog(env, {
      action: 'draft_publish_queued',
      ...extractRequestMeta(request),
      resource: 'post',
      resource_id: preview.draft.slug,
      status_code: 202,
      duration_ms: Date.now() - requestStart,
      detail: { mode, auth_mode: authMode, task_id: prototype.taskRecord.id }
    });

    return createJsonResponse({
      mode,
      status: 'queued',
      task_id: prototype.taskRecord.id,
      preview,
      plan,
      persisted,
      persisted_task: persistedTask
    }, { status: 202 });
  }

  if (url.pathname === '/api/drafts/test-direct-publish' && method === 'POST') {
    const session = await verifySessionCookie(request, env);
    if (!session || !(session.isAdmin === true || session.role === 'admin')) {
      await insertAuditLog(env, {
        action: 'test_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 401,
        duration_ms: Date.now() - requestStart,
        error: 'GitHub admin session is required.',
        detail: { code: 'ADMIN_SESSION_REQUIRED' }
      });
      return createJsonResponse({
        error: 'GitHub admin session is required.',
        code: 'ADMIN_SESSION_REQUIRED'
      }, { status: 401 });
    }

    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }

    const guard = await guardTestDirectPublish(env, request, requestStart, 'publish', session?.login || 'legacy-admin-secret', { isTestDirectPublishEnabled, isForbiddenProductionContentTarget, getGitHubRepository });
    if (!guard.allowed) return guard.response;

    const validationInput = {
      ...firstTestArticleTemplate,
      ...(input || {}),
      status: 'published'
    };
    const validationErrors = validatePublishInput(validationInput);
    if (validationErrors.length > 0) {
      await insertAuditLog(env, {
        action: 'test_direct_publish_failed',
        ...extractRequestMeta(request),
        actor: session.login,
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Validation failed.',
        detail: { code: 'VALIDATION_FAILED', errors: validationErrors }
      });
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }

    const repository = guard.repository;

    const filePath = validationInput.targetPath || validationInput.filePath || `source/_posts/${validationInput.slug}.md`;
    if (!/^source\/_posts\/[^/]+\.md$/i.test(filePath)) {
      return createJsonResponse({
        error: 'Post file path must stay under source/_posts and end with .md.',
        code: 'INVALID_POST_FILE_PATH'
      }, { status: 400 });
    }
    const markdown = buildDraftMarkdownDocument(validationInput);
    const commitMessage = `[test-direct] publish first test post: ${validationInput.title}`;

    try {
      const commitResult = await createDirectMainUpsertCommit(env, {
        branch: repository.baseBranch,
        filePath,
        content: markdown,
        commitMessage
      });

      const publishedAt = nowIso();
      const postUrl = buildHexoPostUrl(validationInput.slug, publishedAt);
      const persisted = await upsertPostIndexRecord(env, {
        id: validationInput.slug,
        slug: validationInput.slug,
        title: validationInput.title,
        path: filePath,
        status: 'published',
        created_at: publishedAt,
        updated_at: publishedAt,
        published_at: publishedAt,
        github_branch: repository.baseBranch,
        github_pr_url: null,
        preview_url: postUrl,
        content: markdown
      });

      await insertAuditLog(env, {
        action: 'test_direct_publish',
        ...extractRequestMeta(request),
        actor: session.login,
        resource: 'post',
        resource_id: validationInput.slug,
        status_code: 200,
        duration_ms: Date.now() - requestStart,
        detail: {
          mode: 'test_direct',
          target_repo: `${repository.owner}/${repository.repo}`,
          target_branch: repository.baseBranch,
          target_path: filePath,
          commit_sha: commitResult.commitSha,
          operation: commitResult.operation
        }
      });
      const pagesDeploy = await triggerDeployAfterCommit(env, 'test_direct_publish', commitResult, repository, { targetPath: filePath });

      return createJsonResponse({
        ok: true,
        mode: 'test_direct',
        targetRepo: `${repository.owner}/${repository.repo}`,
        targetBranch: repository.baseBranch,
        targetPath: filePath,
        postUrl,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        operation: commitResult.operation,
        pagesDeploy,
        persisted,
        message: 'Test direct commit created and Pages rebuild hook was triggered when configured.'
      });
    } catch (err) {
      const statusCode = err.status || 500;

      await insertAuditLog(env, {
        action: 'test_direct_publish_failed',
        ...extractRequestMeta(request),
        actor: session.login,
        status_code: statusCode,
        duration_ms: Date.now() - requestStart,
        error: err.message,
        detail: { code: err.code || 'COMMIT_FAILED' }
      });

      return createJsonResponse({
        error: err.message,
        code: err.code || 'COMMIT_FAILED'
      }, { status: statusCode });
    }
  }

  if (url.pathname === '/api/drafts/direct-publish' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) {
      return createJsonResponse({ error: jsonError }, { status: 400 });
    }

    const publishMode = env.PUBLISH_MODE || 'pr_only';
    const ownerDirectPublishEnabled = String(env.OWNER_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';

    if (publishMode !== 'owner_direct' || !ownerDirectPublishEnabled) {
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 403,
        duration_ms: Date.now() - requestStart,
        error: 'Owner direct publish is disabled.',
        detail: { code: 'OWNER_DIRECT_DISABLED' }
      });
      return createJsonResponse({
        error: 'Owner direct publish is disabled.',
        code: 'OWNER_DIRECT_DISABLED'
      }, { status: 403 });
    }

    const expectedPhrase = env.OWNER_DIRECT_CONFIRMATION_PHRASE || 'DIRECT PUBLISH TO MAIN';
    if (!input.confirmationPhrase || input.confirmationPhrase !== expectedPhrase) {
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Invalid confirmation phrase.',
        detail: { code: 'INVALID_CONFIRMATION' }
      });
      return createJsonResponse({
        error: 'Invalid confirmation phrase.',
        code: 'INVALID_CONFIRMATION'
      }, { status: 400 });
    }

    const validationErrors = validatePublishInput(input);
    if (validationErrors.length > 0) {
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Validation failed.',
        detail: { code: 'VALIDATION_FAILED', errors: validationErrors }
      });
      return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
    }

    const pathErrors = validateDraftPath(input);
    if (pathErrors.length > 0) {
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Validation failed.',
        detail: { code: 'PATH_VALIDATION_FAILED', errors: pathErrors }
      });
      return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
    }

    if (!input.body || String(input.body).trim().length === 0) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
    }

    if (Array.isArray(input)) {
      return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
    }

    const repository = getGitHubRepository(env);
    if (repository.baseBranch !== 'main') {
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: 400,
        duration_ms: Date.now() - requestStart,
        error: 'Owner direct publish requires GITHUB_BRANCH=main.',
        detail: { code: 'OWNER_DIRECT_MAIN_REQUIRED' }
      });
      return createJsonResponse({
        error: 'Owner direct publish requires GITHUB_BRANCH=main.',
        code: 'OWNER_DIRECT_MAIN_REQUIRED'
      }, { status: 400 });
    }

    const filePath = `source/_posts/${input.slug}.md`;
    const auditId = crypto.randomUUID();
    const markdown = buildDraftMarkdownDocument(input);
    const commitMessage = `[owner-direct] publish post: ${input.title}`;

    try {
      const commitResult = await createDirectMainCommit(env, {
        branch: repository.baseBranch,
        filePath,
        content: markdown,
        commitMessage
      });

      const persisted = await upsertPostIndexRecord(env, {
        id: input.slug,
        slug: input.slug,
        title: input.title,
        path: filePath,
        status: 'published',
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: nowIso(),
        github_branch: repository.baseBranch,
        github_pr_url: null,
        preview_url: null,
        content: markdown
      });

      await insertAuditLog(env, {
        action: 'owner_direct_publish',
        ...extractRequestMeta(request),
        resource: 'post',
        resource_id: input.slug,
        status_code: 200,
        duration_ms: Date.now() - requestStart,
        detail: {
          mode: 'owner_direct',
          target_repo: `${repository.owner}/${repository.repo}`,
          target_branch: repository.baseBranch,
          target_path: filePath,
          commit_sha: commitResult.commitSha,
          audit_id: auditId
        }
      });

      return createJsonResponse({
        ok: true,
        mode: 'owner_direct',
        targetRepo: `${repository.owner}/${repository.repo}`,
        targetBranch: repository.baseBranch,
        targetPath: filePath,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        auditId,
        message: 'Direct commit created on main. Cloudflare Pages build may start automatically.'
      });
    } catch (err) {
      const isExistsError = err.message.includes('Target post already exists');
      const statusCode = isExistsError ? 409 : 500;
      
      await insertAuditLog(env, {
        action: 'owner_direct_publish_failed',
        ...extractRequestMeta(request),
        status_code: statusCode,
        duration_ms: Date.now() - requestStart,
        error: err.message,
        detail: { code: isExistsError ? 'TARGET_EXISTS' : 'COMMIT_FAILED' }
      });

      return createJsonResponse({
        error: err.message,
        code: isExistsError ? 'TARGET_EXISTS' : 'COMMIT_FAILED'
      }, { status: statusCode });
    }
  }

  return null;
}
