import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  signUploadToken,
  verifyUploadToken,
  validateR2UploadInput,
  ALLOWED_MIME_TYPES
} from '../workers/api/src/lib/r2.js';

describe('lib/r2.js — crypto & validation', () => {
  const env = { ASSETS_SIGNING_SECRET: 'test-secret-1234567890' };
  
  it('signUploadToken generates a non-empty string', async () => {
    const token = await signUploadToken(env, { foo: 'bar' });
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0);
    assert.ok(token.includes('.'));
  });

  it('verifyUploadToken accepts a valid token', async () => {
    const payload = { test: 123 };
    const token = await signUploadToken(env, payload);
    const result = await verifyUploadToken(env, token);
    assert.deepEqual(result, payload);
  });

  it('verifyUploadToken rejects a tampered signature', async () => {
    const token = await signUploadToken(env, { test: 123 });
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    await assert.rejects(async () => {
      await verifyUploadToken(env, tampered);
    }, /Invalid upload token signature/);
  });

  it('validateR2UploadInput catches path traversal', () => {
    assert.match(String(validateR2UploadInput('../evil.png', 'image/png')), /invalid path traversal/i);
    assert.match(String(validateR2UploadInput('foo.png', 'image/png', '../scope')), /invalid path traversal/i);
    assert.match(String(validateR2UploadInput('foo.png', 'image/png', 'scope', '../post')), /invalid path traversal/i);
  });

  it('validateR2UploadInput catches forbidden MIME types', () => {
    assert.match(String(validateR2UploadInput('test.exe', 'application/x-msdownload')), /not allowed/i);
  });

  it('ALLOWED_MIME_TYPES contains expected types', () => {
    assert.ok(ALLOWED_MIME_TYPES['image/png']);
    assert.ok(ALLOWED_MIME_TYPES['image/jpeg']);
    assert.ok(ALLOWED_MIME_TYPES['application/pdf']);
  });
});
