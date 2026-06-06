import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHexoCompatibilityProfile,
  mapSiteConfigToHexo
} from '../packages/theme-adapter-hexo/src/index.js';

test('theme adapter preserves Hexo permalink and post asset conventions', () => {
  const mapped = mapSiteConfigToHexo({
    site: {
      title: 'Example',
      url: 'https://example.com'
    },
    theme: {
      name: 'next'
    },
    features: {
      postAssetFolder: true
    }
  });

  assert.equal(mapped.permalink, ':year/:month/:day/:title/');
  assert.equal(mapped.post_asset_folder, true);
  assert.deepEqual(mapped.skip_render, ['_headers']);
  assert.deepEqual(mapped.include, ['_headers']);
});

test('theme adapter compatibility profile exposes the optional plugin baseline', () => {
  const profile = buildHexoCompatibilityProfile();

  assert.equal(profile.adapter, 'hexo-next');
  assert.equal(profile.theme, 'next');
  assert.equal(profile.assetRewriteHelper, 'scripts/hexo-asset-image.js');
  assert.ok(profile.optionalPlugins.some((plugin) => plugin.packageName === '@waline/hexo-next'));
  assert.ok(profile.optionalPlugins.some((plugin) => plugin.packageName === 'hexo-generator-searchdb'));
  assert.ok(profile.optionalPlugins.some((plugin) => plugin.packageName === 'hexo-tag-chart'));
});
