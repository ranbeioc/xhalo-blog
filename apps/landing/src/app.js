// Interactive scripts and locale runtime for xhalo-blog landing page.

const en = {
  'meta.title': 'xhalo-blog - Cloudflare-Native Blog Framework Scaffold',
  'meta.description': 'xhalo-blog is a premium, open-source, Cloudflare-native blog framework scaffold combining Cloudflare Pages, Workers API, D1 Database, R2 Storage, and Hexo/NexT static compilation.',
  'nav.features': 'Features',
  'nav.architecture': 'Architecture',
  'nav.quickstart': 'Quickstart',
  'hero.badge': 'Cloudflare Native',
  'hero.title': 'The Ultimate <span class="gradient-text">Cloudflare-Native</span> Blog Scaffold',
  'hero.subtitle': 'Deploy a blazing-fast personal blog or developer journal completely on the Cloudflare edge network. Powered by Hexo, Pages, Workers, D1 database, and R2 bucket.',
  'hero.primaryCta': 'Deploy Now',
  'hero.secondaryCta': 'Learn More ->',
  'hero.terminal': '<span class="code-comment"># Clone and validate the framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog validation passed.</span>\n<span class="code-info">INFO Landing build: npm run build:landing</span>\n<span class="code-info">INFO Test site build: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.title': 'Powerful Capabilities, <span class="gradient-text">Zero Servers</span>',
  'features.lead': 'xhalo-blog provides everything you need to run a professional, secure, and infinitely scalable blog with zero server maintenance overhead.',
  'features.hexo.title': 'Hexo Speed',
  'features.hexo.body': 'Supercharged by Hexo static generation. Fast build times, standard Markdown compatibility, and NexT theme adapter support.',
  'features.d1.title': 'D1 SQLite Database',
  'features.d1.body': 'Serverless relational database at the edge. Mapped schemas, index tracking, and auto-generated migration history.',
  'features.r2.title': 'R2 Object Storage',
  'features.r2.body': 'Zero egress fee storage bucket. Directly upload assets, support signed preview links, and automatically match theme folders.',
  'features.security.title': 'Turnstile Security',
  'features.security.body': 'Protect mutation endpoints from bots and malicious requests using non-interactive Cloudflare Turnstile token validation.',
  'features.admin.title': 'Admin Panel UI',
  'features.admin.body': 'Write, edit, preview, and publish your content on the web. Connects directly to Workers API with local dry-run options.',
  'features.actions.title': 'GitHub Actions Integration',
  'features.actions.body': 'Deploy preview environments on branch commits. Auto-generate sitemaps, robots.txt rules, and RSS feeds during merge cycles.',
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
  'architecture.lead': 'Here is how xhalo-blog integrates the full Cloudflare ecosystem to distribute content and manage assets globally.',
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
  'quickstart.lead': 'Follow these validated commands to create a starter site, import a Hexo/NexT blog, and deploy through Cloudflare Pages.',
  'quickstart.step1.title': 'Clone and Install',
  'quickstart.step1.body': 'Get the framework source and install the locked workspace dependencies.',
  'quickstart.step2.title': 'Initialize a Test Site',
  'quickstart.step2.body': 'Generate a default NexT starter or import an existing Hexo/NexT source into a private test repository.',
  'quickstart.step3.title': 'Build and Validate',
  'quickstart.step3.body': 'Run the repository validation gate and build the standalone landing page before publishing.',
  'quickstart.step4.title': 'Connect Cloudflare Pages',
  'quickstart.step4.body': 'Use the Pages project settings below for the standalone product landing page.',
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
    'meta.description': 'xhalo-blog 是开源的 Cloudflare 原生博客框架脚手架，整合 Cloudflare Pages、Workers API、D1、R2 与 Hexo/NexT 静态编译。',
    'nav.features': '功能',
    'nav.architecture': '架构',
    'nav.quickstart': '快速开始',
    'hero.badge': 'Cloudflare 原生',
    'hero.title': '面向 Cloudflare 的<span class="gradient-text">现代博客框架</span>',
    'hero.subtitle': '在 Cloudflare 边缘网络上部署高速个人博客或开发者日志，由 Hexo、Pages、Workers、D1 数据库和 R2 存储驱动。',
    'hero.primaryCta': '开始部署',
    'hero.secondaryCta': '了解更多 ->',
    'hero.terminal': '<span class="code-comment"># 克隆并验证框架</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 验证通过。</span>\n<span class="code-info">INFO 落地页构建: npm run build:landing</span>\n<span class="code-info">INFO 测试站初始化: npm run init:hexo-next -- --target ../my-blog-test</span>',
    'features.title': '完整能力，<span class="gradient-text">无需服务器</span>',
    'features.lead': 'xhalo-blog 提供运行专业、安全、可扩展博客所需的核心能力，并避免服务器维护负担。',
    'features.hexo.title': 'Hexo 速度',
    'features.hexo.body': '基于 Hexo 静态生成，构建快速，兼容标准 Markdown，并支持 NexT 主题适配。',
    'features.d1.title': 'D1 SQLite 数据库',
    'features.d1.body': '边缘无服务器关系型数据库，支持结构化 schema、索引追踪和迁移历史。',
    'features.r2.title': 'R2 对象存储',
    'features.r2.body': '零出口费用的对象存储，用于媒体资产、签名预览链接和主题资源目录适配。',
    'features.security.title': 'Turnstile 安全防护',
    'features.security.body': '使用 Cloudflare Turnstile 保护写入接口，降低机器人和恶意请求风险。',
    'features.admin.title': '管理后台 UI',
    'features.admin.body': '在网页中编写、编辑、预览和发布内容，并通过 Workers API 进行 dry-run 验证。',
    'features.actions.title': 'GitHub Actions 集成',
    'features.actions.body': '在分支提交上生成预览环境，并在合并流程中生成 sitemap、robots 和 RSS。',
    'migration.title': 'Hexo/NexT 迁移，<span class="gradient-text">标准化</span>',
    'migration.lead': '可从默认 NexT 起步站初始化私有测试站，也可导入既有 Hexo/NexT 博客的文章、上传、菜单、主题、插件配置和审计报告。',
    'migration.starter.title': '起步模式',
    'migration.starter.body': '没有历史来源时，生成干净的 NexT 站点和默认欢迎测试文章。',
    'migration.import.title': '导入模式',
    'migration.import.body': '将历史文章、上传、独立页面、主题配置、feed/search/sitemap/media 插件配置和安全审计输出复制到私有测试仓库。',
    'migration.guide.title': '阅读指南',
    'migration.guide.body': '使用标准流程隔离开源框架源码和私有博客内容。',
    'migration.guide.cta': '迁移指南',
    'architecture.title': '边缘架构概览',
    'architecture.lead': 'xhalo-blog 组合 Cloudflare 生态来全球分发内容、管理资源并承载后台能力。',
    'architecture.svg.user': '访客 / 管理员',
    'architecture.svg.edge': 'Cloudflare 边缘网络',
    'architecture.svg.pagesSub': '静态 HTML / CSS',
    'architecture.svg.worker': 'CF Workers API',
    'architecture.svg.workerSub': '无服务器路由',
    'architecture.svg.r2Sub': '媒体与资产',
    'architecture.svg.d1Sub': 'SQLite 元数据',
    'quickstart.title': '<span class="gradient-text">2 分钟</span>快速开始',
    'quickstart.lead': '使用这些已验证命令创建起步站、导入 Hexo/NexT 博客，并通过 Cloudflare Pages 部署。',
    'quickstart.step1.title': '克隆并安装',
    'quickstart.step1.body': '获取框架源码并安装 lockfile 固定的工作区依赖。',
    'quickstart.step2.title': '初始化测试站',
    'quickstart.step2.body': '生成默认 NexT 起步站，或将既有 Hexo/NexT 源导入私有测试仓库。',
    'quickstart.step3.title': '构建并验证',
    'quickstart.step3.body': '发布前运行仓库验证 gate，并构建独立 Landing 页面。',
    'quickstart.step4.title': '连接 Cloudflare Pages',
    'quickstart.step4.body': '独立产品 Landing 使用以下 Pages 项目设置。',
    'footer.copyright': '© 2026 xhalo-blog scaffold。基于 MIT License 发布。',
    'footer.license': '许可证',
    'footer.security': '安全',
    'footer.docs': '文档'
  },
  ko: {
    ...en,
    'meta.title': 'xhalo-blog - Cloudflare 네이티브 블로그 프레임워크 스캐폴드',
    'nav.features': '기능',
    'nav.architecture': '아키텍처',
    'nav.quickstart': '빠른 시작',
    'hero.badge': 'Cloudflare 네이티브',
    'hero.title': '<span class="gradient-text">Cloudflare 네이티브</span> 블로그 스캐폴드',
    'hero.subtitle': 'Hexo, Pages, Workers, D1, R2로 Cloudflare 엣지에서 빠른 개인 블로그와 개발자 저널을 배포합니다.',
    'hero.primaryCta': '지금 배포',
    'hero.secondaryCta': '더 알아보기 ->',
    'features.title': '강력한 기능, <span class="gradient-text">서버 없음</span>',
    'features.lead': 'xhalo-blog는 전문적이고 안전하며 확장 가능한 블로그 운영에 필요한 핵심 기능을 제공합니다.',
    'migration.title': 'Hexo/NexT 마이그레이션, <span class="gradient-text">표준화</span>',
    'migration.lead': '기본 NexT 스타터로 비공개 테스트 사이트를 만들거나 기존 Hexo/NexT 블로그의 글, 업로드, 메뉴, 테마, 플러그인 설정과 감사 보고서를 가져옵니다.',
    'migration.starter.title': '스타터 모드',
    'migration.starter.body': '기존 소스가 없으면 환영 글이 포함된 깨끗한 NexT 사이트를 생성합니다.',
    'migration.import.title': '가져오기 모드',
    'migration.import.body': '과거 글, 업로드, 페이지, 테마 설정, feed/search/sitemap/media 플러그인 설정과 안전 감사 결과를 비공개 테스트 저장소로 복사합니다.',
    'migration.guide.title': '가이드 읽기',
    'migration.guide.body': '오픈소스 프레임워크 코드와 비공개 블로그 콘텐츠를 분리하는 표준 흐름을 사용하세요.',
    'migration.guide.cta': '마이그레이션 가이드',
    'architecture.title': '엣지 아키텍처 개요',
    'architecture.lead': 'xhalo-blog는 Cloudflare 생태계를 통합해 콘텐츠 배포와 자산 관리를 전 세계 엣지에서 처리합니다.',
    'quickstart.title': '<span class="gradient-text">2분</span> 안에 시작',
    'quickstart.lead': '검증된 명령으로 스타터 사이트를 만들고 Hexo/NexT 블로그를 가져온 뒤 Cloudflare Pages에 배포합니다.',
    'quickstart.step1.title': '클론 및 설치',
    'quickstart.step1.body': '프레임워크 소스를 받고 lockfile 기반 워크스페이스 의존성을 설치합니다.',
    'quickstart.step2.title': '테스트 사이트 초기화',
    'quickstart.step2.body': '기본 NexT 스타터를 만들거나 기존 Hexo/NexT 소스를 비공개 테스트 저장소로 가져옵니다.',
    'quickstart.step3.title': '빌드 및 검증',
    'quickstart.step3.body': '게시 전에 저장소 검증 게이트와 독립 Landing 빌드를 실행합니다.',
    'quickstart.step4.title': 'Cloudflare Pages 연결',
    'quickstart.step4.body': '독립 제품 Landing에는 아래 Pages 프로젝트 설정을 사용합니다.',
    'footer.license': '라이선스',
    'footer.security': '보안',
    'footer.docs': '문서'
  },
  ja: {
    ...en,
    'meta.title': 'xhalo-blog - Cloudflare ネイティブのブログフレームワーク',
    'nav.features': '機能',
    'nav.architecture': '構成',
    'nav.quickstart': 'クイックスタート',
    'hero.badge': 'Cloudflare ネイティブ',
    'hero.title': '<span class="gradient-text">Cloudflare ネイティブ</span>なブログ基盤',
    'hero.subtitle': 'Hexo、Pages、Workers、D1、R2 を使い、Cloudflare エッジ上で高速な個人ブログや開発者ジャーナルを公開します。',
    'hero.primaryCta': '今すぐデプロイ',
    'hero.secondaryCta': '詳しく見る ->',
    'features.title': '強力な機能、<span class="gradient-text">サーバー不要</span>',
    'features.lead': 'xhalo-blog は安全で拡張性の高いブログを運用するための主要機能をまとめて提供します。',
    'migration.title': 'Hexo/NexT 移行を<span class="gradient-text">標準化</span>',
    'migration.lead': '既定の NexT スターターから非公開テストサイトを作成するか、既存の Hexo/NexT ブログから記事、アップロード、メニュー、テーマ、プラグイン設定、監査レポートを取り込みます。',
    'migration.starter.title': 'スターターモード',
    'migration.starter.body': '履歴ソースがない場合、ウェルカム記事付きのクリーンな NexT サイトを生成します。',
    'migration.import.title': 'インポートモード',
    'migration.import.body': '過去記事、アップロード、ページ、テーマ設定、feed/search/sitemap/media プラグイン設定、安全な監査出力を非公開テストリポジトリへコピーします。',
    'migration.guide.title': 'ガイドを読む',
    'migration.guide.body': 'オープンソースのフレームワークコードと非公開ブログコンテンツを分離する標準フローを使用します。',
    'migration.guide.cta': '移行ガイド',
    'architecture.title': 'エッジ構成の概要',
    'architecture.lead': 'xhalo-blog は Cloudflare エコシステムを統合し、コンテンツ配信と資産管理をグローバルに行います。',
    'quickstart.title': '<span class="gradient-text">2分</span>で開始',
    'quickstart.lead': '検証済みコマンドでスターターサイトを作成し、Hexo/NexT ブログを取り込み、Cloudflare Pages にデプロイします。',
    'quickstart.step1.title': 'クローンとインストール',
    'quickstart.step1.body': 'フレームワークのソースを取得し、lockfile に基づく依存関係をインストールします。',
    'quickstart.step2.title': 'テストサイトを初期化',
    'quickstart.step2.body': '既定の NexT スターターを生成するか、既存の Hexo/NexT ソースを非公開テストリポジトリへ取り込みます。',
    'quickstart.step3.title': 'ビルドと検証',
    'quickstart.step3.body': '公開前に検証ゲートと独立 Landing ビルドを実行します。',
    'quickstart.step4.title': 'Cloudflare Pages に接続',
    'quickstart.step4.body': '独立した製品 Landing には以下の Pages 設定を使用します。',
    'footer.license': 'ライセンス',
    'footer.security': 'セキュリティ',
    'footer.docs': 'ドキュメント'
  },
  fr: {
    ...en,
    'meta.title': 'xhalo-blog - Scaffold de blog natif Cloudflare',
    'nav.features': 'Fonctionnalites',
    'nav.architecture': 'Architecture',
    'nav.quickstart': 'Demarrage',
    'hero.badge': 'Natif Cloudflare',
    'hero.title': 'Le scaffold de blog <span class="gradient-text">natif Cloudflare</span>',
    'hero.subtitle': 'Deploiez un blog personnel ou un journal developpeur tres rapide sur le reseau edge de Cloudflare avec Hexo, Pages, Workers, D1 et R2.',
    'hero.primaryCta': 'Deployer',
    'hero.secondaryCta': 'En savoir plus ->',
    'features.title': 'Fonctionnalites puissantes, <span class="gradient-text">zero serveur</span>',
    'features.lead': 'xhalo-blog fournit les bases pour exploiter un blog professionnel, securise et extensible sans maintenance serveur.',
    'migration.title': 'Migration Hexo/NexT, <span class="gradient-text">standardisee</span>',
    'migration.lead': 'Initialisez un site de test prive depuis le starter NexT ou importez un blog Hexo/NexT existant avec articles, uploads, menus, theme, plugins et rapport d audit.',
    'migration.starter.title': 'Mode starter',
    'migration.starter.body': 'Genere un site NexT propre avec un article de bienvenue lorsqu aucune source historique n est fournie.',
    'migration.import.title': 'Mode import',
    'migration.import.body': 'Copie articles, uploads, pages, configuration de theme, plugins feed/search/sitemap/media et sorties d audit dans un depot de test prive.',
    'migration.guide.title': 'Lire le guide',
    'migration.guide.body': 'Utilisez le flux documente pour separer le code open-source du contenu prive du blog.',
    'migration.guide.cta': 'Guide de migration',
    'architecture.title': 'Vue d ensemble de l architecture edge',
    'architecture.lead': 'xhalo-blog integre l ecosysteme Cloudflare pour distribuer le contenu et gerer les ressources globalement.',
    'quickstart.title': 'Demarrez en <span class="gradient-text">2 minutes</span>',
    'quickstart.lead': 'Suivez ces commandes validees pour creer un starter, importer un blog Hexo/NexT et deployer avec Cloudflare Pages.',
    'quickstart.step1.title': 'Cloner et installer',
    'quickstart.step1.body': 'Recuperez la source du framework et installez les dependances verrouillees.',
    'quickstart.step2.title': 'Initialiser un site de test',
    'quickstart.step2.body': 'Generez un starter NexT ou importez une source Hexo/NexT existante dans un depot prive.',
    'quickstart.step3.title': 'Construire et valider',
    'quickstart.step3.body': 'Executez le gate de validation et construisez la landing autonome avant publication.',
    'quickstart.step4.title': 'Connecter Cloudflare Pages',
    'quickstart.step4.body': 'Utilisez les parametres Pages ci-dessous pour la landing produit autonome.',
    'footer.license': 'Licence',
    'footer.security': 'Securite',
    'footer.docs': 'Documentation'
  },
  es: {
    ...en,
    'meta.title': 'xhalo-blog - Scaffold de blog nativo de Cloudflare',
    'nav.features': 'Funciones',
    'nav.architecture': 'Arquitectura',
    'nav.quickstart': 'Inicio rapido',
    'hero.badge': 'Nativo de Cloudflare',
    'hero.title': 'El scaffold de blog <span class="gradient-text">nativo de Cloudflare</span>',
    'hero.subtitle': 'Despliega un blog personal o diario de desarrollo muy rapido en la red edge de Cloudflare con Hexo, Pages, Workers, D1 y R2.',
    'hero.primaryCta': 'Desplegar ahora',
    'hero.secondaryCta': 'Saber mas ->',
    'features.title': 'Capacidades potentes, <span class="gradient-text">cero servidores</span>',
    'features.lead': 'xhalo-blog ofrece lo necesario para operar un blog profesional, seguro y escalable sin mantenimiento de servidores.',
    'migration.title': 'Migracion Hexo/NexT, <span class="gradient-text">estandarizada</span>',
    'migration.lead': 'Inicializa un sitio privado de prueba desde el starter NexT o importa un blog Hexo/NexT existente con articulos, subidas, menus, tema, plugins e informe de auditoria.',
    'migration.starter.title': 'Modo starter',
    'migration.starter.body': 'Genera un sitio NexT limpio con un articulo de bienvenida cuando no hay fuente historica.',
    'migration.import.title': 'Modo importacion',
    'migration.import.body': 'Copia articulos, subidas, paginas, configuracion del tema, plugins feed/search/sitemap/media y salidas de auditoria a un repositorio privado de prueba.',
    'migration.guide.title': 'Leer la guia',
    'migration.guide.body': 'Usa el flujo documentado para separar el codigo open-source del contenido privado del blog.',
    'migration.guide.cta': 'Guia de migracion',
    'architecture.title': 'Resumen de arquitectura edge',
    'architecture.lead': 'xhalo-blog integra el ecosistema de Cloudflare para distribuir contenido y gestionar recursos globalmente.',
    'quickstart.title': 'Empieza en <span class="gradient-text">2 minutos</span>',
    'quickstart.lead': 'Sigue estos comandos validados para crear un starter, importar un blog Hexo/NexT y desplegar con Cloudflare Pages.',
    'quickstart.step1.title': 'Clonar e instalar',
    'quickstart.step1.body': 'Obtén el codigo del framework e instala las dependencias bloqueadas.',
    'quickstart.step2.title': 'Inicializar un sitio de prueba',
    'quickstart.step2.body': 'Genera un starter NexT o importa una fuente Hexo/NexT existente a un repositorio privado.',
    'quickstart.step3.title': 'Construir y validar',
    'quickstart.step3.body': 'Ejecuta la validacion del repositorio y construye la landing independiente antes de publicar.',
    'quickstart.step4.title': 'Conectar Cloudflare Pages',
    'quickstart.step4.body': 'Usa la configuracion de Pages siguiente para la landing independiente.',
    'footer.license': 'Licencia',
    'footer.security': 'Seguridad',
    'footer.docs': 'Documentacion'
  },
  de: {
    ...en,
    'meta.title': 'xhalo-blog - Cloudflare-natives Blog-Framework',
    'nav.features': 'Funktionen',
    'nav.architecture': 'Architektur',
    'nav.quickstart': 'Schnellstart',
    'hero.badge': 'Cloudflare-nativ',
    'hero.title': 'Das <span class="gradient-text">Cloudflare-native</span> Blog-Scaffold',
    'hero.subtitle': 'Veröffentliche ein schnelles persönliches Blog oder Entwicklerjournal am Cloudflare Edge mit Hexo, Pages, Workers, D1 und R2.',
    'hero.primaryCta': 'Jetzt deployen',
    'hero.secondaryCta': 'Mehr erfahren ->',
    'features.title': 'Starke Funktionen, <span class="gradient-text">keine Server</span>',
    'features.lead': 'xhalo-blog liefert die Grundlage für ein professionelles, sicheres und skalierbares Blog ohne Serverwartung.',
    'migration.title': 'Hexo/NexT-Migration, <span class="gradient-text">standardisiert</span>',
    'migration.lead': 'Initialisiere eine private Testsite aus dem NexT-Starter oder importiere ein bestehendes Hexo/NexT-Blog mit Beiträgen, Uploads, Menüs, Theme, Plugin-Konfiguration und Auditbericht.',
    'migration.starter.title': 'Starter-Modus',
    'migration.starter.body': 'Erzeugt eine saubere NexT-Site mit Willkommensbeitrag, wenn keine historische Quelle angegeben ist.',
    'migration.import.title': 'Import-Modus',
    'migration.import.body': 'Kopiert Beiträge, Uploads, Seiten, Theme-Konfiguration, feed/search/sitemap/media-Plugins und sichere Audit-Ausgaben in ein privates Test-Repository.',
    'migration.guide.title': 'Guide lesen',
    'migration.guide.body': 'Nutze den dokumentierten Ablauf, um Open-Source-Framework und private Blog-Inhalte zu trennen.',
    'migration.guide.cta': 'Migrationsguide',
    'architecture.title': 'Edge-Architektur im Überblick',
    'architecture.lead': 'xhalo-blog integriert das Cloudflare-Ökosystem, um Inhalte global zu verteilen und Assets zu verwalten.',
    'quickstart.title': 'Start in <span class="gradient-text">2 Minuten</span>',
    'quickstart.lead': 'Folge diesen geprüften Befehlen, um eine Starter-Site zu erstellen, ein Hexo/NexT-Blog zu importieren und über Cloudflare Pages zu deployen.',
    'quickstart.step1.title': 'Klonen und installieren',
    'quickstart.step1.body': 'Hole den Framework-Quellcode und installiere die fixierten Workspace-Abhängigkeiten.',
    'quickstart.step2.title': 'Testsite initialisieren',
    'quickstart.step2.body': 'Erzeuge einen NexT-Starter oder importiere eine bestehende Hexo/NexT-Quelle in ein privates Test-Repository.',
    'quickstart.step3.title': 'Build und Validierung',
    'quickstart.step3.body': 'Führe den Validierungsgate aus und baue die eigenständige Landing vor der Veröffentlichung.',
    'quickstart.step4.title': 'Cloudflare Pages verbinden',
    'quickstart.step4.body': 'Verwende diese Pages-Einstellungen für die eigenständige Produkt-Landing.',
    'footer.license': 'Lizenz',
    'footer.security': 'Sicherheit',
    'footer.docs': 'Dokumentation'
  },
  pt: {
    ...en,
    'meta.title': 'xhalo-blog - Scaffold de blog nativo Cloudflare',
    'nav.features': 'Recursos',
    'nav.architecture': 'Arquitetura',
    'nav.quickstart': 'Inicio rapido',
    'hero.badge': 'Nativo Cloudflare',
    'hero.title': 'O scaffold de blog <span class="gradient-text">nativo Cloudflare</span>',
    'hero.subtitle': 'Publique um blog pessoal ou diario de desenvolvimento rapido na rede edge da Cloudflare com Hexo, Pages, Workers, D1 e R2.',
    'hero.primaryCta': 'Implantar agora',
    'hero.secondaryCta': 'Saiba mais ->',
    'features.title': 'Recursos fortes, <span class="gradient-text">zero servidores</span>',
    'features.lead': 'xhalo-blog entrega a base para operar um blog profissional, seguro e escalavel sem manutencao de servidores.',
    'migration.title': 'Migracao Hexo/NexT, <span class="gradient-text">padronizada</span>',
    'migration.lead': 'Inicialize um site privado de teste a partir do starter NexT ou importe um blog Hexo/NexT existente com posts, uploads, menus, tema, plugins e relatorio de auditoria.',
    'migration.starter.title': 'Modo starter',
    'migration.starter.body': 'Gera um site NexT limpo com post de boas-vindas quando nenhuma fonte historica e fornecida.',
    'migration.import.title': 'Modo importacao',
    'migration.import.body': 'Copia posts, uploads, paginas, configuracao do tema, plugins feed/search/sitemap/media e saidas seguras de auditoria para um repositorio privado de teste.',
    'migration.guide.title': 'Ler o guia',
    'migration.guide.body': 'Use o fluxo documentado para separar codigo open-source e conteudo privado do blog.',
    'migration.guide.cta': 'Guia de migracao',
    'architecture.title': 'Visao geral da arquitetura edge',
    'architecture.lead': 'xhalo-blog integra o ecossistema Cloudflare para distribuir conteudo e gerenciar ativos globalmente.',
    'quickstart.title': 'Comece em <span class="gradient-text">2 minutos</span>',
    'quickstart.lead': 'Siga estes comandos validados para criar um starter, importar um blog Hexo/NexT e implantar com Cloudflare Pages.',
    'quickstart.step1.title': 'Clonar e instalar',
    'quickstart.step1.body': 'Baixe o codigo do framework e instale as dependencias travadas.',
    'quickstart.step2.title': 'Inicializar site de teste',
    'quickstart.step2.body': 'Gere um starter NexT ou importe uma fonte Hexo/NexT existente para um repositorio privado.',
    'quickstart.step3.title': 'Construir e validar',
    'quickstart.step3.body': 'Execute o gate de validacao e construa a landing independente antes de publicar.',
    'quickstart.step4.title': 'Conectar Cloudflare Pages',
    'quickstart.step4.body': 'Use as configuracoes Pages abaixo para a landing de produto independente.',
    'footer.license': 'Licenca',
    'footer.security': 'Seguranca',
    'footer.docs': 'Documentacao'
  }
};

