import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS = [
  { pattern: /staging\.xhalo-admin\.pages\.dev/i, desc: 'staging.xhalo-admin.pages.dev reference' },
  { pattern: /--project-name\s+xhalo-admin\b/i, desc: '--project-name xhalo-admin parameter' },
  { pattern: /CLOUDFLARE_PAGES_PROJECT_NAME\s*=\s*xhalo-admin\b/i, desc: 'CLOUDFLARE_PAGES_PROJECT_NAME=xhalo-admin variable' },
  { pattern: /CF_PAGES_PROJECT\s*=\s*xhalo-admin\b/i, desc: 'CF_PAGES_PROJECT=xhalo-admin variable' },
  { pattern: /PAGES_PROJECT_NAME\s*=\s*xhalo-admin\b/i, desc: 'PAGES_PROJECT_NAME=xhalo-admin variable' }
];

// Folders to exclude
const EXCLUDE_DIRS = ['.git', 'node_modules', '.wrangler', 'dist'];

// Files to exclude from patterns to avoid false positives (e.g. this script, tests, or documentation explaining the rules)
const EXCLUDE_FILES = [
  'check-deploy-boundary.mjs',
  'admin-ui-boundary.test.mjs',
  'GEMINI.md',
  '.clauderc',
  '.cursorrules',
  'repo-boundary.md',
  'deviation-register.md',
  'CLAUDE_BRANCH_PROGRESS.md',
  'xhalo-blog-admin-deployment-boundary.md',
  'check-pr-body-quality.mjs'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check forbidden patterns
  for (const item of FORBIDDEN_PATTERNS) {
    if (item.pattern.test(content)) {
      // Allow documentation to mention xhalo-admin if it clearly explains it's a global platform, not xhalo-blog
      if (filePath.endsWith('.md')) {
        const lowerContent = content.toLowerCase();
        const explainsIsolation = lowerContent.includes('global') || lowerContent.includes('isolated') || lowerContent.includes('not related') || lowerContent.includes('separate');
        if (explainsIsolation && !item.pattern.toString().includes('staging.xhalo-admin.pages.dev')) {
          continue; // Allowed doc exception
        }
      }
      return `${filePath}: Found forbidden pattern: ${item.desc}`;
    }
  }
  return null;
}

function scanDir(dir) {
  const errors = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      errors.push(...scanDir(fullPath));
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.includes(entry.name)) continue;
      // Only check source, config, workflow, and doc files
      if (/\.(js|mjs|json|yml|yaml|md|toml|html|css)$/.test(entry.name)) {
        const err = checkFile(fullPath);
        if (err) errors.push(err);
      }
    }
  }
  return errors;
}

const errors = scanDir(path.resolve('.'));
if (errors.length > 0) {
  console.error('Deployment Boundary Check FAILED:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('Deployment Boundary Check PASSED.');
process.exit(0);
