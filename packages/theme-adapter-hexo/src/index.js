export function mapSiteConfigToHexo(config) {
  return {
    title: config.site?.title || 'xhalo-blog',
    subtitle: config.site?.subtitle || '',
    description: config.site?.description || '',
    author: config.site?.author || '',
    language: config.site?.language || 'en',
    timezone: config.site?.timezone || 'UTC',
    url: config.site?.url || 'https://example.com',
    theme: config.theme?.name || 'next'
  };
}
