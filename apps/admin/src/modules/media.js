import { apiFetch } from './api-client.js';
import { escapeHtml, showToast } from './ui.js';

export function renderMediaManager(container) {
  let formPayload = {
    slug: 'xhalo-blog-first-test-post',
    filename: 'image.png',
    contentType: 'image/png',
    storageTarget: 'r2',
    size: 204800,
    label: 'Post Banner'
  };

  let selectedFiles = [];
  let previewResults = [];
  let uploadResults = [];
  let loadingState = false;

  async function generatePreview(event) {
    event?.preventDefault();
    syncForm();
    loadingState = true;
    previewResults = [];
    draw();
    try {
      const payloads = selectedFiles.length > 0
        ? selectedFiles.map((file) => ({ ...formPayload, filename: file.name, contentType: file.type || formPayload.contentType, size: file.size }))
        : [formPayload];
      previewResults = await Promise.all(payloads.map(fetchPreview));
      showToast('Media preview generated successfully', 'success');
    } catch (err) {
      showToast(`Error generating preview: ${err.message}`, 'error');
      previewResults = [];
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchPreview(payload) {
    const res = await apiFetch('/api/assets/media-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch media preview');
    return data.asset || {};
  }

  async function testSignedUpload() {
    syncForm();
    if (selectedFiles.length === 0) {
      showToast('Select one or more files before test upload.', 'warning');
      return;
    }
    loadingState = true;
    uploadResults = [];
    draw();
    try {
      for (const file of selectedFiles) {
        const signedRes = await apiFetch('/api/assets/r2-signed-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formPayload,
            filename: file.name,
            contentType: file.type || formPayload.contentType,
            size: file.size,
            mode: 'live'
          })
        });
        const signed = await signedRes.json();
        if (!signedRes.ok) throw new Error(signed.error || signed.code || 'Signed upload was rejected');
        const putRes = await fetch(signed.upload_url, {
          method: signed.upload_method || 'PUT',
          credentials: 'include',
          headers: { 'content-type': file.type || formPayload.contentType },
          body: file
        });
        const putData = await putRes.json().catch(() => ({}));
        if (!putRes.ok) throw new Error(putData.error || `Upload failed with ${putRes.status}`);
        uploadResults.push({ file: file.name, ...putData });
      }
      showToast('Test-only signed upload completed', 'success');
    } catch (err) {
      uploadResults.push({ error: err.message });
      showToast(`Test upload failed: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function copyAllSnippets() {
    const snippets = previewResults.map((asset) => asset.markdownSnippet).filter(Boolean).join('\n');
    if (!snippets) return;
    navigator.clipboard.writeText(snippets)
      .then(() => showToast('Markdown snippets copied to clipboard', 'success'))
      .catch((err) => showToast(`Failed to copy: ${err.message || err}`, 'error'));
  }

  function syncForm() {
    const value = (id) => container.querySelector(id)?.value || '';
    formPayload = {
      slug: value('#media-slug') || formPayload.slug,
      filename: value('#media-filename') || formPayload.filename,
      contentType: value('#media-content-type') || formPayload.contentType,
      storageTarget: value('#media-storage-target') || formPayload.storageTarget,
      size: parseInt(value('#media-size') || '0', 10),
      label: value('#media-label') || ''
    };
  }

  function draw() {
    const selectedFilesHtml = selectedFiles.length > 0
      ? selectedFiles.map((file) => `<li><code>${escapeHtml(file.name)}</code> ${escapeHtml(file.type || 'unknown')} ${file.size} bytes</li>`).join('')
      : '<li class="info-text">No files selected.</li>';
    const previewHtml = previewResults.length > 0
      ? previewResults.map((asset) => `
        <div class="card">
          <div class="meta-grid">
            <div class="meta-row"><span>Safe Filename</span><code>${escapeHtml(asset.filename || '')}</code></div>
            <div class="meta-row"><span>Target Path</span><code>${escapeHtml(asset.targetPath || '')}</code></div>
            <div class="meta-row"><span>Storage Target</span><code>${escapeHtml(asset.storageTarget || '')}</code></div>
          </div>
          <pre class="snippet-pre">${escapeHtml(asset.markdownSnippet || '')}</pre>
        </div>
      `).join('')
      : '<p class="info-text">Generate a dry-run preview to compute paths and insertion snippets.</p>';
    const uploadHtml = uploadResults.length > 0
      ? `<pre class="snippet-pre">${escapeHtml(JSON.stringify(uploadResults, null, 2))}</pre>`
      : '';

    container.innerHTML = `
      <div class="media-workspace">
        <h2>Media Asset Manager</h2>
        <div class="alert alert-info">
          <strong>Dry-run first:</strong> Batch previews never write objects. Test-only signed upload requires <code>DEPLOYMENT_ENV=test</code>, <code>TEST_MEDIA_UPLOAD_ENABLED=true</code>, and the <code>TEST_MEDIA_UPLOAD_PREFIX</code> boundary.
        </div>
        <div class="alert alert-warning">
          <strong>Security Notice:</strong> SVG uploads and executable formats are rejected or flagged to prevent XSS and unsafe file execution.
        </div>

        <div class="media-layout-grid">
          <div class="card media-form-card">
            <h3>Generate Snippet</h3>
            <form id="media-form">
              <label><span>Target Post Slug</span><input type="text" id="media-slug" value="${escapeHtml(formPayload.slug)}" /></label>
              <label><span>Filename</span><input type="text" id="media-filename" value="${escapeHtml(formPayload.filename)}" /></label>
              <label><span>File Selection</span><input type="file" id="media-files" multiple accept="image/*,application/pdf,video/mp4,video/webm,text/plain" /></label>
              <label><span>Content Type</span><select id="media-content-type">
                ${['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm', 'text/plain', 'image/svg+xml'].map((type) => `<option value="${type}" ${formPayload.contentType === type ? 'selected' : ''}>${type}</option>`).join('')}
              </select></label>
              <label><span>Storage Target</span><select id="media-storage-target">
                <option value="r2" ${formPayload.storageTarget === 'r2' ? 'selected' : ''}>Cloudflare R2 Bucket</option>
                <option value="git_asset_folder" ${formPayload.storageTarget === 'git_asset_folder' ? 'selected' : ''}>Git Repository Asset Folder</option>
              </select></label>
              <label><span>File Size (bytes)</span><input type="number" id="media-size" value="${formPayload.size}" /></label>
              <label><span>Label / Caption</span><input type="text" id="media-label" value="${escapeHtml(formPayload.label)}" /></label>
              <button type="submit" class="button-primary" style="margin-top: 15px;">Generate Batch Dry-run</button>
            </form>
            <h4 style="margin-top: 20px;">Selected Files</h4>
            <ul class="bullet-list">${selectedFilesHtml}</ul>
          </div>

          <div class="card media-preview-card">
            <h3>Calculated Targets & Snippets</h3>
            ${loadingState ? '<div class="info-text">Working...</div>' : ''}
            ${previewHtml}
            <button class="button-secondary" id="btn-copy-snippets" style="margin-top: 10px; width: 100%;" ${previewResults.length ? '' : 'disabled'}>Copy Markdown Snippets</button>
            <button class="button-primary" id="btn-test-upload" style="margin-top: 10px; width: 100%;">Test-only Signed Upload</button>
            ${uploadHtml}
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#media-form');
    form?.addEventListener('submit', generatePreview);
    container.querySelector('#media-files')?.addEventListener('change', (event) => {
      selectedFiles = Array.from(event.target.files || []);
      if (selectedFiles[0]) {
        formPayload.filename = selectedFiles[0].name;
        formPayload.contentType = selectedFiles[0].type || formPayload.contentType;
        formPayload.size = selectedFiles[0].size;
      }
      draw();
    });
    container.querySelector('#btn-copy-snippets')?.addEventListener('click', copyAllSnippets);
    container.querySelector('#btn-test-upload')?.addEventListener('click', testSignedUpload);
  }

  draw();
}
