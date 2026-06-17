import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'templates', 'hexo-next');
const args = parseArgs(process.argv.slice(2));

if (args.help || !args.target) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

const targetDir = path.resolve(args.target);
const sourceDir = args.source ? path.resolve(args.source) : null;
const mode = resolveMode(args.mode, sourceDir);
const plan = createPlan({ mode, sourceDir, targetDir, siteUrl: args.siteUrl, siteTitle: args.siteTitle });

if (!fs.existsSync(templateDir)) fail(`Template directory not found: ${templateDir}`);
if (sourceDir && !fs.existsSync(sourceDir)) fail(`Hexo source directory not found: ${sourceDir}`);

ensureEmptyTarget(targetDir);
copyDirectory(templateDir, targetDir, { skip: defaultSkip, plan, reason: 'starter template' });

if (mode === 'import') {
  importHexoSource(sourceDir, targetDir, plan);
} else {
  plan.warnings.push('Starter mode used because no Hexo source was provided.');
}

const configPath = path.join(targetDir, '_config.yml');
if (fs.existsSync(configPath)) {
  sanitizeConfig(configPath, {
    siteUrl: args.siteUrl,
    siteTitle: args.siteTitle,
    plan
  });
}

plan.counts.posts = countMarkdownFiles(path.join(targetDir, 'source', '_posts'));
plan.counts.uploads = countFiles(path.join(targetDir, 'source', 'upload'));
plan.counts.dataFiles = countFiles(path.join(targetDir, 'source', '_data'));
plan.counts.themeFiles = countFiles(path.join(targetDir, 'themes', 'next'));
plan.counts.scripts = countFiles(path.join(targetDir, 'scripts'));
plan.counts.configs = countRootConfigs(targetDir);

writeImportManifest(targetDir, plan);
writeImportReport(targetDir, plan);

console.log(`xhalo-blog Hexo/NexT site initialized at ${targetDir}`);
console.log(`mode: ${plan.mode}`);
console.log(`posts: ${plan.counts.posts}`);
console.log('manifest: .xhalo-import-manifest.json');
console.log('report: .xhalo-import-report.md');

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--target') {
      result.target = argv[++i];
    } else if (arg === '--source') {
      result.source = argv[++i];
    } else if (arg === '--site-url') {
      result.siteUrl = argv[++i];
    } else if (arg === '--site-title') {
      result.siteTitle = argv[++i];
    } else if (arg === '--mode') {
      result.mode = argv[++i];
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return result;
}

function printUsage() {
  console.log(`Usage:
  npm run init:hexo-next -- --target ../my-blog-test
  npm run init:hexo-next -- --target ../my-blog-test --mode starter
  npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://example.pages.dev --site-title "My Blog"
  npm run init:hexo-next -- --target ../my-blog-test --mode import --source ../hexo-blog --site-url https://example.pages.dev

Modes:
  starter  Generate the default NexT starter with welcome test content.
  import   Generate a private test site from a local Hexo/NexT source.

This command never overwrites a non-empty target directory.`);
}

function resolveMode(requestedMode, source) {
  const inferred = source ? 'import' : 'starter';
  if (!requestedMode) return inferred;
  if (!['starter', 'import'].includes(requestedMode)) fail(`Unsupported --mode value: ${requestedMode}`);
  if (requestedMode === 'import' && !source) fail('--mode import requires --source');
  if (requestedMode === 'starter' && source) fail('--mode starter cannot be combined with --source');
  return requestedMode;
}

function createPlan({ mode, sourceDir, targetDir, siteUrl, siteTitle }) {
  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    mode,
    sourceLabel: sourceDir ? path.basename(sourceDir) : null,
    targetLabel: path.basename(targetDir),
    siteUrl: siteUrl || null,
    siteTitle: siteTitle || null,
    counts: {
      posts: 0,
      uploads: 0,
      dataFiles: 0,
      pages: 0,
      themeFiles: 0,
      scripts: 0,
      configs: 0
    },
    copied: [],
    rewritten: [],
    disabled: [],
    needsReview: [],
    blocked: [],
    warnings: []
  };
}

