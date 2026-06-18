// Interactive scripts and locale runtime for xhalo-blog landing page.

const en = {
  'meta.title': 'xhalo-blog - Cloudflare-Native Blog Framework Scaffold',
  'meta.description': 'Open-source Cloudflare-native blog framework for Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub publishing, and a private test-site migration flow.',
  'meta.keywords': 'xhalo-blog, Cloudflare Pages blog, Hexo NexT migration, Workers API, D1, R2, GitHub publishing',
  'nav.features': 'Features',
  'nav.architecture': 'Architecture',
  'nav.quickstart': 'Quickstart',
  'language.label': 'Language',
  'hero.badge': 'Cloudflare Native',
  'hero.title': 'The Ultimate <span class="gradient-text">Cloudflare-Native</span> Blog Scaffold',
  'hero.subtitle': 'Deploy a fast personal blog or developer journal on Cloudflare. Use Hexo/NexT for static output, Workers for authenticated admin APIs, D1 for metadata, and R2 for media assets.',
  'hero.primaryCta': 'Deploy Now',
  'hero.secondaryCta': 'Learn More ->',
  'hero.terminal': '<span class="code-comment"># Clone and validate the framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog validation passed.</span>\n<span class="code-info">INFO Landing build: npm run build:landing</span>\n<span class="code-info">INFO Test site: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.title': 'Powerful Capabilities, <span class="gradient-text">Zero Servers</span>',
  'features.lead': 'xhalo-blog provides the framework, Admin, Workers API, migration tooling, and Cloudflare deployment conventions for a secure edge-native blog.',
  'features.hexo.title': 'Hexo Speed',
  'features.hexo.body': 'Static generation with standard Markdown compatibility and a NexT-compatible initialization path.',
  'features.d1.title': 'D1 SQLite Database',
  'features.d1.body': 'Serverless relational metadata storage for sessions, admins, audit logs, and publishing state.',
  'features.r2.title': 'R2 Object Storage',
  'features.r2.body': 'Media and attachment storage with test-only gates and safe signed-upload flows.',
  'features.security.title': 'Turnstile Security',
  'features.security.body': 'Protect mutation endpoints with authentication, environment gates, Turnstile, and audit logs.',
  'features.admin.title': 'Admin Panel UI',
  'features.admin.body': 'Edit posts, menus, media, Hexo/NexT config, GitHub, and Cloudflare integration state from one dashboard.',
  'features.actions.title': 'GitHub Publishing',
  'features.actions.body': 'Keep Git as the content source of truth with PR-only production publishing and test-only direct publishing.',
  'migration.title': 'Hexo/NexT Migration, <span class="gradient-text">Standardized</span>',
  'migration.lead': 'Initialize a private test site from the default NexT starter or import an existing Hexo/NexT blog with posts, uploads, menus, theme files, plugin config, and an audit report.',
  'migration.starter.title': 'Starter Mode',
  'migration.starter.body': 'Generate a clean NexT site with a welcome post when no historical source is provided.',
  'migration.import.title': 'Import Mode',
  'migration.import.body': 'Copy historical posts, uploads, pages, theme config, feed/search/sitemap/media plugin settings, and safe audit outputs into a private test repository.',
  'migration.guide.title': 'Read the Guide',
  'migration.guide.body': 'Use the documented flow to keep open-source framework code separate from private blog content.',
  'migration.guide.cta': 'Migration Guide',
  'architecture.title': 'Edge Architecture Overview',
  'architecture.lead': 'xhalo-blog combines Cloudflare Pages, Workers, D1, R2, and GitHub to keep the static blog fast while preserving authenticated admin workflows.',
  'architecture.svg.user': 'Visitor / Admin',
  'architecture.svg.edge': 'Cloudflare Edge Network',
  'architecture.svg.pages': 'CF Pages',
  'architecture.svg.pagesSub': 'Static HTML / CSS',
  'architecture.svg.worker': 'CF Workers API',
  'architecture.svg.workerSub': 'Serverless Router',
  'architecture.svg.r2': 'CF R2 Bucket',
  'architecture.svg.r2Sub': 'Media & Assets',
  'architecture.svg.d1': 'CF D1 Database',
  'architecture.svg.d1Sub': 'SQLite Metadata',
  'quickstart.title': 'Get Started in <span class="gradient-text">2 Minutes</span>',
  'quickstart.lead': 'Create a starter site, import a Hexo/NexT blog, configure custom domains, and connect the right Cloudflare Pages projects.',
  'quickstart.step1.title': 'Clone and Install',
  'quickstart.step1.body': 'Get the framework source and install the locked workspace dependencies.',
  'quickstart.step2.title': 'Initialize a Test Site',
  'quickstart.step2.body': 'Generate a default NexT starter or import an existing Hexo/NexT source into a private test repository, then set the site URL to your main domain.',
  'quickstart.step3.title': 'Build and Validate',
  'quickstart.step3.body': 'Run the repository validation gate and build the landing page before publishing.',
  'quickstart.step4.title': 'Connect Cloudflare Pages',
  'quickstart.step4.body': 'Use one Pages project for the open-source landing page and one Pages project for the private full blog test or production site.',
  'footer.copyright': '© 2026 xhalo-blog scaffold. Released under the MIT License.',
  'footer.license': 'License',
  'footer.security': 'Security',
  'footer.docs': 'Documentation'
};