Object.assign(dictionaries.ko, {
  'meta.description': 'xhalo-blog는 Cloudflare Pages, Workers API, D1, R2, Hexo/NexT 정적 컴파일을 결합한 오픈소스 Cloudflare 네이티브 블로그 프레임워크입니다.',
  'hero.terminal': '<span class="code-comment"># 프레임워크 클론 및 검증</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 검증 통과.</span>\n<span class="code-info">INFO Landing 빌드: npm run build:landing</span>\n<span class="code-info">INFO 테스트 사이트 초기화: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Hexo 속도',
  'features.hexo.body': 'Hexo 정적 생성을 기반으로 빠른 빌드, 표준 Markdown 호환성, NexT 테마 어댑터를 제공합니다.',
  'features.d1.title': 'D1 SQLite 데이터베이스',
  'features.d1.body': '엣지의 서버리스 관계형 데이터베이스로 스키마, 인덱스, 마이그레이션 이력을 관리합니다.',
  'features.r2.title': 'R2 오브젝트 스토리지',
  'features.r2.body': '미디어 자산, 서명된 미리보기 링크, 테마 폴더 매핑을 위한 제로 이그레스 스토리지입니다.',
  'features.security.title': 'Turnstile 보안',
  'features.security.body': 'Cloudflare Turnstile 검증으로 변경 API를 봇과 악성 요청으로부터 보호합니다.',
  'features.admin.title': '관리자 UI',
  'features.admin.body': '웹에서 글을 작성, 편집, 미리보기, 게시하고 Workers API와 dry-run으로 검증합니다.',
  'features.actions.title': 'GitHub Actions 통합',
  'features.actions.body': '브랜치 커밋마다 미리보기 환경을 만들고 sitemap, robots, RSS를 자동 생성합니다.',
  'architecture.svg.user': '방문자 / 관리자',
  'architecture.svg.edge': 'Cloudflare 엣지 네트워크',
  'architecture.svg.pagesSub': '정적 HTML / CSS',
  'architecture.svg.workerSub': '서버리스 라우터',
  'architecture.svg.r2Sub': '미디어와 자산',
  'architecture.svg.d1Sub': 'SQLite 메타데이터',
  'footer.copyright': '© 2026 xhalo-blog scaffold. MIT License로 배포됩니다.'
});

