import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const copy = {
  en: {
    title: 'Media Asset Manager',
    dryRun: 'Generate a dry-run preview before upload. Test-only signed upload is available only when the test media gate is enabled.',
    safety: 'Security note: executable formats are blocked. SVG files are treated as high risk and should stay in preview unless explicitly reviewed.',
    generate: 'Generate Snippet',
    slug: 'Target post slug',
    filename: 'Filename',
    files: 'Choose files',
    type: 'Content type',
    path: 'Target path',
    target: 'Storage target',
    size: 'File size (bytes)',
    label: 'Label or caption',
    generateDryRun: 'Generate Batch Dry-run',
    selected: 'Selected files',
    none: 'No files selected.',
    calculated: 'Calculated targets and snippets',
    previewHint: 'Generate a dry-run preview to calculate target paths and Markdown snippets.',
    copy: 'Copy Markdown Snippets',
    upload: 'Test-only Signed Upload',
    previewOk: 'Media preview generated successfully',
    previewFailed: 'Failed to generate media preview',
    uploadNeedFile: 'Select one or more files before test upload.',
    uploadOk: 'Test-only signed upload completed',
    uploadFailed: 'Test upload failed',
    copied: 'Markdown snippets copied to clipboard',
    copyFailed: 'Failed to copy snippets',
    working: 'Working...'
  },
  'zh-CN': {
    title: '媒体资产管理',
    dryRun: '上传前先生成 dry-run 预览。仅在测试媒体门控开启时可使用 test-only 签名上传。',
    safety: '安全说明：可执行格式会被阻断。SVG 属于高风险文件，除非明确审核，否则应停留在预览阶段。',
    generate: '生成插入片段',
    slug: '目标文章 Slug',
    filename: '文件名',
    files: '选择文件',
    type: '内容类型',
    path: '目标路径',
    target: '存储目标',
    size: '文件大小（字节）',
    label: '标签或说明',
    generateDryRun: '生成批量 Dry-run',
    selected: '已选文件',
    none: '未选择文件。',
    calculated: '目标路径与插入片段',
    previewHint: '先生成 dry-run 预览，以计算目标路径和 Markdown 片段。',
    copy: '复制 Markdown 片段',
    upload: '测试签名上传',
    previewOk: '媒体预览生成成功',
    previewFailed: '媒体预览生成失败',
    uploadNeedFile: '请先选择一个或多个文件。',
    uploadOk: '测试签名上传完成',
    uploadFailed: '测试上传失败',
    copied: 'Markdown 片段已复制到剪贴板',
    copyFailed: '复制片段失败',
    working: '处理中...'
  },
  ko: {
    title: '미디어 자산 관리',
    dryRun: '업로드 전에 dry-run 미리보기를 생성하세요. test-only 서명 업로드는 테스트 미디어 게이트가 켜진 경우에만 사용할 수 있습니다.',
    safety: '보안 안내: 실행 가능한 형식은 차단됩니다. SVG는 고위험 파일이므로 명시적으로 검토하지 않았다면 미리보기 단계에만 두세요.',
    generate: '삽입 조각 생성',
    slug: '대상 글 Slug',
    filename: '파일 이름',
    files: '파일 선택',
    type: '콘텐츠 유형',
    path: '대상 경로',
    target: '저장 대상',
    size: '파일 크기(바이트)',
    label: '라벨 또는 설명',
    generateDryRun: '일괄 Dry-run 생성',
    selected: '선택한 파일',
    none: '선택한 파일이 없습니다.',
    calculated: '계산된 대상과 조각',
    previewHint: 'dry-run 미리보기를 생성해 대상 경로와 Markdown 조각을 계산하세요.',
    copy: 'Markdown 조각 복사',
    upload: '테스트 서명 업로드',
    previewOk: '미디어 미리보기가 생성되었습니다',
    previewFailed: '미디어 미리보기 생성 실패',
    uploadNeedFile: '먼저 하나 이상의 파일을 선택하세요.',
    uploadOk: '테스트 서명 업로드가 완료되었습니다',
    uploadFailed: '테스트 업로드 실패',
    copied: 'Markdown 조각을 클립보드에 복사했습니다',
    copyFailed: '조각 복사 실패',
    working: '처리 중...'
  },
  ja: {
    title: 'メディア資産管理',
    dryRun: 'アップロード前に dry-run プレビューを生成してください。test-only 署名アップロードはテスト用メディアゲートが有効な場合のみ利用できます。',
    safety: 'セキュリティ注意: 実行可能形式はブロックされます。SVG は高リスクのため、明示的に確認するまではプレビューに留めてください。',
    generate: '挿入スニペットを生成',
    slug: '対象記事 Slug',
    filename: 'ファイル名',
    files: 'ファイルを選択',
    type: 'コンテンツタイプ',
    path: '対象パス',
    target: '保存先',
    size: 'ファイルサイズ（バイト）',
    label: 'ラベルまたは説明',
    generateDryRun: '一括 Dry-run を生成',
    selected: '選択済みファイル',
    none: 'ファイルが選択されていません。',
    calculated: '計算された対象とスニペット',
    previewHint: 'dry-run プレビューを生成して、対象パスと Markdown スニペットを計算してください。',
    copy: 'Markdown スニペットをコピー',
    upload: 'テスト署名アップロード',
    previewOk: 'メディアプレビューを生成しました',
    previewFailed: 'メディアプレビュー生成に失敗しました',
    uploadNeedFile: '先に 1 つ以上のファイルを選択してください。',
    uploadOk: 'テスト署名アップロードが完了しました',
    uploadFailed: 'テストアップロードに失敗しました',
    copied: 'Markdown スニペットをクリップボードにコピーしました',
    copyFailed: 'スニペットのコピーに失敗しました',
    working: '処理中...'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

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
      showToast(c('previewOk'), 'success');
    } catch (err) {
      showToast(`${c('previewFailed')}: ${err.message}`, 'error');
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
      showToast(c('uploadNeedFile'), 'warning');
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
            filename: file.name,
            contentType: file.type || formPayload.contentType,
            size: file.size,
            scope: 'posts',
            postSlug: formPayload.slug,
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
      showToast(c('uploadOk'), 'success');
    } catch (err) {
      uploadResults.push({ error: err.message });
      showToast(`${c('uploadFailed')}: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function copyAllSnippets() {
    const snippets = previewResults.map((asset) => asset.markdownSnippet).filter(Boolean).join('\n');
    if (!snippets) return;
    navigator.clipboard.writeText(snippets)
      .then(() => showToast(c('copied'), 'success'))
      .catch((err) => showToast(`${c('copyFailed')}: ${err.message || err}`, 'error'));
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
      : `<li class="info-text">${escapeHtml(c('none'))}</li>`;
    const previewHtml = previewResults.length > 0
      ? previewResults.map((asset) => `
        <div class="card">
          <div class="meta-grid">
            <div class="meta-row"><span>${escapeHtml(c('filename'))}</span><code>${escapeHtml(asset.filename || '')}</code></div>
            <div class="meta-row"><span>${escapeHtml(c('path'))}</span><code>${escapeHtml(asset.targetPath || '')}</code></div>
            <div class="meta-row"><span>${escapeHtml(c('target'))}</span><code>${escapeHtml(asset.storageTarget || '')}</code></div>
          </div>
          <pre class="snippet-pre">${escapeHtml(asset.markdownSnippet || '')}</pre>
        </div>
      `).join('')
      : `<p class="info-text">${escapeHtml(c('previewHint'))}</p>`;
    const uploadHtml = uploadResults.length > 0
      ? `<pre class="snippet-pre">${escapeHtml(JSON.stringify(uploadResults, null, 2))}</pre>`
      : '';

    container.innerHTML = `
      <div class="media-workspace">
        <h2>${escapeHtml(c('title'))}</h2>
        <div class="alert alert-info">${escapeHtml(c('dryRun'))}</div>
        <div class="alert alert-warning">${escapeHtml(c('safety'))}</div>

        <div class="media-layout-grid">
          <div class="card media-form-card">
            <h3>${escapeHtml(c('generate'))}</h3>
            <form id="media-form">
              <label><span>${escapeHtml(c('slug'))}</span><input type="text" id="media-slug" value="${escapeHtml(formPayload.slug)}" /></label>
              <label><span>${escapeHtml(c('filename'))}</span><input type="text" id="media-filename" value="${escapeHtml(formPayload.filename)}" /></label>
              <label><span>${escapeHtml(c('files'))}</span><input type="file" id="media-files" multiple accept="image/*,application/pdf,video/mp4,video/webm,text/plain,application/zip" /></label>
              <label><span>${escapeHtml(c('type'))}</span><select id="media-content-type">
                ${['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm', 'text/plain', 'application/zip'].map((type) => `<option value="${type}" ${formPayload.contentType === type ? 'selected' : ''}>${type}</option>`).join('')}
              </select></label>
              <label><span>${escapeHtml(c('target'))}</span><select id="media-storage-target">
                <option value="r2" ${formPayload.storageTarget === 'r2' ? 'selected' : ''}>Cloudflare R2</option>
                <option value="git_asset_folder" ${formPayload.storageTarget === 'git_asset_folder' ? 'selected' : ''}>Git asset folder</option>
              </select></label>
              <label><span>${escapeHtml(c('size'))}</span><input type="number" id="media-size" value="${formPayload.size}" /></label>
              <label><span>${escapeHtml(c('label'))}</span><input type="text" id="media-label" value="${escapeHtml(formPayload.label)}" /></label>
              <button type="submit" class="button-primary" style="margin-top: 15px;">${escapeHtml(c('generateDryRun'))}</button>
            </form>
            <h4 style="margin-top: 20px;">${escapeHtml(c('selected'))}</h4>
            <ul class="bullet-list">${selectedFilesHtml}</ul>
          </div>

          <div class="card media-preview-card">
            <h3>${escapeHtml(c('calculated'))}</h3>
            ${loadingState ? `<div class="info-text">${escapeHtml(c('working'))}</div>` : ''}
            ${previewHtml}
            <button class="button-secondary" id="btn-copy-snippets" style="margin-top: 10px; width: 100%;" ${previewResults.length ? '' : 'disabled'}>${escapeHtml(c('copy'))}</button>
            <button class="button-primary" id="btn-test-upload" style="margin-top: 10px; width: 100%;">${escapeHtml(c('upload'))}</button>
            ${uploadHtml}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#media-form')?.addEventListener('submit', generatePreview);
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
