import { apiFetch } from './api-client.js';
import { getLanguage } from './i18n.js';
import { escapeHtml, showToast } from './ui.js';

const MENU_LOCALES = [
  ['zh-CN', '简体中文'],
  ['en', 'English'],
  ['ko', '한국어'],
  ['ja', '日本語']
];

const NEXT_MENU_LABELS = {
  home: { 'zh-CN': '首页', en: 'Home', ko: '홈', ja: 'ホーム' },
  archives: { 'zh-CN': '归档', en: 'Archives', ko: '아카이브', ja: 'アーカイブ' },
  categories: { 'zh-CN': '分类', en: 'Categories', ko: '카테고리', ja: 'カテゴリー' },
  tags: { 'zh-CN': '标签', en: 'Tags', ko: '태그', ja: 'タグ' },
  about: { 'zh-CN': '关于', en: 'About', ko: '소개', ja: 'このサイトについて' },
  search: { 'zh-CN': '搜索', en: 'Search', ko: '검색', ja: '検索' },
  sitemap: { 'zh-CN': '站点地图', en: 'Sitemap', ko: '사이트맵', ja: 'サイトマップ' },
  commonweal: { 'zh-CN': '公益 404', en: 'Commonweal 404', ko: '공익 404', ja: 'Commonweal 404' },
  gptabs: { 'zh-CN': 'GPTabs', en: 'GPTabs', ko: 'GPTabs', ja: 'GPTabs' },
  gptlabs: { 'zh-CN': 'GPTLabs', en: 'GPTLabs', ko: 'GPTLabs', ja: 'GPTLabs' },
  landing: { 'zh-CN': '落地页', en: 'Landing', ko: '랜딩 페이지', ja: 'ランディング' },
  admin: { 'zh-CN': '管理后台', en: 'Admin', ko: '관리자', ja: '管理画面' }
};

const SOCIAL_PRESETS = {
  github: { label: 'GitHub', icon: 'fab fa-github' },
  twitter: { label: 'X / Twitter', icon: 'fab fa-twitter' },
  email: { label: 'Email', icon: 'fa fa-envelope' },
  rss: { label: 'RSS', icon: 'fa fa-rss' },
  zhihu: { label: '知乎', icon: 'fa fa-book' },
  weibo: { label: '微博', icon: 'fab fa-weibo' }
};

