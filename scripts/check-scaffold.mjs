import fs from 'node:fs';

const required = [
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'ROADMAP.md',
  'rb-blog.config.example.json',
  '.env.example',
  'wrangler.toml.example',
  'workers/api/src/index.js',
  'workers/api/migrations/0001_initial.sql',
  'workers/queue/src/index.js',
  'apps/admin/src/index.html',
  'examples/basic-blog/src/_headers',
  'templates/hexo-next/_config.yml',
  'examples/next-theme-blog/_config.yml',
  'docs/getting-started.md',
  'docs/architecture.md',
  '.github/workflows/check.yml'
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error('Missing required scaffold files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const forbidden = [
  'ranbeis.com',
  'wae.xhalo.co',
  'G-FKQJFY0RNS',
  'gju8jhwyfo',
  '56a7d794be9249a2bb752e3a953c9183'
];

const scanTargets = required.filter((file) => fs.existsSync(file));
const hits = [];

for (const file of scanTargets) {
  const content = fs.readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (content.includes(token)) hits.push(`${file}: ${token}`);
  }
}

if (hits.length > 0) {
  console.error('Forbidden production-specific values found:');
  for (const hit of hits) console.error(`- ${hit}`);
  process.exit(1);
}

console.log('xhalo-blog scaffold check passed.');