const dictionaries = {
  en,
  'zh-CN': {
    ...en,
    'meta.title': 'xhalo-blog - Cloudflare 原生博客框架脚手架',
    'meta.description': '面向 Hexo/NexT、Cloudflare Pages、Workers API、D1、R2、GitHub 发布和私有测试站迁移流程的开源 Cloudflare 原生博客框架。',
    'meta.keywords': 'xhalo-blog, Cloudflare Pages 博客, Hexo NexT 迁移, Workers API, D1, R2, GitHub 发布',
    'nav.features': '功能',
    'nav.architecture': '架构',
    'nav.quickstart': '快速开始',
    'language.label': '语言',
    'hero.badge': 'Cloudflare 原生',
    'hero.title': '面向 Cloudflare 的<span class="gradient-text">现代博客框架</span>',
    'hero.subtitle': '在 Cloudflare 上部署高速个人博客或开发日志。Hexo/NexT 负责静态输出，Workers 负责认证后台 API，D1 存储元数据，R2 承载媒体资产。',
    'hero.primaryCta': '开始部署',
    'hero.secondaryCta': '了解更多 ->',
    'hero.terminal': '<span class="code-comment"># 克隆并验证框架</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 验证通过。</span>\n<span class="code-info">INFO 落地页构建: npm run build:landing</span>\n<span class="code-info">INFO 测试站初始化: npm run init:hexo-next -- --target ../my-blog-test</span>',
    'features.title': '完整能力，<span class="gradient-text">无需服务器</span>',
    'features.lead': 'xhalo-blog 提供框架、Admin、Workers API、迁移工具和 Cloudflare 部署约定，用于构建安全的边缘原生博客。',
    'features.hexo.title': 'Hexo 速度',
    'features.hexo.body': '标准 Markdown 静态生成，并提供 NexT 兼容初始化路径。',
    'features.d1.title': 'D1 SQLite 数据库',
    'features.d1.body': '用于 session、管理员、审计日志和发布状态的边缘关系型元数据存储。',
    'features.r2.title': 'R2 对象存储',
    'features.r2.body': '媒体和附件资产层，配合测试写入 gate 与安全签名上传流程。',
    'features.security.title': 'Turnstile 安全防护',
    'features.security.body': '通过认证、环境 gate、Turnstile 和审计日志保护写入端点。',
    'features.admin.title': '管理后台 UI',
    'features.admin.body': '集中编辑文章、菜单、媒体、Hexo/NexT 配置、GitHub 和 Cloudflare 集成状态。',
    'features.actions.title': 'GitHub 发布',
    'features.actions.body': '以 Git 作为内容真相来源，生产只走 PR，测试站可走受控 direct publish。',
    'migration.title': 'Hexo/NexT 迁移，<span class="gradient-text">标准化</span>',
    'migration.lead': '可从默认 NexT 起步站初始化私有测试站，也可导入既有 Hexo/NexT 博客的文章、上传、菜单、主题、插件配置和审计报告。',
    'migration.starter.title': '起步模式',
    'migration.starter.body': '没有历史来源时，生成干净的 NexT 站点和默认欢迎测试文章。',
    'migration.import.title': '导入模式',
    'migration.import.body': '将历史文章、上传、独立页面、主题配置、feed/search/sitemap/media 插件配置和安全审计输出复制到私有测试仓库。',
    'migration.guide.title': '阅读指南',
    'migration.guide.body': '使用标准流程隔离开源框架代码和私有博客内容。',
    'migration.guide.cta': '迁移指南',
    'architecture.title': '边缘架构概览',
    'architecture.lead': 'xhalo-blog 组合 Cloudflare Pages、Workers、D1、R2 和 GitHub，在保持静态博客速度的同时保留认证后台工作流。',
    'architecture.svg.user': '访客 / 管理员',
    'architecture.svg.edge': 'Cloudflare 边缘网络',
    'architecture.svg.pagesSub': '静态 HTML / CSS',
    'architecture.svg.workerSub': '无服务器路由',
    'architecture.svg.r2Sub': '媒体与资产',
    'architecture.svg.d1Sub': 'SQLite 元数据',
    'quickstart.title': '<span class="gradient-text">2 分钟</span>快速开始',
    'quickstart.lead': '创建起步站、导入 Hexo/NexT 博客、配置自定义主域名，并连接正确的 Cloudflare Pages 项目。',
    'quickstart.step1.title': '克隆并安装',
    'quickstart.step1.body': '获取框架源码并安装 lockfile 固定的工作区依赖。',
    'quickstart.step2.title': '初始化测试站',
    'quickstart.step2.body': '生成默认 NexT 起步站，或将既有 Hexo/NexT 源导入私有测试仓库，并将站点 URL 设置为你的主域名。',
    'quickstart.step3.title': '构建并验证',
    'quickstart.step3.body': '发布前运行仓库验证 gate，并构建落地页。',
    'quickstart.step4.title': '连接 Cloudflare Pages',
    'quickstart.step4.body': '开源落地页使用一个 Pages 项目，私有完整博客测试站或生产站使用另一个 Pages 项目。',
    'footer.copyright': '© 2026 xhalo-blog scaffold。基于 MIT License 发布。',
    'footer.license': '许可证',
    'footer.security': '安全',
    'footer.docs': '文档'
  },
  ko: makeLocale({
    title: 'xhalo-blog - Cloudflare 네이티브 블로그 프레임워크',
    description: 'Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub 게시 및 비공개 테스트 사이트 마이그레이션을 위한 오픈소스 블로그 프레임워크.',
    nav: ['기능', '아키텍처', '빠른 시작', '언어'],
    hero: ['Cloudflare 네이티브', '궁극의 <span class="gradient-text">Cloudflare 네이티브</span> 블로그 스캐폴드', 'Hexo/NexT 정적 출력, Workers 인증 API, D1 메타데이터, R2 미디어 자산으로 Cloudflare 위에 빠른 블로그를 배포합니다.', '지금 배포', '더 알아보기 ->'],
    quickstart: ['<span class="gradient-text">2분</span> 안에 시작', '스타터 사이트 생성, Hexo/NexT 가져오기, 사용자 지정 도메인 설정, Cloudflare Pages 프로젝트 연결.', '클론 및 설치', '테스트 사이트 초기화', '빌드 및 검증', 'Cloudflare Pages 연결']
  }),
  ja: makeLocale({
    title: 'xhalo-blog - Cloudflare ネイティブなブログフレームワーク',
    description: 'Hexo/NexT、Cloudflare Pages、Workers API、D1、R2、GitHub 公開、非公開テストサイト移行に対応するオープンソースブログフレームワーク。',
    nav: ['機能', 'アーキテクチャ', 'クイックスタート', '言語'],
    hero: ['Cloudflare ネイティブ', '究極の <span class="gradient-text">Cloudflare ネイティブ</span> ブログ基盤', 'Hexo/NexT の静的出力、Workers 認証 API、D1 メタデータ、R2 メディアで高速なブログを Cloudflare にデプロイします。', '今すぐデプロイ', '詳しく見る ->'],
    quickstart: ['<span class="gradient-text">2分</span>で開始', 'スターター作成、Hexo/NexT 取り込み、カスタムドメイン設定、Cloudflare Pages 接続を行います。', 'クローンとインストール', 'テストサイトを初期化', 'ビルドと検証', 'Cloudflare Pages に接続']
  }),
  fr: makeLocale({
    title: 'xhalo-blog - Framework de blog natif Cloudflare',
    description: 'Framework open-source pour Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publication GitHub et migration vers un site de test prive.',
    nav: ['Fonctionnalites', 'Architecture', 'Demarrage', 'Langue'],
    hero: ['Cloudflare natif', 'Le scaffold de blog <span class="gradient-text">Cloudflare natif</span>', 'Publiez un blog rapide avec Hexo/NexT, Workers, D1 et R2 sur Cloudflare.', 'Deployer', 'En savoir plus ->'],
    quickstart: ['Demarrez en <span class="gradient-text">2 minutes</span>', 'Creez un starter, importez Hexo/NexT, configurez le domaine principal et connectez Cloudflare Pages.', 'Cloner et installer', 'Initialiser le site de test', 'Construire et valider', 'Connecter Cloudflare Pages']
  }),
  es: makeLocale({
    title: 'xhalo-blog - Framework de blog nativo de Cloudflare',
    description: 'Framework open-source para Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publicacion con GitHub y migracion a sitio privado de prueba.',
    nav: ['Funciones', 'Arquitectura', 'Inicio rapido', 'Idioma'],
    hero: ['Cloudflare nativo', 'El scaffold de blog <span class="gradient-text">nativo de Cloudflare</span>', 'Despliega un blog rapido con Hexo/NexT, Workers, D1 y R2 en Cloudflare.', 'Desplegar', 'Ver mas ->'],
    quickstart: ['Empieza en <span class="gradient-text">2 minutos</span>', 'Crea un starter, importa Hexo/NexT, configura el dominio principal y conecta Cloudflare Pages.', 'Clonar e instalar', 'Inicializar sitio de prueba', 'Construir y validar', 'Conectar Cloudflare Pages']
  }),
  de: makeLocale({
    title: 'xhalo-blog - Cloudflare-natives Blog-Framework',
    description: 'Open-Source Framework fur Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub Publishing und private Testsite-Migration.',
    nav: ['Features', 'Architektur', 'Schnellstart', 'Sprache'],
    hero: ['Cloudflare-nativ', 'Das <span class="gradient-text">Cloudflare-native</span> Blog-Scaffold', 'Deploye ein schnelles Blog mit Hexo/NexT, Workers, D1 und R2 auf Cloudflare.', 'Jetzt deployen', 'Mehr erfahren ->'],
    quickstart: ['Start in <span class="gradient-text">2 Minuten</span>', 'Starter erstellen, Hexo/NexT importieren, Hauptdomain konfigurieren und Cloudflare Pages verbinden.', 'Klonen und installieren', 'Testsite initialisieren', 'Build und Validierung', 'Cloudflare Pages verbinden']
  }),
  pt: makeLocale({
    title: 'xhalo-blog - Framework de blog nativo Cloudflare',
    description: 'Framework open-source para Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publicacao via GitHub e migracao para site privado de teste.',
    nav: ['Recursos', 'Arquitetura', 'Inicio rapido', 'Idioma'],
    hero: ['Cloudflare nativo', 'O scaffold de blog <span class="gradient-text">nativo Cloudflare</span>', 'Implante um blog rapido com Hexo/NexT, Workers, D1 e R2 na Cloudflare.', 'Implantar', 'Saiba mais ->'],
    quickstart: ['Comece em <span class="gradient-text">2 minutos</span>', 'Crie um starter, importe Hexo/NexT, configure o dominio principal e conecte Cloudflare Pages.', 'Clonar e instalar', 'Inicializar site de teste', 'Construir e validar', 'Conectar Cloudflare Pages']
  })
};

