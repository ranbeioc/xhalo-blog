import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const migrationPath = path.join(rootDir, 'workers/api/migrations/0003_harden_posts_index_constraints.sql');
const docsPath = path.join(rootDir, 'docs/d1-migrations.md');

console.log('Running D1 migration readiness preflight checks...');

// 1. Verify migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`Error: Migration file not found at ${migrationPath}`);
  process.exit(1);
}

const migrationContent = fs.readFileSync(migrationPath, 'utf8');

// 2. Verify migration file contains correct indexes
const requiredIndexStatements = [
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_index_slug',
  'CREATE INDEX IF NOT EXISTS idx_posts_index_status',
  'CREATE INDEX IF NOT EXISTS idx_posts_index_published_at'
];

for (const statement of requiredIndexStatements) {
  if (!migrationContent.includes(statement)) {
    console.error(`Error: Migration 0003 is missing statement: "${statement}"`);
    process.exit(1);
  }
}
console.log('✓ Migration file exists and contains all required SQL statements.');

// 3. Verify docs/d1-migrations.md exists
if (!fs.existsSync(docsPath)) {
  console.error(`Error: Documentation file not found at ${docsPath}`);
  process.exit(1);
}

const docsContent = fs.readFileSync(docsPath, 'utf8');

// 4. Verify docs contain preflight check SQL
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

// 5. Verify docs contain rollback SQL
const requiredRollbackPhrases = [
  'DROP INDEX IF EXISTS idx_posts_index_slug;',
  'DROP INDEX IF EXISTS idx_posts_index_status;',
  'DROP INDEX IF EXISTS idx_posts_index_published_at;'
];

for (const phrase of requiredRollbackPhrases) {
  if (!docsContent.includes(phrase)) {
    console.error(`Error: docs/d1-migrations.md is missing rollback SQL phrase: "${phrase}"`);
    process.exit(1);
  }
}
console.log('✓ Documentation contains rollback SQL statements.');

console.log('D1 migration readiness check passed successfully!');
process.exit(0);
