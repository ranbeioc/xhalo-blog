import {
  buildDraftTaskPrototype,
  buildGitHubWritePlan,
  buildPublishNotificationPreview,
  buildPublishNotificationTaskPrototype,
  buildPullRequestPreview,
  buildQueueTaskEnvelope,
  buildR2UploadPreview,
  buildR2UploadTaskPrototype,
  defaultDraftTemplate,
  defaultPublishNotificationTemplate,
  defaultR2UploadTemplate,
  createFallbackPosts,
  createFallbackTasks,
  createJsonResponse,
  getScaffoldMetadata,
  nowIso
} from '../../../packages/core/src/index.js';

async function selectRows(env, sql) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const result = await env.DB.prepare(sql).all();
  return Array.isArray(result?.results) ? result.results : [];
}

async function insertTaskRecord(env, task) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return createJsonResponse({ ok: true, service: 'xhalo-blog-api', stage: '3-prototype', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
      return createJsonResponse(getScaffoldMetadata());
    }

    if (url.pathname === '/api/posts') {
      const items = await selectRows(
        env,
        'SELECT id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url FROM posts_index ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 10'
      );

      return createJsonResponse({
        items: items ?? createFallbackPosts(),
        backend: items ? 'd1' : 'fallback',
        source_of_truth: 'git',
        note: items ? 'Read-only posts_index prototype.' : 'D1 posts_index integration pending; showing fallback examples.'
      });
    }

    if (url.pathname === '/api/tasks') {
      const items = await selectRows(
        env,
        'SELECT id, type, status, payload, error, created_at, updated_at FROM tasks ORDER BY updated_at DESC LIMIT 10'
      );

      return createJsonResponse({
        items: items ?? createFallbackTasks(),
        backend: items ? 'd1' : 'fallback',
        note: items ? 'Read-only tasks prototype.' : 'D1 task status integration pending; showing fallback examples.'
      });
    }

    if (url.pathname === '/api/drafts/template') {
      return createJsonResponse({
        template: defaultDraftTemplate,
        note: 'Stage 3 draft metadata prototype. No real GitHub write happens here.'
      });
    }

    if (url.pathname === '/api/drafts/preview' && request.method === 'POST') {
      const input = await request.json();
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

    if (url.pathname === '/api/drafts/tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const input = await request.json();
      const prototype = buildDraftTaskPrototype(input, {
        repoOwner: env.GITHUB_OWNER || 'example',
        repoName: env.GITHUB_REPO || 'xhalo-blog',
        baseBranch: env.GITHUB_BRANCH || 'main',
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run draft task queued. No GitHub branch or PR has been created.'
      });
    }

    if (url.pathname === '/api/drafts/github-plan' && request.method === 'POST') {
      const input = await request.json();
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

    if (url.pathname === '/api/assets/r2-template') {
      return createJsonResponse({
        template: defaultR2UploadTemplate,
        note: 'Stage 3 R2 upload prototype. No real signed upload or bucket write happens here.'
      });
    }

    if (url.pathname === '/api/assets/r2-preview' && request.method === 'POST') {
      const input = await request.json();
      const preview = buildR2UploadPreview(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 R2 upload preview only. No object has been written.'
      });
    }

    if (url.pathname === '/api/assets/r2-tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const input = await request.json();
      const prototype = buildR2UploadTaskPrototype(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl,
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run R2 upload task queued. No object has been written.'
      });
    }

    if (url.pathname === '/api/publish/notifications/template') {
      return createJsonResponse({
        template: defaultPublishNotificationTemplate,
        note: 'Stage 3 publish notification prototype. No real downstream notification is sent here.'
      });
    }

    if (url.pathname === '/api/publish/notifications/preview' && request.method === 'POST') {
      const input = await request.json();
      const preview = buildPublishNotificationPreview(input, {
        queueBinding: 'TASK_QUEUE'
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 publish notification preview only. No downstream notification has been sent.'
      });
    }

    if (url.pathname === '/api/publish/notifications/tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const input = await request.json();
      const prototype = buildPublishNotificationTaskPrototype(input, {
        queueBinding: 'TASK_QUEUE',
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run publish notification task queued. No downstream notification has been sent.'
      });
    }

    if (url.pathname === '/api/tasks/example' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const queuedTask = buildQueueTaskEnvelope({
        type: 'example',
        stage: '3-prototype',
        created_at: nowIso(),
        idempotency_key: crypto.randomUUID()
      });

      const taskRecord = {
        id: queuedTask.idempotency_key || crypto.randomUUID(),
        type: queuedTask.type,
        status: 'queued',
        payload: queuedTask,
        created_at: queuedTask.created_at,
        updated_at: queuedTask.created_at
      };

      await env.TASK_QUEUE.send(queuedTask);
      const persisted = await insertTaskRecord(env, taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: taskRecord.id,
        task_type: taskRecord.type,
        queue_binding: 'TASK_QUEUE'
      });
    }

    return createJsonResponse({ error: 'Not found' }, { status: 404 });
  }
};
