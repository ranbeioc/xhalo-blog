import {
  defaultR2UploadTemplate,
  nowIso,
  decodeBase64ToBytes,
  encodeBase64Url
} from '../../../../packages/core/src/index.js';

export const ALLOWED_MIME_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3', '.mpeg'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'text/plain': ['.txt']
};

export function validateR2UploadInput(filename, contentType, scope, postSlug) {
  if (!contentType || typeof contentType !== 'string') {
    return 'Content-Type is required.';
  }
  const cleanContentType = contentType.trim().toLowerCase();
  const allowedExtensions = ALLOWED_MIME_TYPES[cleanContentType];
  if (!allowedExtensions) {
    return `MIME type '${contentType}' is not allowed.`;
  }

  if (!filename || typeof filename !== 'string') {
    return 'Filename is required.';
  }
  const cleanFilename = filename.trim().toLowerCase();
  
  if (cleanFilename.includes('..') || cleanFilename.includes('/') || cleanFilename.includes('\\')) {
    return 'Filename contains invalid path traversal characters.';
  }

  const hasValidExtension = allowedExtensions.some(ext => cleanFilename.endsWith(ext));
  if (!hasValidExtension) {
    return `Filename extension does not match the Content-Type '${contentType}'.`;
  }

  if (scope && (typeof scope !== 'string' || scope.includes('..') || scope.includes('/') || scope.includes('\\'))) {
    return 'Scope contains invalid path traversal characters.';
  }

  if (postSlug && (typeof postSlug !== 'string' || postSlug.includes('..') || postSlug.includes('/') || postSlug.includes('\\'))) {
    return 'postSlug contains invalid path traversal characters.';
  }

  return null;
}

export function buildR2UploadBody(input = {}) {
  const encoding = String(input.encoding || defaultR2UploadTemplate.defaults.encoding).trim().toLowerCase() === 'base64'
    ? 'base64'
    : defaultR2UploadTemplate.defaults.encoding;
  const cacheControl = String(input.cacheControl || defaultR2UploadTemplate.defaults.cacheControl).trim()
    || defaultR2UploadTemplate.defaults.cacheControl;
  const rawContent = input.content == null || String(input.content).length === 0
    ? `Prototype asset written at ${nowIso()}\n`
    : String(input.content);
  const body = encoding === 'base64'
    ? decodeBase64ToBytes(rawContent)
    : new TextEncoder().encode(rawContent);

  return {
    body,
    encoding,
    cacheControl,
    byteLength: body.byteLength
  };
}

export function encodeJsonBase64Url(value) {
  return encodeBase64Url(JSON.stringify(value));
}

export function decodeBase64UrlToText(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const bytes = decodeBase64ToBytes(padded);
  return new TextDecoder().decode(bytes);
}

export function decodeBase64UrlToBytes(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return decodeBase64ToBytes(padded);
}

export async function getAssetsSigningKey(env) {
  if (env.__assetsSigningKey) return env.__assetsSigningKey;
  env.__assetsSigningKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(env.ASSETS_SIGNING_SECRET || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return env.__assetsSigningKey;
}

export async function signUploadToken(env, payload) {
  const encodedPayload = encodeJsonBase64Url(payload);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      await getAssetsSigningKey(env),
      new TextEncoder().encode(encodedPayload)
    )
  );

  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

export async function verifyUploadToken(env, token) {
  const [encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedPayload || !encodedSignature) throw new Error('Malformed upload token.');
  const signature = decodeBase64UrlToBytes(encodedSignature);
  const verified = await crypto.subtle.verify(
    'HMAC',
    await getAssetsSigningKey(env),
    signature,
    new TextEncoder().encode(encodedPayload)
  );

  if (!verified) throw new Error('Invalid upload token signature.');
  return JSON.parse(decodeBase64UrlToText(encodedPayload));
}

export async function putAssetObject(env, preview, uploadBody) {
  if (!env.ASSETS || typeof env.ASSETS.put !== 'function') return null;

  return env.ASSETS.put(preview.objectKey, uploadBody.body, {
    httpMetadata: {
      contentType: preview.contentType,
      cacheControl: uploadBody.cacheControl
    },
    customMetadata: {
      scope: preview.scope,
      filename: preview.filename,
      ...(preview.postSlug ? { postSlug: preview.postSlug } : {})
    }
  });
}

export function buildSignedUploadUrl(requestUrl, token) {
  const url = new URL(requestUrl);
  url.pathname = `/api/assets/r2-upload/${token}`;
  url.search = '';
  return url.toString();
}

export function isTestMediaUploadEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' &&
    String(env.TEST_MEDIA_UPLOAD_ENABLED || '').toLowerCase() === 'true';
}

export function isTestTurnstileBypassEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' &&
    String(env.TEST_TURNSTILE_BYPASS_ENABLED || '').toLowerCase() === 'true';
}

export function getTestMediaUploadPrefix(env) {
  const rawPrefix = String(env.TEST_MEDIA_UPLOAD_PREFIX || 'xhalo-blog-test/').trim();
  const safePrefix = rawPrefix.replace(/^\/+/, '').replace(/\.\./g, '').replace(/\/+$/, '');
  return safePrefix ? `${safePrefix}/` : 'xhalo-blog-test/';
}

export function applyTestMediaUploadPrefix(preview, env) {
  const prefix = getTestMediaUploadPrefix(env);
  if (preview.objectKey.startsWith(prefix)) return preview;
  const objectKey = `${prefix}${preview.objectKey}`;
  const publicBaseUrl = String(env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl).replace(/\/$/, '');
  return {
    ...preview,
    objectKey,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
    testMediaUploadPrefix: prefix
  };
}
