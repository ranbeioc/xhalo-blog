import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
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
  ].join('\n'),
  filePath: ''
};

const EMPTY_POST = {
  title: '',
  slug: '',
  category: '',
  tags: '',
  body: '',
  sha: '',
  filePath: ''
};

const MEDIA_SNIPPETS = [
  { id: 'image', zh: '图片', en: 'Image', ko: '이미지', ja: '画像', accept: 'image/png,image/jpeg,image/webp,image/gif', kind: 'image' },
  { id: 'document', zh: '文档', en: 'Document', ko: '문서', ja: '文書', accept: 'application/pdf,text/plain,application/zip', kind: 'document' },
  { id: 'audio', zh: '音频', en: 'Audio', ko: '오디오', ja: '音声', accept: 'audio/*', kind: 'audio' },
  { id: 'video', zh: '视频', en: 'Video', ko: '동영상', ja: '動画', accept: 'video/mp4,video/webm', kind: 'video' },
  { id: 'attachment', zh: '附件', en: 'Attachment', ko: '첨부 파일', ja: '添付', accept: 'image/*,application/pdf,text/plain,application/zip,video/mp4,video/webm,audio/*', kind: 'attachment' }
];

const copy = {
  en: {
    title: 'Article Editor',
    template: 'Use Test Template',
    blank: 'Blank Draft',
    loadSource: 'Load Main Source',
    notice: 'Publish to Test updates the real source path {path} and triggers a Pages build. Hexo output follows frontmatter title, summary, and permalink rules.',
    edit: 'Edit',
    diff: 'Diff',
    plan: 'PR Plan',
    titleField: 'Article Title',
    slug: 'Article Slug',
    category: 'Category',
    tags: 'Tags (comma separated)',
    sourcePath: 'Source File Path',
    body: 'Body Content (Vditor Markdown)',
    mediaShortcuts: 'Insert Uploaded Media',
    previewDiff: 'Preview Diff',
    dryRun: 'Dry-run PR Plan',
    createPr: 'Create Review PR',
    publishTest: 'Publish to Test',
    prUnavailable: 'Create Review PR is unavailable because live writes are disabled.',
    publishUnavailable: 'Publish to Test is unavailable',
    fillSlug: 'Fill in the slug before continuing.',
    sourceLoaded: 'Source loaded successfully',
    sourceFailed: 'Failed to load source',
    diffReady: 'Diff generated successfully',
    diffFailed: 'Failed to generate diff',
    planReady: 'Publish plan computed',
    planFailed: 'Failed to retrieve plan',
    blocked: 'Action blocked by write gate',
    dispatched: 'PR creation task dispatched',
    operationFailed: 'Operation failed',
    published: 'Published to test target',
    publishFailed: 'Test publish failed',
    selectMedia: 'Choose a file to upload and insert.',
    mediaUploading: 'Uploading media and preparing Markdown...',
    mediaInserted: 'Uploaded media inserted into the article.',
    mediaUploadFailed: 'Media upload failed',
    emptyDiff: 'Generate a diff to inspect change details.',
    emptyPlan: 'Generate a publish plan to preview operations.',
    vditorPlaceholder: 'Write Markdown with paste, drag-drop, tables, code blocks, emoji, and media links...',
    editorLoading: 'Loading editor resources...',
    working: 'Processing request...',
    editorFallback: 'Vditor could not load. Plain textarea fallback is active.',
    stats: 'Lines {lines} · Characters {chars} · Words {words}',
    pagesTriggered: 'Pages build triggered',
    pagesNotTriggered: 'Pages build not triggered'
  },
  'zh-CN': {
    title: '文章编辑器',
    template: '使用测试模板',
    blank: '空白草稿',
    loadSource: '加载 main 源文件',
    notice: '发布到测试站会更新真实源文件路径 {path}，并触发 Pages 构建。Hexo 首页和详情页会按 frontmatter 标题、摘要和 permalink 规则生成。',
    edit: '编辑',
    diff: 'Diff',
    plan: 'PR 计划',
    titleField: '文章标题',
    slug: '文章 Slug',
    category: '分类',
    tags: '标签（逗号分隔）',
    sourcePath: '源文件路径',
    body: '正文内容（Vditor Markdown）',
    mediaShortcuts: '插入已上传媒体',
    previewDiff: '预览 Diff',
    dryRun: 'Dry-run PR 计划',
    createPr: '创建审核 PR',
    publishTest: '发布到测试站',
    prUnavailable: '创建审核 PR 不可用，因为实时写入保持关闭。',
    publishUnavailable: '发布到测试站不可用',
    fillSlug: '请先填写 Slug。',
    sourceLoaded: '源文件加载成功',
    sourceFailed: '源文件加载失败',
    diffReady: 'Diff 生成成功',
    diffFailed: 'Diff 生成失败',
    planReady: '发布计划已生成',
    planFailed: '获取发布计划失败',
    blocked: '操作被写入门控阻断',
    dispatched: 'PR 创建任务已提交',
    operationFailed: '操作失败',
    published: '已发布到测试目标',
    publishFailed: '测试发布失败',
    selectMedia: '选择一个文件，上传后插入文章。',
    mediaUploading: '正在上传媒体并生成 Markdown...',
    mediaInserted: '媒体已上传并插入文章。',
    mediaUploadFailed: '媒体上传失败',
    emptyDiff: '生成 Diff 后查看变更细节。',
    emptyPlan: '生成发布计划后预览操作。',
    vditorPlaceholder: '使用 Markdown 编写正文，支持粘贴、拖拽、表格、代码块、表情和媒体链接...',
    editorLoading: '正在加载编辑器资源...',
    working: '正在处理请求...',
    editorFallback: 'Vditor 加载失败，已启用普通文本框回退。',
    stats: '行数 {lines} · 字符 {chars} · Words {words}',
    pagesTriggered: 'Pages 构建已触发',
    pagesNotTriggered: 'Pages 构建未触发'
  },
  ko: {
    title: '글 편집기',
    template: '테스트 템플릿 사용',
    blank: '빈 초안',
    loadSource: 'main 원본 불러오기',
    notice: '테스트 사이트에 게시하면 실제 원본 경로 {path}를 업데이트하고 Pages 빌드를 트리거합니다. Hexo 출력은 frontmatter 제목, 요약, permalink 규칙을 따릅니다.',
    edit: '편집',
    diff: 'Diff',
    plan: 'PR 계획',
    titleField: '글 제목',
    slug: '글 Slug',
    category: '카테고리',
    tags: '태그(쉼표로 구분)',
    sourcePath: '원본 파일 경로',
    body: '본문 내용(Vditor Markdown)',
    mediaShortcuts: '업로드한 미디어 삽입',
    previewDiff: 'Diff 미리보기',
    dryRun: 'Dry-run PR 계획',
    createPr: '검토 PR 생성',
    publishTest: '테스트 사이트에 게시',
    prUnavailable: '실시간 쓰기가 꺼져 있어 검토 PR을 만들 수 없습니다.',
    publishUnavailable: '테스트 사이트 게시를 사용할 수 없습니다',
    fillSlug: '먼저 Slug를 입력하세요.',
    sourceLoaded: '원본을 불러왔습니다',
    sourceFailed: '원본 로드 실패',
    diffReady: 'Diff가 생성되었습니다',
    diffFailed: 'Diff 생성 실패',
    planReady: '게시 계획이 생성되었습니다',
    planFailed: '게시 계획을 가져오지 못했습니다',
    blocked: '쓰기 게이트에서 작업이 차단되었습니다',
    dispatched: 'PR 생성 작업이 제출되었습니다',
    operationFailed: '작업 실패',
    published: '테스트 대상에 게시되었습니다',
    publishFailed: '테스트 게시 실패',
    selectMedia: '업로드 후 삽입할 파일을 선택하세요.',
    mediaUploading: '미디어를 업로드하고 Markdown을 준비하는 중...',
    mediaInserted: '미디어가 업로드되어 글에 삽입되었습니다.',
    mediaUploadFailed: '미디어 업로드 실패',
    emptyDiff: 'Diff를 생성해 변경 내용을 확인하세요.',
    emptyPlan: '게시 계획을 생성해 작업을 미리 확인하세요.',
    vditorPlaceholder: 'Markdown으로 본문을 작성하세요. 붙여넣기, 드래그 앤 드롭, 표, 코드 블록, 이모지, 미디어 링크를 지원합니다...',
    editorLoading: '편집기 리소스를 불러오는 중...',
    working: '요청을 처리하는 중...',
    editorFallback: 'Vditor를 불러오지 못해 일반 텍스트 영역으로 전환했습니다.',
    stats: '줄 {lines} · 문자 {chars} · 단어 {words}',
    pagesTriggered: 'Pages 빌드가 트리거되었습니다',
    pagesNotTriggered: 'Pages 빌드가 트리거되지 않았습니다'
  },
  ja: {
    title: '記事エディター',
    template: 'テストテンプレートを使用',
    blank: '空の下書き',
    loadSource: 'main ソースを読み込む',
    notice: 'テストサイトへ公開すると実際のソースパス {path} を更新し、Pages ビルドをトリガーします。Hexo 出力は frontmatter のタイトル、概要、permalink ルールに従います。',
    edit: '編集',
    diff: 'Diff',
    plan: 'PR 計画',
    titleField: '記事タイトル',
    slug: '記事 Slug',
    category: 'カテゴリー',
    tags: 'タグ（カンマ区切り）',
    sourcePath: 'ソースファイルパス',
    body: '本文（Vditor Markdown）',
    mediaShortcuts: 'アップロード済みメディアを挿入',
    previewDiff: 'Diff をプレビュー',
    dryRun: 'Dry-run PR 計画',
    createPr: 'レビュー PR を作成',
    publishTest: 'テストサイトへ公開',
    prUnavailable: 'ライブ書き込みが無効なため、レビュー PR は作成できません。',
    publishUnavailable: 'テストサイト公開を利用できません',
    fillSlug: '先に Slug を入力してください。',
    sourceLoaded: 'ソースを読み込みました',
    sourceFailed: 'ソースの読み込みに失敗しました',
    diffReady: 'Diff を生成しました',
    diffFailed: 'Diff 生成に失敗しました',
    planReady: '公開計画を生成しました',
    planFailed: '公開計画の取得に失敗しました',
    blocked: '書き込みゲートにより操作がブロックされました',
    dispatched: 'PR 作成タスクを送信しました',
    operationFailed: '操作に失敗しました',
    published: 'テスト対象に公開しました',
    publishFailed: 'テスト公開に失敗しました',
    selectMedia: 'アップロードして挿入するファイルを選択してください。',
    mediaUploading: 'メディアをアップロードし Markdown を準備しています...',
    mediaInserted: 'メディアをアップロードし記事に挿入しました。',
    mediaUploadFailed: 'メディアアップロードに失敗しました',
    emptyDiff: 'Diff を生成して変更内容を確認してください。',
    emptyPlan: '公開計画を生成して操作を確認してください。',
    vditorPlaceholder: 'Markdown で本文を書いてください。貼り付け、ドラッグ、表、コードブロック、絵文字、メディアリンクに対応します...',
    editorLoading: 'エディターリソースを読み込み中...',
    working: 'リクエストを処理しています...',
    editorFallback: 'Vditor を読み込めなかったため、通常のテキストエリアに切り替えました。',
    stats: '行 {lines} · 文字 {chars} · Words {words}',
    pagesTriggered: 'Pages ビルドをトリガーしました',
    pagesNotTriggered: 'Pages ビルドはトリガーされていません'
  }
};

