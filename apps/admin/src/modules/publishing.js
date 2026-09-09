import { getLanguage } from './i18n.js';
import { renderDataTable, bindDataTableControls } from './table.js';
import { apiFetch } from './api-client.js';
import { escapeHtml, showToast } from './ui.js';

const copy = {
  en: {
    title: 'Publishing Safety Center',
    lede: 'Review write gates, release workflow constraints, and operational safety layers before any content mutation.',
    baselineTitle: 'Safety baseline',
    baseline: 'Production writes remain blocked by default. Production content changes must use Branch and Pull Request review unless an owner explicitly enables a separate production gate.',
    matrix: 'Active operations safety matrix',
    search: 'Search capability, workflow, or mode...',
    filter: 'Gate filter',
    all: 'All gates',
    safe: 'Gated / safe',
    risk: 'Enabled / high risk',
    capability: 'Capability',
    workflow: 'Workflow enforcement',
    gate: 'Safety gate status',
    mode: 'Action mode',
    enabled: 'Enabled (high risk)',
    gated: 'Gated (safe)',
    layers: 'Security layers',
    controls: 'Gated controls',
    controlsHelp: 'Direct writes require explicit Cloudflare environment gates and cannot be enabled from the browser UI.',
    directPublish: 'Enable direct publish',
    directUpdate: 'Enable direct update',
    directConfig: 'Enable direct configuration write',
    draft: 'Draft article publishing',
    draftWorkflow: 'Create a content branch and open a GitHub Pull Request.',
    update: 'Existing article updates',
    updateWorkflow: 'Fetch source, review diff, then create a Pull Request unless test-only direct publish is enabled.',
    media: 'Media uploads',
    mediaWorkflow: 'Default to dry-run asset planning; test environments may use gated signed upload.',
    menu: 'Site menu and social links',
    menuWorkflow: 'Validate locally, preview diff, then save only through the test-only configuration gate.',
    prOnly: 'PR-only',
    dryRun: 'Dry-run / gated test',
    previewOnly: 'Preview then test gate',
    active: 'Active',
    bypassed: 'Bypassed in staging',
    tasksTitle: 'Queue Tasks & Operations',
    tasksDesc: 'Inspect recent background publication, object upload, and reconciliation tasks with manual retry controls.',
    taskSearch: 'Search task ID, type, or detail...',
    taskFilter: 'Task status filter',
    taskAll: 'All statuses',
    taskQueued: 'Queued',
    taskCompleted: 'Completed',
    taskFailed: 'Failed',
    taskId: 'Task ID',
    taskType: 'Type',
    taskStatus: 'Status',
    taskDetail: 'Detail / Error',
    taskAction: 'Action',
    taskRetry: 'Retry',
    taskRetrying: 'Retrying...',
    retrySuccess: 'Task successfully re-enqueued for processing.',
    retryFailed: 'Failed to retry task: ',
    noTasks: 'No background tasks recorded.'
  },
  'zh-CN': {
    title: '发布安全中心',
    lede: '在任何内容变更前，集中查看写入 gate、发布流程约束和运行安全层。',
    baselineTitle: '安全基线',
    baseline: '生产写入默认保持阻断。生产内容变更必须走分支和 Pull Request 审核，除非 owner 单独显式开启生产 gate。',
    matrix: '当前操作安全矩阵',
    search: '搜索能力、工作流或模式...',
    filter: 'Gate 筛选',
    all: '全部 gate',
    safe: '已阻断 / 安全',
    risk: '已开启 / 高风险',
    capability: '能力',
    workflow: '工作流约束',
    gate: '安全 gate 状态',
    mode: '动作模式',
    enabled: '已开启（高风险）',
    gated: '已阻断（安全）',
    layers: '安全层',
    controls: '受控开关',
    controlsHelp: '直接写入必须通过 Cloudflare 环境变量显式开启，不能从浏览器界面绕过。',
    directPublish: '启用直接发布',
    directUpdate: '启用直接更新',
    directConfig: '启用配置直写',
    draft: '草稿文章发布',
    draftWorkflow: '创建内容分支并打开 GitHub Pull Request。',
    update: '已有文章更新',
    updateWorkflow: '拉取源文件、检查 diff，然后创建 Pull Request；仅测试环境可走受控 direct publish。',
    media: '媒体上传',
    mediaWorkflow: '默认生成 dry-run 资产计划；测试环境可使用受控签名上传。',
    menu: '站点菜单与社交链接',
    menuWorkflow: '本地校验、预览 diff，然后仅通过 test-only 配置 gate 保存。',
    prOnly: '仅 PR',
    dryRun: 'Dry-run / 测试 gate',
    previewOnly: '预览后测试 gate',
    active: '已启用',
    bypassed: '测试环境绕过',
    tasksTitle: '队列任务与运行状态',
    tasksDesc: '查看近期后台发布、对象上传与状态对齐任务，并支持异常任务一键重试。',
    taskSearch: '搜索任务 ID、类型或详情...',
    taskFilter: '任务状态筛选',
    taskAll: '全部状态',
    taskQueued: '已排队',
    taskCompleted: '已完成',
    taskFailed: '失败',
    taskId: '任务 ID',
    taskType: '类型',
    taskStatus: '状态',
    taskDetail: '详情 / 错误信息',
    taskAction: '操作',
    taskRetry: '重试',
    taskRetrying: '重试中...',
    retrySuccess: '任务已成功重新加入执行队列。',
    retryFailed: '重试任务失败: ',
    noTasks: '暂无后台任务记录。'
  },
  ko: {
    title: '게시 안전 센터',
    lede: '콘텐츠 변경 전에 쓰기 게이트, 게시 워크플로 제약, 운영 안전 계층을 확인합니다.',
    baselineTitle: '안전 기준',
    baseline: '운영 쓰기는 기본적으로 차단됩니다. 운영 콘텐츠 변경은 소유자가 별도 운영 게이트를 명시적으로 켜지 않는 한 브랜치와 Pull Request 검토를 거쳐야 합니다.',
    matrix: '활성 작업 안전 매트릭스',
    search: '기능, 워크플로 또는 모드 검색...',
    filter: '게이트 필터',
    all: '전체 게이트',
    safe: '차단됨 / 안전',
    risk: '켜짐 / 고위험',
    capability: '기능',
    workflow: '워크플로 제약',
    gate: '안전 게이트 상태',
    mode: '동작 모드',
    enabled: '켜짐(고위험)',
    gated: '차단됨(안전)',
    layers: '보안 계층',
    controls: '제어된 스위치',
    controlsHelp: '직접 쓰기는 Cloudflare 환경 변수로 명시적으로 켜야 하며 브라우저 UI에서 우회할 수 없습니다.',
    directPublish: '직접 게시 활성화',
    directUpdate: '직접 업데이트 활성화',
    directConfig: '설정 직접 쓰기 활성화',
    draft: '초안 글 게시',
    draftWorkflow: '콘텐츠 브랜치를 만들고 GitHub Pull Request를 엽니다.',
    update: '기존 글 업데이트',
    updateWorkflow: '원본을 가져와 diff를 확인한 뒤 Pull Request를 만듭니다. 테스트 환경에서는 제한된 direct publish를 사용할 수 있습니다.',
    media: '미디어 업로드',
    mediaWorkflow: '기본은 dry-run 자산 계획이며, 테스트 환경에서만 게이트된 서명 업로드를 사용할 수 있습니다.',
    menu: '사이트 메뉴와 소셜 링크',
    menuWorkflow: '로컬 검증과 diff 미리보기 후 test-only 설정 게이트로만 저장합니다.',
    prOnly: 'PR 전용',
    dryRun: 'Dry-run / 테스트 게이트',
    previewOnly: '미리보기 후 테스트 게이트',
    active: '활성',
    bypassed: '스테이징에서 우회',
    tasksTitle: '대기열 작업 및 운영 상태',
    tasksDesc: '최근 백그라운드 게시, 객체 업로드 및 동기화 작업을 확인하고 실패한 작업을 재시도합니다.',
    taskSearch: '작업 ID, 유형 또는 세부정보 검색...',
    taskFilter: '작업 상태 필터',
    taskAll: '전체 상태',
    taskQueued: '대기 중',
    taskCompleted: '완료됨',
    taskFailed: '실패',
    taskId: '작업 ID',
    taskType: '유형',
    taskStatus: '상태',
    taskDetail: '세부정보 / 오류',
    taskAction: '작업',
    taskRetry: '재시도',
    taskRetrying: '재시도 중...',
    retrySuccess: '작업이 대기열에 다시 추가되었습니다.',
    retryFailed: '작업 재시도 실패: ',
    noTasks: '기록된 백그라운드 작업이 없습니다.'
  },
  ja: {
    title: '公開安全センター',
    lede: 'コンテンツ変更の前に、書き込みゲート、公開ワークフロー制約、運用安全層を確認します。',
    baselineTitle: '安全基準',
    baseline: '本番書き込みは既定でブロックされます。本番コンテンツ変更は、owner が別の本番ゲートを明示的に有効化しない限り、ブランチと Pull Request レビューを通過する必要があります。',
    matrix: '有効な操作の安全マトリクス',
    search: '機能、ワークフロー、モードを検索...',
    filter: 'ゲート絞り込み',
    all: 'すべてのゲート',
    safe: 'ブロック済み / 安全',
    risk: '有効 / 高リスク',
    capability: '機能',
    workflow: 'ワークフロー制約',
    gate: '安全ゲート状態',
    mode: '動作モード',
    enabled: '有効（高リスク）',
    gated: 'ブロック済み（安全）',
    layers: 'セキュリティ層',
    controls: '制御スイッチ',
    controlsHelp: '直接書き込みは Cloudflare 環境変数で明示的に有効化する必要があり、ブラウザ UI からは回避できません。',
    directPublish: '直接公開を有効化',
    directUpdate: '直接更新を有効化',
    directConfig: '設定直接書き込みを有効化',
    draft: '下書き記事の公開',
    draftWorkflow: 'コンテンツブランチを作成し GitHub Pull Request を開きます。',
    update: '既存記事の更新',
    updateWorkflow: 'ソースを取得し diff を確認して Pull Request を作成します。テスト環境では制限付き direct publish を使用できます。',
    media: 'メディアアップロード',
    mediaWorkflow: '既定は dry-run アセット計画です。テスト環境のみゲート付き署名アップロードを利用できます。',
    menu: 'サイトメニューとソーシャルリンク',
    menuWorkflow: 'ローカル検証と diff プレビュー後、test-only 設定ゲートでのみ保存します。',
    prOnly: 'PR のみ',
    dryRun: 'Dry-run / テストゲート',
    previewOnly: 'プレビュー後テストゲート',
    active: '有効',
    bypassed: 'ステージングでバイパス',
    tasksTitle: 'キュータスクと実行ステータス',
    tasksDesc: '最近のバックグラウンド公開、オブジェクトアップロード、調整タスクを確認し、失敗したタスクを手動で再試行できます。',
    taskSearch: 'タスクID、タイプ、詳細を検索...',
    taskFilter: 'タスクステータス絞り込み',
    taskAll: 'すべてのステータス',
    taskQueued: '待機中',
    taskCompleted: '完了',
    taskFailed: '失敗',
    taskId: 'タスクID',
    taskType: 'タイプ',
    taskStatus: 'ステータス',
    taskDetail: '詳細 / エラー',
    taskAction: '操作',
    taskRetry: '再試行',
    taskRetrying: '再試行中...',
    retrySuccess: 'タスクが正常に再キューイングされました。',
    retryFailed: 'タスクの再試行に失敗しました: ',
    noTasks: 'バックグラウンドタスクの記録はありません。'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

export function renderPublishingSafetyCenter(container, { dashboardData }) {
  const readiness = dashboardData?.readiness || {};
  const tableState = { query: '', filter: 'all', page: 1 };
  const tasksTableState = { query: '', filter: 'all', page: 1 };

  let tasks = dashboardData?.recentTasks || [];
  let tasksLoaded = Boolean(dashboardData?.recentTasks);

  const rows = [
    { capability: c('draft'), workflow: c('draftWorkflow'), gate: readiness.ownerDirectPublishEnabled, mode: c('prOnly') },
    { capability: c('update'), workflow: c('updateWorkflow'), gate: readiness.ownerDirectUpdateEnabled, mode: c('prOnly') },
    { capability: c('media'), workflow: c('mediaWorkflow'), gate: readiness.liveWritesEnabled, mode: c('dryRun') },
    { capability: c('menu'), workflow: c('menuWorkflow'), gate: readiness.ownerDirectConfigUpdateEnabled, mode: c('previewOnly') }
  ];

  const gateBadge = (enabled) => enabled
    ? `<span class="status-badge" data-state="error">${c('enabled')}</span>`
    : `<span class="status-badge" data-state="ok">${c('gated')}</span>`;

  async function loadTasks() {
    try {
      const res = await apiFetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        tasks = Array.isArray(data.items) ? data.items : [];
        tasksLoaded = true;
        draw();
      }
    } catch {
      tasksLoaded = true;
    }
  }

  async function handleRetry(taskId, button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = c('taskRetrying');
    try {
      const res = await apiFetch(`/api/tasks/${encodeURIComponent(taskId)}/retry`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }
      showToast(c('retrySuccess'), 'success');
      await loadTasks();
    } catch (err) {
      showToast(`${c('retryFailed')}${err.message}`, 'error');
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function draw() {
    container.innerHTML = `
      <div class="publishing-workspace">
        <h2>${c('title')}</h2>
        <p class="lede">${c('lede')}</p>
        <div class="alert alert-info"><strong>${c('baselineTitle')}:</strong> ${c('baseline')}</div>
        <div class="publishing-grid">
          <div class="card safety-matrix-card field-span-2">
            <h3>${c('matrix')}</h3>
            ${renderDataTable({
              id: 'publishing-safety',
              rows,
              query: tableState.query,
              filter: tableState.filter,
              page: tableState.page,
              pageSize: 4,
              searchPlaceholder: c('search'),
              filterLabel: c('filter'),
              allLabel: c('all'),
              filterOptions: [
                { value: 'safe', label: c('safe') },
                { value: 'risk', label: c('risk') }
              ],
              getFilterValue: (row) => row.gate ? 'risk' : 'safe',
              getSearchText: (row) => `${row.capability} ${row.workflow} ${row.mode}`,
              columns: [
                { label: c('capability'), minWidth: '230px', render: (row) => `<strong>${row.capability}</strong>` },
                { label: c('workflow'), minWidth: '260px', render: (row) => row.workflow },
                { label: c('gate'), minWidth: '170px', render: (row) => gateBadge(row.gate) },
                { label: c('mode'), width: '150px', render: (row) => `<code>${row.mode}</code>` }
              ]
            })}
          </div>
          <div class="card security-layers-card">
            <h3>${c('layers')}</h3>
            <div class="meta-grid">
              <div class="meta-row"><span>Cloudflare Access</span><span class="status-badge" data-state="ok">${c('active')}</span></div>
              <div class="meta-row"><span>Turnstile CAPTCHA</span><span class="status-badge" data-state="${readiness.turnstileSiteKey ? 'ok' : 'warning'}">${readiness.turnstileSiteKey ? c('active') : c('bypassed')}</span></div>
              <div class="meta-row"><span>Audit logging</span><span class="status-badge" data-state="ok">${c('active')}</span></div>
            </div>
          </div>
          <div class="card gated-actions-card">
            <h3>${c('controls')}</h3>
            <p class="help-text">${c('controlsHelp')}</p>
            <div class="btn-col" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
              <button class="button-danger" disabled>${c('directPublish')}</button>
              <button class="button-danger" disabled>${c('directUpdate')}</button>
              <button class="button-danger" disabled>${c('directConfig')}</button>
            </div>
          </div>
          <div class="card tasks-card field-span-2" style="margin-top: 20px;">
            <h3>${c('tasksTitle')}</h3>
            <p class="help-text">${c('tasksDesc')}</p>
            ${renderDataTable({
              id: 'publishing-tasks',
              rows: tasks,
              query: tasksTableState.query,
              filter: tasksTableState.filter,
              page: tasksTableState.page,
              pageSize: 5,
              searchPlaceholder: c('taskSearch'),
              filterLabel: c('taskFilter'),
              allLabel: c('taskAll'),
              filterOptions: [
                { value: 'queued', label: c('taskQueued') },
                { value: 'completed', label: c('taskCompleted') },
                { value: 'failed', label: c('taskFailed') }
              ],
              getFilterValue: (row) => row.status || 'unknown',
              getSearchText: (row) => `${row.id} ${row.type} ${row.status} ${row.detail_secondary || ''} ${row.last_error || ''}`,
              columns: [
                { label: c('taskId'), minWidth: '130px', render: (row) => `<code>${escapeHtml(row.id || '')}</code>` },
                { label: c('taskType'), minWidth: '140px', render: (row) => escapeHtml(row.type || '') },
                {
                  label: c('taskStatus'),
                  minWidth: '120px',
                  render: (row) => {
                    const state = row.status === 'completed' ? 'ok' : row.status === 'failed' ? 'error' : 'warning';
                    const retryBadge = row.retry_count > 0 ? ` <small>(#${row.retry_count})</small>` : '';
                    return `<span class="status-badge" data-state="${state}">${escapeHtml(row.status || '')}</span>${retryBadge}`;
                  }
                },
                {
                  label: c('taskDetail'),
                  minWidth: '220px',
                  render: (row) => escapeHtml(row.last_error || row.detail_secondary || row.detail_primary || '-')
                },
                {
                  label: c('taskAction'),
                  width: '100px',
                  render: (row) => {
                    if (row.status === 'failed' || row.status === 'queued') {
                      return `<button class="button-secondary btn-retry-task" data-task-id="${escapeHtml(row.id || '')}" style="padding: 4px 8px; font-size: 12px;">${c('taskRetry')}</button>`;
                    }
                    return '-';
                  }
                }
              ]
            })}
          </div>
        </div>
      </div>
    `;
    bindDataTableControls(container, 'publishing-safety', tableState, draw);
    bindDataTableControls(container, 'publishing-tasks', tasksTableState, draw);

    container.querySelectorAll('.btn-retry-task').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        if (taskId) {
          handleRetry(taskId, btn);
        }
      });
    });
  }

  draw();

  if (!tasksLoaded) {
    loadTasks();
  }
}
