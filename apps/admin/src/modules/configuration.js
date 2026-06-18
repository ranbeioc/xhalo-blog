import { apiFetch } from './api-client.js';
import { escapeHtml } from './ui.js';

export async function fetchSiteConfig() {
  const res = await apiFetch('/api/site/config');
  if (!res.ok) throw new Error(`Config API returned status ${res.status}`);
  return await res.json();
}

export function renderSiteConfiguration(container, data) {
  const configs = Array.isArray(data?.configs) ? data.configs : [];
  const plugins = Array.isArray(data?.pluginCatalog) ? data.pluginCatalog : [];

  container.innerHTML = `
    <div class="config-workspace">
      <h2>Hexo / NexT 配置管理</h2>
      <p class="lede">集中查看 Hexo 主配置、NexT 主题配置、package 插件依赖和插件开关。当前页面默认只读，后续写入必须走 test-only 配置更新 gate。</p>
      <div class="alert alert-info">
        目标：<code>${escapeHtml(data?.targetRepo || '')}@${escapeHtml(data?.targetBranch || '')}</code>
      </div>
      <div class="dashboard-grid">
        <div class="card">
          <h3>配置文件</h3>
          <div class="config-file-list">
            ${configs.map((file) => `
              <details class="config-file" ${file.exists ? '' : 'open'}>
                <summary>
                  <strong>${escapeHtml(file.path)}</strong>
                  <span class="status-badge" data-state="${file.exists ? 'ok' : 'warning'}">${file.exists ? '存在' : '缺失'}</span>
                  ${file.sha ? `<code>${escapeHtml(file.sha.slice(0, 8))}</code>` : ''}
                </summary>
                ${file.exists ? `<pre class="config-preview"><code>${escapeHtml(trimPreview(file.content))}</code></pre>` : `<p class="info-text">${escapeHtml(file.error || 'not_found')}</p>`}
              </details>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <h3>NexT 插件与配置项</h3>
          <div class="plugin-grid">
            ${plugins.map((plugin) => `
              <div class="plugin-card">
                <strong>${escapeHtml(plugin.name)}</strong>
                <span>${escapeHtml(plugin.category)}</span>
                <code>${escapeHtml([...(plugin.configFiles || []), ...(plugin.configKeys || [])].join(', ') || '-')}</code>
                <button class="button-small button-secondary" disabled>配置编辑待 test-only gate</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function trimPreview(content) {
  const text = String(content || '');
  return text.length > 4000 ? `${text.slice(0, 4000)}\n\n# ... truncated for Admin preview ...` : text;
}
