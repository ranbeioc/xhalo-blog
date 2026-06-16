import { apiFetch } from './api-client.js';
import { showToast } from './ui.js';

export async function fetchPostSource(slug) {
  try {
    const res = await apiFetch(`/api/posts/source?slug=${slug}`);
    if (!res.ok) throw new Error(`Source API returned status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load post source:', err);
    throw err;
  }
}

export function renderEditor(container, { initialPost, onSaveSuccess, dashboardData }) {
  let post = initialPost || { title: '', slug: '', category: '', tags: '', body: '', sha: '' };
  let activeTab = 'edit'; // edit, preview, diff, plan
  let diffHtml = '';
  let planHtml = '';
  let actionResultHtml = '';
  let loadingState = false;

  const isDirectPublishEnabled = dashboardData?.readiness?.ownerDirectPublishEnabled === true;
  const isDirectUpdateEnabled = dashboardData?.readiness?.ownerDirectUpdateEnabled === true;
  const isLiveWritesEnabled = dashboardData?.readiness?.liveWritesEnabled === true;

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
      actionResultHtml = `<div class="alert alert-success">Source loaded successfully (SHA: <code>${post.sha.substring(0, 7)}</code>)</div>`;
      showToast('Source loaded successfully', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Failed to load source: ${err.message}</div>`;
      showToast(`Failed to load source: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchDiffPreview() {
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
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          category: post.category,
          tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
          body: post.body
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diff failed');
      
      const diff = data.diff || {};
      diffHtml = `
        <div class="diff-container">
          <p>Comparing local draft changes against main source file <code>${diff.filePath || ''}</code>.</p>
          <div class="diff-meta">
            <span>Base SHA: <code>${diff.baseSha ? diff.baseSha.substring(0, 7) : 'None'}</code></span>
            <span>Status: <strong>${diff.status || 'modified'}</strong></span>
          </div>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No modifications detected.')}</pre>
          </div>
        </div>
      `;
      showToast('Diff generated successfully', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">Failed to generate diff: ${err.message}</div>`;
      showToast(`Failed to generate diff: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchPublishPlan() {
    loadingState = true;
    activeTab = 'plan';
    draw();
    try {
      const res = await apiFetch('/api/drafts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          category: post.category,
          tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
          body: post.body,
          mode: 'dry-run',
          publish_target: 'github'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Plan failed');
      
      const plan = data.plan || {};
      const actions = plan.actions || plan.ops || [];
      planHtml = `
        <div class="plan-container">
          <p><strong>Dry-run Plan Summary:</strong> No remote changes have been created.</p>
          <div class="plan-actions-list">
            ${actions.map((act, index) => `
              <div class="plan-step">
                <span class="step-num">Step ${index + 1}</span>
                <div class="step-details">
                  <strong>${act.op || act.action}</strong>
                  <span>${act.branch || act.path || act.title || ''}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      showToast('Publish plan computed', 'success');
    } catch (err) {
      planHtml = `<div class="alert alert-error">Failed to retrieve plan: ${err.message}</div>`;
      showToast(`Failed to retrieve plan: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function handleCreatePR() {
    loadingState = true;
    draw();
    try {
      const res = await apiFetch('/api/drafts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          category: post.category,
          tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
          body: post.body,
          mode: 'live',
          publish_target: 'github'
        })
      });
      const data = await res.json();
      if (res.status === 403) {
        actionResultHtml = `
          <div class="alert alert-warning">
            <strong>Action Blocked:</strong> Staging write is disabled. Rejections occurred as expected.<br/>
            <code>${data.error || 'Live writes are disabled'}</code>
          </div>
        `;
        showToast('Action Blocked: Staging write is disabled', 'warning');
      } else if (res.ok) {
        actionResultHtml = `
          <div class="alert alert-success">
            <strong>Task Dispatched:</strong> PR request queued successfully. Task ID: <code>${data.task_id || ''}</code>
          </div>
        `;
        showToast('PR creation task dispatched', 'success');
      } else {
        throw new Error(data.error || 'Unexpected error');
      }
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">Operation failed: ${err.message}</div>`;
      showToast(`Operation failed: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function draw() {
    const editActive = activeTab === 'edit' ? 'active' : '';
    const previewActive = activeTab === 'preview' ? 'active' : '';
    const diffActive = activeTab === 'diff' ? 'active' : '';
    const planActive = activeTab === 'plan' ? 'active' : '';

    let tabContent = '';
    if (activeTab === 'edit') {
      tabContent = `
        <div class="editor-fields-grid">
          <label>
            <span>Article Title</span>
            <input type="text" id="edit-title" value="${escapeHtml(post.title)}" placeholder="e.g. Hello World" />
          </label>
          <label>
            <span>Article Slug</span>
            <input type="text" id="edit-slug" value="${escapeHtml(post.slug)}" placeholder="e.g. hello-world" />
          </label>
          <label>
            <span>Category</span>
            <input type="text" id="edit-category" value="${escapeHtml(post.category)}" placeholder="e.g. Life" />
          </label>
          <label>
            <span>Tags (comma separated)</span>
            <input type="text" id="edit-tags" value="${escapeHtml(post.tags)}" placeholder="e.g. personal, welcome" />
          </label>
          
          <label class="field-span-2">
            <span>Body Content (Markdown)</span>
            <textarea id="edit-body" rows="15" placeholder="Write markdown content here...">${escapeHtml(post.body)}</textarea>
          </label>
        </div>
      `;
    } else if (activeTab === 'preview') {
      tabContent = `
        <div class="markdown-preview-container card">
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
    } else if (activeTab === 'diff') {
      tabContent = diffHtml || '<p class="info-text">Load diff status to inspect change details.</p>';
    } else if (activeTab === 'plan') {
      tabContent = planHtml || '<p class="info-text">Generate a publish plan to preview operations.</p>';
    }

    container.innerHTML = `
      <div class="editor-workspace">
        <div class="editor-top-actions">
          <h2>Article Editor</h2>
          <div class="source-loader-block">
            <button class="button-small button-secondary" id="btn-load-source" ${post.slug ? '' : 'disabled'}>Load Main Source</button>
          </div>
        </div>

        ${actionResultHtml}

        <div class="tab-header-nav" style="margin-bottom: 20px;">
          <button class="tab-btn ${editActive}" data-tab="edit">Edit</button>
          <button class="tab-btn ${previewActive}" data-tab="preview">Preview HTML</button>
          <button class="tab-btn ${diffActive}" data-tab="diff">Diff Preview</button>
          <button class="tab-btn ${planActive}" data-tab="plan">GitHub Plan</button>
        </div>

        <div class="editor-tab-content" style="position: relative;">
          ${loadingState ? '<div class="loading-overlay"><span>Loading...</span></div>' : ''}
          ${tabContent}
        </div>

        <div class="editor-bottom-actions card" style="margin-top: 30px;">
          <h3>Operational Controls</h3>
          <div class="control-actions-grid">
            <div class="control-group">
              <h4>Safe Inspection</h4>
              <div class="btn-row">
                <button class="button-secondary" id="btn-inspect-diff">Generate Diff</button>
                <button class="button-secondary" id="btn-inspect-plan">View Dry-run Plan</button>
              </div>
            </div>
            
            <div class="control-group">
              <h4>Controlled PR Publish</h4>
              ${isLiveWritesEnabled 
                ? '<button class="button-primary" id="btn-create-pr">Create Review PR</button>'
                : '<button class="button-primary" id="btn-create-pr" disabled title="Staging write is disabled">Create Review PR unavailable: LIVE_WRITES_ENABLED=false</button>'
              }
            </div>
            
            <div class="control-group">
              <h4>Direct Main Write (Disabled)</h4>
              <div class="btn-row">
                <button class="button-danger" id="btn-direct-publish" disabled title="OWNER_DIRECT_PUBLISH_ENABLED is false">Direct Publish</button>
                <button class="button-danger" id="btn-direct-update" disabled title="OWNER_DIRECT_UPDATE_ENABLED is false">Direct Update</button>
              </div>
              <span class="control-help-text">Direct main updates are blocked in staging/production by default.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    if (activeTab === 'edit') {
      const editTitle = container.querySelector('#edit-title');
      const editSlug = container.querySelector('#edit-slug');
      const editCategory = container.querySelector('#edit-category');
      const editTags = container.querySelector('#edit-tags');
      const editBody = container.querySelector('#edit-body');

      const updateState = () => {
        post.title = editTitle.value;
        post.slug = editSlug.value;
        post.category = editCategory.value;
        post.tags = editTags.value;
        post.body = editBody.value;
        
        const loadBtn = container.querySelector('#btn-load-source');
        if (loadBtn) {
          loadBtn.disabled = !post.slug;
        }
      };

      [editTitle, editSlug, editCategory, editTags, editBody].forEach(el => {
        el.addEventListener('input', updateState);
      });
    }

    // Bind tabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.target.getAttribute('data-tab');
        draw();
      });
    });

    // Bind action buttons
    const loadSourceBtn = container.querySelector('#btn-load-source');
    if (loadSourceBtn) loadSourceBtn.addEventListener('click', loadExistingSource);

    const inspectDiffBtn = container.querySelector('#btn-inspect-diff');
    if (inspectDiffBtn) inspectDiffBtn.addEventListener('click', fetchDiffPreview);

    const inspectPlanBtn = container.querySelector('#btn-inspect-plan');
    if (inspectPlanBtn) inspectPlanBtn.addEventListener('click', fetchPublishPlan);

    const createPrBtn = container.querySelector('#btn-create-pr');
    if (createPrBtn) createPrBtn.addEventListener('click', handleCreatePR);
  }

  function renderSimpleMarkdown(md) {
    if (!md) return '';
    let escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const blocks = escaped.split(/\n\n+/);
    let htmlBlocks = [];

    for (let block of blocks) {
      block = block.trim();
      if (!block) continue;

      if (block.startsWith('```')) {
        const lines = block.split('\n');
        const firstLine = lines[0];
        const lang = firstLine.substring(3).trim();
        const codeLines = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined);
        const code = codeLines.join('\n');
        htmlBlocks.push(`<pre><code class="language-${lang}">${code}</code></pre>`);
        continue;
      }

      if (block.startsWith('#')) {
        const match = block.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          const level = match[1].length;
          const text = parseInlineMarkdown(match[2]);
          htmlBlocks.push(`<h${level}>${text}</h${level}>`);
          continue;
        }
      }

      if (block.startsWith('>')) {
        const lines = block.split('\n').map(line => line.replace(/^>\s?/, ''));
        const text = parseInlineMarkdown(lines.join('\n'));
        htmlBlocks.push(`<blockquote><p>${text}</p></blockquote>`);
        continue;
      }

      if (block.startsWith('* ') || block.startsWith('- ')) {
        const lines = block.split('\n');
        let listHtml = '<ul>';
        for (const line of lines) {
          const itemText = line.replace(/^[\*\-]\s+/, '');
          listHtml += `<li>${parseInlineMarkdown(itemText)}</li>`;
        }
        listHtml += '</ul>';
        htmlBlocks.push(listHtml);
        continue;
      }

      if (/^\d+\.\s+/.test(block)) {
        const lines = block.split('\n');
        let listHtml = '<ol>';
        for (const line of lines) {
          const itemText = line.replace(/^\d+\.\s+/, '');
          listHtml += `<li>${parseInlineMarkdown(itemText)}</li>`;
        }
        listHtml += '</ol>';
        htmlBlocks.push(listHtml);
        continue;
      }

      const text = parseInlineMarkdown(block.split('\n').join('<br/>'));
      htmlBlocks.push(`<p>${text}</p>`);
    }

    return htmlBlocks.join('\n');
  }

  function parseInlineMarkdown(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  draw();
}
