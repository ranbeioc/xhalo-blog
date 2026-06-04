function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

function scaffoldPayload() {
  return {
    repo: 'xhalo-blog',
    stage: '2.5',
    mode: 'scaffold',
    static_site: 'Cloudflare Pages',
    worker_entry: 'workers/api/src/index.js',
    queue_binding: 'TASK_QUEUE',
    queue_name: 'xhalo-blog-tasks',
    expected_paths: ['/api/health', '/api/scaffold', '/api/posts', '/api/tasks/example'],
    notes: [
      'Posts and site configuration stay Git-backed.',
      'Dynamic write flows should open pull requests rather than write to main directly.',
      'This API surface is placeholder-only and not a production admin implementation.'
    ]
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'xhalo-blog-api', stage: '2.5', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
      return json(scaffoldPayload());
    }

    if (url.pathname === '/api/posts') {
      return json({
        items: [],
        source_of_truth: 'git',
        note: 'D1 posts_index integration pending.'
      });
    }

    if (url.pathname === '/api/tasks/example' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return json({ error: 'TASK_QUEUE is not bound' }, { status: 500 });
      await env.TASK_QUEUE.send({
        type: 'example',
        stage: '2.5',
        created_at: new Date().toISOString()
      });
      return json({ queued: true, task_type: 'example', queue_binding: 'TASK_QUEUE' });
    }

    return json({ error: 'Not found' }, { status: 404 });
  }
};