Object.assign(dictionaries.ja, {
  'meta.description': 'xhalo-blog は Cloudflare Pages、Workers API、D1、R2、Hexo/NexT 静的コンパイルを組み合わせたオープンソースの Cloudflare ネイティブなブログ基盤です。',
  'hero.terminal': '<span class="code-comment"># フレームワークをクローンして検証</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog の検証が完了しました。</span>\n<span class="code-info">INFO Landing ビルド: npm run build:landing</span>\n<span class="code-info">INFO テストサイト初期化: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Hexo の速度',
  'features.hexo.body': 'Hexo の静的生成により高速なビルド、標準 Markdown 互換、NexT テーマアダプターを提供します。',
  'features.d1.title': 'D1 SQLite データベース',
  'features.d1.body': 'エッジ上のサーバーレスリレーショナルデータベースで、スキーマ、インデックス、移行履歴を管理します。',
  'features.r2.title': 'R2 オブジェクトストレージ',
  'features.r2.body': 'メディア資産、署名付きプレビューリンク、テーマフォルダー連携に使えるゼロエグレスのストレージです。',
  'features.security.title': 'Turnstile セキュリティ',
  'features.security.body': 'Cloudflare Turnstile により変更 API をボットや悪意あるリクエストから保護します。',
  'features.admin.title': '管理 UI',
  'features.admin.body': 'Web 上で記事の作成、編集、プレビュー、公開を行い、Workers API と dry-run で検証します。',
  'features.actions.title': 'GitHub Actions 連携',
  'features.actions.body': 'ブランチコミットでプレビュー環境を作り、sitemap、robots、RSS を自動生成します。',
  'architecture.svg.user': '訪問者 / 管理者',
  'architecture.svg.edge': 'Cloudflare エッジネットワーク',
  'architecture.svg.pagesSub': '静的 HTML / CSS',
  'architecture.svg.workerSub': 'サーバーレスルーター',
  'architecture.svg.r2Sub': 'メディアと資産',
  'architecture.svg.d1Sub': 'SQLite メタデータ',
  'footer.copyright': '© 2026 xhalo-blog scaffold。MIT License で公開されています。'
});

