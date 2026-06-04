function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'xhalo-blog-api' });
    }

    if (url.pathname === '/api/posts') {
      return json({ items: [], note: 'D1 posts_index integration pending.' });
    }

    if (url.pathname === '/api/tasks/example' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return json({ error: 'TASK_QUEUE is not bound' }, { status: 500 });
      await env.TASK_QUEUE.send({ type: 'example', created_at: new Date().toISOString() });
      return json({ queued: true });
    }

    return json({ error: 'Not found' }, { status: 404 });
  }
};
