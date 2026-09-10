import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleCors } from '../workers/api/src/lib/cors.js';

describe('lib/cors.js — handleCors', () => {
  function makeRequest(origin) {
    return { headers: new Headers(origin ? { Origin: origin } : {}) };
  }
  function makeResponse(status = 200) {
    return new Response('ok', { status });
  }

  it('passes through response when no Origin header is present', () => {
    const req = makeRequest(null);
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com' };
    const result = handleCors(req, res, env);
    assert.equal(result, res, 'should return original response');
    assert.equal(result.headers.has('Access-Control-Allow-Origin'), false);
  });

  it('sets CORS headers for allowed ADMIN_FRONTEND_BASE_URL origin', () => {
    const req = makeRequest('https://admin.example.com');
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'https://admin.example.com');
    assert.equal(result.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.equal(result.headers.get('Vary'), 'Origin');
  });

  it('sets CORS headers for allowed ADMIN_AUTH_BASE_URL origin', () => {
    const req = makeRequest('https://auth.example.com');
    const res = makeResponse();
    const env = { ADMIN_AUTH_BASE_URL: 'https://auth.example.com/' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'https://auth.example.com');
  });

  it('rejects unknown origin — no CORS headers added', () => {
    const req = makeRequest('https://evil.example.com');
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.has('Access-Control-Allow-Origin'), false);
  });

  it('allows localhost in non-production environment', () => {
    const req = makeRequest('http://localhost:3000');
    const res = makeResponse();
    const env = { DEPLOYMENT_ENV: 'staging' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
  });

  it('allows 127.0.0.1 in non-production environment', () => {
    const req = makeRequest('http://127.0.0.1:8080');
    const res = makeResponse();
    const env = { DEPLOYMENT_ENV: 'staging' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'http://127.0.0.1:8080');
  });

  it('rejects localhost in production environment', () => {
    const req = makeRequest('http://localhost:3000');
    const res = makeResponse();
    const env = { DEPLOYMENT_ENV: 'production' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.has('Access-Control-Allow-Origin'), false);
  });

  it('rejects 127.0.0.1 in production environment', () => {
    const req = makeRequest('http://127.0.0.1:8080');
    const res = makeResponse();
    const env = { DEPLOYMENT_ENV: 'production' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.has('Access-Control-Allow-Origin'), false);
  });

  it('includes all required allowed methods', () => {
    const req = makeRequest('https://admin.example.com');
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com' };
    const result = handleCors(req, res, env);
    const methods = result.headers.get('Access-Control-Allow-Methods');
    assert.ok(methods.includes('GET'));
    assert.ok(methods.includes('POST'));
    assert.ok(methods.includes('PUT'));
    assert.ok(methods.includes('DELETE'));
    assert.ok(methods.includes('OPTIONS'));
  });

  it('includes required allowed headers', () => {
    const req = makeRequest('https://admin.example.com');
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com' };
    const result = handleCors(req, res, env);
    const headers = result.headers.get('Access-Control-Allow-Headers');
    assert.ok(headers.includes('x-xhalo-admin-secret'));
    assert.ok(headers.includes('x-xhalo-turnstile-token'));
    assert.ok(headers.includes('cf-access-jwt-assertion'));
  });

  it('strips trailing slash from ADMIN_FRONTEND_BASE_URL', () => {
    const req = makeRequest('https://admin.example.com');
    const res = makeResponse();
    const env = { ADMIN_FRONTEND_BASE_URL: 'https://admin.example.com/' };
    const result = handleCors(req, res, env);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'https://admin.example.com');
  });
});