const gateReasonCopy = {
  en: {
    testEnv: 'The current API is not running in the approved test environment.',
    mode: 'The current publishing mode does not allow test-site direct publishing.',
    enabled: 'Test-site direct publishing has not been enabled for this environment.',
    target: 'The configured target repository or branch is not approved for test-site writes.'
  },
  'zh-CN': {
    testEnv: '当前 API 未运行在已批准的测试环境。',
    mode: '当前发布模式不允许测试站直发。',
    enabled: '当前环境尚未开启测试站直发能力。',
    target: '当前配置的目标仓库或分支未被批准用于测试站写入。'
  },
  ko: {
    testEnv: '현재 API가 승인된 테스트 환경에서 실행되고 있지 않습니다.',
    mode: '현재 게시 모드는 테스트 사이트 직접 게시를 허용하지 않습니다.',
    enabled: '이 환경에서 테스트 사이트 직접 게시가 활성화되어 있지 않습니다.',
    target: '설정된 대상 저장소 또는 브랜치가 테스트 사이트 쓰기 대상으로 승인되지 않았습니다.'
  },
  ja: {
    testEnv: '現在の API は承認済みのテスト環境で実行されていません。',
    mode: '現在の公開モードではテストサイトへの直接公開は許可されていません。',
    enabled: 'この環境ではテストサイト直接公開が有効化されていません。',
    target: '設定された対象リポジトリまたはブランチは、テストサイト書き込み対象として承認されていません。'
  }
};