Object.assign(dictionaries.fr, {
  'meta.description': 'xhalo-blog est un framework de blog open-source natif Cloudflare combinant Cloudflare Pages, Workers API, D1, R2 et la compilation statique Hexo/NexT.',
  'hero.terminal': '<span class="code-comment"># Cloner et valider le framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK validation xhalo-blog reussie.</span>\n<span class="code-info">INFO Build landing: npm run build:landing</span>\n<span class="code-info">INFO Initialisation site test: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Vitesse Hexo',
  'features.hexo.body': 'Generation statique Hexo, builds rapides, compatibilite Markdown standard et adaptateur de theme NexT.',
  'features.d1.title': 'Base SQLite D1',
  'features.d1.body': 'Base relationnelle serverless a l edge avec schemas, index et historique de migrations.',
  'features.r2.title': 'Stockage objet R2',
  'features.r2.body': 'Stockage sans frais d egress pour medias, liens de preview signes et dossiers de theme.',
  'features.security.title': 'Securite Turnstile',
  'features.security.body': 'Protection des endpoints de mutation contre les bots et requetes malveillantes via Cloudflare Turnstile.',
  'features.admin.title': 'Interface Admin',
  'features.admin.body': 'Ecrire, modifier, previsualiser et publier du contenu sur le web avec l API Workers et des dry-runs locaux.',
  'features.actions.title': 'Integration GitHub Actions',
  'features.actions.body': 'Creer des previews par branche et generer automatiquement sitemap, robots et RSS.',
  'architecture.svg.user': 'Visiteur / Admin',
  'architecture.svg.edge': 'Reseau edge Cloudflare',
  'architecture.svg.pagesSub': 'HTML / CSS statiques',
  'architecture.svg.workerSub': 'Routeur serverless',
  'architecture.svg.r2Sub': 'Medias et assets',
  'architecture.svg.d1Sub': 'Metadonnees SQLite',
  'footer.copyright': '© 2026 xhalo-blog scaffold. Publie sous licence MIT.'
});