const copy = {
  en: {
    title: 'Site Menu Manager',
    intro: 'Edit menus and social links locally first. After diff preview, saving writes to ranbeioc/xhalo-blog-test@main, updates NexT menu/social settings, and triggers a Cloudflare Pages build.',
    listTitle: 'Top menu links',
    socialTitle: 'Sidebar social links',
    socialIntro: 'Manage the social links shown below the avatar in the NexT sidebar.',
    empty: 'No menu items are loaded.',
    socialEmpty: 'No social links are loaded.',
    addTitle: 'Add menu item',
    editTitle: 'Edit menu item',
    addSocialTitle: 'Add social link',
    editSocialTitle: 'Edit social link',
    defaultLabel: 'Default label',
    socialLabel: 'Link name',
    url: 'Link URL',
    path: 'Path',
    icon: 'Icon',
    visible: 'Visible',
    add: 'Add item',
    update: 'Update item',
    addSocial: 'Add social link',
    updateSocial: 'Update social link',
    actions: 'Actions',
    previewDiff: 'Preview diff',
    reset: 'Reset loaded menu and social links',
    save: 'Save to test site',
    saveHelp: 'Saving creates one GitHub commit, updates framework config, NexT menu config, and NexT social config, then triggers a Pages rebuild.',
    moveUp: 'Move up',
    moveDown: 'Move down',
    edit: 'Edit',
    delete: 'Delete',
    labelRequired: 'Enter at least one label and a path.',
    socialRequired: 'Enter a link name and an https:// or mailto: URL.',
    added: 'Menu item added locally.',
    updated: 'Menu item updated locally.',
    socialAdded: 'Social link added locally.',
    socialUpdated: 'Social link updated locally.',
    resetDone: 'Menu and social links reset to the loaded source.',
    diffReady: 'Menu and social link diff generated.',
    diffFailed: 'Diff preview failed',
    saved: 'Menu and social links saved to the test site.',
    saveFailed: 'Test menu save failed',
    pathLabel: 'Path',
    labels: 'Localized labels',
    sourceFile: 'Source file',
    deployTriggered: 'Pages build triggered',
    deployNotTriggered: 'Pages build not triggered',
    working: 'Working...'
  },
  'zh-CN': {
    title: '站点菜单管理',
    intro: '菜单和社交链接先在本地编辑；预览 diff 后保存到 ranbeioc/xhalo-blog-test@main，并同步更新 NexT menu/social 配置，触发 Cloudflare Pages 构建。',
    listTitle: '顶部菜单链接',
    socialTitle: '侧栏社交链接',
    socialIntro: '管理博客首页左侧头像下方的 NexT social 链接列表。',
    empty: '菜单结构中没有项目。',
    socialEmpty: '未检测到社交链接。',
    addTitle: '新增菜单项',
    editTitle: '编辑菜单项',
    addSocialTitle: '新增社交链接',
    editSocialTitle: '编辑社交链接',
    defaultLabel: '默认标签',
    socialLabel: '链接名称',
    url: '链接 URL',
    path: '路径',
    icon: '图标',
    visible: '可见',
    add: '新增项目',
    update: '更新项目',
    addSocial: '新增社交链接',
    updateSocial: '更新社交链接',
    actions: '操作',
    previewDiff: '预览 Diff',
    reset: '重置已加载菜单和社交链接',
    save: '保存到测试站',
    saveHelp: '保存会创建一次 GitHub 提交，同时更新框架配置、NexT 菜单配置和 NexT social 配置，并触发 Pages 重建。',
    moveUp: '上移',
    moveDown: '下移',
    edit: '编辑',
    delete: '删除',
    labelRequired: '请填写至少一个标签和路径。',
    socialRequired: '请填写社交链接名称和 https:// 或 mailto: URL。',
    added: '菜单项已在本地新增。',
    updated: '菜单项已在本地更新。',
    socialAdded: '社交链接已在本地新增。',
    socialUpdated: '社交链接已在本地更新。',
    resetDone: '菜单和社交链接已重置为加载来源。',
    diffReady: '菜单和社交链接 diff 已生成。',
    diffFailed: '预览生成失败',
    saved: '菜单和社交链接已保存到测试站。',
    saveFailed: '测试菜单保存失败',
    pathLabel: '路径',
    labels: '多语言标签',
    sourceFile: '配置文件',
    deployTriggered: '已触发 Pages 构建',
    deployNotTriggered: '未触发 Pages 构建',
    working: '处理中...'
  },
  ko: {
    title: '사이트 메뉴 관리',
    intro: '메뉴와 소셜 링크를 먼저 로컬에서 편집합니다. diff 미리보기 후 저장하면 ranbeioc/xhalo-blog-test@main에 쓰고 NexT menu/social 설정을 갱신하며 Cloudflare Pages 빌드를 트리거합니다.',
    listTitle: '상단 메뉴 링크',
    socialTitle: '사이드바 소셜 링크',
    socialIntro: '블로그 홈 왼쪽 아바타 아래에 표시되는 NexT social 링크 목록을 관리합니다.',
    empty: '불러온 메뉴 항목이 없습니다.',
    socialEmpty: '불러온 소셜 링크가 없습니다.',
    addTitle: '메뉴 항목 추가',
    editTitle: '메뉴 항목 편집',
    addSocialTitle: '소셜 링크 추가',
    editSocialTitle: '소셜 링크 편집',
    defaultLabel: '기본 라벨',
    socialLabel: '링크 이름',
    url: '링크 URL',
    path: '경로',
    icon: '아이콘',
    visible: '표시',
    add: '항목 추가',
    update: '항목 업데이트',
    addSocial: '소셜 링크 추가',
    updateSocial: '소셜 링크 업데이트',
    actions: '작업',
    previewDiff: 'Diff 미리보기',
    reset: '불러온 메뉴와 소셜 링크 초기화',
    save: '테스트 사이트에 저장',
    saveHelp: '저장하면 GitHub 커밋 하나로 프레임워크 설정, NexT 메뉴 설정, NexT social 설정을 업데이트하고 Pages 재빌드를 트리거합니다.',
    moveUp: '위로',
    moveDown: '아래로',
    edit: '편집',
    delete: '삭제',
    labelRequired: '하나 이상의 라벨과 경로를 입력하세요.',
    socialRequired: '소셜 링크 이름과 https:// 또는 mailto: URL을 입력하세요.',
    added: '메뉴 항목을 로컬에 추가했습니다.',
    updated: '메뉴 항목을 로컬에서 업데이트했습니다.',
    socialAdded: '소셜 링크를 로컬에 추가했습니다.',
    socialUpdated: '소셜 링크를 로컬에서 업데이트했습니다.',
    resetDone: '메뉴와 소셜 링크를 불러온 원본으로 되돌렸습니다.',
    diffReady: '메뉴와 소셜 링크 diff를 생성했습니다.',
    diffFailed: 'diff 미리보기 실패',
    saved: '메뉴와 소셜 링크를 테스트 사이트에 저장했습니다.',
    saveFailed: '테스트 메뉴 저장 실패',
    pathLabel: '경로',
    labels: '다국어 라벨',
    sourceFile: '설정 파일',
    deployTriggered: 'Pages 빌드가 트리거됨',
    deployNotTriggered: 'Pages 빌드가 트리거되지 않음',
    working: '처리 중...'
  },
  ja: {
    title: 'サイトメニュー管理',
    intro: 'メニューとソーシャルリンクはまずローカルで編集します。diff プレビュー後に保存すると ranbeioc/xhalo-blog-test@main へ書き込み、NexT menu/social 設定を更新して Cloudflare Pages ビルドを開始します。',
    listTitle: '上部メニューリンク',
    socialTitle: 'サイドバーのソーシャルリンク',
    socialIntro: 'ブログホーム左側のアバター下に表示される NexT social リンク一覧を管理します。',
    empty: '読み込まれたメニュー項目はありません。',
    socialEmpty: '読み込まれたソーシャルリンクはありません。',
    addTitle: 'メニュー項目を追加',
    editTitle: 'メニュー項目を編集',
    addSocialTitle: 'ソーシャルリンクを追加',
    editSocialTitle: 'ソーシャルリンクを編集',
    defaultLabel: '既定ラベル',
    socialLabel: 'リンク名',
    url: 'リンク URL',
    path: 'パス',
    icon: 'アイコン',
    visible: '表示',
    add: '項目を追加',
    update: '項目を更新',
    addSocial: 'ソーシャルリンクを追加',
    updateSocial: 'ソーシャルリンクを更新',
    actions: '操作',
    previewDiff: 'Diff をプレビュー',
    reset: '読み込み済みメニューとソーシャルリンクをリセット',
    save: 'テストサイトに保存',
    saveHelp: '保存すると 1 つの GitHub コミットでフレームワーク設定、NexT メニュー設定、NexT social 設定を更新し、Pages 再ビルドを開始します。',
    moveUp: '上へ',
    moveDown: '下へ',
    edit: '編集',
    delete: '削除',
    labelRequired: '少なくとも 1 つのラベルとパスを入力してください。',
    socialRequired: 'ソーシャルリンク名と https:// または mailto: URL を入力してください。',
    added: 'メニュー項目をローカルに追加しました。',
    updated: 'メニュー項目をローカルで更新しました。',
    socialAdded: 'ソーシャルリンクをローカルに追加しました。',
    socialUpdated: 'ソーシャルリンクをローカルで更新しました。',
    resetDone: 'メニューとソーシャルリンクを読み込み元に戻しました。',
    diffReady: 'メニューとソーシャルリンクの diff を生成しました。',
    diffFailed: 'diff プレビューに失敗しました',
    saved: 'メニューとソーシャルリンクをテストサイトに保存しました。',
    saveFailed: 'テストメニュー保存に失敗しました',
    pathLabel: 'パス',
    labels: '多言語ラベル',
    sourceFile: '設定ファイル',
    deployTriggered: 'Pages ビルドを開始しました',
    deployNotTriggered: 'Pages ビルドは開始されていません',
    working: '処理中...'
  }
};

