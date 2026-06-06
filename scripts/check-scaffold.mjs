import fs from 'node:fs';
import {
  validateEnvExample,
  validateScaffoldConfig
} from '../packages/core/src/index.js';

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
  'apps/admin/src/app.js',
  'examples/basic-blog/src/_headers',
  'templates/hexo-next/_config.yml',
  'examples/next-theme-blog/_config.yml',
  'docs/getting-started.md',
  'docs/architecture.md',
  'docs/compatibility-matrix.md',
  'docs/hexo-blog-extraction-manifest.md',
  'docs/public-config-contract.md',
  'docs/stable-deployment-guide.md',
  'docs/stable-template-layout.md',
  '.github/workflows/check.yml',
  'scripts/check-no-production-markers.mjs',
  'tests/worker-security.test.mjs'
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error('Missing required scaffold files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const configIssues = validateScaffoldConfig(
  JSON.parse(fs.readFileSync('rb-blog.config.example.json', 'utf8'))
);
const envIssues = validateEnvExample(fs.readFileSync('.env.example', 'utf8'));
const validationIssues = [...configIssues, ...envIssues];

if (validationIssues.length > 0) {
  console.error('Scaffold validation issues found:');
  for (const issue of validationIssues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('xhalo-blog scaffold check passed.');
