export async function triggerPagesDeployHook(env, detail = {}) {
  const hookUrl = env.CLOUDFLARE_PAGES_DEPLOY_HOOK_URL || env.PAGES_DEPLOY_HOOK_URL || '';
  if (!hookUrl) {
    return {
      configured: false,
      triggered: false,
      note: 'CLOUDFLARE_PAGES_DEPLOY_HOOK_URL is not configured; Git commit was created but Pages rebuild was not explicitly triggered.'
    };
  }

  if (!/^https:\/\/api\.cloudflare\.com\/client\/v4\/pages\/webhooks\/deploy_hooks\/[a-f0-9-]+$/i.test(hookUrl)) {
    return {
      configured: true,
      triggered: false,
      error: 'Configured deploy hook URL is not a Cloudflare Pages deploy hook URL.'
    };
  }

  try {
    const hookFetch = env.PAGES_DEPLOY_HOOK_FETCH || fetch;
    const response = await hookFetch(hookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(detail)
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return {
      configured: true,
      triggered: response.ok,
      status: response.status,
      hook: 'cloudflare_pages_deploy_hook',
      deploymentId: payload?.result?.id || payload?.result?.deployment_id || null,
      deploymentUrl: payload?.result?.url || null,
      error: response.ok ? null : (payload?.errors?.[0]?.message || payload?.error || 'Cloudflare deploy hook request failed.')
    };
  } catch (error) {
    return {
      configured: true,
      triggered: false,
      error: error.message || String(error)
    };
  }
}

export async function waitBeforePagesDeployHook(env) {
  const hookUrl = env.CLOUDFLARE_PAGES_DEPLOY_HOOK_URL || env.PAGES_DEPLOY_HOOK_URL || '';
  if (!hookUrl) return;
  const rawDelay = env.CLOUDFLARE_PAGES_DEPLOY_HOOK_DELAY_MS || env.PAGES_DEPLOY_HOOK_DELAY_MS;
  const delayMs = rawDelay == null || rawDelay === '' ? 1500 : Number(rawDelay);
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000)));
}

export function buildHexoPostUrl(slug, publishedAt) {
  const date = new Date(publishedAt || Date.now());
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `/${year}/${month}/${day}/${slug}/`;
}

export function buildHexoNextPluginCatalog() {
  return [
    { id: 'next-theme', name: 'NexT Theme', configFiles: ['themes/next/_config.yml', '_config.next.yml'], category: 'theme', supportsToggle: true },
    { id: 'feed', name: 'hexo-generator-feed', configKeys: ['feed'], category: 'seo', supportsToggle: true },
    { id: 'sitemap', name: 'hexo-generator-sitemap', configKeys: ['sitemap'], category: 'seo', supportsToggle: true },
    { id: 'search', name: 'hexo-generator-searchdb', configKeys: ['search'], category: 'search', supportsToggle: true },
    { id: 'waline', name: 'Waline comments', configKeys: ['waline'], category: 'comments', supportsToggle: true },
    { id: 'analytics', name: 'Analytics providers', configKeys: ['google_analytics', 'baidu_analytics', 'clarity'], category: 'analytics', supportsToggle: true },
    { id: 'math', name: 'Math rendering', configKeys: ['math', 'katex', 'mathjax'], category: 'content', supportsToggle: true },
    { id: 'mermaid', name: 'Mermaid diagrams', configKeys: ['mermaid'], category: 'content', supportsToggle: true },
    { id: 'pjax', name: 'NexT PJAX', configKeys: ['pjax'], category: 'performance', supportsToggle: true },
    { id: 'lazyload', name: 'Image lazy loading', configKeys: ['lazyload'], category: 'performance', supportsToggle: true }
  ];
}