function makeLocale({ title, description, nav, hero, quickstart }) {
  return {
    ...en,
    'meta.title': title,
    'meta.description': description,
    'nav.features': nav[0],
    'nav.architecture': nav[1],
    'nav.quickstart': nav[2],
    'language.label': nav[3],
    'hero.badge': hero[0],
    'hero.title': hero[1],
    'hero.subtitle': hero[2],
    'hero.primaryCta': hero[3],
    'hero.secondaryCta': hero[4],
    'quickstart.title': quickstart[0],
    'quickstart.lead': quickstart[1],
    'quickstart.step1.title': quickstart[2],
    'quickstart.step2.title': quickstart[3],
    'quickstart.step3.title': quickstart[4],
    'quickstart.step4.title': quickstart[5]
  };
}

const localeAliases = new Map([
  ['zh', 'zh-CN'], ['zh-cn', 'zh-CN'], ['zh-hans', 'zh-CN'],
  ['ko', 'ko'], ['ko-kr', 'ko'],
  ['ja', 'ja'], ['ja-jp', 'ja'],
  ['fr', 'fr'], ['fr-fr', 'fr'],
  ['es', 'es'], ['es-es', 'es'], ['es-mx', 'es'],
  ['de', 'de'], ['de-de', 'de'],
  ['pt', 'pt'], ['pt-br', 'pt'], ['pt-pt', 'pt'],
  ['en', 'en'], ['en-us', 'en'], ['en-gb', 'en']
]);

