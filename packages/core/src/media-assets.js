import { validateDraftSlug } from './index.js';

export const ALLOWED_MEDIA_TYPES = {
  // Images
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  // Documents
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
  // Videos
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  // Audio
  'audio/mpeg': ['.mp3', '.mpeg'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg']
};

export const MEDIA_SIZE_LIMITS = {
  // Images (<= 5MB)
  image: 5 * 1024 * 1024,
  // Documents (<= 20MB)
  document: 20 * 1024 * 1024,
  // Videos (<= 100MB)
  video: 100 * 1024 * 1024,
  // Audio (<= 50MB)
  audio: 50 * 1024 * 1024
};

export function getMediaTypeCategory(contentType) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  return 'document'; // pdf, txt, zip
}

export function sanitizeFilename(filename) {
  if (!filename) return '';
  let clean = filename.trim();
  clean = clean.replace(/\\/g, '/');
  
  // Remove path traversal segments (e.g. ../ or ..)
  clean = clean.replace(/\.\.+\//g, '');
  clean = clean.replace(/\.\.+/g, '');
  
  // Replace slashes with hyphens
  clean = clean.replace(/\//g, '-');
  
  const extIndex = clean.lastIndexOf('.');
  if (extIndex === -1) {
    let name = clean.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    // Collapse consecutive hyphens/underscores/spaces to a single hyphen
    name = name.replace(/[-_]+/g, '-');
    // Trim hyphens from ends
    name = name.replace(/^-+|-+$/g, '');
    return name;
  }
  
  let namePart = clean.substring(0, extIndex);
  let extPart = clean.substring(extIndex);
  
  let cleanName = namePart.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  cleanName = cleanName.replace(/[-_]+/g, '-').replace(/^-+|-+$/g, '');
  
  let cleanExt = extPart.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
  
  return cleanName + cleanExt;
}

export function validateMediaUpload({ filename, contentType, size, storageTarget, slug }) {
  const slugErrors = validateDraftSlug(slug);
  if (slugErrors && slugErrors.length > 0) {
    return 'Invalid article slug: ' + slugErrors.join(', ');
  }

  if (!filename || typeof filename !== 'string') {
    return 'Filename is required.';
  }

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return 'Filename contains invalid path traversal characters.';
  }

  const sanitized = sanitizeFilename(filename);
  if (!sanitized || sanitized.trim() === '') {
    return 'Filename is invalid or empty after sanitization.';
  }

  const cleanFilename = filename.trim().toLowerCase();
  const forbiddenExtensions = ['.exe', '.js', '.sh', '.php', '.html', '.htm', '.xhtml'];
  const hasForbiddenExt = forbiddenExtensions.some(ext => cleanFilename.endsWith(ext));
  if (hasForbiddenExt) {
    return 'File extension is strictly forbidden.';
  }

  if (!contentType || typeof contentType !== 'string') {
    return 'Content-Type is required.';
  }

  const cleanContentType = contentType.trim().toLowerCase();
  const allowedExtensions = ALLOWED_MEDIA_TYPES[cleanContentType];
  if (!allowedExtensions) {
    return `MIME type '${contentType}' is not allowed.`;
  }

  const hasValidExtension = allowedExtensions.some(ext => cleanFilename.endsWith(ext));
  if (!hasValidExtension) {
    return `Filename extension does not match the Content-Type '${contentType}'.`;
  }

  if (typeof size !== 'number' || size <= 0) {
    return 'Invalid file size.';
  }

  const category = getMediaTypeCategory(cleanContentType);
  const limit = MEDIA_SIZE_LIMITS[category];
  if (size > limit) {
    return `File size exceeds the limit for ${category}s (${limit / (1024 * 1024)}MB).`;
  }

  if (!storageTarget || !['git_asset_folder', 'r2'].includes(storageTarget)) {
    return 'Invalid storage target. Must be git_asset_folder or r2.';
  }

  return null;
}

export function generateMediaSnippet({ filename, contentType, storageTarget, slug, label, publicBaseUrl }) {
  const cleanFilename = sanitizeFilename(filename);
  const cleanContentType = contentType.trim().toLowerCase();
  const displayLabel = label || cleanFilename;

  if (storageTarget === 'git_asset_folder') {
    if (cleanContentType.startsWith('image/')) {
      return `{% asset_img ${cleanFilename} ${displayLabel} %}`;
    }
    return `[${displayLabel}](${cleanFilename})`;
  } else {
    const baseUrl = (publicBaseUrl || 'https://assets.example.com').replace(/\/$/, '');
    const url = `${baseUrl}/posts/${slug}/${cleanFilename}`;
    if (cleanContentType.startsWith('image/')) {
      return `![${displayLabel}](${url})`;
  } else if (cleanContentType.startsWith('audio/')) {
    return `<audio controls src="${url}"></audio>`;
  } else if (cleanContentType.startsWith('video/')) {
    return `<video controls src="${url}"></video>`;
  }
    return `[${displayLabel}](${url})`;
  }
}
