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
  let splitPreview = true;
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
      actionResultHtml = `<div class="alert alert-success">源码加载成功 / Source loaded successfully (SHA: <code>${escapeHtml(post.sha.substring(0, 7))}</code>)</div>`;
      showToast('源码加载成功 / Source loaded successfully', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">源码加载失败 / Failed to load source: ${escapeHtml(err.message)}</div>`;
      showToast(`源码加载失败 / Failed to load source: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchDiffPreview() {
    syncFromForm();
    if (!post.slug) {
      showToast('请先填写 Slug / Please fill out the Slug field before requesting a diff.', 'warning');
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
          <p>正在对比本地草稿与 main 源文件 / Comparing local draft changes against main source file <code>${escapeHtml(diff.filePath || '')}</code>.</p>
          <div class="diff-meta">
            <span>Base SHA: <code>${escapeHtml(diff.baseSha ? diff.baseSha.substring(0, 7) : 'None')}</code></span>
            <span>Status: <strong>${escapeHtml(diff.status || 'modified')}</strong></span>
          </div>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No modifications detected.')}</pre>
          </div>
        </div>
      `;
      showToast('Diff 生成成功 / Diff generated successfully', 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">Diff 生成失败 / Failed to generate diff: ${escapeHtml(err.message)}</div>`;
      showToast(`Diff 生成失败 / Failed to generate diff: ${err.message}`, 'error');
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
          <p><strong>Dry-run 计划摘要 / Dry-run Plan Summary:</strong> 未创建任何远端变更。</p>
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
      showToast('发布计划已生成 / Publish plan computed', 'success');
    } catch (err) {
      planHtml = `<div class="alert alert-error">获取计划失败 / Failed to retrieve plan: ${escapeHtml(err.message)}</div>`;
      showToast(`获取计划失败 / Failed to retrieve plan: ${err.message}`, 'error');
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
        actionResultHtml = `<div class="alert alert-warning"><strong>操作被阻断 / Action Blocked:</strong> <code>${escapeHtml(data.error || 'Live writes are disabled')}</code></div>`;
        showToast('操作被写入 gate 阻断 / Action blocked by write gate', 'warning');
      } else if (res.ok) {
        actionResultHtml = `<div class="alert alert-success"><strong>任务已派发 / Task Dispatched:</strong> Task ID: <code>${escapeHtml(data.task_id || '')}</code></div>`;
        showToast('PR 创建任务已派发 / PR creation task dispatched', 'success');
      } else {
        throw new Error(data.error || 'Unexpected error');
      }
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">操作失败 / Operation failed: ${escapeHtml(err.message)}</div>`;
      showToast(`操作失败 / Operation failed: ${err.message}`, 'error');
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
          <strong>已发布到测试目标 / Published to test target:</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          Path: <code>${escapeHtml(data.targetPath || '')}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          ${data.postUrl ? `<br/>Post URL: <a href="${escapeHtml(data.postUrl)}" target="_blank" rel="noreferrer">${escapeHtml(data.postUrl)}</a>` : ''}
        </div>
      `;
      showToast('测试发布请求完成 / Test publish request completed', 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">测试发布失败 / Test publish failed: ${escapeHtml(err.message)}</div>`;
      showToast(`测试发布失败 / Test publish failed: ${err.message}`, 'error');
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
          <h2>文章编辑器 / Article Editor</h2>
          <div class="source-loader-block">
            <button class="button-small button-secondary" id="btn-template-first">使用测试模板 / Use Test Template</button>
            <button class="button-small button-secondary" id="btn-template-empty">空白草稿 / Blank Draft</button>
            <button class="button-small button-secondary" id="btn-load-source" ${post.slug ? '' : 'disabled'}>加载 main 源码 / Load Main Source</button>
          </div>
        </div>

        <div class="alert alert-info">
          <strong>测试发布 / Test publishing:</strong> Publish to Test 仅在 DEPLOYMENT_ENV=test、PUBLISH_MODE=test_direct、TEST_DIRECT_PUBLISH_ENABLED=true 且目标安全时可用。
        </div>

        <div class="editor-tabs">
          <button class="tab-btn ${activeTab === 'edit' ? 'active' : ''}" data-tab="edit">编辑 / Edit</button>
          <button class="tab-btn ${activeTab === 'preview' ? 'active' : ''}" data-tab="preview">Markdown Preview / Markdown 预览</button>
          <button class="tab-btn ${activeTab === 'diff' ? 'active' : ''}" data-tab="diff">Diff / 差异</button>
          <button class="tab-btn ${activeTab === 'plan' ? 'active' : ''}" data-tab="plan">PR Plan / PR 计划</button>
        </div>

        <div class="editor-tab-content card">${tabContent}</div>

        <div class="editor-actions">
          <button class="button-secondary" id="btn-diff">预览 Diff / Preview Diff</button>
          <button class="button-secondary" id="btn-plan">Dry-run PR 计划 / Dry-run PR Plan</button>
          <button class="button-secondary" id="btn-create-pr" ${readiness.liveWritesEnabled === true ? '' : 'disabled'} title="${readiness.liveWritesEnabled === true ? 'Ready' : 'Create Review PR unavailable: LIVE_WRITES_ENABLED=false'}">创建审核 PR / Create Review PR</button>
          <button class="button-primary" id="btn-publish-test" ${isTestDirectPublishEnabled ? '' : 'disabled'} title="${escapeHtml(testPublishDisabledReason || 'Ready')}">发布到测试站 / Publish to Test</button>
        </div>

        ${readiness.liveWritesEnabled === true ? '' : '<p class="help-text">创建审核 PR 暂不可用 / Create Review PR unavailable: LIVE_WRITES_ENABLED=false</p>'}
        ${!isTestDirectPublishEnabled ? `<p class="help-text">发布到测试站暂不可用 / Publish to Test unavailable: ${escapeHtml(testPublishDisabledReason)}</p>` : ''}
        ${loadingState ? '<div class="info-text">处理中 / Working...</div>' : ''}
        ${actionResultHtml}
      </div>
    `;

    bindEvents();
  }

  function renderTabContent() {
    if (activeTab === 'preview') {
      return `
        <div class="markdown-preview-container">
          <h2>${escapeHtml(post.title || '未命名文章 / Untitled Post')}</h2>
          <div class="post-meta">
            ${post.category ? `<span>分类 / Category: <strong>${escapeHtml(post.category)}</strong></span>` : ''}
            ${post.tags ? `<span>标签 / Tags: <strong>${escapeHtml(post.tags)}</strong></span>` : ''}
          </div>
          <hr/>
          <div class="markdown-rendered-body">
            ${post.body ? renderSimpleMarkdown(post.body) : '<p class="info-text">正文为空 / No content in post body.</p>'}
          </div>
        </div>
      `;
    }
    if (activeTab === 'diff') return diffHtml || '<p class="info-text">生成 Diff 后查看变更细节 / Load diff status to inspect change details.</p>';
    if (activeTab === 'plan') return planHtml || '<p class="info-text">生成发布计划后预览操作 / Generate a publish plan to preview operations.</p>';

    return `
      <div class="editor-fields-grid">
        <label><span>文章标题 / Article Title</span><input type="text" id="edit-title" value="${escapeHtml(post.title)}" placeholder="例如：Hello World" /></label>
        <label><span>文章 Slug / Article Slug</span><input type="text" id="edit-slug" value="${escapeHtml(post.slug)}" placeholder="例如：hello-world" /></label>
        <label><span>分类 / Category</span><input type="text" id="edit-category" value="${escapeHtml(post.category)}" placeholder="例如：Life" /></label>
        <label><span>标签 / Tags (comma separated)</span><input type="text" id="edit-tags" value="${escapeHtml(post.tags)}" placeholder="例如：personal, welcome" /></label>
        <div class="field-span-2 markdown-editor-shell">
          <div class="markdown-toolbar" aria-label="Markdown editor toolbar">
            ${renderMarkdownToolbar()}
            <button type="button" class="button-small button-secondary" id="btn-toggle-split">${splitPreview ? '关闭分屏 / Close Split' : '打开分屏 / Split Preview'}</button>
          </div>
          <div class="markdown-editor-layout ${splitPreview ? 'split' : ''}">
            <label class="markdown-input-pane"><span>正文内容 / Body Content (Markdown)</span><textarea id="edit-body" rows="22" spellcheck="false" placeholder="使用 Markdown 编写正文，支持标题、列表、引用、代码块、表格、图片和链接...">${escapeHtml(post.body)}</textarea></label>
            ${splitPreview ? `<div class="markdown-live-preview"><span>实时预览 / Live Preview</span><div class="markdown-rendered-body">${post.body ? renderSimpleMarkdown(post.body) : '<p class="info-text">正文为空 / No content in post body.</p>'}</div></div>` : ''}
          </div>
          <div class="markdown-editor-status">${renderMarkdownStats(post.body)}</div>
        </div>
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
    container.querySelector('#btn-toggle-split')?.addEventListener('click', () => {
      syncFromForm();
      splitPreview = !splitPreview;
      draw();
    });
    container.querySelectorAll('[data-md-insert]').forEach((button) => {
      button.addEventListener('click', () => {
        insertMarkdownSyntax(button.getAttribute('data-md-insert'));
      });
    });
    const bodyInput = container.querySelector('#edit-body');
    if (bodyInput && splitPreview) {
      bodyInput.addEventListener('input', () => {
        syncFromForm();
        const preview = container.querySelector('.markdown-live-preview .markdown-rendered-body');
        const status = container.querySelector('.markdown-editor-status');
        if (preview) preview.innerHTML = post.body ? renderSimpleMarkdown(post.body) : '<p class="info-text">正文为空 / No content in post body.</p>';
        if (status) status.innerHTML = renderMarkdownStats(post.body);
      });
    }
  }

  function insertMarkdownSyntax(kind) {
    const textarea = container.querySelector('#edit-body');
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selected = textarea.value.slice(start, end);
    const snippets = {
      h2: `## ${selected || '小标题'}\n`,
      bold: `**${selected || '加粗文本'}**`,
      italic: `*${selected || '斜体文本'}*`,
      quote: `> ${selected || '引用内容'}\n`,
      ul: `- ${selected || '列表项'}\n`,
      ol: `1. ${selected || '列表项'}\n`,
      code: `\`\`\`js\n${selected || 'const value = 1;'}\n\`\`\`\n`,
      link: `[${selected || '链接文本'}](https://example.com)`,
      image: `![${selected || '图片描述'}](https://example.com/image.png)`,
      table: `| 列 A | 列 B |\n| --- | --- |\n| ${selected || '内容'} | 示例 |\n`
    };
    const insert = snippets[kind] || selected;
    textarea.value = `${textarea.value.slice(0, start)}${insert}${textarea.value.slice(end)}`;
    textarea.focus();
    textarea.selectionStart = start + insert.length;
    textarea.selectionEnd = start + insert.length;
    syncFromForm();
    draw();
  }

  draw();
}

