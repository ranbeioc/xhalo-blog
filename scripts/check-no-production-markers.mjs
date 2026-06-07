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
    if (allowlist.has(relativePath)) continue;

    for (const marker of forbiddenMarkers) {
      if (content.includes(marker)) findings.push(`${relativePath}: ${marker}`);
    }
  }
}

walk(rootDir);

if (findings.length > 0) {
  console.error('Forbidden production markers found:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('No forbidden production markers found.');