function ensureEmptyTarget(target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(target).filter((name) => name !== '.git');
  if (entries.length > 0) fail(`Target directory must be empty or absent: ${target}`);
}

function importHexoSource(source, target, plan) {
  auditDangerousSourceArtifacts(source, plan);

  const sourcePosts = path.join(source, 'source', '_posts');
  const targetPosts = path.join(target, 'source', '_posts');
  if (fs.existsSync(sourcePosts)) emptyDirectory(targetPosts, target, plan, 'source/_posts');

  for (const rel of rootImportFiles(source)) {
    copyIfExists(path.join(source, rel), path.join(target, rel), { plan, reason: 'root config or package metadata' });
  }

  for (const rel of ['scaffolds', 'scripts', 'themes/next', 'source']) {
    copyIfExists(path.join(source, rel), path.join(target, rel), {
      directory: true,
      plan,
      reason: rel === 'source' ? 'Hexo content and static pages' : 'Hexo/NexT project support'
    });
  }

  removeDangerousDeploymentFiles(target, plan);
  detectReviewItems(target, plan);
}

function auditDangerousSourceArtifacts(source, plan) {
  for (const rel of ['CNAME', '.github', '.env', '.deploy_git', 'public', 'node_modules', 'db.json']) {
    const abs = path.join(source, rel);
    if (fs.existsSync(abs)) plan.blocked.push({ path: rel, reason: 'Excluded unsafe project artifact from source' });
  }
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && /^\.env\./.test(entry.name)) {
      plan.blocked.push({ path: entry.name, reason: 'Excluded environment file from source' });
    }
  }
}

function rootImportFiles(source) {
  const files = new Set(['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && /^_config(?:\..+)?\.ya?ml$/.test(entry.name)) files.add(entry.name);
  }
  return [...files].sort();
}

function copyIfExists(from, to, options = {}) {
  if (!fs.existsSync(from)) return;
  const stat = fs.statSync(from);
  if (options.directory || stat.isDirectory()) {
    copyDirectory(from, to, { skip: defaultSkip, plan: options.plan, reason: options.reason });
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  recordCopied(options.plan, to, options.reason);
}

function copyDirectory(from, to, options = {}) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (options.skip?.(sourcePath, entry.name, options.plan)) continue;
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, options);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      recordCopied(options.plan, targetPath, options.reason);
    }
  }
}

function defaultSkip(sourcePath, name, plan) {
  const skippedNames = new Set(['.git', '.github', '.env', '.deploy_git', 'node_modules', 'public', 'db.json', 'CNAME']);
  if (skippedNames.has(name)) {
    recordBlocked(plan, sourcePath, `Excluded unsafe project artifact: ${name}`);
    return true;
  }
  if (/(^|[/\\])\.env\./.test(sourcePath)) {
    recordBlocked(plan, sourcePath, 'Excluded environment file');
    return true;
  }
  return false;
}

function removeDangerousDeploymentFiles(target, plan) {
  for (const rel of ['CNAME', '.github', '.deploy_git', 'public', 'node_modules', 'db.json']) {
    const abs = path.join(target, rel);
    if (!fs.existsSync(abs)) continue;
    assertInside(abs, target);
    fs.rmSync(abs, { recursive: true, force: true });
    plan.blocked.push({ path: rel, reason: 'Removed unsafe generated or deployment artifact from target' });
  }
}

