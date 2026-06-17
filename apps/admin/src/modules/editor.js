import { apiFetch } from './api-client.js';
import { escapeHtml, showToast } from './ui.js';

export const FIRST_TEST_ARTICLE_TEMPLATE = {
  title: 'xHalo Blog 测试文章',
  slug: 'xhalo-blog-first-test-post',
  category: 'Test',
  tags: 'xhalo-blog, test, Cloudflare',
  body: [
    '# xHalo Blog 测试文章',
    '',
    '这是一篇用于验证 xhalo-blog-test Cloudflare Pages、GitHub OAuth 管理员登录和 test-only direct publish 流程的文章。',
    '',
    '- Pages 承载博客 HTML、Admin 前端和普通静态资源。',
    '- R2 仅作为媒体和附件资产层，不作为整站托管层。',
    '- 生产写入未被批准。'
  ].join('\n')
};

const EMPTY_POST = {
  title: '',
  slug: '',
  category: '',
  tags: '',
  body: '',
  sha: ''
};

export async function fetchPostSource(slug) {
  const res = await apiFetch(`/api/posts/source?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Source API returned status ${res.status}`);
  return await res.json();
}

export function renderEditor(container, { initialPost, dashboardData }) {
  let post = initialPost || { ...FIRST_TEST_ARTICLE_TEMPLATE, sha: '' };
  let activeTab = 'edit';
  let diffHtml = '';
  let planHtml = '';
  let actionResultHtml = '';
  let loadingState = false;

  const readiness = dashboardData?.readiness || {};
  const isDirectPublishEnabled = dashboardData?.readiness?.ownerDirectPublishEnabled === true;
  const isDirectUpdateEnabled = dashboardData?.readiness?.ownerDirectUpdateEnabled === true;
  const isLiveWritesEnabled = dashboardData?.readiness?.liveWritesEnabled === true;
  void isDirectPublishEnabled;
  void isDirectUpdateEnabled;
  void isLiveWritesEnabled;

  const isTestDirectPublishEnabled = readiness.deploymentEnv === 'test' &&
    readiness.publishMode === 'test_direct' &&
    readiness.testDirectPublishEnabled === true &&
    readiness.testDirectTargetSafe === true;

  const testPublishDisabledReason = readiness.deploymentEnv !== 'test'
    ? 'DEPLOYMENT_ENV must be test'
    : readiness.publishMode !== 'test_direct'
      ? 'PUBLISH_MODE must be test_direct'
      : readiness.testDirectPublishEnabled !== true
        ? 'TEST_DIRECT_PUBLISH_ENABLED must be true'
        : readiness.testDirectTargetSafe !== true
          ? 'Target repository/branch is not test-safe'
          : '';

  function syncFromForm() {
    const getValue = (id) => container.querySelector(id)?.value || '';
    post = {
      ...post,
      title: getValue('#edit-title'),
      slug: getValue('#edit-slug'),
      category: getValue('#edit-category'),
      tags: getValue('#edit-tags'),
      body: getValue('#edit-body')
    };
  }

  async function loadExistingSource() {
    if (!post.slug) return;
    loadingState = true;
    draw();
    try {
      const data = await fetchPostSource(post.slug);
      post = {
        title: data.frontmatter?.title || post.title || '',
        slug: post.slug,
        category: data.frontmatter?.category || '',
        tags: Array.isArray(data.frontmatter?.tags) ? data.frontmatter.tags.join(', ') : '',
        body: data.body || '',
        sha: data.sha || ''
      };
      actionResultHtml = `<div class="alert alert-success">Source loaded successfully (SHA: <code>${escapeHtml(post.sha.substring(0, 7))}</code>)</div>`;
      showToast('Source loaded successfully', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Failed to load source: ${escapeHtml(err.message)}</div>`;
      showToast(`Failed to load source: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchDiffPreview() {
    syncFromForm();
    if (!post.slug) {
      showToast('Please fill out the Slug field before requesting a diff.', 'warning');
      return;
    }
    loadingState = true;
    activeTab = 'diff';
    draw();
    try {
      const res = await apiFetch('/api/drafts/direct-update-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diff failed');
      const diff = data.diff || {};
      diffHtml = `
        <div class="diff-container">
          <p>Comparing local draft changes against main source file <code>${escapeHtml(diff.filePath || '')}</code>.</p>
          <div class="diff-meta">
            <span>Base SHA: <code>${escapeHtml(diff.baseSha ? diff.baseSha.substring(0, 7) : 'None')}</code></span>
            <span>Status: <strong>${escapeHtml(diff.status || 'modified')}</strong></span>
          </div>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No modifications detected.')}</pre>
          </div>
        </div>
      `;
      showToast('Diff generated successfully', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">Failed to generate diff: ${escapeHtml(err.message)}</div>`;
      showToast(`Failed to generate diff: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchPublishPlan() {
    syncFromForm();
    loadingState = true;
    activeTab = 'plan';
    draw();
    try {
      const res = await apiFetch('/api/drafts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), mode: 'dry-run', publish_target: 'github' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Plan failed');
      const actions = data.plan?.actions || data.plan?.ops || [];
      planHtml = `
        <div class="plan-container">
          <p><strong>Dry-run Plan Summary:</strong> No remote changes have been created.</p>
          <div class="plan-actions-list">
            ${actions.map((act, index) => `
              <div class="plan-step">
                <span class="step-num">Step ${index + 1}</span>
                <div class="step-details">
                  <strong>${escapeHtml(act.op || act.action || 'operation')}</strong>
                  <span>${escapeHtml(act.branch || act.path || act.title || '')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      showToast('Publish plan computed', 'success');
    } catch (err) {
      planHtml = `<div class="alert alert-error">Failed to retrieve plan: ${escapeHtml(err.message)}</div>`;
      showToast(`Failed to retrieve plan: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function handleCreatePR() {
    syncFromForm();
    loadingState = true;
    draw();
    try {
      const res = await apiFetch('/api/drafts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), mode: 'live', publish_target: 'github' })
      });
      const data = await res.json();
      if (res.status === 403) {
        actionResultHtml = `<div class="alert alert-warning"><strong>Action Blocked:</strong> <code>${escapeHtml(data.error || 'Live writes are disabled')}</code></div>`;
        showToast('Action blocked by write gate', 'warning');
      } else if (res.ok) {
        actionResultHtml = `<div class="alert alert-success"><strong>Task Dispatched:</strong> Task ID: <code>${escapeHtml(data.task_id || '')}</code></div>`;
        showToast('PR creation task dispatched', 'success');
      } else {
        throw new Error(data.error || 'Unexpected error');
      }
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Operation failed: ${escapeHtml(err.message)}</div>`;
      showToast(`Operation failed: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function handlePublishToTest() {
    syncFromForm();
    loadingState = true;
    draw();
    try {
      const res = await apiFetch('/api/drafts/test-direct-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.code || 'Test publish failed');
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>Published to test target:</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          Path: <code>${escapeHtml(data.targetPath || '')}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          ${data.postUrl ? `<br/>Post URL: <a href="${escapeHtml(data.postUrl)}" target="_blank" rel="noreferrer">${escapeHtml(data.postUrl)}</a>` : ''}
        </div>
      `;
      showToast('Test publish request completed', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Test publish failed: ${escapeHtml(err.message)}</div>`;
      showToast(`Test publish failed: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function buildPayload() {
    return {
      title: post.title,
      slug: post.slug,
      category: post.category,
      tags: post.tags ? post.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      body: post.body
    };
  }

  function useTemplate(templateName) {
    post = templateName === 'first-test'
      ? { ...FIRST_TEST_ARTICLE_TEMPLATE, sha: '' }
      : { ...EMPTY_POST };
    activeTab = 'edit';
    actionResultHtml = '';
    draw();
  }

  function draw() {
    const tabContent = renderTabContent();
    container.innerHTML = `
      <div class="editor-workspace">
        <div class="editor-top-actions">
          <h2>Article Editor</h2>
          <div class="source-loader-block">
            <button class="button-small button-secondary" id="btn-template-first">Use Test Template</button>
            <button class="button-small button-secondary" id="btn-template-empty">Blank Draft</button>
            <button class="button-small button-secondary" id="btn-load-source" ${post.slug ? '' : 'disabled'}>Load Main Source</button>
          </div>
        </div>

        <div class="alert alert-info">
          <strong>Test publishing:</strong> Publish to Test is available only when DEPLOYMENT_ENV is test, PUBLISH_MODE is test_direct, TEST_DIRECT_PUBLISH_ENABLED is true, and the target is safe.
        </div>

        <div class="editor-tabs">
          <button class="tab-btn ${activeTab === 'edit' ? 'active' : ''}" data-tab="edit">Edit</button>
          <button class="tab-btn ${activeTab === 'preview' ? 'active' : ''}" data-tab="preview">Markdown Preview</button>
          <button class="tab-btn ${activeTab === 'diff' ? 'active' : ''}" data-tab="diff">Diff</button>
          <button class="tab-btn ${activeTab === 'plan' ? 'active' : ''}" data-tab="plan">PR Plan</button>
        </div>

        <div class="editor-tab-content card">${tabContent}</div>

        <div class="editor-actions">
          <button class="button-secondary" id="btn-diff">Preview Diff</button>
          <button class="button-secondary" id="btn-plan">Dry-run PR Plan</button>
          <button class="button-secondary" id="btn-create-pr" ${readiness.liveWritesEnabled === true ? '' : 'disabled'} title="${readiness.liveWritesEnabled === true ? 'Ready' : 'Create Review PR unavailable: LIVE_WRITES_ENABLED=false'}">Create Review PR</button>
          <button class="button-primary" id="btn-publish-test" ${isTestDirectPublishEnabled ? '' : 'disabled'} title="${escapeHtml(testPublishDisabledReason || 'Ready')}">Publish to Test</button>
        </div>

        ${readiness.liveWritesEnabled === true ? '' : '<p class="help-text">Create Review PR unavailable: LIVE_WRITES_ENABLED=false</p>'}
        ${!isTestDirectPublishEnabled ? `<p class="help-text">Publish to Test unavailable: ${escapeHtml(testPublishDisabledReason)}</p>` : ''}
        ${loadingState ? '<div class="info-text">Working...</div>' : ''}
        ${actionResultHtml}
      </div>
    `;

    bindEvents();
  }

  function renderTabContent() {
    if (activeTab === 'preview') {
      return `
        <div class="markdown-preview-container">
          <h2>${escapeHtml(post.title || 'Untitled Post')}</h2>
          <div class="post-meta">
            ${post.category ? `<span>Category: <strong>${escapeHtml(post.category)}</strong></span>` : ''}
            ${post.tags ? `<span>Tags: <strong>${escapeHtml(post.tags)}</strong></span>` : ''}
          </div>
          <hr/>
          <div class="markdown-rendered-body">
            ${post.body ? renderSimpleMarkdown(post.body) : '<p class="info-text">No content in post body.</p>'}
          </div>
        </div>
      `;
    }
    if (activeTab === 'diff') return diffHtml || '<p class="info-text">Load diff status to inspect change details.</p>';
    if (activeTab === 'plan') return planHtml || '<p class="info-text">Generate a publish plan to preview operations.</p>';

    return `
      <div class="editor-fields-grid">
        <label><span>Article Title</span><input type="text" id="edit-title" value="${escapeHtml(post.title)}" placeholder="e.g. Hello World" /></label>
        <label><span>Article Slug</span><input type="text" id="edit-slug" value="${escapeHtml(post.slug)}" placeholder="e.g. hello-world" /></label>
        <label><span>Category</span><input type="text" id="edit-category" value="${escapeHtml(post.category)}" placeholder="e.g. Life" /></label>
        <label><span>Tags (comma separated)</span><input type="text" id="edit-tags" value="${escapeHtml(post.tags)}" placeholder="e.g. personal, welcome" /></label>
        <label class="field-span-2"><span>Body Content (Markdown)</span><textarea id="edit-body" rows="15" placeholder="Write markdown content here...">${escapeHtml(post.body)}</textarea></label>
      </div>
    `;
  }

  function bindEvents() {
    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncFromForm();
        activeTab = btn.getAttribute('data-tab') || 'edit';
        draw();
      });
    });
    container.querySelector('#btn-template-first')?.addEventListener('click', () => useTemplate('first-test'));
    container.querySelector('#btn-template-empty')?.addEventListener('click', () => useTemplate('empty'));
    container.querySelector('#btn-load-source')?.addEventListener('click', () => {
      syncFromForm();
      loadExistingSource();
    });
    container.querySelector('#btn-diff')?.addEventListener('click', fetchDiffPreview);
    container.querySelector('#btn-plan')?.addEventListener('click', fetchPublishPlan);
    container.querySelector('#btn-create-pr')?.addEventListener('click', handleCreatePR);
    container.querySelector('#btn-publish-test')?.addEventListener('click', handlePublishToTest);
  }

  draw();
}

function renderSimpleMarkdown(markdown) {
  const htmlBlocks = [];
  let listType = null;

  function closeList() {
    if (listType) {
      htmlBlocks.push(`</${listType}>`);
      listType = null;
    }
  }

  const lines = String(markdown || '').split(/\r?\n/);
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      htmlBlocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      closeList();
      htmlBlocks.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.*)$/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        htmlBlocks.push('<ul>');
      }
      htmlBlocks.push(`<li>${renderInlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        htmlBlocks.push('<ol>');
      }
      htmlBlocks.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    if (line.trim()) {
      htmlBlocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  return htmlBlocks.join('');
}

function renderInlineMarkdown(input) {
  return escapeHtml(input)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}