const supportedLocales = ['en', 'zh-CN', 'ko', 'ja', 'fr', 'es', 'de', 'pt'];

function resolveLocale(languages = []) {
  for (const raw of languages) {
    const normalized = String(raw || '').toLowerCase();
    if (localeAliases.has(normalized)) return localeAliases.get(normalized);
    const primary = normalized.split('-')[0];
    if (localeAliases.has(primary)) return localeAliases.get(primary);
  }
  return 'en';
}

function getStoredLocale() {
  try {
    return localStorage.getItem('xhalo_landing_lang');
  } catch {
    return null;
  }
}

function setStoredLocale(locale) {
  try {
    localStorage.setItem('xhalo_landing_lang', locale);
  } catch {
    // Storage can be unavailable in strict privacy contexts.
  }
}

function upsertMeta(selector, attr, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(attr, value);
}

function updateSeo(locale, dictionary) {
  const title = dictionary['meta.title'] || en['meta.title'];
  const description = dictionary['meta.description'] || en['meta.description'];
  const canonicalUrl = locale === 'en' ? 'https://blog.xhalo.co/' : `https://blog.xhalo.co/?lang=${encodeURIComponent(locale)}`;
  document.title = title;
  upsertMeta('meta[name="description"]', 'content', description);
  upsertMeta('meta[name="keywords"]', 'content', dictionary['meta.keywords'] || en['meta.keywords']);
  upsertMeta('meta[property="og:title"]', 'content', title);
  upsertMeta('meta[property="og:description"]', 'content', description);
  upsertMeta('meta[property="og:url"]', 'content', canonicalUrl);
  upsertMeta('meta[name="twitter:title"]', 'content', title);
  upsertMeta('meta[name="twitter:description"]', 'content', description);
  upsertMeta('link[rel="canonical"]', 'href', canonicalUrl);
}

