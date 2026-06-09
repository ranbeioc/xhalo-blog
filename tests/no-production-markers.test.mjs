import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSecretLikeValues } from '../scripts/check-no-production-markers.mjs';

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