function c(key) {
  const language = getLanguage();
  return copy[language]?.[key] || copy.en[key] || key;
}

export async function fetchSiteMenu() {
  const res = await apiFetch('/api/site/menu');
  if (!res.ok) throw new Error(`Menu API returned status ${res.status}`);
  return await res.json();
}

function emptyMenuItem(order = 0) {
  return { id: `menu-${Date.now()}`, label: '', labels: {}, path: '/', external: false, visible: true, order, icon: '' };
}

function emptySocialLink(order = 0) {
  return { id: `social-${Date.now()}`, label: '', url: 'https://', icon: 'fa fa-link', visible: true, order };
}

function normalizeMenuKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function inferNextLabels(item, fallback) {
  const candidates = [item?.id, item?.key, item?.label, item?.name, fallback].map(normalizeMenuKey);
  const known = candidates.map((key) => NEXT_MENU_LABELS[key]).find(Boolean);
  if (known) return { ...known };
  if (!fallback) return {};
  return Object.fromEntries(MENU_LOCALES.map(([locale]) => [locale, fallback]));
}

function normalizeMenuItem(item, index = 0) {
  const rawLabels = item?.labels && typeof item.labels === 'object' && !Array.isArray(item.labels) ? { ...item.labels } : {};
  const fallback = item?.label || item?.name || rawLabels['zh-CN'] || rawLabels.en || item?.id || '';
  const labels = { ...inferNextLabels(item, fallback), ...rawLabels };
  if (fallback && Object.keys(labels).length === 0) {
    labels['zh-CN'] = fallback;
    labels.en = fallback;
  }
  return {
    id: item?.id || slugify(fallback) || `menu-item-${index}`,
    label: item?.label || fallback || labels['zh-CN'] || labels.en || '',
    labels,
    path: item?.path || '/',
    external: Boolean(item?.external),
    visible: item?.visible !== false,
    order: Number.isInteger(Number(item?.order)) ? Number(item.order) : index * 10,
    icon: item?.icon || ''
  };
}