Object.assign(dictionaries.es, {
  'meta.description': 'xhalo-blog es un framework de blog open-source nativo de Cloudflare que combina Cloudflare Pages, Workers API, D1, R2 y compilacion estatica Hexo/NexT.',
  'hero.terminal': '<span class="code-comment"># Clonar y validar el framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK validacion de xhalo-blog completada.</span>\n<span class="code-info">INFO Build landing: npm run build:landing</span>\n<span class="code-info">INFO Inicializar sitio test: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Velocidad Hexo',
  'features.hexo.body': 'Generacion estatica con Hexo, builds rapidos, compatibilidad Markdown estandar y adaptador de tema NexT.',
  'features.d1.title': 'Base SQLite D1',
  'features.d1.body': 'Base relacional serverless en el edge con schemas, indices e historial de migraciones.',
  'features.r2.title': 'Almacenamiento R2',
  'features.r2.body': 'Almacenamiento sin egress para medios, enlaces firmados de preview y carpetas de tema.',
  'features.security.title': 'Seguridad Turnstile',
  'features.security.body': 'Protege endpoints de mutacion contra bots y solicitudes maliciosas con Cloudflare Turnstile.',
  'features.admin.title': 'Panel Admin',
  'features.admin.body': 'Escribe, edita, previsualiza y publica contenido en la web con Workers API y dry-runs locales.',
  'features.actions.title': 'Integracion GitHub Actions',
  'features.actions.body': 'Crea previews por branch y genera automaticamente sitemap, robots y RSS.',
  'architecture.svg.user': 'Visitante / Admin',
  'architecture.svg.edge': 'Red edge de Cloudflare',
  'architecture.svg.pagesSub': 'HTML / CSS estatico',
  'architecture.svg.workerSub': 'Router serverless',
  'architecture.svg.r2Sub': 'Medios y assets',
  'architecture.svg.d1Sub': 'Metadatos SQLite',
  'footer.copyright': '© 2026 xhalo-blog scaffold. Publicado bajo licencia MIT.'
});

