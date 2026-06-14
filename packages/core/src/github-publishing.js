import { nowIso } from './index.js';

export function getGitHubFetch(env) {
  return env.GITHUB_FETCH || fetch;
}

export function getGitHubRepository(env) {
  return {
    owner: env.GITHUB_OWNER || 'example',
    repo: env.GITHUB_REPO || 'xhalo-blog',
    baseBranch: env.GITHUB_BRANCH || 'main'
  };
}

export function hasGitHubAppConfig(env) {
  return Boolean(env.GITHUB_APP_ID) && Boolean(env.GITHUB_APP_PRIVATE_KEY) && Boolean(env.GITHUB_INSTALLATION_ID);
}

export function encodeBase64Utf8(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

export function decodeBase64ToBytes(input) {
  const normalized = String(input || '').replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

export function encodeBase64Url(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');

  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function encodeDerLength(length) {
  if (length < 0x80) return Uint8Array.of(length);
  const bytes = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

export function encodeDerSequence(...parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  return Uint8Array.from([0x30, ...encodeDerLength(totalLength), ...parts.flatMap((part) => Array.from(part))]);
}

export function encodeDerIntegerZero() {
  return Uint8Array.of(0x02, 0x01, 0x00);
}

export function encodeDerNull() {
  return Uint8Array.of(0x05, 0x00);
}

export function encodeDerOidRsaEncryption() {
  return Uint8Array.of(0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01);
}

export function encodeDerOctetString(bytes) {
  return Uint8Array.from([0x04, ...encodeDerLength(bytes.byteLength), ...bytes]);
}

export function wrapPkcs1PrivateKey(pkcs1Bytes) {
  const algorithmIdentifier = encodeDerSequence(
    encodeDerOidRsaEncryption(),
    encodeDerNull()
  );
  return encodeDerSequence(
    encodeDerIntegerZero(),
    algorithmIdentifier,
    encodeDerOctetString(pkcs1Bytes)
  );
}

export function parsePemPrivateKey(pem) {
  const normalized = String(pem || '').replace(/\\n/g, '\n').trim();
  const isPkcs1 = normalized.includes('-----BEGIN RSA PRIVATE KEY-----');
  const base64 = normalized
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const derBytes = decodeBase64ToBytes(base64);

  return isPkcs1 ? wrapPkcs1PrivateKey(derBytes) : derBytes;
}

export async function createGitHubAppJwt(env) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: env.GITHUB_APP_ID
  };
  const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    parsePemPrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signingInput)
    )
  );

  return `${signingInput}.${encodeBase64Url(signature)}`;
}

export async function getGitHubAuthorization(env) {
  if (env.__githubAuthorization) return env.__githubAuthorization;

  if (hasGitHubAppConfig(env)) {
    const appJwt = await createGitHubAppJwt(env);
    const response = await getGitHubFetch(env)(`https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_INSTALLATION_ID)}/access_tokens`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${appJwt}`,
        'x-github-api-version': '2022-11-28',
        'user-agent': 'xhalo-blog-api'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`GitHub App token ${response.status}: ${text}`);
      error.status = response.status;
      throw error;
    }

    const tokenPayload = await response.json();
    env.__githubAuthorization = {
      mode: 'app',
      header: `Bearer ${tokenPayload.token}`
    };
    return env.__githubAuthorization;
  }

  if (env.GITHUB_TOKEN) {
    env.__githubAuthorization = {
      mode: 'token',
      header: `Bearer ${env.GITHUB_TOKEN}`
    };
    return env.__githubAuthorization;
  }

  return {
    mode: 'none',
    header: null
  };
}

export async function githubApiRequest(env, path, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('accept', 'application/vnd.github+json');
  headers.set('x-github-api-version', '2022-11-28');
  headers.set('user-agent', 'xhalo-blog-api');
  const authorization = await getGitHubAuthorization(env);
  if (authorization.header) headers.set('authorization', authorization.header);

  const response = await getGitHubFetch(env)(`https://api.github.com${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub API ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function getBranchHeadSha(env, branchName) {
  const { owner, repo } = getGitHubRepository(env);
  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`);
  return result.object.sha;
}

export async function createBranchIfMissing(env, branchName, baseSha) {
  const { owner, repo } = getGitHubRepository(env);

  try {
    await githubApiRequest(env, `/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });
    return { created: true };
  } catch (error) {
    if (error.status === 422) return { created: false };
    throw error;
  }
}

export async function createDraftFileCommit(env, filePath, branchName, content, commitMessage) {
  const { owner, repo } = getGitHubRepository(env);
  let existingSha = null;
  try {
    const existingFile = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branchName)}`);
    if (existingFile && existingFile.sha) {
      existingSha = existingFile.sha;
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  return githubApiRequest(env, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: encodeBase64Utf8(content),
      branch: branchName,
      ...(existingSha ? { sha: existingSha } : {})
    })
  });
}

export async function createPullRequest(env, preview) {
  const { owner, repo } = getGitHubRepository(env);
  try {
    return await githubApiRequest(env, `/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: preview.pullRequestTitle,
        head: preview.branchName,
        base: preview.baseBranch,
        body: preview.pullRequestBody || `Generated by xhalo-blog live draft publish prototype for \`${preview.filePath}\`.`
      })
    });
  } catch (error) {
    if (error.status === 422) {
      try {
        const prs = await githubApiRequest(env, `/repos/${owner}/${repo}/pulls?head=${owner}:${preview.branchName}&state=open`);
        if (Array.isArray(prs) && prs.length > 0) {
          return prs[0];
        }
        const prsFallback = await githubApiRequest(env, `/repos/${owner}/${repo}/pulls?head=${preview.branchName}&state=open`);
        if (Array.isArray(prsFallback) && prsFallback.length > 0) {
          return prsFallback[0];
        }
      } catch (searchError) {
        console.error('Failed to search for existing PR:', searchError);
      }
    }
    throw error;
  }
}
