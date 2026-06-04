import { createJsonResponse, getScaffoldMetadata, nowIso } from '../../../packages/core/src/index.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return createJsonResponse({ ok: true, service: 'xhalo-blog-api', stage: '2.5', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
      return createJsonResponse(getScaffoldMetadata());
    }

    if (url.pathname === '/api/posts') {
      return createJsonResponse({
        items: [],
        source_of_truth: 'git',
        note: 'D1 posts_index integration pending.'
      });
    }

    if (url.pathname === '/api/tasks/example' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });
      await env.TASK_QUEUE.send({
        type: 'example',
        stage: '2.5',
        created_at: nowIso()
      });
      return createJsonResponse({ queued: true, task_type: 'example', queue_binding: 'TASK_QUEUE' });
    }

    return createJsonResponse({ error: 'Not found' }, { status: 404 });
  }
};