Object.assign(dictionaries.de, {
  'meta.description': 'xhalo-blog ist ein Open-Source Cloudflare-natives Blog-Framework mit Cloudflare Pages, Workers API, D1, R2 und Hexo/NexT Static Compilation.',
  'hero.terminal': '<span class="code-comment"># Framework klonen und validieren</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog Validierung bestanden.</span>\n<span class="code-info">INFO Landing Build: npm run build:landing</span>\n<span class="code-info">INFO Testsite initialisieren: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Hexo-Geschwindigkeit',
  'features.hexo.body': 'Statische Generierung mit Hexo, schnelle Builds, Markdown-Kompatibilität und NexT-Theme-Adapter.',
  'features.d1.title': 'D1 SQLite-Datenbank',
  'features.d1.body': 'Serverlose relationale Edge-Datenbank mit Schemas, Index-Tracking und Migrationshistorie.',
  'features.r2.title': 'R2 Objektspeicher',
  'features.r2.body': 'Speicher ohne Egress-Gebühren für Medien, signierte Vorschau-Links und Theme-Ordner.',
  'features.security.title': 'Turnstile-Sicherheit',
  'features.security.body': 'Schützt Mutations-Endpunkte mit Cloudflare Turnstile vor Bots und bösartigen Anfragen.',
  'features.admin.title': 'Admin UI',
  'features.admin.body': 'Inhalte im Web schreiben, bearbeiten, prüfen und veröffentlichen, verbunden mit Workers API und dry-runs.',
  'features.actions.title': 'GitHub Actions Integration',
  'features.actions.body': 'Preview-Umgebungen pro Branch bereitstellen und sitemap, robots und RSS automatisch erzeugen.',
  'architecture.svg.user': 'Besucher / Admin',
  'architecture.svg.edge': 'Cloudflare Edge-Netzwerk',
  'architecture.svg.pagesSub': 'Statisches HTML / CSS',
  'architecture.svg.workerSub': 'Serverloser Router',
  'architecture.svg.r2Sub': 'Medien und Assets',
  'architecture.svg.d1Sub': 'SQLite-Metadaten',
  'footer.copyright': '© 2026 xhalo-blog scaffold. Veröffentlicht unter der MIT License.'
});

