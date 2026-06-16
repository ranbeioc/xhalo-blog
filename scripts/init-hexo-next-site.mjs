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

if (!fs.existsSync(templateDir)) fail(`Template directory not found: ${templateDir}`);
if (sourceDir && !fs.existsSync(sourceDir)) fail(`Hexo source directory not found: ${sourceDir}`);

ensureEmptyTarget(targetDir);
copyDirectory(templateDir, targetDir, { skip: defaultSkip });

let importedPosts = 0;
if (sourceDir) {
  importedPosts = importHexoSource(sourceDir, targetDir);
} else {
  importedPosts = countMarkdownFiles(path.join(targetDir, 'source', '_posts'));
}

const configPath = path.join(targetDir, '_config.yml');
if (fs.existsSync(configPath)) {
  sanitizeConfig(configPath, {
    siteUrl: args.siteUrl,
    siteTitle: args.siteTitle
  });
}

writeImportManifest(targetDir, {
  sourceDir,
  importedPosts,
  mode: sourceDir ? 'hexo-source-import' : 'starter-template',
  siteUrl: args.siteUrl || null,
  siteTitle: args.siteTitle || null
});

console.log(`xhalo-blog Hexo/NexT site initialized at ${targetDir}`);
console.log(`mode: ${sourceDir ? 'hexo-source-import' : 'starter-template'}`);
console.log(`posts: ${importedPosts}`);

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
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return result;
}

function printUsage() {
  console.log(`Usage:
  npm run init:hexo-next -- --target ../my-blog-test
  npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://example.pages.dev --site-title "My Blog"

This command never overwrites a non-empty target directory.`);
}

function ensureEmptyTarget(target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(target).filter((name) => name !== '.git');
  if (entries.length > 0) fail(`Target directory must be empty or absent: ${target}`);
}

function importHexoSource(source, target) {
  const sourcePosts = path.join(source, 'source', '_posts');
  const targetPosts = path.join(target, 'source', '_posts');
  if (fs.existsSync(sourcePosts)) emptyDirectory(targetPosts, target);

  for (const rel of [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '_config.yml',
    '_config.next.yml',
    '_config.landscape.yml'
  ]) {
    copyIfExists(path.join(source, rel), path.join(target, rel));
  }

  for (const rel of [
    'scaffolds',
    'scripts',
    'themes/next',
    'source/_posts',
    'source/upload',
    'source/_data',
    'source/about',
    'source/categories',
    'source/tags',
    'source/project',
    'source/projects'
  ]) {
    copyIfExists(path.join(source, rel), path.join(target, rel), { directory: true });
  }

  removeDangerousDeploymentFiles(target);
  return countMarkdownFiles(targetPosts);
}

function copyIfExists(from, to, options = {}) {
  if (!fs.existsSync(from)) return;
  const stat = fs.statSync(from);
  if (options.directory || stat.isDirectory()) {
    copyDirectory(from, to, { skip: defaultSkip });
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDirectory(from, to, options = {}) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (options.skip?.(sourcePath, entry.name)) continue;
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, options);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function defaultSkip(sourcePath, name) {
  const skippedNames = new Set(['.git', '.github', '.env', '.deploy_git', 'node_modules', 'public', 'db.json', 'CNAME']);
  if (skippedNames.has(name)) return true;
  return /(^|[/\\])\.env\./.test(sourcePath);
}

function removeDangerousDeploymentFiles(target) {
  for (const rel of ['CNAME', '.github', '.deploy_git', 'public', 'node_modules', 'db.json']) {
    const abs = path.join(target, rel);
    if (!fs.existsSync(abs)) continue;
    assertInside(abs, target);
    fs.rmSync(abs, { recursive: true, force: true });
  }
}

function sanitizeConfig(configPath, options) {
  let text = fs.readFileSync(configPath, 'utf8');
  if (options.siteUrl) text = replaceOrAppendTopLevel(text, 'url', options.siteUrl);
  if (options.siteTitle) text = replaceOrAppendTopLevel(text, 'title', options.siteTitle);
  text = removeTopLevelBlock(text, 'deploy');
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

function emptyDirectory(dir, target) {
  if (!fs.existsSync(dir)) return;
  assertInside(dir, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function assertInside(candidate, parent) {
  const resolvedCandidate = path.resolve(candidate);
  const resolvedParent = path.resolve(parent);
  if (resolvedCandidate !== resolvedParent && !resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`)) {
    fail(`Refusing to modify path outside target: ${resolvedCandidate}`);
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

function writeImportManifest(target, data) {
  fs.writeFileSync(path.join(target, '.xhalo-import-manifest.json'), `${JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    ...data,
    sourceDir: data.sourceDir ? path.basename(data.sourceDir) : null
  }, null, 2)}\n`, 'utf8');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
