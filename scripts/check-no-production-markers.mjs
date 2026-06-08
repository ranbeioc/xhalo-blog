import fs from 'node:fs';
import path from 'node:path';

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
  '56a7d794be9249a2bb752e3a953c9183'
];
const allowlist = new Set([
  'scripts/check-no-production-markers.mjs',
  'docs/CLAUDE_BRANCH_PROGRESS.md'
]);
const findings = [];

function isTextFile(content) {
  return !content.includes('\u0000');
}

function checkSecretLikeValues(relativePath, content) {
  // Skip unit test files as they are allowed to contain dummy/mock secrets
  if (relativePath.startsWith('tests/')) return;

  // Regex to match assignments in shell/env/toml/markdown/toml.example (with = or :)
  // 1. MATCH: key = value (without space or quotes, or with quotes)
  // 2. MATCH: "key": "value" or 'key': 'value' (with quotes)
  // We use [ \t] instead of \s to prevent matching across newlines.
  const regexes = [
    /(ADMIN_API_SHARED_SECRET|TURNSTILE_SECRET_KEY|GITHUB_WEBHOOK_SECRET|PREVIEW_WEBHOOK_SECRET|ASSETS_SIGNING_SECRET|GITHUB_TOKEN|GITHUB_APP_PRIVATE_KEY)[ \t]*=[ \t]*['"`]?([^'"\r\n\s#]+)['"`]?/gi,
    /(ADMIN_API_SHARED_SECRET|TURNSTILE_SECRET_KEY|GITHUB_WEBHOOK_SECRET|PREVIEW_WEBHOOK_SECRET|ASSETS_SIGNING_SECRET|GITHUB_TOKEN|GITHUB_APP_PRIVATE_KEY)[ \t]*:[ \t]*['"`]([^'"\r\n]+)['"`]/gi
  ];

  const safeValues = new Set([
    '<placeholder>',
    '<redacted>',
    '<redacted-staging-admin-secret>',
    'your-secret',
    'example-secret',
    'example',
    'dummy-token',
    'your-domain',
    'your-access-aud-tag',
    'your-turnstile-site-key',
    'your-access-audience-tag',
    'your-admin-shared-secret',
    'your_secret',
    'secret',
    'your-github-username',
    'your-blog-repo',
    'main',
    'dummy-github-webhook-secret',
    'dummy-preview-webhook-secret',
    '1x0000000000000000000000000000000aa'
  ]);

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      const val = (match[2] || match[3] || '').trim();
      if (!val) continue;

      if (!safeValues.has(val) && !safeValues.has(val.toLowerCase())) {
        findings.push(`${relativePath}: secret-like value found for ${key} = "${val}"`);
      }
    }
  }
}


function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (skippedDirs.has(entry.name)) continue;

    const absolutePath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walk(absolutePath);
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
    if (!allowlist.has(relativePath)) {
      for (const marker of forbiddenMarkers) {
        if (content.includes(marker)) {
          findings.push(`${relativePath}: ${marker}`);
        }
      }
    }

    // Check for secret-like values in ALL files
    checkSecretLikeValues(relativePath, content);
  }
}

walk(rootDir);

if (findings.length > 0) {
  console.error('Forbidden production markers or secret-like values found:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('No forbidden production markers or secret-like values found.');

