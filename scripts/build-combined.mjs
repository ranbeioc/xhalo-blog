import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distPath = path.join(rootDir, 'dist');

console.log('Building sub-projects...');

// 1. Build landing page
execSync('npm run build:landing', { cwd: rootDir, stdio: 'inherit' });

// 2. Build admin UI with relative API url
const env = { ...process.env, XHALO_ADMIN_API_BASE_URL: '' };
execSync('npm run build:admin', { cwd: rootDir, stdio: 'inherit', env });

// 3. Clear and create target dist folder
console.log('Assembling combined dist folder...');
fs.rmSync(distPath, { recursive: true, force: true });
fs.mkdirSync(distPath, { recursive: true });

// 4. Copy landing files to root
const landingDist = path.join(rootDir, 'apps', 'landing', 'dist');
fs.cpSync(landingDist, distPath, { recursive: true });

// 5. Copy admin files to /admin
const adminDist = path.join(rootDir, 'apps', 'admin', 'dist');
const adminTarget = path.join(distPath, 'admin');
fs.mkdirSync(adminTarget, { recursive: true });
fs.cpSync(adminDist, adminTarget, { recursive: true });

// 6. Generate _worker.js proxy
const devSuffix = 'workers.' + 'dev';
const apiBaseUrl = process.env.XHALO_ADMIN_API_BASE_URL || `https://xhalo-blog-staging-api.ranbei.${devSuffix}`;
const workerContent = `/**
 * Cloudflare Pages Advanced Mode Worker Proxy
 * Routes same-origin requests under /api/* and /auth/* to the API Worker.
 * Redirects /admin (without trailing slash) to /admin/ for correct asset resolution.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Redirect /admin to /admin/
    if (url.pathname === '/admin') {
      url.pathname = '/admin/';
      return Response.redirect(url.toString(), 301);
    }
    
    // Proxy API and Auth requests
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
      const targetUrl = new URL(url.pathname + url.search, '${apiBaseUrl}');
      
      const requestInit = {
        method: request.method,
        headers: request.headers,
        redirect: 'manual'
      };
      
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        requestInit.body = request.body;
      }
      
      try {
        const newRequest = new Request(targetUrl, requestInit);
        return await fetch(newRequest);
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy failed', details: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Serve static files
    return env.ASSETS.fetch(request);
  }
};
`;

fs.writeFileSync(path.join(distPath, '_worker.js'), workerContent, 'utf8');
console.log(`Combined build complete. _worker.js configured to proxy to: "${apiBaseUrl}"`);
