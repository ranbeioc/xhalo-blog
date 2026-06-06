const defaultMenu = [
  { key: 'home', path: '/', icon: 'home' },
  { key: 'about', path: '/about/', icon: 'user' },
  { key: 'tags', path: '/tags/', icon: 'tags' },
  { key: 'categories', path: '/categories/', icon: 'th' },
  { key: 'archives', path: '/archives/', icon: 'archive' }
];

const optionalCompatibilityPlugins = [
  { packageName: 'cheerio', purpose: 'asset path rewrite helper' },
  { packageName: '@waline/hexo-next', purpose: 'Waline placeholder integration' },
  { packageName: 'hexo-generator-searchdb', purpose: 'local search index generation' },
  { packageName: 'hexo-generator-baidu-sitemap', purpose: 'baidusitemap generation' },
  { packageName: 'hexo-tag-chart', purpose: 'chart tag compatibility' },
  { packageName: 'hexo-tag-mmedia', purpose: 'mmedia tag compatibility', status: 'planned' }
];

function normalizeMenuItem(item) {
  return {
    key: item?.key || 'custom',
    path: item?.path || '/',
    icon: item?.icon || 'circle'
  };
}

export function mapSiteConfigToHexo(config) {
  return {
    title: config.site?.title || 'xhalo-blog',
    subtitle: config.site?.subtitle || '',
    description: config.site?.description || '',
    author: config.site?.author || '',
    language: config.site?.language || 'zh-CN',
    timezone: config.site?.timezone || 'Asia/Shanghai',
    url: config.site?.url || 'https://example.com',
    theme: config.theme?.name || 'next',
    permalink: ':year/:month/:day/:title/',
    pretty_urls: {
      trailing_index: false,
      trailing_html: false
    },
    post_asset_folder: config.features?.postAssetFolder !== false,
    tag_dir: 'tags',
    archive_dir: 'archives',
    category_dir: 'categories',
    code_dir: 'downloads/code',
    i18n_dir: ':lang',
    skip_render: ['_headers'],
    include: ['_headers']
  };
}

export function mapThemeConfigToNext(config) {
  const theme = config.theme || {};

  return {
    scheme: theme.scheme || 'Gemini',
    darkmode: theme.darkmode !== false,
    sidebar: theme.sidebar || 'left',
    menu: Array.isArray(theme.menu) && theme.menu.length > 0
      ? theme.menu.map(normalizeMenuItem)
      : defaultMenu,
    social: Array.isArray(config.social) ? config.social : [],
    comments: {
      provider: config.comments?.provider || 'waline',
      enabled: Boolean(config.comments?.enabled),
      serverUrl: config.comments?.serverUrl || ''
    },
    analytics: {
      googleAnalyticsId: config.analytics?.googleAnalyticsId || '',
      baiduAnalyticsId: config.analytics?.baiduAnalyticsId || '',
      growingioProjectId: config.analytics?.growingioProjectId || '',
      cloudflareAnalyticsToken: config.analytics?.cloudflareAnalyticsToken || '',
      clarityProjectId: config.analytics?.clarityProjectId || ''
    }
  };
}

export function buildHexoCompatibilityProfile() {
  return {
    adapter: 'hexo-next',
    theme: 'next',
    permalink: ':year/:month/:day/:title/',
    postAssetFolder: true,
    headersFile: 'source/_headers',
    assetRewriteHelper: 'scripts/hexo-asset-image.js',
    optionalPlugins: optionalCompatibilityPlugins
  };
}
