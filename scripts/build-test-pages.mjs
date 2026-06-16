import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { firstTestArticleTemplate } from '../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'pages');
const adminDist = path.join(rootDir, 'apps', 'admin', 'dist');

function escapeHtml(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(markdown = '') {
  return String(markdown)
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('# ')) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith('- ')) {
        return `<ul>${trimmed.split('\n').map((line) => `<li>${escapeHtml(line.replace(/^- /, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function writeFile(relativePath, content) {
  const filePath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function pageShell({ title, body, currentPath = '/' }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/assets/site.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/">xHalo Blog Test</a>
    <nav>
      <a href="/" ${currentPath === '/' ? 'aria-current="page"' : ''}>Home</a>
      <a href="/posts/xhalo-blog-first-test-post/" ${currentPath.startsWith('/posts/') ? 'aria-current="page"' : ''}>First Test Post</a>
      <a href="/admin">Admin</a>
    </nav>
  </header>
  <main>${body}</main>
</body>
</html>
`;
}

const adminEnv = { ...process.env, XHALO_ADMIN_API_BASE_URL: '' };
console.log('Building admin UI for same-origin Pages routing...');
execSync('npm run build:admin', { cwd: rootDir, stdio: 'inherit', env: adminEnv });

console.log('Assembling Cloudflare Pages test site at dist/pages...');
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const post = firstTestArticleTemplate;
const postPath = `/posts/${post.slug}/`;

writeFile('assets/site.css', `
:root {
  color-scheme: light;
  --ink: #17201a;
  --muted: #5b675f;
  --paper: #f7f2e8;
  --accent: #1f6f55;
  --line: rgba(23, 32, 26, 0.16);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: Georgia, "Times New Roman", serif;
  color: var(--ink);
  background:
    radial-gradient(circle at 10% 10%, rgba(31, 111, 85, 0.16), transparent 28rem),
    linear-gradient(135deg, #fbf7ef 0%, var(--paper) 55%, #e9efe7 100%);
}
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem clamp(1rem, 4vw, 4rem);
  border-bottom: 1px solid var(--line);
}
.brand { color: var(--ink); font-weight: 700; text-decoration: none; letter-spacing: 0.03em; }
nav { display: flex; flex-wrap: wrap; gap: 0.9rem; }
nav a { color: var(--muted); text-decoration: none; }
nav a[aria-current="page"] { color: var(--accent); font-weight: 700; }
main { width: min(1080px, calc(100% - 2rem)); margin: 0 auto; padding: clamp(2rem, 6vw, 5rem) 0; }
.hero { display: grid; gap: 1.5rem; max-width: 820px; }
.eyebrow { color: var(--accent); font: 700 0.85rem/1.2 ui-sans-serif, system-ui; letter-spacing: 0.12em; text-transform: uppercase; }
h1 { font-size: clamp(2.5rem, 8vw, 6.5rem); line-height: 0.95; margin: 0; }
p { color: var(--muted); font-size: 1.1rem; line-height: 1.75; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 3rem; }
.card {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--line);
  border-radius: 1.2rem;
  padding: 1.2rem;
  box-shadow: 0 1rem 4rem rgba(25, 47, 38, 0.08);
}
.card a { color: var(--accent); font-weight: 700; text-decoration: none; }
.article { max-width: 760px; }
.article h1 { font-size: clamp(2.4rem, 7vw, 5rem); }
.article li { color: var(--muted); margin: 0.4rem 0; line-height: 1.6; }
code { background: rgba(31, 111, 85, 0.1); border-radius: 0.35rem; padding: 0.1rem 0.3rem; }
@media (max-width: 640px) {
  .site-header { align-items: flex-start; flex-direction: column; }
}
`);

writeFile('index.html', pageShell({
  title: 'xHalo Blog Test',
  currentPath: '/',
  body: `
    <section class="hero">
      <div class="eyebrow">Cloudflare Pages Full Test Site</div>
      <h1>xHalo Blog 测试站</h1>
      <p>当前 <code>xhalo-blog-test</code> 应由 Cloudflare Pages 承载博客 HTML、Admin 前端和普通静态资源。R2 只保留为媒体和附件资产层，不作为整站托管层。</p>
    </section>
    <section class="card-grid" aria-label="Test site sections">
      <article class="card">
        <p class="eyebrow">First Post</p>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.summary)}</p>
        <a href="${postPath}">Read test article</a>
      </article>
      <article class="card">
        <p class="eyebrow">Admin</p>
        <h2>GitHub OAuth Admin</h2>
        <p>首个成功 GitHub 登录用户可在 test 环境 bootstrap 为管理员，后续依赖 D1 admin_users 或白名单。</p>
        <a href="/admin">Open admin</a>
      </article>
      <article class="card">
        <p class="eyebrow">Boundary</p>
        <h2>R2 assets only</h2>
        <p>R2 不承载整站 HTML。测试直发只允许 test_direct gate 下的安全目标。</p>
      </article>
    </section>
  `
}));

writeFile(`posts/${post.slug}/index.html`, pageShell({
  title: post.title,
  currentPath: postPath,
  body: `
    <article class="article">
      <div class="eyebrow">${escapeHtml(post.category)} / ${post.tags.map(escapeHtml).join(', ')}</div>
      ${markdownToHtml(post.body)}
    </article>
  `
}));

fs.mkdirSync(path.join(outputDir, 'admin'), { recursive: true });
fs.cpSync(adminDist, path.join(outputDir, 'admin'), { recursive: true });

const workerContent = `/**
 * Cloudflare Pages Advanced Mode Worker Proxy for xhalo-blog-test.
 * Static HTML/Admin assets are served by Pages. R2 remains media/assets only.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/admin') {
      url.pathname = '/admin/';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
      const apiBaseUrl = env.XHALO_ADMIN_API_BASE_URL || '';
      if (!apiBaseUrl) {
        return new Response(JSON.stringify({ error: 'XHALO_ADMIN_API_BASE_URL is not configured for Pages proxy.' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      const targetUrl = new URL(url.pathname + url.search, apiBaseUrl);
      const requestInit = {
        method: request.method,
        headers: request.headers,
        redirect: 'manual'
      };
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        requestInit.body = request.body;
      }
      return fetch(new Request(targetUrl, requestInit));
    }

    return env.ASSETS.fetch(request);
  }
};
`;

writeFile('_worker.js', workerContent);

console.log('Pages test build complete: dist/pages');