function normalizeSocialLink(item, index = 0) {
  const preset = SOCIAL_PRESETS[normalizeMenuKey(item?.label || item?.id)] || {};
  const label = item?.label || preset.label || item?.id || '';
  return {
    id: item?.id || slugify(label || item?.url) || `social-link-${index}`,
    label,
    url: item?.url || item?.path || 'https://',
    icon: item?.icon || preset.icon || 'fa fa-link',
    visible: item?.visible !== false,
    order: Number.isInteger(Number(item?.order)) ? Number(item.order) : index * 10
  };
}

function cloneMenu(menu) {
  return structuredClone(Array.isArray(menu) ? menu : []).map(normalizeMenuItem);
}

function cloneSocialLinks(socialLinks) {
  return structuredClone(Array.isArray(socialLinks) ? socialLinks : []).map(normalizeSocialLink);
}

function displayLabel(item) {
  const language = getLanguage();
  return item.labels?.[language] || item.labels?.['zh-CN'] || item.labels?.en || item.label || item.id;
}

function normalizeLabels(item) {
  const labels = { ...(item.labels || {}) };
  const inferred = inferNextLabels(item, item.label || item.id);
  for (const [locale, value] of Object.entries(inferred)) {
    if (!labels[locale]) labels[locale] = value;
  }
  if (item.label && !labels['zh-CN'] && !NEXT_MENU_LABELS[normalizeMenuKey(item.label)]) labels['zh-CN'] = item.label;
  if (item.label && !labels.en && !NEXT_MENU_LABELS[normalizeMenuKey(item.label)]) labels.en = item.label;
  return Object.fromEntries(Object.entries(labels).filter(([, value]) => String(value || '').trim()));
}

