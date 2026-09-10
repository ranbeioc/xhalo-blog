import { buildQueueTaskEnvelope } from './index.js';
import { nowIso } from './diff.js';
import { slugifyTitle } from './drafts.js';
export const defaultR2UploadTemplate = {
  bucketBinding: 'ASSETS',
  bucketName: 'xhalo-blog-assets',
  keyPrefix: 'uploads',
  publicBaseUrl: 'https://assets.example.com',
  fields: ['filename', 'contentType', 'scope', 'postSlug', 'content', 'encoding', 'cacheControl'],
  defaults: {
    scope: 'uploads',
    contentType: 'image/png',
    encoding: 'utf-8',
    cacheControl: 'public, max-age=31536000, immutable',
    uploadUrlTtlSeconds: 900
  }
};

export function sanitizeAssetSegment(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

export function normalizeR2UploadInput(input = {}) {
  const filename = sanitizeAssetSegment(input.filename || 'upload.png');
  const contentType = String(input.contentType || defaultR2UploadTemplate.defaults.contentType).trim();
  const scope = sanitizeAssetSegment(input.scope || defaultR2UploadTemplate.defaults.scope);
  const postSlug = String(input.postSlug || '').trim();

  return {
    filename,
    contentType,
    scope,
    postSlug: postSlug ? slugifyTitle(postSlug) : ''
  };
}

export function buildR2ObjectKey(input = {}, options = {}) {
  const normalized = normalizeR2UploadInput(input);
  const date = options.date || new Date();
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  if (normalized.postSlug) {
    return `posts/${normalized.postSlug}/${yyyy}-${mm}-${dd}-${normalized.filename}`;
  }

  return `${normalized.scope}/${yyyy}/${mm}/${dd}/${normalized.filename}`;
}

export function buildR2UploadPreview(input = {}, options = {}) {
  const normalized = normalizeR2UploadInput(input);
  const objectKey = buildR2ObjectKey(normalized, options);
  const publicBaseUrl = options.publicBaseUrl || defaultR2UploadTemplate.publicBaseUrl;

  return {
    bucketBinding: options.bucketBinding || defaultR2UploadTemplate.bucketBinding,
    bucketName: options.bucketName || defaultR2UploadTemplate.bucketName,
    objectKey,
    publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`,
    contentType: normalized.contentType,
    scope: normalized.scope,
    postSlug: normalized.postSlug || null,
    filename: normalized.filename
  };
}

export function buildR2UploadTaskPrototype(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'r2_upload_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export function buildR2UploadWritePlan(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const encoding = String(input.encoding || defaultR2UploadTemplate.defaults.encoding).trim() || defaultR2UploadTemplate.defaults.encoding;
  const cacheControl = String(input.cacheControl || defaultR2UploadTemplate.defaults.cacheControl).trim() || defaultR2UploadTemplate.defaults.cacheControl;

  return {
    preview,
    actions: [
      {
        type: 'derive_object_key',
        summary: `Resolve ${preview.objectKey} under ${preview.bucketName}`,
        payload: {
          bucketBinding: preview.bucketBinding,
          bucketName: preview.bucketName,
          objectKey: preview.objectKey
        }
      },
      {
        type: 'write_object',
        summary: `Write ${preview.filename} to ${preview.objectKey} with ${preview.contentType}`,
        payload: {
          contentType: preview.contentType,
          encoding,
          cacheControl
        }
      },
      {
        type: 'verify_public_url',
        summary: `Verify the uploaded object on ${preview.publicUrl}`,
        payload: {
          publicUrl: preview.publicUrl
        }
      }
    ]
  };
}

export function buildR2SignedUploadPlan(input = {}, options = {}) {
  const preview = buildR2UploadPreview(input, options);
  const ttlSeconds = Number(options.ttlSeconds || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds) || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds;

  return {
    preview,
    ttlSeconds,
    actions: [
      {
        type: 'derive_object_key',
        summary: `Resolve ${preview.objectKey} under ${preview.bucketName}`,
        payload: {
          bucketBinding: preview.bucketBinding,
          bucketName: preview.bucketName,
          objectKey: preview.objectKey
        }
      },
      {
        type: 'sign_upload_url',
        summary: `Issue a short-lived signed worker upload URL for ${preview.objectKey}`,
        payload: {
          ttlSeconds,
          method: 'PUT',
          pathPrefix: '/api/assets/r2-upload/'
        }
      },
      {
        type: 'browser_put_upload',
        summary: `PUT the asset bytes to the signed upload URL with ${preview.contentType}`,
        payload: {
          contentType: preview.contentType,
          publicUrl: preview.publicUrl,
          adminHeader: 'x-xhalo-admin-secret'
        }
      },
      {
        type: 'verify_public_url',
        summary: `Verify the uploaded object on ${preview.publicUrl}`,
        payload: {
          publicUrl: preview.publicUrl
        }
      }
    ]
  };
}

export const defaultPublishNotificationTemplate = {
  queueBinding: 'TASK_QUEUE',
  channels: ['cloudflare-pages-preview', 'github-pr-comment'],
  defaults: {
    channel: 'cloudflare-pages-preview',
    status: 'preview-ready'
  },
  fields: ['postSlug', 'branchName', 'previewUrl', 'channel', 'status']
};

export function normalizePublishNotificationInput(input = {}) {
  const postSlug = String(input.postSlug || 'hello-xhalo-blog').trim();
  const branchName = String(input.branchName || `draft/${slugifyTitle(postSlug) || 'hello-xhalo-blog'}`).trim();
  const previewUrl = String(input.previewUrl || `https://preview.example.com/${slugifyTitle(postSlug) || 'hello-xhalo-blog'}/`).trim();
  const channel = String(input.channel || defaultPublishNotificationTemplate.defaults.channel).trim();
  const status = String(input.status || defaultPublishNotificationTemplate.defaults.status).trim();

  return {
    postSlug: slugifyTitle(postSlug) || 'hello-xhalo-blog',
    branchName,
    previewUrl,
    channel,
    status
  };
}

export function buildPublishNotificationPreview(input = {}, options = {}) {
  const normalized = normalizePublishNotificationInput(input);
  return {
    queueBinding: options.queueBinding || defaultPublishNotificationTemplate.queueBinding,
    postSlug: normalized.postSlug,
    branchName: normalized.branchName,
    previewUrl: normalized.previewUrl,
    channel: normalized.channel,
    status: normalized.status,
    title: `Preview ready for ${normalized.postSlug}`,
    message: `Preview deployment is ready on ${normalized.previewUrl}`
  };
}

export function buildPublishNotificationTaskPrototype(input = {}, options = {}) {
  const preview = buildPublishNotificationPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'publish_notification_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}

export const defaultModerationTemplate = {
  queueBinding: 'TASK_QUEUE',
  providers: ['waline'],
  actions: ['approve', 'reject', 'flag'],
  defaults: {
    provider: 'waline',
    action: 'flag',
    reason: 'manual-review'
  },
  fields: ['commentId', 'provider', 'action', 'reason']
};

export function normalizeModerationInput(input = {}) {
  const commentId = String(input.commentId || 'comment-demo-1').trim();
  const provider = String(input.provider || defaultModerationTemplate.defaults.provider).trim();
  const action = String(input.action || defaultModerationTemplate.defaults.action).trim();
  const reason = String(input.reason || defaultModerationTemplate.defaults.reason).trim();

  return {
    commentId,
    provider,
    action,
    reason
  };
}

export function buildModerationPreview(input = {}, options = {}) {
  const normalized = normalizeModerationInput(input);
  return {
    queueBinding: options.queueBinding || defaultModerationTemplate.queueBinding,
    commentId: normalized.commentId,
    provider: normalized.provider,
    action: normalized.action,
    reason: normalized.reason,
    title: `Moderation review for ${normalized.commentId}`,
    message: `${normalized.action} comment ${normalized.commentId} via ${normalized.provider}`
  };
}

export function buildModerationTaskPrototype(input = {}, options = {}) {
  const preview = buildModerationPreview(input, options);
  const createdAt = nowIso();
  const task = buildQueueTaskEnvelope({
    type: 'moderation_preview',
    stage: options.stage || '3-prototype',
    created_at: createdAt,
    idempotency_key: crypto.randomUUID(),
    preview
  });

  return {
    preview,
    queuedTask: task,
    taskRecord: {
      id: task.idempotency_key,
      type: task.type,
      status: 'queued',
      payload: task,
      created_at: createdAt,
      updated_at: createdAt
    }
  };
}
