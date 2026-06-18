// Interactive scripts and locale runtime for the xhalo-blog landing page.

const localeDefinitions = {
  en: {
    meta: [
      'xhalo-blog - Cloudflare-Native Blog Framework Scaffold',
      'Open-source Cloudflare-native blog framework for Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub publishing, and a private test-site migration flow.',
      'xhalo-blog, Cloudflare Pages blog, Hexo NexT migration, Workers API, D1, R2, GitHub publishing'
    ],
    nav: ['Features', 'Architecture', 'Quickstart', 'Language', 'Menu'],
    hero: [
      'Cloudflare Native',
      'The Ultimate <span class="gradient-text">Cloudflare-Native</span> Blog Scaffold',
      'Deploy a fast personal blog or developer journal on Cloudflare. Use Hexo/NexT for static output, Workers for authenticated admin APIs, D1 for metadata, and R2 for media assets.',
      'Deploy Now',
      'Learn More ->',
      '<span class="code-comment"># Clone and validate the framework</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog validation passed.</span>\n<span class="code-info">INFO Landing build: npm run build:landing</span>\n<span class="code-info">INFO Test site: npm run init:hexo-next -- --target ../my-blog-test</span>'
    ],
    featuresTitle: 'Powerful Capabilities, <span class="gradient-text">Zero Servers</span>',
    featuresLead: 'xhalo-blog provides the framework, Admin, Workers API, migration tooling, and Cloudflare deployment conventions for a secure edge-native blog.',
    features: [
      ['Hexo Speed', 'Static generation with standard Markdown compatibility and a NexT-compatible initialization path.'],
      ['D1 SQLite Database', 'Serverless relational metadata storage for sessions, admins, audit logs, and publishing state.'],
      ['R2 Object Storage', 'Media and attachment storage with test-only gates and safe signed-upload flows.'],
      ['Turnstile Security', 'Protect mutation endpoints with authentication, environment gates, Turnstile, and audit logs.'],
      ['Admin Panel UI', 'Edit posts, menus, media, Hexo/NexT config, GitHub, and Cloudflare integration state from one dashboard.'],
      ['GitHub Publishing', 'Keep Git as the content source of truth with PR-only production publishing and test-only direct publishing.']
    ],
    migration: [
      'Hexo/NexT Migration, <span class="gradient-text">Standardized</span>',
      'Initialize a private test site from the default NexT starter or import an existing Hexo/NexT blog with posts, uploads, menus, theme files, plugin config, and an audit report.',
      'Starter Mode',
      'Generate a clean NexT site with a welcome post when no historical source is provided.',
      'Import Mode',
      'Copy historical posts, uploads, pages, theme config, feed/search/sitemap/media plugin settings, and safe audit outputs into a private test repository.',
      'Read the Guide',
      'Use the documented flow to keep open-source framework code separate from private blog content.',
      'Migration Guide'
    ],
    architecture: [
      'Edge Architecture Overview',
      'xhalo-blog combines Cloudflare Pages, Workers, D1, R2, and GitHub to keep the static blog fast while preserving authenticated admin workflows.',
      'Visitor / Admin',
      'Cloudflare Edge Network',
      'CF Pages',
      'Static HTML / CSS',
      'CF Workers API',
      'Serverless Router',
      'CF R2 Bucket',
      'Media & Assets',
      'CF D1 Database',
      'SQLite Metadata'
    ],
    quickstart: [
      'Get Started in <span class="gradient-text">2 Minutes</span>',
      'Create a starter site, import a Hexo/NexT blog, configure custom domains, and connect the right Cloudflare Pages projects.',
      'Clone and Install',
      'Get the framework source and install the locked workspace dependencies.',
      'Initialize a Test Site',
      'Generate a default NexT starter or import an existing Hexo/NexT source into a private test repository, then set the site URL to your main domain.',
      'Build and Validate',
      'Run the repository validation gate and build the landing page before publishing.',
      'Connect Cloudflare Pages',
      'Use one Pages project for the open-source landing page and one Pages project for the private full blog test or production site.'
    ],
    footer: ['© 2026 xhalo-blog scaffold. Released under the MIT License.', 'License', 'Security', 'Documentation']
  },
  'zh-CN': {
    meta: [
      'xhalo-blog - Cloudflare 原生博客框架脚手架',
      '面向 Hexo/NexT、Cloudflare Pages、Workers API、D1、R2、GitHub 发布和私有测试站迁移流程的开源 Cloudflare 原生博客框架。',
      'xhalo-blog, Cloudflare Pages 博客, Hexo NexT 迁移, Workers API, D1, R2, GitHub 发布'
    ],
    nav: ['功能', '架构', '快速开始', '语言', '菜单'],
    hero: ['Cloudflare 原生', '面向 Cloudflare 的<span class="gradient-text">现代博客框架</span>', '在 Cloudflare 上部署高速个人博客或开发日志。Hexo/NexT 负责静态输出，Workers 负责认证后台 API，D1 存储元数据，R2 承载媒体资产。', '开始部署', '了解更多 ->', '<span class="code-comment"># 克隆并验证框架</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 验证通过。</span>\n<span class="code-info">INFO 落地页构建: npm run build:landing</span>\n<span class="code-info">INFO 测试站初始化: npm run init:hexo-next -- --target ../my-blog-test</span>'],
    featuresTitle: '完整能力，<span class="gradient-text">无需自管服务器</span>',
    featuresLead: 'xhalo-blog 提供框架、Admin、Workers API、迁移工具和 Cloudflare 部署约定，用于构建安全的边缘原生博客。',
    features: [['Hexo 速度', '标准 Markdown 静态生成，并提供 NexT 兼容初始化路径。'], ['D1 SQLite 数据库', '用于 session、管理员、审计日志和发布状态的边缘关系型元数据存储。'], ['R2 对象存储', '媒体和附件资产层，配合测试写入 gate 与安全签名上传流程。'], ['Turnstile 安全防护', '通过认证、环境 gate、Turnstile 和审计日志保护写入端点。'], ['管理后台 UI', '集中编辑文章、菜单、媒体、Hexo/NexT 配置、GitHub 和 Cloudflare 集成状态。'], ['GitHub 发布', '以 Git 作为内容真相来源，生产只走 PR，测试站可走受控 direct publish。']],
    migration: ['Hexo/NexT 迁移，<span class="gradient-text">标准化</span>', '可从默认 NexT 起步站初始化私有测试站，也可导入既有 Hexo/NexT 博客的文章、上传、菜单、主题、插件配置和审计报告。', '起步模式', '没有历史来源时，生成干净的 NexT 站点和默认欢迎测试文章。', '导入模式', '将历史文章、上传、独立页面、主题配置、feed/search/sitemap/media 插件配置和安全审计输出复制到私有测试仓库。', '阅读指南', '使用标准流程隔离开源框架代码和私有博客内容。', '迁移指南'],
    architecture: ['边缘架构概览', 'xhalo-blog 组合 Cloudflare Pages、Workers、D1、R2 和 GitHub，在保持静态博客速度的同时保留认证后台工作流。', '访客 / 管理员', 'Cloudflare 边缘网络', 'CF Pages', '静态 HTML / CSS', 'CF Workers API', '无服务器路由', 'CF R2 存储桶', '媒体与资产', 'CF D1 数据库', 'SQLite 元数据'],
    quickstart: ['<span class="gradient-text">2 分钟</span>快速开始', '创建起步站、导入 Hexo/NexT 博客、配置自定义主域名，并连接正确的 Cloudflare Pages 项目。', '克隆并安装', '获取框架源码并安装 lockfile 固定的工作区依赖。', '初始化测试站', '生成默认 NexT 起步站，或将既有 Hexo/NexT 源导入私有测试仓库，并将站点 URL 设置为你的主域名。', '构建并验证', '发布前运行仓库验证 gate，并构建落地页。', '连接 Cloudflare Pages', '开源落地页使用一个 Pages 项目，私有完整博客测试站或生产站使用另一个 Pages 项目。'],
    footer: ['© 2026 xhalo-blog scaffold。基于 MIT License 发布。', '许可证', '安全', '文档']
  },
  ko: {
    meta: ['xhalo-blog - Cloudflare 네이티브 블로그 프레임워크', 'Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub 게시, 비공개 테스트 사이트 마이그레이션을 위한 오픈소스 블로그 프레임워크.', 'xhalo-blog, Cloudflare Pages 블로그, Hexo NexT 마이그레이션, Workers API, D1, R2, GitHub 게시'],
    nav: ['기능', '아키텍처', '빠른 시작', '언어', '메뉴'],
    hero: ['Cloudflare 네이티브', '<span class="gradient-text">Cloudflare 네이티브</span> 블로그 스캐폴드', 'Cloudflare에서 빠른 개인 블로그나 개발 저널을 배포하세요. Hexo/NexT는 정적 출력을, Workers는 인증된 Admin API를, D1은 메타데이터를, R2는 미디어 자산을 담당합니다.', '지금 배포', '자세히 보기 ->', '<span class="code-comment"># 프레임워크 복제 및 검증</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 검증 통과.</span>\n<span class="code-info">INFO 랜딩 빌드: npm run build:landing</span>\n<span class="code-info">INFO 테스트 사이트: npm run init:hexo-next -- --target ../my-blog-test</span>'],
    featuresTitle: '강력한 기능, <span class="gradient-text">서버 운영 없음</span>',
    featuresLead: 'xhalo-blog는 안전한 엣지 네이티브 블로그를 위한 프레임워크, Admin, Workers API, 마이그레이션 도구, Cloudflare 배포 규칙을 제공합니다.',
    features: [['Hexo 속도', '표준 Markdown 호환 정적 생성과 NexT 호환 초기화 경로를 제공합니다.'], ['D1 SQLite 데이터베이스', '세션, 관리자, 감사 로그, 게시 상태를 위한 서버리스 관계형 메타데이터 저장소입니다.'], ['R2 객체 스토리지', 'test-only 게이트와 안전한 서명 업로드 흐름을 갖춘 미디어 및 첨부 파일 저장소입니다.'], ['Turnstile 보안', '인증, 환경 게이트, Turnstile, 감사 로그로 변경 엔드포인트를 보호합니다.'], ['Admin 패널 UI', '글, 메뉴, 미디어, Hexo/NexT 설정, GitHub, Cloudflare 통합 상태를 한 대시보드에서 관리합니다.'], ['GitHub 게시', 'Git을 콘텐츠의 기준으로 유지하고 운영은 PR 전용, 테스트는 제한된 direct publish를 사용합니다.']],
    migration: ['Hexo/NexT 마이그레이션, <span class="gradient-text">표준화</span>', '기본 NexT 스타터에서 비공개 테스트 사이트를 만들거나 기존 Hexo/NexT 블로그의 글, 업로드, 메뉴, 테마 파일, 플러그인 설정, 감사 보고서를 가져옵니다.', '스타터 모드', '기존 소스가 없으면 환영 글이 포함된 깨끗한 NexT 사이트를 생성합니다.', '가져오기 모드', '과거 글, 업로드, 페이지, 테마 설정, feed/search/sitemap/media 플러그인 설정, 안전 감사 결과를 비공개 테스트 저장소로 복사합니다.', '가이드 보기', '문서화된 흐름으로 오픈소스 프레임워크 코드와 비공개 블로그 콘텐츠를 분리합니다.', '마이그레이션 가이드'],
    architecture: ['엣지 아키텍처 개요', 'xhalo-blog는 Cloudflare Pages, Workers, D1, R2, GitHub를 결합해 정적 블로그 속도와 인증된 Admin 워크플로를 함께 유지합니다.', '방문자 / 관리자', 'Cloudflare 엣지 네트워크', 'CF Pages', '정적 HTML / CSS', 'CF Workers API', '서버리스 라우터', 'CF R2 버킷', '미디어 및 자산', 'CF D1 데이터베이스', 'SQLite 메타데이터'],
    quickstart: ['<span class="gradient-text">2분</span> 안에 시작', '스타터 사이트 생성, Hexo/NexT 가져오기, 사용자 지정 도메인 설정, Cloudflare Pages 프로젝트 연결을 진행합니다.', '복제 및 설치', '프레임워크 소스를 가져오고 잠금 파일로 고정된 워크스페이스 의존성을 설치합니다.', '테스트 사이트 초기화', '기본 NexT 스타터를 생성하거나 기존 Hexo/NexT 소스를 비공개 테스트 저장소로 가져온 뒤 사이트 URL을 주 도메인으로 설정합니다.', '빌드 및 검증', '게시 전에 저장소 검증 게이트를 실행하고 랜딩 페이지를 빌드합니다.', 'Cloudflare Pages 연결', '오픈소스 랜딩 페이지와 비공개 전체 블로그 테스트 또는 운영 사이트는 서로 다른 Pages 프로젝트를 사용합니다.'],
    footer: ['© 2026 xhalo-blog scaffold. MIT License로 배포됩니다.', '라이선스', '보안', '문서']
  },
  ja: {
    meta: ['xhalo-blog - Cloudflare ネイティブブログフレームワーク', 'Hexo/NexT、Cloudflare Pages、Workers API、D1、R2、GitHub 公開、非公開テストサイト移行に対応するオープンソースブログフレームワーク。', 'xhalo-blog, Cloudflare Pages ブログ, Hexo NexT 移行, Workers API, D1, R2, GitHub 公開'],
    nav: ['機能', 'アーキテクチャ', 'クイックスタート', '言語', 'メニュー'],
    hero: ['Cloudflare ネイティブ', '<span class="gradient-text">Cloudflare ネイティブ</span>ブログスキャフォールド', 'Cloudflare 上に高速な個人ブログや開発日誌をデプロイします。Hexo/NexT が静的出力、Workers が認証済み Admin API、D1 がメタデータ、R2 がメディア資産を担当します。', '今すぐデプロイ', '詳しく見る ->', '<span class="code-comment"># フレームワークを clone して検証</span>\n$ git clone https://github.com/ranbeioc/xhalo-blog.git\n$ cd xhalo-blog\n$ npm ci\n$ npm run check:all\n\n<span class="code-success">OK xhalo-blog 検証に成功しました。</span>\n<span class="code-info">INFO ランディングビルド: npm run build:landing</span>\n<span class="code-info">INFO テストサイト: npm run init:hexo-next -- --target ../my-blog-test</span>'],
    featuresTitle: '強力な機能、<span class="gradient-text">サーバー運用不要</span>',
    featuresLead: 'xhalo-blog は、安全なエッジネイティブブログのために、フレームワーク、Admin、Workers API、移行ツール、Cloudflare デプロイ規約を提供します。',
    features: [['Hexo の速度', '標準 Markdown 互換の静的生成と NexT 互換の初期化パスを提供します。'], ['D1 SQLite データベース', 'セッション、管理者、監査ログ、公開状態のためのサーバーレスなリレーショナルメタデータストレージです。'], ['R2 オブジェクトストレージ', 'test-only ゲートと安全な署名アップロードを備えたメディアと添付ファイルの保管層です。'], ['Turnstile セキュリティ', '認証、環境ゲート、Turnstile、監査ログで変更エンドポイントを保護します。'], ['Admin パネル UI', '記事、メニュー、メディア、Hexo/NexT 設定、GitHub、Cloudflare 統合状態を 1 つのダッシュボードで編集します。'], ['GitHub 公開', 'Git をコンテンツの正本として維持し、本番は PR のみ、テストは制御された direct publish を使用します。']],
    migration: ['Hexo/NexT 移行を<span class="gradient-text">標準化</span>', '既定の NexT スターターから非公開テストサイトを初期化、または既存 Hexo/NexT ブログの記事、アップロード、メニュー、テーマファイル、プラグイン設定、監査レポートを取り込みます。', 'スターターモード', '履歴ソースがない場合、歓迎記事付きのクリーンな NexT サイトを生成します。', 'インポートモード', '過去記事、アップロード、ページ、テーマ設定、feed/search/sitemap/media プラグイン設定、安全な監査出力を非公開テストリポジトリにコピーします。', 'ガイドを読む', '文書化された手順でオープンソースのフレームワークコードと非公開ブログコンテンツを分離します。', '移行ガイド'],
    architecture: ['エッジアーキテクチャ概要', 'xhalo-blog は Cloudflare Pages、Workers、D1、R2、GitHub を組み合わせ、静的ブログの速度と認証済み Admin ワークフローを両立します。', '訪問者 / 管理者', 'Cloudflare エッジネットワーク', 'CF Pages', '静的 HTML / CSS', 'CF Workers API', 'サーバーレスルーター', 'CF R2 バケット', 'メディアと資産', 'CF D1 データベース', 'SQLite メタデータ'],
    quickstart: ['<span class="gradient-text">2 分</span>で開始', 'スターターサイト作成、Hexo/NexT 取り込み、カスタムドメイン設定、Cloudflare Pages プロジェクト接続を行います。', 'Clone とインストール', 'フレームワークソースを取得し、lockfile で固定されたワークスペース依存関係をインストールします。', 'テストサイトを初期化', '既定の NexT スターターを生成、または既存 Hexo/NexT ソースを非公開テストリポジトリに取り込み、サイト URL を主ドメインに設定します。', 'ビルドと検証', '公開前にリポジトリ検証ゲートを実行し、ランディングページをビルドします。', 'Cloudflare Pages に接続', 'オープンソースのランディングページと非公開の完全ブログテストまたは本番サイトには、別々の Pages プロジェクトを使用します。'],
    footer: ['© 2026 xhalo-blog scaffold. MIT License で公開されています。', 'ライセンス', 'セキュリティ', 'ドキュメント']
  },
  fr: {
    meta: ['xhalo-blog - Framework de blog natif Cloudflare', 'Framework open-source pour Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publication GitHub et migration vers un site de test privé.', 'xhalo-blog, blog Cloudflare Pages, migration Hexo NexT, Workers API, D1, R2, publication GitHub'],
    nav: ['Fonctionnalités', 'Architecture', 'Démarrage', 'Langue', 'Menu'],
    hero: ['Cloudflare natif', 'Le scaffold de blog <span class="gradient-text">natif Cloudflare</span>', 'Déployez un blog personnel rapide sur Cloudflare avec Hexo/NexT, Workers, D1 et R2.', 'Déployer', 'En savoir plus ->'],
    quickstart: ['Démarrez en <span class="gradient-text">2 minutes</span>', 'Créez un starter, importez Hexo/NexT, configurez le domaine principal et connectez Cloudflare Pages.', 'Cloner et installer', 'Récupérez la source et installez les dépendances verrouillées.', 'Initialiser le site de test', 'Générez un starter NexT ou importez une source Hexo/NexT privée puis définissez le domaine principal.', 'Construire et valider', 'Exécutez la validation du dépôt et construisez la page de présentation.', 'Connecter Cloudflare Pages', 'Utilisez un projet Pages pour la landing et un autre pour le blog complet privé.']
  },
  es: {
    meta: ['xhalo-blog - Framework de blog nativo de Cloudflare', 'Framework open-source para Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publicación con GitHub y migración a sitio privado de prueba.', 'xhalo-blog, blog Cloudflare Pages, migración Hexo NexT, Workers API, D1, R2, publicación GitHub'],
    nav: ['Funciones', 'Arquitectura', 'Inicio rápido', 'Idioma', 'Menú'],
    hero: ['Cloudflare nativo', 'El scaffold de blog <span class="gradient-text">nativo de Cloudflare</span>', 'Despliega un blog rápido en Cloudflare con Hexo/NexT, Workers, D1 y R2.', 'Desplegar', 'Ver más ->'],
    quickstart: ['Empieza en <span class="gradient-text">2 minutos</span>', 'Crea un starter, importa Hexo/NexT, configura el dominio principal y conecta Cloudflare Pages.', 'Clonar e instalar', 'Obtén el código fuente e instala las dependencias bloqueadas.', 'Inicializar sitio de prueba', 'Genera un starter NexT o importa una fuente Hexo/NexT privada y define el dominio principal.', 'Construir y validar', 'Ejecuta la validación del repositorio y construye la landing.', 'Conectar Cloudflare Pages', 'Usa un proyecto Pages para la landing y otro para el blog completo privado.']
  },
  de: {
    meta: ['xhalo-blog - Cloudflare-natives Blog-Framework', 'Open-Source Framework für Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, GitHub Publishing und private Testsite-Migration.', 'xhalo-blog, Cloudflare Pages Blog, Hexo NexT Migration, Workers API, D1, R2, GitHub Publishing'],
    nav: ['Features', 'Architektur', 'Schnellstart', 'Sprache', 'Menü'],
    hero: ['Cloudflare-nativ', 'Das <span class="gradient-text">Cloudflare-native</span> Blog-Scaffold', 'Deploye ein schnelles Blog auf Cloudflare mit Hexo/NexT, Workers, D1 und R2.', 'Jetzt deployen', 'Mehr erfahren ->'],
    quickstart: ['Start in <span class="gradient-text">2 Minuten</span>', 'Starter erstellen, Hexo/NexT importieren, Hauptdomain konfigurieren und Cloudflare Pages verbinden.', 'Klonen und installieren', 'Hole den Quellcode und installiere die gesperrten Workspace-Abhängigkeiten.', 'Testsite initialisieren', 'Erzeuge einen NexT-Starter oder importiere eine private Hexo/NexT-Quelle und setze die Hauptdomain.', 'Build und Validierung', 'Führe die Repository-Validierung aus und baue die Landing Page.', 'Cloudflare Pages verbinden', 'Nutze ein Pages-Projekt für die Landing Page und ein separates für das private vollständige Blog.']
  },
  pt: {
    meta: ['xhalo-blog - Framework de blog nativo Cloudflare', 'Framework open-source para Hexo/NexT, Cloudflare Pages, Workers API, D1, R2, publicação via GitHub e migração para site privado de teste.', 'xhalo-blog, blog Cloudflare Pages, migração Hexo NexT, Workers API, D1, R2, publicação GitHub'],
    nav: ['Recursos', 'Arquitetura', 'Início rápido', 'Idioma', 'Menu'],
    hero: ['Cloudflare nativo', 'O scaffold de blog <span class="gradient-text">nativo Cloudflare</span>', 'Implante um blog rápido na Cloudflare com Hexo/NexT, Workers, D1 e R2.', 'Implantar', 'Saiba mais ->'],
    quickstart: ['Comece em <span class="gradient-text">2 minutos</span>', 'Crie um starter, importe Hexo/NexT, configure o domínio principal e conecte Cloudflare Pages.', 'Clonar e instalar', 'Obtenha o código-fonte e instale as dependências bloqueadas.', 'Inicializar site de teste', 'Gere um starter NexT ou importe uma fonte Hexo/NexT privada e defina o domínio principal.', 'Construir e validar', 'Execute a validação do repositório e construa a landing page.', 'Conectar Cloudflare Pages', 'Use um projeto Pages para a landing e outro para o blog completo privado.']
  }
};