export function renderMenuManager(container, { initialMenuData }) {
  const originalMenu = cloneMenu(initialMenuData?.menu);
  const originalSocialLinks = cloneSocialLinks(initialMenuData?.socialLinks);
  let menuItems = cloneMenu(originalMenu);
  let socialLinks = cloneSocialLinks(originalSocialLinks);
  let editingIndex = null;
  let editingSocialIndex = null;
  let draftItem = emptyMenuItem(menuItems.length * 10);
  let draftSocial = emptySocialLink(socialLinks.length * 10);
  let diffHtml = '';
  let actionResultHtml = '';
  let loadingState = false;

  function normalizeOrder() {
    menuItems = menuItems.map((item, index) => ({ ...item, order: index * 10 }));
  }

  function normalizeSocialOrder() {
    socialLinks = socialLinks.map((item, index) => ({ ...item, order: index * 10 }));
  }

  async function generateMenuDiff() {
    loadingState = true;
    diffHtml = '';
    draw();
    try {
      const res = await apiFetch('/api/site/menu/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuItems.map(prepareForSubmit), socialLinks: socialLinks.map(prepareSocialForSubmit) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diff generation failed');
      const diff = data.diff || {};
      diffHtml = `
        <div class="diff-container card">
          <h4>${escapeHtml(c('previewDiff'))}</h4>
          <p>${escapeHtml(c('sourceFile'))}: <code>${escapeHtml(diff.filePath || data.source || '_config.yml')}</code></p>
          <div class="diff-code-view"><pre class="diff-diff">${escapeHtml(diff.diffText || 'No menu changes detected.')}</pre></div>
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

  async function saveMenuToTest() {
    loadingState = true;
    actionResultHtml = '';
    draw();
    try {
      const res = await apiFetch('/api/site/menu/test-direct-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu: menuItems.map(prepareForSubmit),
          socialLinks: socialLinks.map(prepareSocialForSubmit),
          baseSha: initialMenuData?.sha
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.code || 'Test menu update failed');
      const deploy = data.pagesDeploy || {};
      const deployState = deploy.triggered
        ? `<span class="status-badge" data-state="ok">${escapeHtml(c('deployTriggered'))}</span>`
        : `<span class="status-badge" data-state="warning">${escapeHtml(c('deployNotTriggered'))}</span>`;
      actionResultHtml = `
        <div class="alert alert-success">
          <strong>${escapeHtml(c('saved'))}</strong>
          <code>${escapeHtml(data.targetRepo || '')}@${escapeHtml(data.targetBranch || '')}</code><br/>
          ${escapeHtml(c('sourceFile'))}: <code>${escapeHtml((data.targetPaths || [data.targetPath || '']).join(', '))}</code>
          ${data.commitSha ? `<br/>Commit: <code>${escapeHtml(data.commitSha.substring(0, 12))}</code>` : ''}
          <br/>${deployState}
          ${deploy.deploymentId ? `<br/>Deployment: <code>${escapeHtml(deploy.deploymentId)}</code>` : ''}
          ${deploy.deploymentUrl ? `<br/>Preview: <a href="${escapeHtml(deploy.deploymentUrl)}" target="_blank" rel="noreferrer">${escapeHtml(deploy.deploymentUrl)}</a>` : ''}
        </div>
      `;
      showToast(c('saved'), deploy.triggered ? 'success' : 'warning');
    } catch (err) {
      actionResultHtml = `<div class="alert alert-error">${escapeHtml(c('saveFailed'))}: ${escapeHtml(err.message)}</div>`;
      showToast(`${c('saveFailed')}: ${err.message}`, 'error');
    } finally {
      loadingState = false;
      draw();
    }
  }

  function prepareForSubmit(item) {
    const labels = normalizeLabels(item);
    return {
      ...item,
      label: labels['zh-CN'] || labels.en || item.label || item.id,
      labels,
      external: Boolean(item.external),
      visible: item.visible !== false,
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : 0
    };
  }

  function prepareSocialForSubmit(item) {
    return {
      id: item.id || slugify(item.label || item.url),
      label: item.label,
      url: item.url,
      icon: item.icon || 'fa fa-link',
      visible: item.visible !== false,
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : 0
    };
  }

  function startEdit(index) {
    editingIndex = index;
    draftItem = normalizeMenuItem(menuItems[index], index);
    draw();
  }

  function startSocialEdit(index) {
    editingSocialIndex = index;
    draftSocial = normalizeSocialLink(socialLinks[index], index);
    draw();
  }

  function deleteMenuItem(index) {
    const deletedName = displayLabel(menuItems[index]) || 'Item';
    menuItems.splice(index, 1);
    normalizeOrder();
    diffHtml = '';
    showToast(`${c('delete')}: ${deletedName}`, 'info');
    draw();
  }

  function deleteSocialLink(index) {
    const deletedName = socialLinks[index]?.label || 'Social';
    socialLinks.splice(index, 1);
    normalizeSocialOrder();
    diffHtml = '';
    showToast(`${c('delete')}: ${deletedName}`, 'info');
    draw();
  }

  function moveMenuItem(index, delta) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= menuItems.length) return;
    const [item] = menuItems.splice(index, 1);
    menuItems.splice(nextIndex, 0, item);
    normalizeOrder();
    diffHtml = '';
    draw();
  }

  function moveSocialLink(index, delta) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= socialLinks.length) return;
    const [item] = socialLinks.splice(index, 1);
    socialLinks.splice(nextIndex, 0, item);
    normalizeSocialOrder();
    diffHtml = '';
    draw();
  }

  function resetMenu() {
    menuItems = cloneMenu(originalMenu);
    socialLinks = cloneSocialLinks(originalSocialLinks);
    editingIndex = null;
    editingSocialIndex = null;
    draftItem = emptyMenuItem(menuItems.length * 10);
    draftSocial = emptySocialLink(socialLinks.length * 10);
    diffHtml = '';
    actionResultHtml = '';
    showToast(c('resetDone'), 'info');
    draw();
  }

  function submitDraft(event) {
    event.preventDefault();
    const normalized = prepareForSubmit({
      ...draftItem,
      id: draftItem.id || slugify(draftItem.label || draftItem.labels?.['zh-CN']),
      order: Number.isInteger(Number(draftItem.order)) ? Number(draftItem.order) : menuItems.length * 10
    });
    if (!normalized.label || !normalized.path) {
      showToast(c('labelRequired'), 'warning');
      return;
    }
    if (editingIndex == null) {
      menuItems.push(normalized);
      showToast(c('added'), 'success');
    } else {
      menuItems[editingIndex] = normalized;
      showToast(c('updated'), 'success');
    }
    normalizeOrder();
    editingIndex = null;
    draftItem = emptyMenuItem(menuItems.length * 10);
    diffHtml = '';
    draw();
  }

  function submitSocialDraft(event) {
    event.preventDefault();
    const normalized = prepareSocialForSubmit({
      ...draftSocial,
      id: draftSocial.id || slugify(draftSocial.label || draftSocial.url),
      order: Number.isInteger(Number(draftSocial.order)) ? Number(draftSocial.order) : socialLinks.length * 10
    });
    if (!normalized.label || !/^(https:\/\/|mailto:)/i.test(normalized.url || '')) {
      showToast(c('socialRequired'), 'warning');
      return;
    }
    if (editingSocialIndex == null) {
      socialLinks.push(normalized);
      showToast(c('socialAdded'), 'success');
    } else {
      socialLinks[editingSocialIndex] = normalized;
      showToast(c('socialUpdated'), 'success');
    }
    normalizeSocialOrder();
    editingSocialIndex = null;
    draftSocial = emptySocialLink(socialLinks.length * 10);
    diffHtml = '';
    draw();
  }

  function renderLabels(item) {
    const labels = item.labels || {};
    return Object.entries(labels).length > 0
      ? `<span>${escapeHtml(c('labels'))}: ${Object.entries(labels).map(([locale, value]) => `<code>${escapeHtml(locale)}=${escapeHtml(value)}</code>`).join(' ')}</span>`
      : '';
  }

  function renderMenuList() {
    return menuItems.length > 0 ? menuItems.map((item, index) => `
      <div class="menu-item-row card">
        <div class="item-info">
          <strong>${escapeHtml(displayLabel(item))}</strong>
          <span>${escapeHtml(c('pathLabel'))}: <code>${escapeHtml(item.path)}</code></span>
          <span>${escapeHtml(c('visible'))}: <code>${item.visible === false ? 'false' : 'true'}</code></span>
          ${item.icon ? `<span>${escapeHtml(c('icon'))}: <code>${escapeHtml(item.icon)}</code></span>` : ''}
          ${renderLabels(item)}
        </div>
        <div class="inline-actions">
          <button class="button-small button-secondary btn-move-up" data-index="${index}">${escapeHtml(c('moveUp'))}</button>
          <button class="button-small button-secondary btn-move-down" data-index="${index}">${escapeHtml(c('moveDown'))}</button>
          <button class="button-small button-secondary btn-edit-item" data-index="${index}">${escapeHtml(c('edit'))}</button>
          <button class="button-small button-danger btn-delete-item" data-index="${index}">${escapeHtml(c('delete'))}</button>
        </div>
      </div>
    `).join('') : `<p class="info-text">${escapeHtml(c('empty'))}</p>`;
  }

  function renderSocialList() {
    return socialLinks.length > 0 ? socialLinks.map((item, index) => `
      <div class="menu-item-row card">
        <div class="item-info">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(c('url'))}: <code>${escapeHtml(item.url)}</code></span>
          <span>${escapeHtml(c('visible'))}: <code>${item.visible === false ? 'false' : 'true'}</code></span>
          ${item.icon ? `<span>${escapeHtml(c('icon'))}: <code>${escapeHtml(item.icon)}</code></span>` : ''}
        </div>
        <div class="inline-actions">
          <button class="button-small button-secondary btn-social-up" data-index="${index}">${escapeHtml(c('moveUp'))}</button>
          <button class="button-small button-secondary btn-social-down" data-index="${index}">${escapeHtml(c('moveDown'))}</button>
          <button class="button-small button-secondary btn-edit-social" data-index="${index}">${escapeHtml(c('edit'))}</button>
          <button class="button-small button-danger btn-delete-social" data-index="${index}">${escapeHtml(c('delete'))}</button>
        </div>
      </div>
    `).join('') : `<p class="info-text">${escapeHtml(c('socialEmpty'))}</p>`;
  }

  function draw() {
    container.innerHTML = `
      <div class="menu-workspace">
        <h2>${escapeHtml(c('title'))}</h2>
        <div class="alert alert-info">${escapeHtml(c('intro'))}</div>
        <div class="menu-layout-grid">
          <div class="menu-stack">
            <div class="card menu-items-list-card">
              <h3>${escapeHtml(c('listTitle'))}</h3>
              <div class="menu-list">${renderMenuList()}</div>
              <hr class="section-rule"/>
              <h3>${escapeHtml(editingIndex == null ? c('addTitle') : c('editTitle'))}</h3>
              <form id="menu-item-form" class="inline-form menu-edit-form">
                <label><span>${escapeHtml(c('defaultLabel'))}</span><input type="text" id="item-label" value="${escapeHtml(draftItem.label || '')}" placeholder="home" /></label>
                ${MENU_LOCALES.map(([locale, label]) => `
                  <label><span>${escapeHtml(label)} ${escapeHtml(c('defaultLabel'))}</span><input type="text" data-label-locale="${escapeHtml(locale)}" value="${escapeHtml(draftItem.labels?.[locale] || '')}" placeholder="${escapeHtml(label)}" /></label>
                `).join('')}
                <label><span>${escapeHtml(c('path'))}</span><input type="text" id="item-path" value="${escapeHtml(draftItem.path || '/')}" placeholder="/about/" /></label>
                <label><span>${escapeHtml(c('icon'))}</span><input type="text" id="item-icon" value="${escapeHtml(draftItem.icon || '')}" placeholder="home" /></label>
                <label><span>${escapeHtml(c('visible'))}</span><select id="item-visible"><option value="true" ${draftItem.visible !== false ? 'selected' : ''}>true</option><option value="false" ${draftItem.visible === false ? 'selected' : ''}>false</option></select></label>
                <button type="submit" class="button-secondary full-width-action">${escapeHtml(editingIndex == null ? c('add') : c('update'))}</button>
              </form>
            </div>
            <div class="card social-links-card">
              <h3>${escapeHtml(c('socialTitle'))}</h3>
              <p class="help-text">${escapeHtml(c('socialIntro'))}</p>
              <div class="menu-list">${renderSocialList()}</div>
              <hr class="section-rule"/>
              <h3>${escapeHtml(editingSocialIndex == null ? c('addSocialTitle') : c('editSocialTitle'))}</h3>
              <form id="social-link-form" class="inline-form menu-edit-form">
                <label><span>${escapeHtml(c('socialLabel'))}</span><input type="text" id="social-label" value="${escapeHtml(draftSocial.label || '')}" placeholder="GitHub" /></label>
                <label><span>${escapeHtml(c('url'))}</span><input type="text" id="social-url" value="${escapeHtml(draftSocial.url || '')}" placeholder="https://github.com/ranbeioc" /></label>
                <label><span>${escapeHtml(c('icon'))}</span><input type="text" id="social-icon" value="${escapeHtml(draftSocial.icon || '')}" placeholder="fab fa-github" /></label>
                <label><span>${escapeHtml(c('visible'))}</span><select id="social-visible"><option value="true" ${draftSocial.visible !== false ? 'selected' : ''}>true</option><option value="false" ${draftSocial.visible === false ? 'selected' : ''}>false</option></select></label>
                <button type="submit" class="button-secondary full-width-action">${escapeHtml(editingSocialIndex == null ? c('addSocial') : c('updateSocial'))}</button>
              </form>
            </div>
          </div>
          <div class="menu-preview-actions-card">
            <div class="card operational-card">
              <h3>${escapeHtml(c('actions'))}</h3>
              <button class="button-primary full-width-action" id="btn-preview-menu-diff">${escapeHtml(c('previewDiff'))}</button>
              <button class="button-secondary full-width-action" id="btn-reset-menu">${escapeHtml(c('reset'))}</button>
              <button class="button-primary full-width-action" id="btn-save-menu-test">${escapeHtml(c('save'))}</button>
              <p class="help-text">${escapeHtml(c('saveHelp'))}</p>
            </div>
            ${loadingState ? `<div class="info-text">${escapeHtml(c('working'))}</div>` : ''}
            ${actionResultHtml}
            ${diffHtml}
          </div>
        </div>
      </div>
    `;
    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.btn-delete-item').forEach((btn) => btn.addEventListener('click', () => deleteMenuItem(Number(btn.getAttribute('data-index')))));
    container.querySelectorAll('.btn-edit-item').forEach((btn) => btn.addEventListener('click', () => startEdit(Number(btn.getAttribute('data-index')))));
    container.querySelectorAll('.btn-move-up').forEach((btn) => btn.addEventListener('click', () => moveMenuItem(Number(btn.getAttribute('data-index')), -1)));
    container.querySelectorAll('.btn-move-down').forEach((btn) => btn.addEventListener('click', () => moveMenuItem(Number(btn.getAttribute('data-index')), 1)));
    container.querySelectorAll('.btn-delete-social').forEach((btn) => btn.addEventListener('click', () => deleteSocialLink(Number(btn.getAttribute('data-index')))));
    container.querySelectorAll('.btn-edit-social').forEach((btn) => btn.addEventListener('click', () => startSocialEdit(Number(btn.getAttribute('data-index')))));
    container.querySelectorAll('.btn-social-up').forEach((btn) => btn.addEventListener('click', () => moveSocialLink(Number(btn.getAttribute('data-index')), -1)));
    container.querySelectorAll('.btn-social-down').forEach((btn) => btn.addEventListener('click', () => moveSocialLink(Number(btn.getAttribute('data-index')), 1)));

    const form = container.querySelector('#menu-item-form');
    if (form) {
      form.addEventListener('submit', submitDraft);
      for (const [key, selector] of Object.entries({ label: '#item-label', path: '#item-path', icon: '#item-icon', visible: '#item-visible' })) {
        const input = container.querySelector(selector);
        const listener = (event) => {
          draftItem[key] = key === 'visible' ? event.target.value === 'true' : event.target.value;
        };
        input?.addEventListener('input', listener);
        input?.addEventListener('change', listener);
      }
      container.querySelectorAll('[data-label-locale]').forEach((input) => {
        input.addEventListener('input', (event) => {
          const locale = event.target.getAttribute('data-label-locale');
          draftItem.labels = { ...(draftItem.labels || {}), [locale]: event.target.value };
        });
      });
    }

    const socialForm = container.querySelector('#social-link-form');
    if (socialForm) {
      socialForm.addEventListener('submit', submitSocialDraft);
      for (const [key, selector] of Object.entries({ label: '#social-label', url: '#social-url', icon: '#social-icon', visible: '#social-visible' })) {
        const input = container.querySelector(selector);
        const listener = (event) => {
          draftSocial[key] = key === 'visible' ? event.target.value === 'true' : event.target.value;
        };
        input?.addEventListener('input', listener);
        input?.addEventListener('change', listener);
      }
    }

    container.querySelector('#btn-preview-menu-diff')?.addEventListener('click', generateMenuDiff);
    container.querySelector('#btn-reset-menu')?.addEventListener('click', resetMenu);
    container.querySelector('#btn-save-menu-test')?.addEventListener('click', saveMenuToTest);
  }

  draw();
}

function slugify(value) {
  return String(value || 'menu-item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'menu-item';
}
