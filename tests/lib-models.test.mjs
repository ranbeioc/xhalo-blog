import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseJsonSafe,
  summarizeTaskRecord,
  summarizePostRecord,
  insertTaskRecord,
  upsertPostIndexRecord
} from '../workers/api/src/lib/models.js';

describe('lib/models.js', () => {
  it('parseJsonSafe handles null, undefined, malformed JSON, valid JSON', () => {
    assert.equal(parseJsonSafe(null), null);
    assert.equal(parseJsonSafe(undefined), null);
    assert.equal(parseJsonSafe('{malformed'), null);
    assert.deepEqual(parseJsonSafe('{"a":1}'), { a: 1 });
    assert.deepEqual(parseJsonSafe({ already: 'object' }), { already: 'object' });
  });

  it('summarizeTaskRecord formats output correctly', () => {
    const item = {
      id: 'task-1',
      status: 'completed',
      payload: '{"reconciliation":{"summary":{"outcome":"success","branch":"main"}}}'
    };
    const summary = summarizeTaskRecord(item);
    assert.equal(summary.detail_primary, 'success');
    assert.equal(summary.branch, 'main');
  });

  it('summarizePostRecord formats output correctly', () => {
    const item = {
      id: 'post-1',
      github_branch: 'draft-1',
      github_pr_url: 'https://github.com/pr/1'
    };
    const summary = summarizePostRecord(item);
    assert.equal(summary.detail_primary, 'draft-1');
    assert.equal(summary.detail_secondary, 'https://github.com/pr/1');
  });

  it('insertTaskRecord calls DB with correct SQL', async () => {
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
    await insertTaskRecord(env, { id: '1', type: 'test', status: 'new', payload: {}, created_at: 1, updated_at: 1 });
    assert.ok(executedSql.includes('INSERT INTO tasks'));
  });

  it('upsertPostIndexRecord calls DB with correct SQL', async () => {
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
    await upsertPostIndexRecord(env, { id: '1', slug: 'test', title: 'Test', path: '/test' });
    assert.ok(executedSql.includes('INSERT INTO posts_index'));
    assert.ok(executedSql.includes('ON CONFLICT(id) DO UPDATE SET'));
  });
});
