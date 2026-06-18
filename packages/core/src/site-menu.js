import { githubApiRequest, decodeBase64ToBytes, getFileContentFromBranch } from './github-publishing.js';
import { generateUnifiedDiff } from './index.js';

export const NEXT_THEME_MENU_CONFIG_PATH = 'themes/next/_config.yml';

export function validateMenuItem(item, existingIds = []) {
  if (!item || typeof item !== 'object') {
    return 'Menu item must be a JSON object.';
  }

  // id validation: required, lowercase letters, numbers, hyphen
  if (!item.id || typeof item.id !== 'string') {
    return 'Menu item id is required and must be a string.';
  }
  if (!/^[a-z0-9-]+$/.test(item.id)) {
    return 'Menu item id must contain only lowercase letters, numbers, and hyphens.';
  }
  if (existingIds.includes(item.id)) {
    return `Duplicate menu item id: ${item.id}.`;
  }

  // label validation: required, 1-40 chars
  if (!item.label || typeof item.label !== 'string') {
    return 'Menu item label is required and must be a string.';
  }
  if (item.label.length < 1 || item.label.length > 40) {
    return 'Menu item label must be between 1 and 40 characters.';
  }

  // path validation: required, 1-200 chars
  if (!item.path || typeof item.path !== 'string') {
    return 'Menu item path is required and must be a string.';
  }
  if (item.path.length < 1 || item.path.length > 200) {
    return 'Menu item path must be between 1 and 200 characters.';
  }

  const lowerPath = item.path.toLowerCase().trim();
  if (lowerPath.startsWith('javascript:')) {
    return 'Menu item path cannot contain javascript: protocol.';
  }
  if (lowerPath.startsWith('data:')) {
    return 'Menu item path cannot contain data: protocol.';
  }
  if (lowerPath.startsWith('//')) {
    return 'Protocol-relative paths are not allowed.';
  }

  // external and visible: required boolean
  if (item.external === undefined || item.external === null || typeof item.external !== 'boolean') {
    return 'Menu item external is required and must be a boolean.';
  }
  if (item.visible === undefined || item.visible === null || typeof item.visible !== 'boolean') {
    return 'Menu item visible is required and must be a boolean.';
  }

  if (item.external) {
    if (!item.path.startsWith('https://')) {
      return 'External menu item path must begin with https://.';
    }
  } else {
    if (!item.path.startsWith('/')) {
      return 'Internal menu item path must begin with /.';
    }
  }

  // icon validation: optional, safe icon id only (alphanumeric and hyphen)
  if (item.icon !== undefined && item.icon !== null && item.icon !== '') {
    if (typeof item.icon !== 'string') {
      return 'Menu item icon must be a string.';
    }
    if (!/^[a-zA-Z0-9-]+$/.test(item.icon)) {
      return 'Menu item icon must contain only alphanumeric characters and hyphens.';
    }
  }

  // order validation: required, integer 0-9999
  if (item.order === undefined || item.order === null) {
    return 'Menu item order is required.';
  }
  if (!Number.isInteger(item.order) || item.order < 0 || item.order > 9999) {
    return 'Menu item order must be an integer between 0 and 9999.';
  }

  return null;
}

export function validateMenuList(menuList) {
  if (!Array.isArray(menuList)) {
    return 'Menu list must be a JSON array.';
  }

  const existingIds = [];
  for (const item of menuList) {
    const error = validateMenuItem(item, existingIds);
    if (error) return error;
    existingIds.push(item.id);
  }

  return null;
}

export async function getConfigFromMain(env) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  let sha = null;
  let raw = '';
  let filename = 'rb-blog.config.json';

  try {
    const data = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/rb-blog.config.json?ref=main`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    sha = data.sha;
    const bytes = decodeBase64ToBytes(data.content);
    raw = new TextDecoder().decode(bytes);
  } catch (err) {
    if (err.status === 404) {
      try {
        const dataFallback = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/rb-blog.config.example.json?ref=main`, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        sha = dataFallback.sha;
        const bytes = decodeBase64ToBytes(dataFallback.content);
        raw = new TextDecoder().decode(bytes);
        filename = 'rb-blog.config.example.json';
      } catch (errFallback) {
        throw errFallback;
      }
    } else {
      throw err;
    }
  }

  return { filename, sha, raw };
}