Object.assign(dictionaries.pt, {
  'meta.description': 'xhalo-blog e um framework de blog open-source nativo Cloudflare que combina Cloudflare Pages, Workers API, D1, R2 e compilacao estatica Hexo/NexT.',
  'hero.terminal': '<span class="code-comment"># Clonar e validar o framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK validacao do xhalo-blog concluida.</span>\n<span class="code-info">INFO Build landing: npm run build:landing</span>\n<span class="code-info">INFO Inicializar site teste: npm run init:hexo-next -- --target ../my-blog-test</span>',
  'features.hexo.title': 'Velocidade Hexo',
  'features.hexo.body': 'Geracao estatica com Hexo, builds rapidos, compatibilidade Markdown padrao e adaptador do tema NexT.',
  'features.d1.title': 'Banco SQLite D1',
  'features.d1.body': 'Banco relacional serverless no edge com schemas, indices e historico de migracoes.',
  'features.r2.title': 'Armazenamento R2',
  'features.r2.body': 'Armazenamento sem egress para midia, links assinados de preview e pastas de tema.',
  'features.security.title': 'Seguranca Turnstile',
  'features.security.body': 'Protege endpoints de mutacao contra bots e requisicoes maliciosas com Cloudflare Turnstile.',
  'features.admin.title': 'Painel Admin',
  'features.admin.body': 'Escreva, edite, previsualize e publique conteudo na web com Workers API e dry-runs locais.',
  'features.actions.title': 'Integracao GitHub Actions',
  'features.actions.body': 'Crie previews por branch e gere automaticamente sitemap, robots e RSS.',
  'architecture.svg.user': 'Visitante / Admin',
  'architecture.svg.edge': 'Rede edge Cloudflare',
  'architecture.svg.pagesSub': 'HTML / CSS estatico',
  'architecture.svg.workerSub': 'Roteador serverless',
  'architecture.svg.r2Sub': 'Midia e assets',
  'architecture.svg.d1Sub': 'Metadados SQLite',
  'footer.copyright': '© 2026 xhalo-blog scaffold. Publicado sob a licenca MIT.'
});

