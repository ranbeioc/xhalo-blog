import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const targetDirs = [
  'workers/api/src',
  'workers/queue/src',
  'packages/core/src',
  'packages/theme-adapter-hexo/src'
];

function getFiles(dir) {
  const results = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...getFiles(fullPath));
      } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Directory might not exist in some environments
  }
  return results;
}

const allFiles = targetDirs.flatMap(getFiles);
let hasError = false;

console.log(`Checking syntax for ${allFiles.length} JavaScript files...`);

for (const file of allFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    console.error(`✗ Syntax error in ${file}:`);
    console.error(err.stderr?.toString() || err.message);
    hasError = true;
  }
}

if (hasError) {
  console.error('\nSyntax check failed!');
  process.exit(1);
} else {
  console.log(`✓ All ${allFiles.length} files passed syntax check.`);
}
