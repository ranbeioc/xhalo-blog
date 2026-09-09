import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHexoCompatibilityFixtureManifest,
  buildHexoCompatibilityProfile,
  mapSiteConfigToHexo,
  listSupportedThemes,
  getThemeAdapterProfile,
  detectThemeFromConfig
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

test('theme adapter fixture manifest keeps the runtime compatibility sample stable', () => {
  const manifest = buildHexoCompatibilityFixtureManifest();

  assert.equal(manifest.postSlug, 'hexo-compatibility-fixtures');
  assert.equal(manifest.postOutputPath, '/2026/06/02/hexo-compatibility-fixtures/index.html');
  assert.ok(manifest.assets.some((asset) => asset.endsWith('fixture-video.mp4')));
  assert.ok(manifest.expectedHtmlMarkers.some((marker) => marker.includes('fixture-document.pdf')));
  assert.ok(manifest.expectedHtmlMarkers.some((marker) => marker === 'compatibility fixture'));
});

test('theme adapter lists supported themes and retrieves theme profiles', () => {
  const themes = listSupportedThemes();
  assert.ok(Array.isArray(themes));
  assert.ok(themes.some((t) => t.id === 'next'));
  assert.ok(themes.some((t) => t.id === 'fluid'));
  assert.ok(themes.some((t) => t.id === 'butterfly'));

  const nextProfile = getThemeAdapterProfile('next');
  assert.equal(nextProfile.id, 'next');
  assert.ok(nextProfile.configFiles.includes('themes/next/_config.yml'));
  assert.ok(nextProfile.schemes.includes('Gemini'));

  const customProfile = getThemeAdapterProfile('my-custom-theme');
  assert.equal(customProfile.id, 'my-custom-theme');
  assert.ok(customProfile.configFiles.includes('themes/my-custom-theme/_config.yml'));
});

test('theme adapter detects theme name from config string or object', () => {
  assert.equal(detectThemeFromConfig('theme: fluid\n'), 'fluid');
  assert.equal(detectThemeFromConfig({ theme: { name: 'butterfly' } }), 'butterfly');
  assert.equal(detectThemeFromConfig({ theme: 'next' }), 'next');
  assert.equal(detectThemeFromConfig(''), 'next');
  assert.equal(detectThemeFromConfig(null), 'next');
});