function sanitizeConfig(configPath, options) {
  let text = fs.readFileSync(configPath, 'utf8');
  if (options.siteUrl) {
    text = replaceOrAppendTopLevel(text, 'url', options.siteUrl);
    options.plan.rewritten.push({ path: '_config.yml', field: 'url', value: options.siteUrl });
  }
  if (options.siteTitle) {
    text = replaceOrAppendTopLevel(text, 'title', options.siteTitle);
    options.plan.rewritten.push({ path: '_config.yml', field: 'title', value: options.siteTitle });
  }
  const deployRemoved = hasTopLevelKey(text, 'deploy');
  text = removeTopLevelBlock(text, 'deploy');
  if (deployRemoved) options.plan.disabled.push({ path: '_config.yml', field: 'deploy', reason: 'Production deploy targets disabled' });
  text = ensureSkipRender(text, ['_headers', '_worker.js', 'admin/**', 'landing/**'], options.plan);
  text = `${text.trimEnd()}

# xhalo-blog safety: deploy targets are intentionally disabled in generated sites.
deploy:
`;
  fs.writeFileSync(configPath, text, 'utf8');
}

function replaceOrAppendTopLevel(text, key, value) {
  const regex = new RegExp(`^${key}:.*$`, 'm');
  const line = `${key}: ${value.replace(/\\/g, '\\\\')}`;
  return regex.test(text) ? text.replace(regex, line) : `${text.trimEnd()}\n${line}\n`;
}

function hasTopLevelKey(text, key) {
  return new RegExp(`^${key}:`, 'm').test(text);
}

function ensureSkipRender(text, requiredItems, plan) {
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith('skip_render:'));
  const existing = [];
  let end = index + 1;

  if (index >= 0) {
    const inline = lines[index].slice('skip_render:'.length).trim();
    if (inline && inline !== '[]') existing.push(...parseInlineList(inline));
    while (end < lines.length && !/^[A-Za-z0-9_-]+:/.test(lines[end])) {
      const match = lines[end].match(/^\s*-\s*(.+?)\s*$/);
      if (match) existing.push(unquote(match[1]));
      end += 1;
    }
  }

  const merged = unique([...existing, ...requiredItems]).filter(Boolean);
  const block = ['skip_render:', ...merged.map((item) => `  - ${item}`)];
  plan.rewritten.push({ path: '_config.yml', field: 'skip_render', value: merged.join(', ') });

  if (index < 0) return `${text.trimEnd()}\n${block.join('\n')}\n`;
  return [...lines.slice(0, index), ...block, ...lines.slice(end)].join('\n');
}

function parseInlineList(value) {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((item) => unquote(item.trim())).filter(Boolean);
  }
  return [unquote(value)];
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function unique(items) {
  return [...new Set(items)];
}

function removeTopLevelBlock(text, key) {
  const lines = text.split(/\r?\n/);
  const output = [];
  let skipping = false;
  for (const line of lines) {
    if (!skipping && line.startsWith(`${key}:`)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (/^[A-Za-z0-9_-]+:/.test(line)) {
        skipping = false;
        output.push(line);
      }
      continue;
    }
    output.push(line);
  }
  return output.join('\n');
}

