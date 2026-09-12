import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapThemeConfigToNext
} from '../packages/theme-adapter-hexo/src/index.js';
import {
  generateUnifiedDiff
} from '../packages/core/src/index.js';

test('mapThemeConfigToNext maps default theme configurations accurately', () => {
  const result = mapThemeConfigToNext({});
  assert.equal(result.scheme, 'Gemini');
  assert.equal(result.darkmode, true);
  assert.equal(result.sidebar, 'left');
  assert.ok(Array.isArray(result.menu));
  assert.equal(result.menu.length, 5);
  assert.equal(result.menu[0].key, 'home');
  assert.equal(result.menu[0].path, '/');
  assert.equal(result.comments.provider, 'waline');
  assert.equal(result.comments.enabled, false);
  assert.equal(result.analytics.clarityProjectId, '');
});

test('mapThemeConfigToNext maps custom theme, scheme, menu, comments, and analytics', () => {
  const config = {
    theme: {
      scheme: 'Pisces',
      darkmode: false,
      sidebar: 'right',
      menu: [
        { key: 'custom-item', path: '/custom/', icon: 'star' },
        { path: '/no-key/' }
      ]
    },
    social: [
      { label: 'GitHub', url: 'https://github.com/test' }
    ],
    comments: {
      provider: 'waline',
      enabled: true,
      serverUrl: 'https://waline.example.com'
    },
    analytics: {
      googleAnalyticsId: 'G-12345',
      baiduAnalyticsId: 'baidu-6789',
      clarityProjectId: 'clarity-abc',
      cloudflareAnalyticsToken: 'cf-token-xyz',
      growingioProjectId: 'gio-999'
    }
  };

  const result = mapThemeConfigToNext(config);
  assert.equal(result.scheme, 'Pisces');
  assert.equal(result.darkmode, false);
  assert.equal(result.sidebar, 'right');
  assert.equal(result.menu.length, 2);
  assert.equal(result.menu[0].key, 'custom-item');
  assert.equal(result.menu[0].path, '/custom/');
  assert.equal(result.menu[0].icon, 'star');
  assert.equal(result.menu[1].key, 'custom');
  assert.equal(result.menu[1].icon, 'circle');
  assert.equal(result.social.length, 1);
  assert.equal(result.comments.enabled, true);
  assert.equal(result.comments.serverUrl, 'https://waline.example.com');
  assert.equal(result.analytics.googleAnalyticsId, 'G-12345');
  assert.equal(result.analytics.clarityProjectId, 'clarity-abc');
});

test('generateUnifiedDiff optimizes identical files with fast bailout', () => {
  const content = '---\ntitle: "Static Title"\n---\nLine 1\nLine 2\nLine 3';
  const diff = generateUnifiedDiff(content, content, 'doc.md');

  assert.equal(diff.addedLines, 0);
  assert.equal(diff.removedLines, 0);
  assert.equal(diff.frontmatterChanged, false);
  assert.equal(diff.bodyChanged, false);
  assert.ok(diff.diffText.includes('--- a/doc.md'));
  assert.ok(diff.diffText.includes('+++ b/doc.md'));
  const contentLines = diff.diffText.split('\n');
  assert.equal(contentLines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length, 0);
  assert.equal(contentLines.filter(l => l.startsWith('-') && !l.startsWith('---')).length, 0);
});

test('generateUnifiedDiff optimizes diffing using common prefix and suffix trimming', () => {
  const prefix = Array.from({ length: 50 }, (_, i) => `prefix line ${i}`).join('\n');
  const suffix = Array.from({ length: 50 }, (_, i) => `suffix line ${i}`).join('\n');
  const oldText = `${prefix}\nmiddle old\n${suffix}`;
  const newText = `${prefix}\nmiddle new\n${suffix}`;

  const diff = generateUnifiedDiff(oldText, newText, 'long.md');
  assert.equal(diff.addedLines, 1);
  assert.equal(diff.removedLines, 1);
  assert.ok(diff.diffText.includes('+middle new'));
  assert.ok(diff.diffText.includes('-middle old'));
});

test('generateUnifiedDiff size limit guard prevents worker OOM on huge differences', () => {
  const hugeOld = Array.from({ length: 1200 }, (_, i) => `old line ${i}`).join('\n');
  const hugeNew = Array.from({ length: 1200 }, (_, i) => `new line ${i}`).join('\n');

  const diff = generateUnifiedDiff(hugeOld, hugeNew, 'huge.md');
  assert.equal(diff.addedLines, 1200);
  assert.equal(diff.removedLines, 1200);
  assert.ok(diff.diffText.startsWith('--- a/huge.md'));
});