function makeLocale(definition) {
  const base = localeDefinitions.en;
  const features = definition.features || base.features;
  const migration = definition.migration || base.migration;
  const architecture = definition.architecture || base.architecture;
  const hero = definition.hero || base.hero;
  const quickstart = definition.quickstart || base.quickstart;
  const footer = definition.footer || base.footer;
  return {
    'meta.title': definition.meta[0],
    'meta.description': definition.meta[1],
    'meta.keywords': definition.meta[2],
    'nav.features': definition.nav[0],
    'nav.architecture': definition.nav[1],
    'nav.quickstart': definition.nav[2],
    'language.label': definition.nav[3],
    'nav.menu': definition.nav[4],
    'hero.badge': hero[0],
    'hero.title': hero[1],
    'hero.subtitle': hero[2],
    'hero.primaryCta': hero[3],
    'hero.secondaryCta': hero[4],
    'hero.terminal': hero[5] || base.hero[5],
    'features.title': definition.featuresTitle || base.featuresTitle,
    'features.lead': definition.featuresLead || base.featuresLead,
    'features.hexo.title': features[0][0],
    'features.hexo.body': features[0][1],
    'features.d1.title': features[1][0],
    'features.d1.body': features[1][1],
    'features.r2.title': features[2][0],
    'features.r2.body': features[2][1],
    'features.security.title': features[3][0],
    'features.security.body': features[3][1],
    'features.admin.title': features[4][0],
    'features.admin.body': features[4][1],
    'features.actions.title': features[5][0],
    'features.actions.body': features[5][1],
    'migration.title': migration[0],
    'migration.lead': migration[1],
    'migration.starter.title': migration[2],
    'migration.starter.body': migration[3],
    'migration.import.title': migration[4],
    'migration.import.body': migration[5],
    'migration.guide.title': migration[6],
    'migration.guide.body': migration[7],
    'migration.guide.cta': migration[8],
    'architecture.title': architecture[0],
    'architecture.lead': architecture[1],
    'architecture.svg.user': architecture[2],
    'architecture.svg.edge': architecture[3],
    'architecture.svg.pages': architecture[4],
    'architecture.svg.pagesSub': architecture[5],
    'architecture.svg.worker': architecture[6],
    'architecture.svg.workerSub': architecture[7],
    'architecture.svg.r2': architecture[8],
    'architecture.svg.r2Sub': architecture[9],
    'architecture.svg.d1': architecture[10],
    'architecture.svg.d1Sub': architecture[11],
    'quickstart.title': quickstart[0],
    'quickstart.lead': quickstart[1],
    'quickstart.step1.title': quickstart[2],
    'quickstart.step1.body': quickstart[3],
    'quickstart.step2.title': quickstart[4],
    'quickstart.step2.body': quickstart[5],
    'quickstart.step3.title': quickstart[6],
    'quickstart.step3.body': quickstart[7],
    'quickstart.step4.title': quickstart[8],
    'quickstart.step4.body': quickstart[9],
    'footer.copyright': footer[0],
    'footer.license': footer[1],
    'footer.security': footer[2],
    'footer.docs': footer[3]
  };
}

