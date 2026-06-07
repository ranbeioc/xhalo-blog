import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const migration3Path = path.join(rootDir, 'workers/api/migrations/0003_harden_posts_index_constraints.sql');
const migration4Path = path.join(rootDir, 'workers/api/migrations/0004_add_posts_index_preview_url.sql');
const docsPath = path.join(rootDir, 'docs/d1-migrations.md');

console.log('Running D1 migration readiness preflight checks...');

// 1. Verify migration 0003 file exists
if (!fs.existsSync(migration3Path)) {
  console.error(`Error: Migration 0003 file not found at ${migration3Path}`);
  process.exit(1);
}

const migration3Content = fs.readFileSync(migration3Path, 'utf8');

// 2. Verify migration 0003 file contains correct indexes
const required3IndexStatements = [
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_index_slug',
  'CREATE INDEX IF NOT EXISTS idx_posts_index_status',
  'CREATE INDEX IF NOT EXISTS idx_posts_index_published_at'
];

for (const statement of required3IndexStatements) {
  if (!migration3Content.includes(statement)) {
    console.error(`Error: Migration 0003 is missing statement: "${statement}"`);
    process.exit(1);
  }
}
console.log('✓ Migration 0003 file exists and contains all required SQL statements.');

// 3. Verify migration 0004 file exists
if (!fs.existsSync(migration4Path)) {
  console.error(`Error: Migration 0004 file not found at ${migration4Path}`);
  process.exit(1);
}

const migration4Content = fs.readFileSync(migration4Path, 'utf8');

// 4. Verify migration 0004 file contains correct statement
const statement4 = 'ALTER TABLE posts_index ADD COLUMN preview_url TEXT;';
if (!migration4Content.includes(statement4)) {
  console.error(`Error: Migration 0004 is missing statement: "${statement4}"`);
  process.exit(1);
}
console.log('✓ Migration 0004 file exists and contains Alter Table statement.');

// 5. Verify docs/d1-migrations.md exists
if (!fs.existsSync(docsPath)) {
  console.error(`Error: Documentation file not found at ${docsPath}`);
  process.exit(1);
}

const docsContent = fs.readFileSync(docsPath, 'utf8');

// 6. Verify docs contain preflight check SQL
const requiredPreflightPhrases = [
  'SELECT slug, COUNT(*) AS count',
  'FROM posts_index',
  'GROUP BY slug',
  'HAVING count > 1;'
];

for (const phrase of requiredPreflightPhrases) {
  if (!docsContent.includes(phrase)) {
    console.error(`Error: docs/d1-migrations.md is missing preflight SQL phrase: "${phrase}"`);
    process.exit(1);
  }
}
console.log('✓ Documentation contains duplicate slug preflight query.');

// 7. Verify docs contain rollback SQL
const requiredRollbackPhrases = [
  'DROP INDEX IF EXISTS idx_posts_index_slug;',
  'DROP INDEX IF EXISTS idx_posts_index_status;',
  'DROP INDEX IF EXISTS idx_posts_index_published_at;',
  'ALTER TABLE posts_index DROP COLUMN preview_url;'
];

for (const phrase of requiredRollbackPhrases) {
  if (!docsContent.includes(phrase)) {
    console.error(`Error: docs/d1-migrations.md is missing rollback SQL phrase: "${phrase}"`);
    process.exit(1);
  }
}
console.log('✓ Documentation contains all rollback SQL statements.');

console.log('D1 migration readiness check passed successfully!');
process.exit(0);