function applyLocale(locale) {
  const dictionary = dictionaries[locale] || dictionaries.en;
  document.documentElement.lang = locale;
  updateSeo(locale, dictionary);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    node.textContent = dictionary[key] || en[key] || node.textContent;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    const key = node.getAttribute('data-i18n-html');
    node.innerHTML = dictionary[key] || en[key] || node.innerHTML;
  });

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) languageSelect.value = dictionaries[locale] ? locale : 'en';
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const urlLocale = new URLSearchParams(window.location.search).get('lang');
    const locale = resolveLocale([urlLocale, getStoredLocale(), ...(navigator.languages || [navigator.language])]);
    applyLocale(locale);

    const languageSelect = document.getElementById('language-select');
    languageSelect?.addEventListener('change', () => {
      const selectedLocale = resolveLocale([languageSelect.value]);
      setStoredLocale(selectedLocale);
      const url = new URL(window.location.href);
      if (selectedLocale === 'en') url.searchParams.delete('lang');
      else url.searchParams.set('lang', selectedLocale);
      window.history.replaceState({}, '', url.toString());
      applyLocale(selectedLocale);
    });

    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      if (!header) return;
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
        header.style.backgroundColor = 'rgba(11, 15, 25, 0.85)';
      } else {
        header.style.boxShadow = 'none';
        header.style.backgroundColor = 'rgba(17, 24, 39, 0.7)';
      }
    });

    document.querySelectorAll('.node').forEach((node) => {
      node.addEventListener('click', () => {
        const rect = node.querySelector('rect');
        if (!rect) return;
        const originalFilter = rect.style.filter;
        const originalTransform = rect.style.transform;
        rect.style.filter = 'brightness(1.5) saturate(1.2)';
        rect.style.transform = 'scale(1.05)';
        rect.style.transformOrigin = 'center';
        setTimeout(() => {
          rect.style.filter = originalFilter;
          rect.style.transform = originalTransform;
        }, 500);
      });
    });

    console.log(`xhalo-blog landing page initialized with locale: ${locale}`);
  });
}

export { applyLocale, dictionaries, resolveLocale, supportedLocales };