const dictionaries = Object.fromEntries(
  Object.entries(localeDefinitions).map(([locale, definition]) => [locale, makeLocale(definition)])
);

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
  const title = dictionary['meta.title'] || dictionaries.en['meta.title'];
  const description = dictionary['meta.description'] || dictionaries.en['meta.description'];
  const canonicalUrl = locale === 'en' ? 'https://blog.xhalo.co/' : `https://blog.xhalo.co/?lang=${encodeURIComponent(locale)}`;
  document.title = title;
  upsertMeta('meta[name="description"]', 'content', description);
  upsertMeta('meta[name="keywords"]', 'content', dictionary['meta.keywords'] || dictionaries.en['meta.keywords']);
  upsertMeta('meta[property="og:title"]', 'content', title);
  upsertMeta('meta[property="og:description"]', 'content', description);
  upsertMeta('meta[property="og:url"]', 'content', canonicalUrl);
  upsertMeta('meta[name="twitter:title"]', 'content', title);
  upsertMeta('meta[name="twitter:description"]', 'content', description);
  upsertMeta('link[rel="canonical"]', 'href', canonicalUrl);
}

function applyLocale(locale) {
  const safeLocale = dictionaries[locale] ? locale : 'en';
  const dictionary = dictionaries[safeLocale];
  document.documentElement.lang = safeLocale;
  updateSeo(safeLocale, dictionary);

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    node.textContent = dictionary[key] || dictionaries.en[key] || node.textContent;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    const key = node.getAttribute('data-i18n-html');
    node.innerHTML = dictionary[key] || dictionaries.en[key] || node.innerHTML;
  });

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) languageSelect.value = safeLocale;
}

function bindMobileNavigation() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const header = document.getElementById('main-header');
  if (!toggle || !navLinks) return;

  const close = () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', close));
  document.addEventListener('click', (event) => {
    if (!header?.contains(event.target)) close();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const urlLocale = new URLSearchParams(window.location.search).get('lang');
    const locale = resolveLocale([urlLocale, getStoredLocale(), ...(navigator.languages || [navigator.language])]);
    applyLocale(locale);
    bindMobileNavigation();

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
  });
}

export { applyLocale, dictionaries, resolveLocale, supportedLocales };