function emptyDirectory(dir, target, plan, rel) {
  if (!fs.existsSync(dir)) return;
  assertInside(dir, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  plan.rewritten.push({ path: rel, field: 'content', value: 'starter posts replaced by source posts' });
}

function assertInside(candidate, parent) {
  const resolvedCandidate = path.resolve(candidate);
  const resolvedParent = path.resolve(parent);
  if (resolvedCandidate !== resolvedParent && !resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`)) {
    fail(`Refusing to modify path outside target: ${resolvedCandidate}`);
  }
}

function detectReviewItems(target, plan) {
  const packagePath = path.join(target, 'package.json');
  if (fs.existsSync(packagePath)) {
    const text = fs.readFileSync(packagePath, 'utf8');
    for (const name of ['@waline/hexo-next', 'hexo-generator-searchdb', 'hexo-generator-feed', 'hexo-generator-sitemap', 'hexo-tag-mmedia']) {
      if (text.includes(`"${name}"`)) plan.needsReview.push({ path: 'package.json', reason: `Preserved optional plugin dependency: ${name}` });
    }
  }

  for (const rel of ['_config.yml', '_config.next.yml']) {
    const abs = path.join(target, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const key of ['waline', 'search', 'feed', 'sitemap', 'baidusitemap', 'mmedia', 'menu']) {
      if (new RegExp(`^${key}:`, 'm').test(text)) plan.needsReview.push({ path: rel, reason: `Preserved ${key} configuration for owner review` });
    }
  }
}

function countMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countMarkdownFiles(abs);
    else if (entry.isFile() && entry.name.endsWith('.md')) count += 1;
  }
  return count;
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(abs);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

function countRootConfigs(target) {
  if (!fs.existsSync(target)) return 0;
  return fs.readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^_config(?:\..+)?\.ya?ml$/.test(entry.name))
    .length;
}

function recordCopied(plan, targetPath, reason) {
  if (!plan) return;
  const rel = normalizeRelative(path.relative(targetDir, targetPath));
  plan.copied.push({ path: rel, reason });
  if (rel.startsWith('source/') && !rel.startsWith('source/_') && rel.endsWith('/index.md')) {
    plan.counts.pages += 1;
  }
}

function recordBlocked(plan, sourcePath, reason) {
  if (!plan) return;
  plan.blocked.push({ path: normalizeSourceLabel(sourcePath), reason });
}

function normalizeSourceLabel(sourcePath) {
  const parts = sourcePath.split(/[\\/]+/);
  return parts.slice(Math.max(0, parts.length - 3)).join('/');
}

function normalizeRelative(rel) {
  return rel.split(path.sep).join('/');
}

function publicManifest(plan) {
  return {
    ...plan,
    copied: compactEntries(plan.copied),
    rewritten: compactEntries(plan.rewritten),
    disabled: compactEntries(plan.disabled),
    needsReview: compactEntries(plan.needsReview),
    blocked: compactEntries(plan.blocked),
    importedPosts: plan.counts.posts
  };
}

function compactEntries(entries) {
  const seen = new Set();
  const output = [];
  for (const entry of entries) {
    const key = JSON.stringify(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }
  return output;
}

function writeImportManifest(target, plan) {
  fs.writeFileSync(
    path.join(target, '.xhalo-import-manifest.json'),
    `${JSON.stringify(publicManifest(plan), null, 2)}\n`,
    'utf8'
  );
}

function writeImportReport(target, plan) {
  const manifest = publicManifest(plan);
  const lines = [
    '# xHalo Hexo/NexT Import Report',
    '',
    `- Mode: ${manifest.mode}`,
    `- Source: ${manifest.sourceLabel || 'starter-template'}`,
    `- Target: ${manifest.targetLabel}`,
    `- Site URL: ${manifest.siteUrl || 'not set'}`,
    `- Site title: ${manifest.siteTitle || 'not set'}`,
    '',
    '## Counts',
    '',
    `- Posts: ${manifest.counts.posts}`,
    `- Upload files: ${manifest.counts.uploads}`,
    `- Data files: ${manifest.counts.dataFiles}`,
    `- Static pages: ${manifest.counts.pages}`,
    `- NexT theme files: ${manifest.counts.themeFiles}`,
    `- Scripts: ${manifest.counts.scripts}`,
    `- Config files: ${manifest.counts.configs}`,
    '',
    '## Rewritten',
    ...formatEntries(manifest.rewritten),
    '',
    '## Disabled',
    ...formatEntries(manifest.disabled),
    '',
    '## Needs Review',
    ...formatEntries(manifest.needsReview),
    '',
    '## Blocked Or Excluded',
    ...formatEntries(manifest.blocked),
    '',
    '## Warnings',
    ...formatWarnings(manifest.warnings)
  ];
  fs.writeFileSync(path.join(target, '.xhalo-import-report.md'), `${lines.join('\n')}\n`, 'utf8');
}

function formatEntries(entries) {
  if (entries.length === 0) return ['- None'];
  return entries.map((entry) => `- ${entry.path}${entry.field ? ` ${entry.field}` : ''}: ${entry.reason || entry.value || 'recorded'}`);
}

function formatWarnings(warnings) {
  if (warnings.length === 0) return ['- None'];
  return warnings.map((warning) => `- ${warning}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
