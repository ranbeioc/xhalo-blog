import { githubApiRequest, decodeBase64ToBytes } from './github-publishing.js';
import { generateUnifiedDiff } from './index.js';

export function validateMenuItem(item, existingIds = []) {
  if (!item || typeof item !== 'object') {
    return 'Menu item must be a JSON object.';
  }

  // id validation: optional, but if present must be lowercase letters, numbers, hyphen
  if (item.id !== undefined && item.id !== null) {
    if (typeof item.id !== 'string') {
      return 'Menu item id must be a string.';
    }
    if (!/^[a-z0-9-]+$/.test(item.id)) {
      return 'Menu item id must contain only lowercase letters, numbers, and hyphens.';
    }
    if (existingIds.includes(item.id)) {
      return `Duplicate menu item id: ${item.id}.`;
    }
  }

  // label validation: 1-40 chars
  if (!item.label || typeof item.label !== 'string') {
    return 'Menu item label is required and must be a string.';
  }
  if (item.label.length < 1 || item.label.length > 40) {
    return 'Menu item label must be between 1 and 40 characters.';
  }

  // path validation: internal begins with /, external begins with https:// or http://
  if (!item.path || typeof item.path !== 'string') {
    return 'Menu item path is required and must be a string.';
  }

  const isExternal = typeof item.external === 'boolean' ? item.external : (item.path.startsWith('http://') || item.path.startsWith('https://'));
  if (isExternal) {
    if (!item.path.startsWith('https://') && !item.path.startsWith('http://')) {
      return 'External menu item path must begin with http:// or https://.';
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

  // order validation: optional, integer 0-9999
  if (item.order !== undefined && item.order !== null) {
    if (!Number.isInteger(item.order) || item.order < 0 || item.order > 9999) {
      return 'Menu item order must be an integer between 0 and 9999.';
    }
  }

  // visible and external: optional boolean
  if (item.visible !== undefined && item.visible !== null && typeof item.visible !== 'boolean') {
    return 'Menu item visible must be a boolean.';
  }
  if (item.external !== undefined && item.external !== null && typeof item.external !== 'boolean') {
    return 'Menu item external must be a boolean.';
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
  let sha = null;
  let raw = '';
  let filename = 'rb-blog.config.json';

  try {
    const res = await githubApiRequest(env, `/contents/rb-blog.config.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      sha = data.sha;
      const bytes = decodeBase64ToBytes(data.content);
      raw = new TextDecoder().decode(bytes);
    } else if (res.status === 404) {
      const resFallback = await githubApiRequest(env, `/contents/rb-blog.config.example.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (resFallback.status === 200) {
        const data = await resFallback.json();
        sha = data.sha;
        const bytes = decodeBase64ToBytes(data.content);
        raw = new TextDecoder().decode(bytes);
        filename = 'rb-blog.config.example.json';
      } else {
        throw new Error('Config file not found on GitHub.');
      }
    } else {
      throw new Error(`GitHub API returned status ${res.status}`);
    }
  } catch (err) {
    throw err;
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
