import {
  createJsonResponse,
  defaultR2UploadTemplate,
  defaultPublishNotificationTemplate,
  defaultModerationTemplate,
  buildR2UploadPreview,
  buildR2UploadTaskPrototype,
  buildR2UploadWritePlan,
  buildR2SignedUploadPlan,
  buildPublishNotificationPreview,
  buildPublishNotificationTaskPrototype,
  buildModerationPreview,
  buildModerationTaskPrototype,
  validateMediaUpload,
  sanitizeFilename,
  generateMediaSnippet,
  nowIso
} from '../../../../packages/core/src/index.js';
import {
  extractRequestMeta,
  insertAuditLog
} from '../lib/logger.js';
import {
  validateR2UploadInput,
  buildR2UploadBody,
  getAssetsSigningKey,
  signUploadToken,
  verifyUploadToken,
  putAssetObject,
  buildSignedUploadUrl,
  isTestMediaUploadEnabled,
  getTestMediaUploadPrefix,
  applyTestMediaUploadPrefix
} from '../lib/r2.js';
import { insertTaskRecord } from '../lib/models.js';
import { enqueueTask } from '../lib/routes-shared.js';

export async function handleAssetRoutes(request, env, url, method, requestStart, { isLiveWritesEnabled, rejectLiveWriteDisabled, readJsonBody }) {
  if (url.pathname === '/api/assets/r2-template') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    return createJsonResponse({
      template: defaultR2UploadTemplate,
      note: 'Stage 3 R2 upload prototype. No real signed upload or bucket write happens here.'
    });
  }

  if (url.pathname === '/api/assets/r2-preview' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
    if (validationError) {
      return createJsonResponse({ error: validationError }, { status: 400 });
    }
    const preview = buildR2UploadPreview(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
    });

    return createJsonResponse({
      preview,
      note: 'Stage 3 R2 upload preview only. No object has been written.'
    });
  }

  if (url.pathname === '/api/assets/r2-signed-upload' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
    if (validationError) {
      return createJsonResponse({ error: validationError }, { status: 400 });
    }
    const mode = input.mode === 'live' ? 'live' : 'dry-run';
    let preview = buildR2UploadPreview(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
    });
    const testMediaUpload = mode === 'live' && !isLiveWritesEnabled(env) && isTestMediaUploadEnabled(env);
    if (testMediaUpload) {
      preview = applyTestMediaUploadPrefix(preview, env);
    }
    const ttlSeconds = Number(input.ttlSeconds || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds) || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds;
    const plan = buildR2SignedUploadPlan(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl,
      ttlSeconds
    });

    if (mode !== 'live') {
      return createJsonResponse({
        mode,
        preview,
        plan,
        note: 'Dry-run signed upload plan only. No signed URL has been issued.'
      });
    }

    if (!isLiveWritesEnabled(env) && !testMediaUpload) {
      return rejectLiveWriteDisabled();
    }

    if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
      return createJsonResponse({
        error: 'ASSETS binding is required for the live signed upload prototype.',
        mode
      }, { status: 503 });
    }

    if (!env.ASSETS_PUBLIC_BASE_URL) {
      return createJsonResponse({
        error: 'ASSETS_PUBLIC_BASE_URL is required for the live signed upload prototype.',
        mode
      }, { status: 503 });
    }

    if (!env.ASSETS_SIGNING_SECRET) {
      return createJsonResponse({
        error: 'ASSETS_SIGNING_SECRET is required for the live signed upload prototype.',
        mode
      }, { status: 503 });
    }

    const uploadBody = buildR2UploadBody(input);
    if (uploadBody.byteLength > 1024 * 1024) {
      return createJsonResponse({
        error: 'Prototype signed uploads are limited to 1 MiB.',
        mode,
        uploaded_bytes: uploadBody.byteLength
      }, { status: 413 });
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + ttlSeconds * 1000;
    const token = await signUploadToken(env, {
      objectKey: preview.objectKey,
      contentType: preview.contentType,
      cacheControl: uploadBody.cacheControl,
      filename: preview.filename,
      scope: preview.scope,
      postSlug: preview.postSlug,
      publicUrl: preview.publicUrl,
      testMediaUpload,
      testMediaUploadPrefix: testMediaUpload ? getTestMediaUploadPrefix(env) : null,
      exp: expiresAt
    });
    const uploadUrl = buildSignedUploadUrl(request.url, token);

    return createJsonResponse({
      mode,
      auth_mode: 'hmac',
      preview,
      plan,
      upload_url: uploadUrl,
      upload_method: 'PUT',
      upload_headers: {
        'content-type': preview.contentType,
        'x-xhalo-admin-secret': '<ADMIN_API_SHARED_SECRET>'
      },
      expires_at: new Date(expiresAt).toISOString(),
      uploaded_bytes: uploadBody.byteLength,
      note: testMediaUpload
        ? 'Short-lived test-only signed worker upload URL issued under TEST_MEDIA_UPLOAD_PREFIX. Production R2 live upload remains disabled.'
        : 'Short-lived signed worker upload URL issued. Send x-xhalo-admin-secret with the PUT request. It is not one-time unless a nonce store is added.'
    });
  }

  if (url.pathname.startsWith('/api/assets/r2-upload/') && method === 'PUT') {
    const token = decodeURIComponent(url.pathname.slice('/api/assets/r2-upload/'.length));

    if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
      return createJsonResponse({ error: 'ASSETS binding is required for signed uploads.' }, { status: 503 });
    }

    if (!env.ASSETS_SIGNING_SECRET) {
      return createJsonResponse({ error: 'ASSETS_SIGNING_SECRET is required for signed uploads.' }, { status: 503 });
    }

    let signedPayload;
    try {
      signedPayload = await verifyUploadToken(env, token);
    } catch (error) {
      return createJsonResponse({ error: error.message || 'Invalid upload token.' }, { status: 403 });
    }

    const signedTestMediaUpload = signedPayload.testMediaUpload === true;
    if (!isLiveWritesEnabled(env)) {
      if (!signedTestMediaUpload || !isTestMediaUploadEnabled(env)) {
        return rejectLiveWriteDisabled();
      }
      const requiredPrefix = getTestMediaUploadPrefix(env);
      if (!String(signedPayload.objectKey || '').startsWith(requiredPrefix)) {
        return createJsonResponse({
          error: 'Signed upload object key is outside TEST_MEDIA_UPLOAD_PREFIX.',
          code: 'TEST_MEDIA_UPLOAD_PREFIX_VIOLATION'
        }, { status: 403 });
      }
    }

    if (Date.now() > Number(signedPayload.exp || 0)) {
      return createJsonResponse({ error: 'Upload token has expired.' }, { status: 410 });
    }

    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength > 1024 * 1024) {
      return createJsonResponse({ error: 'Prototype signed uploads are limited to 1 MiB.' }, { status: 413 });
    }

    const requestContentType = request.headers.get('content-type') || '';
    if (signedPayload.contentType && requestContentType && requestContentType !== signedPayload.contentType) {
      return createJsonResponse({ error: 'Content-Type does not match the signed upload intent.' }, { status: 400 });
    }

    const object = await env.ASSETS.put(signedPayload.objectKey, body, {
      httpMetadata: {
        contentType: signedPayload.contentType,
        cacheControl: signedPayload.cacheControl
      },
      customMetadata: {
        scope: signedPayload.scope || 'uploads',
        filename: signedPayload.filename || 'asset',
        ...(signedPayload.postSlug ? { postSlug: signedPayload.postSlug } : {})
      }
    });
    const recordedAt = nowIso();
    const persisted = await insertTaskRecord(env, {
      id: crypto.randomUUID(),
      type: 'r2_upload_signed',
      status: 'completed',
      payload: {
        mode: 'signed-upload',
        objectKey: signedPayload.objectKey,
        publicUrl: signedPayload.publicUrl,
        uploaded_bytes: body.byteLength
      },
      created_at: recordedAt,
      updated_at: recordedAt
    });

    await insertAuditLog(env, {
      action: 'r2_signed_upload',
      ...extractRequestMeta(request),
      resource: 'asset',
      resource_id: signedPayload.objectKey,
      status_code: 201,
      duration_ms: Date.now() - requestStart,
      detail: { uploaded_bytes: body.byteLength }
    });

    return createJsonResponse({
      mode: 'signed-upload',
      public_url: signedPayload.publicUrl,
      object_key: signedPayload.objectKey,
      uploaded_bytes: body.byteLength,
      etag: object?.etag || null,
      version: object?.version || null,
      persisted
    }, { status: 201 });
  }

  if (url.pathname === '/api/assets/r2-upload' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
    if (validationError) {
      return createJsonResponse({ error: validationError }, { status: 400 });
    }
    const mode = input.mode === 'live' ? 'live' : 'dry-run';
    const preview = buildR2UploadPreview(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
    });
    const plan = buildR2UploadWritePlan(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
    });

    if (mode !== 'live') {
      return createJsonResponse({
        mode,
        preview,
        plan,
        note: 'Dry-run R2 upload only. No object has been written.'
      });
    }

    if (!isLiveWritesEnabled(env)) {
      return rejectLiveWriteDisabled();
    }

    if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
      return createJsonResponse({
        error: 'ASSETS binding is required for the live R2 upload prototype.',
        mode
      }, { status: 503 });
    }

    if (!env.ASSETS_PUBLIC_BASE_URL) {
      return createJsonResponse({
        error: 'ASSETS_PUBLIC_BASE_URL is required for the live R2 upload prototype.',
        mode
      }, { status: 503 });
    }

    const uploadBody = buildR2UploadBody(input);
    if (uploadBody.byteLength > 256 * 1024) {
      return createJsonResponse({
        error: 'Prototype uploads are limited to 256 KiB.',
        mode,
        uploaded_bytes: uploadBody.byteLength
      }, { status: 413 });
    }

    const object = await putAssetObject(env, preview, uploadBody);
    const recordedAt = nowIso();
    const persisted = await insertTaskRecord(env, {
      id: crypto.randomUUID(),
      type: 'r2_upload_live',
      status: 'completed',
      payload: {
        mode,
        preview,
        encoding: uploadBody.encoding,
        cacheControl: uploadBody.cacheControl,
        uploaded_bytes: uploadBody.byteLength
      },
      created_at: recordedAt,
      updated_at: recordedAt
    });

    await insertAuditLog(env, {
      action: 'r2_upload',
      ...extractRequestMeta(request),
      resource: 'asset',
      resource_id: preview.objectKey,
      status_code: 200,
      duration_ms: Date.now() - requestStart,
      detail: { mode, uploaded_bytes: uploadBody.byteLength }
    });

    return createJsonResponse({
      mode,
      preview,
      plan,
      uploaded_bytes: uploadBody.byteLength,
      etag: object?.etag || null,
      version: object?.version || null,
      persisted
    });
  }

  if (url.pathname === '/api/assets/r2-tasks' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const prototype = buildR2UploadTaskPrototype(input, {
      bucketBinding: 'ASSETS',
      bucketName: 'xhalo-blog-assets',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl,
      stage: '3-prototype'
    });

    const { error: queueError, persisted } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    return createJsonResponse({
      queued: true,
      persisted,
      task_id: prototype.taskRecord.id,
      task_type: prototype.taskRecord.type,
      preview: prototype.preview,
      note: 'Dry-run R2 upload task queued. No object has been written.'
    });
  }

  if (url.pathname === '/api/publish/notifications/template') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    return createJsonResponse({
      template: defaultPublishNotificationTemplate,
      note: 'Stage 3 publish notification prototype. No real downstream notification is sent here.'
    });
  }

  if (url.pathname === '/api/publish/notifications/preview' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const preview = buildPublishNotificationPreview(input, {
      queueBinding: 'TASK_QUEUE'
    });

    return createJsonResponse({
      preview,
      note: 'Stage 3 publish notification preview only. No downstream notification has been sent.'
    });
  }

  if (url.pathname === '/api/publish/notifications/tasks' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const prototype = buildPublishNotificationTaskPrototype(input, {
      queueBinding: 'TASK_QUEUE',
      stage: '3-prototype'
    });

    const { error: queueError, persisted } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    return createJsonResponse({
      queued: true,
      persisted,
      task_id: prototype.taskRecord.id,
      task_type: prototype.taskRecord.type,
      preview: prototype.preview,
      note: 'Dry-run publish notification task queued. No downstream notification has been sent.'
    });
  }

  if (url.pathname === '/api/moderation/template') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    return createJsonResponse({
      template: defaultModerationTemplate,
      note: 'Stage 3 moderation prototype. No real comment provider write happens here.'
    });
  }

  if (url.pathname === '/api/moderation/preview' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const preview = buildModerationPreview(input, {
      queueBinding: 'TASK_QUEUE'
    });

    return createJsonResponse({
      preview,
      note: 'Stage 3 moderation preview only. No real comment has been updated.'
    });
  }

  if (url.pathname === '/api/moderation/tasks' && method === 'POST') {
    const { input, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const prototype = buildModerationTaskPrototype(input, {
      queueBinding: 'TASK_QUEUE',
      stage: '3-prototype'
    });

    const { error: queueError, persisted } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    return createJsonResponse({
      queued: true,
      persisted,
      task_id: prototype.taskRecord.id,
      task_type: prototype.taskRecord.type,
      preview: prototype.preview,
      note: 'Dry-run moderation task queued. No real comment has been updated.'
    });
  }

  // ── Media Asset Manager Routes ──────────────────────────────────────────
  if (url.pathname === '/api/assets/media-preview' && method === 'POST') {
    const { input, error: parseError } = await readJsonBody(request);
    if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });

    if (Array.isArray(input)) {
      return createJsonResponse({ error: 'Validation failed: batch payload not allowed.' }, { status: 400 });
    }

    const validationError = validateMediaUpload({
      filename: input.filename,
      contentType: input.contentType,
      size: input.size || 0,
      storageTarget: input.storageTarget,
      slug: input.slug
    });
    if (validationError) {
      return createJsonResponse({ error: validationError }, { status: 400 });
    }

    const safeFilename = sanitizeFilename(input.filename);
    const targetPath = input.storageTarget === 'git_asset_folder'
      ? `source/_posts/${input.slug}/${safeFilename}`
      : `posts/${input.slug}/${safeFilename}`;

    const markdownSnippet = generateMediaSnippet({
      filename: input.filename,
      contentType: input.contentType,
      storageTarget: input.storageTarget,
      slug: input.slug,
      label: input.label || '',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || 'https://assets.example.com'
    });

    await insertAuditLog(env, {
      action: 'media_preview',
      ...extractRequestMeta(request),
      resource: 'media',
      resource_id: input.slug,
      status_code: 200,
      detail: { filename: safeFilename, storageTarget: input.storageTarget, contentType: input.contentType },
      duration_ms: Date.now() - requestStart
    });

    const isSvg = input.contentType === 'image/svg+xml' || safeFilename.endsWith('.svg');
    return createJsonResponse({
      ok: true,
      mode: 'dry-run',
      asset: {
        slug: input.slug,
        filename: safeFilename,
        contentType: input.contentType,
        storageTarget: input.storageTarget,
        targetPath,
        markdownSnippet,
        highRisk: isSvg ? true : undefined,
        note: isSvg ? 'SVG files are flagged as high-risk and only allowed under dry-run preview constraints.' : undefined
      }
    });
  }

  if (url.pathname === '/api/assets/media-insert-snippet' && method === 'POST') {
    const { input, error: parseError } = await readJsonBody(request);
    if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });

    if (!input.filename || !input.contentType || !input.storageTarget || !input.slug) {
      return createJsonResponse({ error: 'Missing required fields: filename, contentType, storageTarget, slug.' }, { status: 400 });
    }

    const snippet = generateMediaSnippet({
      filename: input.filename,
      contentType: input.contentType,
      storageTarget: input.storageTarget,
      slug: input.slug,
      label: input.label || '',
      publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || 'https://assets.example.com'
    });

    return createJsonResponse({ ok: true, markdownSnippet: snippet });
  }

  return null;
}
