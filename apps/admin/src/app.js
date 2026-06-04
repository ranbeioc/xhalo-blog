const fallbackScaffold = {
  repo: 'xhalo-blog',
  stage: '2.5',
  mode: 'scaffold',
  static_site: 'Cloudflare Pages',
  queue_name: 'xhalo-blog-tasks',
  expected_paths: ['/api/health', '/api/scaffold', '/api/posts', '/api/tasks/example']
};

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderScaffold(data) {
  setText('[data-field="repo"]', data.repo || fallbackScaffold.repo);
  setText('[data-field="stage"]', data.stage || fallbackScaffold.stage);
  setText('[data-field="mode"]', data.mode || fallbackScaffold.mode);
  setText('[data-field="static-site"]', data.static_site || fallbackScaffold.static_site);
  setText('[data-field="queue-name"]', data.queue_name || fallbackScaffold.queue_name);

  const list = document.querySelector('[data-field="expected-paths"]');
  if (list) {
    list.innerHTML = '';
    const paths = Array.isArray(data.expected_paths) ? data.expected_paths : fallbackScaffold.expected_paths;
    for (const path of paths) {
      const item = document.createElement('li');
      item.innerHTML = `<code>${path}</code>`;
      list.appendChild(item);
    }
  }
}

function renderHealth(ok, note) {
  const badge = document.querySelector('[data-field="health-status"]');
  if (!badge) return;
  badge.textContent = note;
  badge.dataset.state = ok ? 'ok' : 'warning';
}

async function loadScaffoldData() {
  renderScaffold(fallbackScaffold);
  renderHealth(false, 'API not checked');

  if (window.location.protocol === 'file:') {
    renderHealth(false, 'Static-only preview');
    return;
  }

  try {
    const [healthResponse, scaffoldResponse] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/scaffold')
    ]);

    if (healthResponse.ok) {
      const health = await healthResponse.json();
      renderHealth(Boolean(health.ok), health.ok ? 'API reachable' : 'API returned non-ok payload');
    } else {
      renderHealth(false, `Health check failed (${healthResponse.status})`);
    }

    if (scaffoldResponse.ok) {
      const scaffold = await scaffoldResponse.json();
      renderScaffold(scaffold);
    }
  } catch {
    renderHealth(false, 'Static-only preview');
  }
}

loadScaffoldData();
