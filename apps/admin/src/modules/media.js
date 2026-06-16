import { apiFetch } from './api-client.js';
import { showToast } from './ui.js';

export function renderMediaManager(container) {
  let formPayload = {
    slug: 'hello-world',
    filename: 'image.png',
    contentType: 'image/png',
    storageTarget: 'r2',
    size: 204800,
    label: 'Post Banner'
  };

  let previewResult = null;
  let loadingState = false;

  async function generatePreview(e) {
    e.preventDefault();
    loadingState = true;
    draw();
    
    try {
      const res = await apiFetch('/api/assets/media-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch media preview');
      previewResult = data.asset || {};
      showToast('Media preview generated successfully', 'success');
    } catch (err) {
      showToast(`Error generating preview: ${err.message}`, 'error');
      previewResult = null;
    } finally {
      loadingState = false;
      draw();
    }
  }

  function copySnippetToClipboard() {
    if (!previewResult || !previewResult.markdownSnippet) return;
    navigator.clipboard.writeText(previewResult.markdownSnippet)
      .then(() => showToast('Markdown snippet copied to clipboard!', 'success'))
      .catch(err => showToast('Failed to copy: ' + err, 'error'));
  }

  function draw() {
    container.innerHTML = `
      <div class="media-workspace">
        <h2>Media Asset Manager (Dry-run)</h2>
        
        <div class="alert alert-info">
          <strong>Dry-run Mode:</strong> Actual R2 object uploading and local file writing are disabled in this phase. You can plan file targets and retrieve markdown embedding snippets without executing live writes.
        </div>

        <div class="alert alert-warning">
          <strong>Security Notice:</strong> SVG uploads and binary files containing executable scripts are rejected to prevent XSS vulnerabilities.
        </div>

        <div class="media-layout-grid">
          <div class="card media-form-card">
            <h3>Generate Snippet</h3>
            <form id="media-form">
              <label>
                <span>Target Post Slug</span>
                <input type="text" id="media-slug" value="${formPayload.slug}" />
              </label>
              <label>
                <span>Filename</span>
                <input type="text" id="media-filename" value="${formPayload.filename}" />
              </label>
              <label>
                <span>Content Type</span>
                <select id="media-content-type">
                  <option value="image/png" ${formPayload.contentType === 'image/png' ? 'selected' : ''}>PNG Image (image/png)</option>
                  <option value="image/jpeg" ${formPayload.contentType === 'image/jpeg' ? 'selected' : ''}>JPEG Image (image/jpeg)</option>
                  <option value="image/svg+xml" ${formPayload.contentType === 'image/svg+xml' ? 'selected' : ''}>SVG Vector (image/svg+xml - Gated)</option>
                  <option value="application/pdf" ${formPayload.contentType === 'application/pdf' ? 'selected' : ''}>PDF Document (application/pdf)</option>
                </select>
              </label>
              <label>
                <span>Storage Target</span>
                <select id="media-storage-target">
                  <option value="r2" ${formPayload.storageTarget === 'r2' ? 'selected' : ''}>Cloudflare R2 Bucket</option>
                  <option value="git_asset_folder" ${formPayload.storageTarget === 'git_asset_folder' ? 'selected' : ''}>Git Repository Asset Folder</option>
                </select>
              </label>
              <label>
                <span>File Size (bytes)</span>
                <input type="number" id="media-size" value="${formPayload.size}" />
              </label>
              <label>
                <span>Label / Caption</span>
                <input type="text" id="media-label" value="${formPayload.label}" />
              </label>
              
              <button type="submit" class="button-primary" style="margin-top: 15px;">Generate Dry-run Snippet</button>
            </form>
          </div>

          <div class="card media-preview-card">
            <h3>Calculated Target & Snippet</h3>
            ${loadingState ? '<div class="info-text">Calculating plan...</div>' : ''}
            ${!loadingState && previewResult ? `
              <div class="meta-grid">
                <div class="meta-row"><span>Safe Filename</span><code>${previewResult.filename || ''}</code></div>
                <div class="meta-row"><span>Target Path</span><code>${previewResult.targetPath || ''}</code></div>
                <div class="meta-row"><span>Storage Target</span><code>${previewResult.storageTarget || ''}</code></div>
              </div>
              <div style="margin-top: 20px;">
                <label>
                  <span>Markdown Embed Snippet</span>
                  <pre class="snippet-pre">${escapeHtml(previewResult.markdownSnippet || '')}</pre>
                </label>
                <button class="button-secondary" id="btn-copy-snippet" style="margin-top: 10px; width: 100%;">Copy Snippet</button>
              </div>
            ` : !loadingState ? `
              <p class="info-text">Fill in the file details and click generate to compute paths.</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    const form = container.querySelector('#media-form');
    if (form) {
      form.addEventListener('submit', generatePreview);

      const fields = {
        slug: '#media-slug',
        filename: '#media-filename',
        contentType: '#media-content-type',
        storageTarget: '#media-storage-target',
        size: '#media-size',
        label: '#media-label'
      };

      Object.entries(fields).forEach(([key, selector]) => {
        const el = container.querySelector(selector);
        if (el) {
          el.addEventListener('change', (e) => {
            formPayload[key] = key === 'size' ? parseInt(e.target.value || '0', 10) : e.target.value;
          });
          el.addEventListener('input', (e) => {
            formPayload[key] = key === 'size' ? parseInt(e.target.value || '0', 10) : e.target.value;
          });
        }
      });
    }

    const copyBtn = container.querySelector('#btn-copy-snippet');
    if (copyBtn) copyBtn.addEventListener('click', copySnippetToClipboard);
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