function renderMarkdownToolbar() {
  return [
    ['h2', '标题'],
    ['bold', '加粗'],
    ['italic', '斜体'],
    ['quote', '引用'],
    ['ul', '无序列表'],
    ['ol', '有序列表'],
    ['code', '代码块'],
    ['link', '链接'],
    ['image', '图片'],
    ['table', '表格']
  ].map(([kind, label]) => `<button type="button" class="button-small button-secondary" data-md-insert="${kind}">${label}</button>`).join('');
}

function renderMarkdownStats(markdown) {
  const text = String(markdown || '');
  const lines = text ? text.split(/\r?\n/).length : 0;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return `行数 ${lines} · 字符 ${chars} · Words ${words}`;
}

function renderSimpleMarkdown(markdown) {
  const htmlBlocks = [];
  let listType = null;
  let inCodeBlock = false;
  let codeLines = [];

  function closeList() {
    if (listType) {
      htmlBlocks.push(`</${listType}>`);
      listType = null;
    }
  }

  function closeCodeBlock() {
    if (inCodeBlock) {
      htmlBlocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      inCodeBlock = false;
      codeLines = [];
    }
  }

  const lines = String(markdown || '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith('```')) {
      closeList();
      if (inCodeBlock) {
        closeCodeBlock();
      } else {
        inCodeBlock = true;
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (isMarkdownTable(lines, index)) {
      closeList();
      const { html, nextIndex } = renderMarkdownTable(lines, index);
      htmlBlocks.push(html);
      index = nextIndex;
      continue;
    }

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
  closeCodeBlock();
  return htmlBlocks.join('');
}

function renderInlineMarkdown(input) {
  return escapeHtml(input)
    .replace(/!\[(.*?)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function isMarkdownTable(lines, index) {
  return /\|/.test(lines[index] || '') && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || '');
}

function renderMarkdownTable(lines, index) {
  const parseRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const headers = parseRow(lines[index]);
  const rows = [];
  let cursor = index + 2;
  while (cursor < lines.length && /\|/.test(lines[cursor])) {
    rows.push(parseRow(lines[cursor]));
    cursor += 1;
  }
  const headerHtml = headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('');
  const bodyHtml = rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInlineMarkdown(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('');
  return {
    html: `<div class="markdown-table-wrap"><table class="markdown-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
    nextIndex: cursor - 1
  };
}
