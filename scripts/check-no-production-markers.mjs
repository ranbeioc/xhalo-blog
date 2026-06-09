import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const skippedDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'public',
  '.wrangler',
  '.cache',
  'coverage'
]);
const skippedFiles = new Set([
  'package-lock.json'
]);
const forbiddenMarkers = [
  'ranbeis.com',
  'wae.xhalo.co',
  'G-FKQJFY0RNS',
  'gju8jhwyfo',
  '56a7d794be9249a2bb752e3a953c9183',
  'file:///',
  'c:/Users',
  'C:/Users'
];

export const markerAllowlist = new Set([
  'scripts/check-no-production-markers.mjs',
  'docs/CLAUDE_BRANCH_PROGRESS.md',
  'docs/level1-report-security-fix.md'
]);

export const secretAllowlist = new Set([
  'scripts/check-no-production-markers.mjs'
]);

export const findings = [];

export function isTextFile(content) {
  return !content.includes('\u0000');
}

export function checkSecretLikeValues(relativePath, content, localFindings = findings) {
  // Skip unit test files as they are allowed to contain dummy/mock secrets
  if (relativePath.startsWith('tests/')) return;

  // Regex to match assignments in shell/env/toml/markdown/toml.example (with = or :)
  // 1. MATCH: key = value (without space or quotes, or with quotes)
  // 2. MATCH: "key": "value" or 'key': 'value' (with optional quotes)
  // We use [ \t] instead of \s to prevent matching across newlines.
  const regexes = [
    /(ADMIN_API_SHARED_SECRET|TURNSTILE_SECRET_KEY|GITHUB_WEBHOOK_SECRET|PREVIEW_WEBHOOK_SECRET|ASSETS_SIGNING_SECRET|GITHUB_TOKEN|GITHUB_APP_PRIVATE_KEY)[ \t]*=[ \t]*['"`]?([^'"\r\n\s#]+)['"`]?/gi,
    /(ADMIN_API_SHARED_SECRET|TURNSTILE_SECRET_KEY|GITHUB_WEBHOOK_SECRET|PREVIEW_WEBHOOK_SECRET|ASSETS_SIGNING_SECRET|GITHUB_TOKEN|GITHUB_APP_PRIVATE_KEY)[ \t]*:[ \t]*['"`]?([^'"\r\n\s#]+)['"`]?/gi
  ];

  const safeValues = new Set([
    '<placeholder>',
    '<redacted>',
    '<redacted-admin-shared-secret>',
    '<redacted-staging-admin-secret>',
    '<admin-shared-secret>',
    '<read-only-token>',
    'your-secret',
    'example',
    'dummy-token',
    'your-domain',
    'your-access-aud-tag',
    'your-turnstile-site-key',
    'your-access-audience-tag',
    'your-admin-shared-secret',
    'your_secret',
    'your-github-username',
    'your-github-token',
    'your-blog-repo',
    'main',
    '1x0000000000000000000000000000000aa',
    'test-admin-secret'
  ]);

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      const val = (match[2] || '').trim();
      if (!val) continue;

      if (val === 'dummy-github-webhook-secret' || val === 'dummy-preview-webhook-secret') {
        const allowedPaths = [
          'docs/live-write-verification.md',
          'docs/deployment-smoke-test-matrix.md'
        ];
        const isAllowed = allowedPaths.includes(relativePath) || relativePath.startsWith('tests/');
        if (!isAllowed) {
          localFindings.push(`${relativePath}: dummy secret "${val}" is only allowed in docs/live-write-verification.md, docs/deployment-smoke-test-matrix.md, or tests/`);
        }
        continue;
      }

      if (val.includes('***') || val.includes('****')) continue;

      if (!safeValues.has(val) && !safeValues.has(val.toLowerCase())) {
        localFindings.push(`${relativePath}: secret-like value found for ${key} = "${val}"`);
      }
    }
  }
}

export function walk(dirPath, localFindings = findings) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (skippedDirs.has(entry.name)) continue;

    const absolutePath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walk(absolutePath, localFindings);
      continue;
    }

    if (skippedFiles.has(entry.name)) continue;

    let content;
    try {
      content = fs.readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    if (!isTextFile(content)) continue;

    // Check for forbidden production markers (skipping allowlisted files)
    if (!markerAllowlist.has(relativePath)) {
      for (const marker of forbiddenMarkers) {
        if (content.includes(marker)) {
          localFindings.push(`${relativePath}: forbidden production marker found: "${marker}"`);
        }
      }
    }

    // Check for concrete .workers.dev staging subdomains (excluding allowed placeholder)
    if (!markerAllowlist.has(relativePath)) {
      const workerDevMatch = content.match(/[a-zA-Z0-9-]+\.workers\.dev/g);
      if (workerDevMatch) {
        for (const url of workerDevMatch) {
          if (url !== '<your-account>.workers.dev' && url !== 'your-account.workers.dev' && url !== 'workers.dev') {
            localFindings.push(`${relativePath}: concrete staging URL found: "${url}"`);
          }
        }
      }
    }

    // Check for secret-like values in files NOT in secretAllowlist
    if (!secretAllowlist.has(relativePath)) {
      checkSecretLikeValues(relativePath, content, localFindings);
    }
  }
}

// Entry point when run directly
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]) ||
  fs.realpathSync(process.argv[1]).replace(/\\/g, '/').endsWith('scripts/check-no-production-markers.mjs')
);

if (isMain) {
  walk(rootDir);

  if (findings.length > 0) {
    console.error('Forbidden production markers or secret-like values found:');
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(1);
  }

  console.log('No forbidden production markers or secret-like values found.');
}
