import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '..');

const src = path.join(adminRoot, 'src');
const dist = path.join(adminRoot, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// Copy all files and folders recursively
fs.cpSync(src, dist, { recursive: true });

// Read config.js in dist and inject the environment variable
const configFile = path.join(dist, 'config.js');
if (fs.existsSync(configFile)) {
  let content = fs.readFileSync(configFile, 'utf8');
  const apiBaseUrl = process.env.XHALO_ADMIN_API_BASE_URL || '';
  content = content.replace('__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__', apiBaseUrl);
  fs.writeFileSync(configFile, content, 'utf8');
  console.log(`Injected API Base URL: "${apiBaseUrl}"`);
}

console.log('Admin UI built recursively.');
