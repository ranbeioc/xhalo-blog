import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStructuredLog,
  extractRequestMeta,
  logInfo,
  logWarn,
  logError,
  logSecurity,
  insertAuditLog
} from '../workers/api/src/lib/logger.js';

describe('lib/logger.js', () => {
  it('createStructuredLog returns valid JSON-serializable object', () => {
    const log = createStructuredLog('info', 'test_action', { foo: 'bar' });
    assert.equal(log.level, 'info');
    assert.equal(log.action, 'test_action');
    assert.equal(log.foo, 'bar');
    assert.ok(log.timestamp);
    JSON.stringify(log);
  });

  it('extractRequestMeta extracts method, path, ip, user_agent from Request', () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'user-agent': 'test-agent'
      }
    });
    const meta = extractRequestMeta(req);
    assert.equal(meta.method, 'POST');
    assert.equal(meta.path, '/api/test');
    assert.equal(meta.ip, '1.2.3.4');
    assert.equal(meta.user_agent, 'test-agent');
  });

  it('logInfo/logWarn/logError/logSecurity format correctly', () => {
    const info = logInfo('info_action', { a: 1 });
    assert.equal(info.level, 'info');
    assert.equal(info.action, 'info_action');

    const warn = logWarn('warn_action', { b: 2 });
    assert.equal(warn.level, 'warn');

    const err = logError('err_action', { c: 3 });
    assert.equal(err.level, 'error');

    const sec = logSecurity('sec_action', { d: 4 });
    assert.equal(sec.level, 'warn');
    assert.equal(sec.category, 'security');
  });

  it('insertAuditLog safely handles D1 failures (does not throw)', async () => {
    const env = {
      DB: {
        prepare: () => { throw new Error('DB Error'); }
      }
    };
    const result = await insertAuditLog(env, { action: 'test' });
    assert.equal(result, false);
  });

  it('insertAuditLog calls DB.prepare with correct INSERT sql', async () => {
    let executedSql = '';
    const env = {
      DB: {
        prepare: (sql) => {
          executedSql = sql;
          return {
            bind: () => ({ run: async () => {} })
          };
        }
      }
    };
    await insertAuditLog(env, { action: 'test' });
    assert.ok(executedSql.includes('INSERT INTO audit_logs'));
  });
});
