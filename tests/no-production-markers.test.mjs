import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSecretLikeValues, walk } from '../scripts/check-no-production-markers.mjs';

test('secrets scanner rejects concrete staging or production secrets', () => {
  const cases = [
    'ADMIN_API_SHARED_SECRET="staging-sec-9f7a5b3c-rotated"',
    '$env:ADMIN_API_SHARED_SECRET="staging-sec-9f7a5b3c-rotated"',
    'ADMIN_API_SHARED_SECRET: "staging-sec-9f7a5b3c-rotated"',
    'GITHUB_TOKEN="gho_fakeToken1234567890abcdefghijklmnopqr"',
    'ADMIN_API_SHARED_SECRET=my-real-secret-123'
  ];

  for (const content of cases) {
    const findings = [];
    checkSecretLikeValues('docs/test-report.md', content, findings);
    assert.ok(findings.length > 0, `Expected content "${content}" to trigger a secret scanner finding, but it did not.`);
    assert.match(findings[0], /secret-like value found/, `Expected finding error message, got: ${findings[0]}`);
  }
});

test('secrets scanner accepts safe placeholder values', () => {
  const cases = [
    'ADMIN_API_SHARED_SECRET="<redacted>"',
    'ADMIN_API_SHARED_SECRET="<redacted-admin-shared-secret>"',
    'ADMIN_API_SHARED_SECRET="<redacted-staging-admin-secret>"',
    'ADMIN_API_SHARED_SECRET="<placeholder>"',
    'ADMIN_API_SHARED_SECRET="<admin-shared-secret>"',
    'ADMIN_API_SHARED_SECRET="your-admin-shared-secret"',
    'GITHUB_TOKEN="<read-only-token>"',
    'GITHUB_TOKEN="your-github-token"',
    'GITHUB_TOKEN="gho_************************************"',
    'GITHUB_TOKEN="gho_***"',
    'LEVEL1_TURNSTILE_TOKEN="dummy-token"'
  ];

  for (const content of cases) {
    const findings = [];
    checkSecretLikeValues('docs/test-report.md', content, findings);
    assert.equal(findings.length, 0, `Expected content "${content}" to be allowed as safe, but it triggered a finding: ${JSON.stringify(findings)}`);
  }
});

test('scanner detects forbidden markers, concrete staging URLs, and secrets via walk()', () => {
  const tempDir = path.join(process.cwd(), 'temp-fixture-scanner');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Write a file with forbidden marker
    const file1 = path.join(tempDir, 'fail-marker.md');
    fs.writeFileSync(file1, 'Some local path: ' + 'file://' + '/c:/' + 'Users/ranbe/Documents/Github/xhalo-blog/docs/test.md');

    // Write a file with concrete staging URL
    const file2 = path.join(tempDir, 'fail-url.md');
    fs.writeFileSync(file2, 'Target is xhalo-blog-staging-api.' + 'ranbei' + '.workers' + '.dev');

    // Write a file with allowed values
    const file3 = path.join(tempDir, 'pass-safe.md');
    fs.writeFileSync(file3, 'Referencing ./docs/level1-readonly-validation-report-20260609.md and URL <staging-api-worker-url>');

    // Write a file with a secret
    const file4 = path.join(tempDir, 'fail-secret.md');
    fs.writeFileSync(file4, 'ADMIN_API_SHARED_SECRET="staging-sec-9f7a5b3c-rotated"');

    const localFindings = [];
    walk(tempDir, localFindings);

    // Verify failures
    const failedFiles = localFindings.map(f => path.basename(f.split(':')[0]));
    assert.ok(failedFiles.includes('fail-marker.md'), 'Expected fail-marker.md to trigger a finding');
    assert.ok(failedFiles.includes('fail-url.md'), 'Expected fail-url.md to trigger a finding');
    assert.ok(failedFiles.includes('fail-secret.md'), 'Expected fail-secret.md to trigger a finding');
    
    // Verify pass
    const passTriggered = failedFiles.includes('pass-safe.md');
    assert.ok(!passTriggered, 'Expected pass-safe.md to pass without findings');
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
});