const localeAliases = new Map([
  ['zh', 'zh-CN'],
  ['zh-cn', 'zh-CN'],
  ['zh-hans', 'zh-CN'],
  ['ko', 'ko'],
  ['ko-kr', 'ko'],
  ['ja', 'ja'],
  ['ja-jp', 'ja'],
  ['fr', 'fr'],
  ['fr-fr', 'fr'],
  ['es', 'es'],
  ['es-es', 'es'],
  ['es-mx', 'es'],
  ['de', 'de'],
  ['de-de', 'de'],
  ['pt', 'pt'],
  ['pt-br', 'pt'],
  ['pt-pt', 'pt'],
  ['en', 'en'],
  ['en-us', 'en'],
  ['en-gb', 'en']
]);

function resolveLocale(languages = []) {
  for (const raw of languages) {
    const normalized = String(raw || '').toLowerCase();
    if (localeAliases.has(normalized)) return localeAliases.get(normalized);
    const primary = normalized.split('-')[0];
    if (localeAliases.has(primary)) return localeAliases.get(primary);
  }
  return 'en';
}

function applyLocale(locale) {
  const dictionary = dictionaries[locale] || dictionaries.en;
  document.documentElement.lang = locale;
  document.title = dictionary['meta.title'] || en['meta.title'];
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', dictionary['meta.description'] || en['meta.description']);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    node.textContent = dictionary[key] || en[key] || node.textContent;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    const key = node.getAttribute('data-i18n-html');
    node.innerHTML = dictionary[key] || en[key] || node.innerHTML;
  });
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
  const urlLocale = new URLSearchParams(window.location.search).get('lang');
  const locale = resolveLocale([urlLocale, ...(navigator.languages || [navigator.language])]);
  applyLocale(locale);

  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
      header.style.backgroundColor = 'rgba(11, 15, 25, 0.85)';
    } else {
      header.style.boxShadow = 'none';
      header.style.backgroundColor = 'rgba(17, 24, 39, 0.7)';
    }
  });

  const nodes = document.querySelectorAll('.node');
  nodes.forEach((node) => {
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

export { applyLocale, dictionaries, resolveLocale };