export function normalizeMenuFromConfig(config) {
  if (!config || typeof config !== 'object') return [];
  const menu = config.theme?.menu || config.menu;
  if (!Array.isArray(menu)) return [];

  return menu.map((item, index) => {
    const id = item.key || item.id || `menu-item-${index}`;
    // Fallback label capitalized if not present
    let label = item.label || item.title || item.name || id;
    if (label && typeof label === 'string' && label.length > 0) {
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }
    const path = item.path || '/';
    const icon = item.icon || '';
    const order = typeof item.order === 'number' ? item.order : index * 10;
    const visible = typeof item.visible === 'boolean' ? item.visible : true;
    const external = typeof item.external === 'boolean' ? item.external : path.startsWith('http');

    return { id, label, path, icon, order, visible, external };
  });
}

export function updateConfigWithMenu(config, menuList) {
  if (!config || typeof config !== 'object') return config;
  const newConfig = JSON.parse(JSON.stringify(config));
  
  const targetMenu = menuList.map(item => {
    return {
      key: item.id,
      path: item.path,
      icon: item.icon || undefined,
      label: item.label,
      order: item.order,
      visible: item.visible,
      external: item.external
    };
  });

  if (newConfig.theme && Array.isArray(newConfig.theme.menu)) {
    newConfig.theme.menu = targetMenu;
  } else if (Array.isArray(newConfig.menu)) {
    newConfig.menu = menuList.map(item => {
      return {
        name: item.label,
        path: item.path,
        icon: item.icon || undefined,
        order: item.order,
        visible: item.visible,
        external: item.external
      };
    });
  } else if (newConfig.theme) {
    newConfig.theme.menu = targetMenu;
  } else {
    newConfig.theme = { menu: targetMenu };
  }

  return newConfig;
}

export async function getNextThemeMenuConfigFromMain(env, branch = 'main') {
  try {
    return await getFileContentFromBranch(env, {
      branch,
      filePath: NEXT_THEME_MENU_CONFIG_PATH
    });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export function normalizeNextMenuIcon(icon) {
  const raw = String(icon || '').trim();
  if (!raw) return 'fa fa-circle';
  if (raw.startsWith('fa ')) return raw;
  return `fa fa-${raw.replace(/^fa-/, '')}`;
}

export function formatNextMenuLabel(item) {
  return String(item.label || item.id || 'Menu').trim().replace(/"/g, '\\"');
}

export function buildNextThemeMenuBlock(menuList) {
  const lines = ['menu:'];
  const visibleItems = [...menuList]
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (visibleItems.length === 0) {
    lines.push('  # No visible menu items configured by xhalo-blog Admin.');
    return lines.join('\n');
  }

  for (const item of visibleItems) {
    const label = formatNextMenuLabel(item);
    const path = String(item.path || '/').trim();
    const icon = normalizeNextMenuIcon(item.icon);
    lines.push(`  "${label}": ${path} || ${icon}`);
  }
  return lines.join('\n');
}

export function updateNextThemeConfigWithMenu(rawConfig, menuList) {
  const source = String(rawConfig || '');
  const lines = source.split(/\r?\n/);
  const menuStart = lines.findIndex((line) => /^menu:\s*$/.test(line));
  const nextBlock = buildNextThemeMenuBlock(menuList).split('\n');

  if (menuStart === -1) {
    const trimmed = source.endsWith('\n') ? source.trimEnd() : source;
    return `${trimmed}\n\n${nextBlock.join('\n')}\n`;
  }

  let menuEnd = menuStart + 1;
  while (menuEnd < lines.length) {
    const line = lines[menuEnd];
    if (/^\S/.test(line) && line.trim() !== '') break;
    menuEnd += 1;
  }

  const updated = [
    ...lines.slice(0, menuStart),
    ...nextBlock,
    ...lines.slice(menuEnd)
  ].join('\n');

  return updated.endsWith('\n') ? updated : `${updated}\n`;
}