let vditorAssetsPromise = null;

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

function gateReason(key) {
  const language = getLanguage();
  return gateReasonCopy[language]?.[key] || gateReasonCopy.en[key] || key;
}

function interpolate(template, params) {
  return Object.entries(params).reduce((value, [key, replacement]) => value.replaceAll(`{${key}}`, String(replacement)), template);
}

function mediaLabel(item) {
  const language = getLanguage();
  if (language === 'zh-CN') return item.zh;
  return item[language] || item.en;
}

export async function fetchPostSource(slug, targetPath = '') {
  const query = new URLSearchParams({ slug });
  if (targetPath) query.set('targetPath', targetPath);
  const res = await apiFetch(`/api/posts/source?${query.toString()}`);
  if (!res.ok) throw new Error(`Source API returned status ${res.status}`);
  return await res.json();
}

function ensureVditorAssets() {
  if (window.Vditor) return Promise.resolve(window.Vditor);
  if (vditorAssetsPromise) return vditorAssetsPromise;
  vditorAssetsPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/vditor/dist/index.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/vditor/dist/index.min.js';
    script.async = true;
    script.onload = () => resolve(window.Vditor);
    script.onerror = () => reject(new Error('Vditor failed to load.'));
    document.head.appendChild(script);
  });
  return vditorAssetsPromise;
}

