import fs from 'node:fs';
import path from 'node:path';
import { buildHexoCompatibilityFixtureManifest } from '../packages/theme-adapter-hexo/src/index.js';

const projectRoots = [
  'examples/next-theme-blog',
  'templates/hexo-next'
];

const manifest = buildHexoCompatibilityFixtureManifest();
const issues = [];

for (const projectRoot of projectRoots) {
  const publicRoot = path.join(projectRoot, 'public');
  const htmlPath = path.join(projectRoot, 'public', manifest.postOutputPath.replace(/^\//, ''));

  if (!fs.existsSync(htmlPath)) {
    issues.push(`${projectRoot}: missing fixture HTML output ${htmlPath}`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  for (const marker of manifest.expectedHtmlMarkers) {
    if (!html.includes(marker)) {
      issues.push(`${projectRoot}: missing HTML marker ${marker}`);
    }
  }

  for (const asset of manifest.assets) {
    const assetPath = path.join(publicRoot, asset.replace(/^\//, ''));
    if (!fs.existsSync(assetPath)) {
      issues.push(`${projectRoot}: missing copied asset ${asset}`);
    }
  }

  for (const output of [manifest.searchOutput, manifest.sitemapOutput, manifest.baiduSitemapOutput]) {
    const outputPath = path.join(publicRoot, output);
    if (!fs.existsSync(outputPath)) {
      issues.push(`${projectRoot}: missing generated output ${output}`);
      continue;
    }

    const outputText = fs.readFileSync(outputPath, 'utf8');
    if (output === manifest.searchOutput && !outputText.includes('Hexo Compatibility Fixtures')) {
      issues.push(`${projectRoot}: ${output} does not reference the fixture post title`);
    }

    if (output === manifest.sitemapOutput && !outputText.includes('/2026/06/02/hexo-compatibility-fixtures/')) {
      issues.push(`${projectRoot}: ${output} does not reference the fixture post permalink`);
    }
  }
}

if (issues.length > 0) {
  console.error('Hexo compatibility fixture check failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Hexo compatibility fixtures verified.');
