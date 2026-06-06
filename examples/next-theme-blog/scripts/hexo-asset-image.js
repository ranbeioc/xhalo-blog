'use strict';

const cheerio = require('cheerio');

function getPosition(str, marker, count) {
  return str.split(marker, count).join(marker).length;
}

function shouldSkipPath(value) {
  return /http[s]*.*|\/\/.*/.test(value) || /^\s*\//.test(value);
}

function rewriteAssetAttr($, selector, attr, root, link) {
  $(selector).each(function() {
    const currentValue = $(this).attr(attr);
    if (!currentValue) return;

    let normalized = currentValue.replace('\\', '/');
    if (shouldSkipPath(normalized)) return;

    const parts = normalized.split('/').filter((entry) => entry !== '' && entry !== '.');
    if (parts.length > 1) parts.shift();

    normalized = parts.join('/');
    $(this).attr(attr, `${root}${link}${normalized}`);
  });
}

hexo.extend.filter.register('after_post_render', function(data) {
  if (!hexo.config.post_asset_folder) return;

  let link = data.permalink;
  const version = String(hexo.version).split('.');
  const beginPosition = version.length > 0 && Number(version[0]) === 3
    ? getPosition(link, '/', 1) + 1
    : getPosition(link, '/', 3) + 1;
  const endPosition = link.lastIndexOf('/') + 1;
  link = link.substring(beginPosition, endPosition);

  ['excerpt', 'more', 'content'].forEach((key) => {
    const $ = cheerio.load(data[key], {
      ignoreWhitespace: false,
      xmlMode: false,
      lowerCaseTags: false,
      decodeEntities: false
    });

    rewriteAssetAttr($, 'img', 'src', hexo.config.root, link);
    rewriteAssetAttr($, 'img', 'data-src', hexo.config.root, link);
    rewriteAssetAttr($, '[data-fancybox="images"]', 'href', hexo.config.root, link);
    rewriteAssetAttr($, 'video > source', 'src', hexo.config.root, link);
    rewriteAssetAttr($, 'video.fancybox-video', 'poster', hexo.config.root, link);

    data[key] = $.html();
  });
});