function closeVditorFloatingPanels(host) {
  if (!host) return;
  host.querySelectorAll('.vditor-panel, .vditor-hint').forEach((panel) => {
    panel.style.display = 'none';
  });
  host.querySelectorAll('.vditor-toolbar__item--current').forEach((button) => {
    button.classList.remove('vditor-toolbar__item--current');
  });
}

export function renderEditor(container, { initialPost, dashboardData }) {
  let post = normalizePost(initialPost || { ...FIRST_TEST_ARTICLE_TEMPLATE, sha: '' });
  let activeTab = 'edit';
  let diffHtml = '';
  let planHtml = '';
  let actionResultHtml = '';
  let loadingState = false;
  let autoLoadAttempted = false;

  const readiness = dashboardData?.readiness || {};
  const isTestDirectPublishEnabled = readiness.deploymentEnv === 'test' &&
    readiness.publishMode === 'test_direct' &&
    readiness.testDirectPublishEnabled === true &&
    readiness.testDirectTargetSafe === true;

  const testPublishDisabledReason = readiness.deploymentEnv !== 'test'
    ? gateReason('testEnv')
    : readiness.publishMode !== 'test_direct'
      ? gateReason('mode')
      : readiness.testDirectPublishEnabled !== true
        ? gateReason('enabled')
        : readiness.testDirectTargetSafe !== true
          ? gateReason('target')
          : '';

  function syncFromForm() {
    const getValue = (id) => container.querySelector(id)?.value || '';
    const vditor = container.querySelector('#vditor-editor')?._xhaloVditor;
    post = {
      ...post,
      title: getValue('#edit-title'),
      slug: getValue('#edit-slug'),
      category: getValue('#edit-category'),
      tags: getValue('#edit-tags'),
      body: vditor ? vditor.getValue() : getValue('#edit-body'),
      filePath: getValue('#edit-file-path')
    };
  }

  async function loadExistingSource() {
    if (!post.slug) return;
    loadingState = true;
    draw();
    try {
      const data = await fetchPostSource(post.slug, post.filePath);
      post = normalizePost({
        title: data.frontmatter?.title || post.title || '',
        slug: post.slug,
        category: data.frontmatter?.category || (Array.isArray(data.frontmatter?.categories) ? data.frontmatter.categories.join(', ') : data.frontmatter?.categories || ''),
        tags: Array.isArray(data.frontmatter?.tags) ? data.frontmatter.tags.join(', ') : '',
        body: data.body || '',
        sha: data.sha || '',
        filePath: data.targetPath || post.filePath || ''
      });
      actionResultHtml = `<div class="alert alert-success">${escapeHtml(c('sourceLoaded'))} (SHA: <code>${escapeHtml(post.sha.substring(0, 7))}</code>)</div>`;
      showToast(c('sourceLoaded'), 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('sourceFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('sourceFailed')}: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  async function fetchDiffPreview() {
    syncFromForm();
    if (!post.slug) {
      showToast(c('fillSlug'), 'warning');
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
          <p>Comparing draft changes against <code>${escapeHtml(diff.filePath || post.filePath || '')}</code>.</p>
          <div class="diff-meta">
            <span>Base SHA: <code>${escapeHtml(diff.baseSha ? diff.baseSha.substring(0, 7) : 'None')}</code></span>
            <span>Status: <strong>${escapeHtml(diff.status || 'modified')}</strong></span>
          </div>
          <div class="diff-code-view">
            <pre class="diff-diff">${escapeHtml(diff.diffText || 'No modifications detected.')}</pre>
          </div>
        </div>
      `;
      showToast(c('diffReady'), 'success');
    } catch (err) {
      diffHtml = `<div class="alert alert-error">${escapeHtml(c('diffFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('diffFailed')}: ${err.message}`, 'error');
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
          <p><strong>Dry-run Plan Summary:</strong> no remote changes are created.</p>
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
      showToast(c('planReady'), 'success');
    } catch (err) {
      planHtml = `<div class="alert alert-error">${escapeHtml(c('planFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('planFailed')}: ${err.message}`, 'error');
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
        actionResultHtml = `<div class="alert alert-warning"><strong>${escapeHtml(c('blocked'))}:</strong> <code>${escapeHtml(data.error || 'Live writes are disabled')}</code></div>`;
        showToast(c('blocked'), 'warning');
      } else if (res.ok) {
        actionResultHtml = `<div class="alert alert-success"><strong>${escapeHtml(c('dispatched'))}:</strong> Task ID: <code>${escapeHtml(data.task_id || '')}</code></div>`;
        showToast(c('dispatched'), 'success');
      } else {
        throw new Error(data.error || 'Unexpected error');
      }
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('operationFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('operationFailed')}: ${err.message}`, 'error');
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
          <strong>${escapeHtml(c('published'))}:</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          Path: <code>${escapeHtml(data.targetPath || '')}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          ${data.postUrl ? `<br/>Post URL: <a href="${escapeHtml(data.postUrl)}" target="_blank" rel="noreferrer">${escapeHtml(data.postUrl)}</a>` : ''}
          ${data.pagesDeploy?.triggered ? `<br/><span class="status-badge" data-state="ok">${escapeHtml(c('pagesTriggered'))}</span>` : `<br/><span class="status-badge" data-state="warning">${escapeHtml(c('pagesNotTriggered'))}</span>`}
          ${data.pagesDeploy?.deploymentId ? `<br/>Deployment: <code>${escapeHtml(data.pagesDeploy.deploymentId)}</code>` : ''}
          ${data.pagesDeploy?.deploymentUrl ? `<br/>Preview: <a href="${escapeHtml(data.pagesDeploy.deploymentUrl)}" target="_blank" rel="noreferrer">${escapeHtml(data.pagesDeploy.deploymentUrl)}</a>` : ''}
        </div>
      `;
      showToast(c('published'), 'success');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('publishFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('publishFailed')}: ${err.message}`, 'error');
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
      body: post.body,
      targetPath: post.filePath || undefined
    };
  }

  function useTemplate(templateName) {
    post = normalizePost(templateName === 'first-test'
      ? { ...FIRST_TEST_ARTICLE_TEMPLATE, sha: '' }
      : { ...EMPTY_POST });
    activeTab = 'edit';
    actionResultHtml = '';
    draw();
  }

  function draw() {
    container.innerHTML = `
      <div class="editor-workspace">
        <div class="editor-top-actions">
          <h2>${escapeHtml(c('title'))}</h2>
          <div class="source-loader-block">
            <button class="button-small button-secondary" id="btn-template-first">${escapeHtml(c('template'))}</button>
            <button class="button-small button-secondary" id="btn-template-empty">${escapeHtml(c('blank'))}</button>
            <button class="button-small button-secondary" id="btn-load-source" ${post.slug ? '' : 'disabled'}>${escapeHtml(c('loadSource'))}</button>
          </div>
        </div>

        <div class="alert alert-info">
          ${escapeHtml(interpolate(c('notice'), { path: post.filePath || `source/_posts/${post.slug || 'slug'}.md` }))}
        </div>

        <div class="editor-tabs">
          <button class="tab-btn ${activeTab === 'edit' ? 'active' : ''}" data-tab="edit">${escapeHtml(c('edit'))}</button>
          <button class="tab-btn ${activeTab === 'diff' ? 'active' : ''}" data-tab="diff">${escapeHtml(c('diff'))}</button>
          <button class="tab-btn ${activeTab === 'plan' ? 'active' : ''}" data-tab="plan">${escapeHtml(c('plan'))}</button>
        </div>

        <div class="editor-tab-content card">${renderTabContent()}</div>

        <div class="editor-actions">
          <button class="button-secondary" id="btn-diff">${escapeHtml(c('previewDiff'))}</button>
          <button class="button-secondary" id="btn-plan">${escapeHtml(c('dryRun'))}</button>
          <button class="button-secondary" id="btn-create-pr" ${readiness.liveWritesEnabled === true ? '' : 'disabled'} title="${readiness.liveWritesEnabled === true ? 'Ready' : c('prUnavailable')}">${escapeHtml(c('createPr'))}</button>
          <button class="button-primary" id="btn-publish-test" ${isTestDirectPublishEnabled ? '' : 'disabled'} title="${escapeHtml(testPublishDisabledReason || 'Ready')}">${escapeHtml(c('publishTest'))}</button>
        </div>

        ${readiness.liveWritesEnabled === true ? '' : `<p class="help-text">${escapeHtml(c('prUnavailable'))}</p>`}
        ${!isTestDirectPublishEnabled ? `<p class="help-text">${escapeHtml(c('publishUnavailable'))}: ${escapeHtml(testPublishDisabledReason)}</p>` : ''}
        ${loadingState ? `<div class="info-text">${escapeHtml(c('working'))}</div>` : ''}
        ${actionResultHtml}
      </div>
    `;

    bindEvents();
    if (!autoLoadAttempted && post.slug && !post.body && !loadingState) {
      autoLoadAttempted = true;
      setTimeout(() => loadExistingSource(), 0);
    }
  }

  function renderTabContent() {
    if (activeTab === 'diff') return diffHtml || `<p class="info-text">${escapeHtml(c('emptyDiff'))}</p>`;
    if (activeTab === 'plan') return planHtml || `<p class="info-text">${escapeHtml(c('emptyPlan'))}</p>`;

    return `
      <div class="editor-fields-grid">
        <label><span>${escapeHtml(c('titleField'))}</span><input type="text" id="edit-title" value="${escapeHtml(post.title)}" placeholder="Hello World" /></label>
        <label><span>${escapeHtml(c('slug'))}</span><input type="text" id="edit-slug" value="${escapeHtml(post.slug)}" placeholder="hello-world" /></label>
        <label><span>${escapeHtml(c('category'))}</span><input type="text" id="edit-category" value="${escapeHtml(post.category)}" placeholder="Life" /></label>
        <label><span>${escapeHtml(c('tags'))}</span><input type="text" id="edit-tags" value="${escapeHtml(post.tags)}" placeholder="personal, welcome" /></label>
        <label class="field-span-2"><span>${escapeHtml(c('sourcePath'))}</span><input type="text" id="edit-file-path" value="${escapeHtml(post.filePath || '')}" placeholder="source/_posts/2026-01-01-example.md" /></label>
        <div class="field-span-2 media-shortcut-bar" aria-label="${escapeHtml(c('mediaShortcuts'))}">
          <span>${escapeHtml(c('mediaShortcuts'))}</span>
          ${MEDIA_SNIPPETS.map((item) => `<button type="button" class="button-small button-secondary btn-media-snippet" data-media-snippet="${escapeHtml(item.id)}">${escapeHtml(mediaLabel(item))}</button>`).join('')}
        </div>
        <div class="field-span-2 markdown-editor-shell">
          <div class="markdown-input-pane">
            <span id="edit-body-label">${escapeHtml(c('body'))}</span>
            <div class="vditor-loading-card" id="vditor-loading">
              <div class="spinner"></div>
              <span>${escapeHtml(c('editorLoading'))}</span>
            </div>
            <div id="vditor-editor" class="vditor-host is-loading" role="textbox" aria-labelledby="edit-body-label"></div>
            <textarea id="edit-body" rows="22" spellcheck="false" aria-labelledby="edit-body-label" placeholder="${escapeHtml(c('vditorPlaceholder'))}">${escapeHtml(post.body)}</textarea>
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
    container.querySelectorAll('[data-media-snippet]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = MEDIA_SNIPPETS.find((candidate) => candidate.id === button.getAttribute('data-media-snippet'));
        if (!item) return;
        openMediaPicker(item);
      });
    });
    const bodyInput = container.querySelector('#edit-body');
    bodyInput?.addEventListener('input', () => {
      post.body = bodyInput.value;
      updateStatus();
    });
    mountVditor();
  }

  function mountVditor() {
    const host = container.querySelector('#vditor-editor');
    const textarea = container.querySelector('#edit-body');
    const loading = container.querySelector('#vditor-loading');
    if (!host || !textarea || host.dataset.ready === 'true') return;
    ensureVditorAssets().then((Vditor) => {
      if (!Vditor || !container.contains(host)) return;
      textarea.style.display = 'none';
      const lang = getLanguage() === 'zh-CN' ? 'zh_CN' : 'en_US';
      const editor = new Vditor(host, {
        value: post.body || '',
        height: 620,
        mode: 'ir',
        lang,
        cache: { enable: false },
        placeholder: c('vditorPlaceholder'),
        toolbar: ['headings', 'bold', 'italic', 'strike', '|', 'list', 'ordered-list', 'check', '|', 'quote', 'line', 'code', 'inline-code', '|', 'upload', 'link', 'table', '|', 'undo', 'redo', 'preview', 'fullscreen', '|', 'emoji'],
        after() {
          host.dataset.ready = 'true';
          host.classList.remove('is-loading');
          if (loading) loading.hidden = true;
          const editable = host.querySelector('.vditor-ir') ||
            host.querySelector('.vditor-wysiwyg') ||
            host.querySelector('[contenteditable="true"]');
          editable?.addEventListener('pointerdown', () => closeVditorFloatingPanels(host), true);
          editable?.addEventListener('focusin', () => closeVditorFloatingPanels(host), true);
          setTimeout(() => closeVditorFloatingPanels(host), 0);
        },
        input(value) {
          post.body = value;
          textarea.value = value;
          updateStatus();
        },
        upload: {
          accept: 'image/*,audio/*,video/*,.pdf,.txt,.zip',
          handler(files) {
            const [file] = Array.from(files || []);
            if (file) void uploadAndInsertMedia(file, MEDIA_SNIPPETS.find((item) => item.id === 'attachment'));
            return null;
          }
        }
      });
      host._xhaloVditor = editor;
    }).catch((err) => {
      if (loading) loading.hidden = true;
      host.classList.add('is-fallback');
      textarea.style.display = '';
      showToast(`${c('editorFallback')}: ${err.message}`, 'warning');
    });
  }

  function updateStatus() {
    const status = container.querySelector('.markdown-editor-status');
    if (status) status.innerHTML = renderMarkdownStats(post.body);
  }

  function openMediaPicker(item) {
    syncFromForm();
    if (!post.slug) {
      showToast(c('fillSlug'), 'warning');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = item.accept || '*/*';
    input.style.position = 'fixed';
    input.style.left = '-10000px';
    input.addEventListener('change', () => {
      const [file] = Array.from(input.files || []);
      input.remove();
      if (file) void uploadAndInsertMedia(file, item);
    }, { once: true });
    document.body.appendChild(input);
    input.click();
  }

  async function uploadAndInsertMedia(file, item) {
    syncFromForm();
    showToast(c('mediaUploading'), 'info');
    try {
      const contentType = file.type || inferContentType(file.name, item);
      const signedRes = await apiFetch('/api/assets/r2-signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType,
          size: file.size,
          scope: 'posts',
          postSlug: post.slug,
          mode: 'live'
        })
      });
      const signed = await signedRes.json();
      if (!signedRes.ok) throw new Error(signed.error || signed.code || 'Signed upload was rejected');
      const putRes = await fetch(signed.upload_url, {
        method: signed.upload_method || 'PUT',
        credentials: 'include',
        headers: { 'content-type': contentType },
        body: file
      });
      const uploaded = await putRes.json().catch(() => ({}));
      if (!putRes.ok) throw new Error(uploaded.error || `Upload failed with ${putRes.status}`);
      const publicUrl = uploaded.public_url || signed.preview?.publicUrl;
      if (!publicUrl) throw new Error('Upload response did not include a public URL.');
      insertMarkdownSnippet(buildMediaSnippetFromUrl(file.name, contentType, publicUrl));
      showToast(c('mediaInserted'), 'success');
    } catch (err) {
      showToast(`${c('mediaUploadFailed')}: ${err.message}`, 'error');
    }
  }

  function insertMarkdownSnippet(snippet) {
    const host = container.querySelector('#vditor-editor');
    if (host?._xhaloVditor) {
      host._xhaloVditor.insertValue(`\n${snippet}\n`);
      post.body = host._xhaloVditor.getValue();
      updateStatus();
      return;
    }
    const textarea = container.querySelector('#edit-body');
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    textarea.value = `${textarea.value.slice(0, start)}\n${snippet}\n${textarea.value.slice(start)}`;
    post.body = textarea.value;
    updateStatus();
  }

  draw();
}

function normalizePost(post) {
  return {
    ...EMPTY_POST,
    ...post,
    tags: Array.isArray(post?.tags) ? post.tags.join(', ') : (post?.tags || ''),
    filePath: post?.filePath || post?.path || post?.targetPath || ''
  };
}

function inferContentType(filename, item = {}) {
  const lower = String(filename || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (item.kind === 'audio') return 'audio/mpeg';
  return 'application/zip';
}

function buildMediaSnippetFromUrl(filename, contentType, url) {
  const label = filename || 'media';
  if (contentType.startsWith('image/')) return `![${label}](${url})`;
  if (contentType.startsWith('audio/')) return `<audio controls src="${url}"></audio>`;
  if (contentType.startsWith('video/')) return `<video controls src="${url}"></video>`;
  return `[${label}](${url})`;
}

function renderMarkdownStats(markdown) {
  const text = String(markdown || '');
  const lines = text ? text.split(/\r?\n/).length : 0;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return escapeHtml(interpolate(c('stats'), { lines, chars, words }));
}
