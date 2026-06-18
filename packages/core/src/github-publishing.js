import { nowIso, parseDraftMarkdownDocument } from './index.js';

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

export async function createDirectMainCommit(env, { branch = 'main', filePath, content, commitMessage }) {
  const { owner, repo } = getGitHubRepository(env);

  let existingSha = null;
  try {
    const existingFile = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`);
    if (existingFile && existingFile.sha) {
      existingSha = existingFile.sha;
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  if (existingSha) {
    throw new Error('Target post already exists. Use explicit update flow in a separate phase.');
  }

  const finalCommitMessage = commitMessage.includes('[owner-direct]') || commitMessage.includes('[test-direct]')
    ? commitMessage
    : `[owner-direct] ${commitMessage}`;

  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: finalCommitMessage,
      content: encodeBase64Utf8(content),
      branch
    })
  });

  return {
    commitSha: result.commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${result.commit.sha}`
  };
}

export async function getFileContentFromBranch(env, { branch = 'main', filePath }) {
  const { owner, repo } = getGitHubRepository(env);
  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`);

  if (!result || !result.content) {
    const error = new Error('File content is empty.');
    error.status = 404;
    error.code = 'FILE_CONTENT_EMPTY';
    throw error;
  }

  const bytes = decodeBase64ToBytes(result.content);
  return {
    filePath,
    sha: result.sha,
    raw: new TextDecoder().decode(bytes)
  };
}

export async function createDirectMainUpsertCommit(env, { branch = 'main', filePath, content, commitMessage }) {
  const { owner, repo } = getGitHubRepository(env);

  let existingSha = null;
  try {
    const existingFile = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`);
    if (existingFile && existingFile.sha) {
      existingSha = existingFile.sha;
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  const finalCommitMessage = commitMessage.includes('[owner-direct]') || commitMessage.includes('[test-direct]')
    ? commitMessage
    : `[test-direct] ${commitMessage}`;

  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: finalCommitMessage,
      content: encodeBase64Utf8(content),
      branch,
      ...(existingSha ? { sha: existingSha } : {})
    })
  });

  return {
    commitSha: result.commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${result.commit.sha}`,
    operation: existingSha ? 'updated' : 'created',
    previousSha: existingSha
  };
}

export async function getPostFileFromMain(env, { slug, filePath: explicitFilePath }) {
  const { owner, repo, baseBranch } = getGitHubRepository(env);
  if (baseBranch !== 'main') {
    const error = new Error('Owner direct publish requires GITHUB_BRANCH=main.');
    error.status = 400;
    error.code = 'OWNER_DIRECT_MAIN_REQUIRED';
    throw error;
  }

  const filePath = explicitFilePath || `source/_posts/${slug}.md`;
  if (!/^source\/_posts\/[^/]+\.md$/i.test(filePath)) {
    const error = new Error('Post file path must stay under source/_posts and end with .md.');
    error.status = 400;
    error.code = 'INVALID_POST_FILE_PATH';
    throw error;
  }
  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=main`);

  if (!result || !result.content) {
    const error = new Error('Post file content is empty.');
    error.status = 404;
    throw error;
  }

  const bytes = decodeBase64ToBytes(result.content);
  const raw = new TextDecoder().decode(bytes);

  const { frontmatter, body } = parseDraftMarkdownDocument(raw);

  return {
    slug,
    filePath,
    sha: result.sha,
    raw,
    frontmatter,
    body
  };
}

export async function listPostFilesFromMain(env, { branch = 'main', limit = 100 } = {}) {
  const { owner, repo, baseBranch } = getGitHubRepository(env);
  const targetBranch = branch || baseBranch || 'main';
  const headSha = await getBranchHeadSha(env, targetBranch);
  const tree = await githubApiRequest(
    env,
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(headSha)}?recursive=1`
  );

  const files = Array.isArray(tree?.tree)
    ? tree.tree
      .filter((item) => item.type === 'blob' && /^source\/_posts\/.+\.md$/i.test(item.path || ''))
      .sort((a, b) => String(b.path || '').localeCompare(String(a.path || '')))
      .slice(0, Math.max(1, Math.min(Number(limit) || 100, 200)))
    : [];

  const posts = [];
  for (const file of files) {
    const fileData = await getFileContentFromBranch(env, {
      branch: targetBranch,
      filePath: file.path
    });
    const { frontmatter, body } = parseDraftMarkdownDocument(fileData.raw);
    const filename = file.path.split('/').pop() || '';
    const slug = filename.replace(/\.md$/i, '');
    const title = frontmatter.title || slug;
    const date = frontmatter.updated || frontmatter.date || frontmatter.created || null;

    posts.push({
      id: `git-${slug}`,
      slug,
      title: String(title),
      path: file.path,
      filePath: file.path,
      status: frontmatter.status || 'published',
      created_at: date,
      updated_at: frontmatter.updated || date,
      published_at: frontmatter.date || date,
      github_branch: targetBranch,
      github_pr_url: null,
      preview_url: `/posts/${slug}/`,
      sha: fileData.sha,
      excerpt: body ? body.split(/\r?\n/).find((line) => line.trim()) || '' : '',
      frontmatter
    });
  }

  return posts;
}

export async function createDirectMainUpdateCommit(env, { branch = 'main', filePath, content, baseSha, commitMessage }) {
  const { owner, repo } = getGitHubRepository(env);

  if (!baseSha) {
    throw new Error('baseSha is required for updating an existing file.');
  }

  let currentFile = null;
  try {
    currentFile = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`);
  } catch (error) {
    if (error.status === 404) {
      const targetNotFoundError = new Error('Target file not found.');
      targetNotFoundError.status = 404;
      targetNotFoundError.code = 'TARGET_NOT_FOUND';
      throw targetNotFoundError;
    }
    throw error;
  }

  if (currentFile.sha !== baseSha) {
    const staleError = new Error('Article has changed on main. Please reload before publishing.');
    staleError.status = 409;
    staleError.code = 'STALE_BASE_SHA';
    throw staleError;
  }

  const finalCommitMessage = commitMessage.startsWith('[owner-direct-update]')
    ? commitMessage
    : `[owner-direct-update] ${commitMessage}`;

  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: finalCommitMessage,
      content: encodeBase64Utf8(content),
      branch,
      sha: baseSha
    })
  });

  return {
    commitSha: result.commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${result.commit.sha}`
  };
}

export async function createDirectMultiFileUpdateCommit(env, { branch = 'main', files, commitMessage }) {
  const { owner, repo } = getGitHubRepository(env);
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('files is required for a multi-file commit.');
  }

  const ref = await githubApiRequest(env, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha = ref.object.sha;
  const headCommit = await githubApiRequest(env, `/repos/${owner}/${repo}/git/commits/${encodeURIComponent(headSha)}`);
  const baseTreeSha = headCommit.tree.sha;

  for (const file of files) {
    if (!file.filePath || typeof file.content !== 'string') {
      throw new Error('Each multi-file commit entry requires filePath and content.');
    }
    if (file.baseSha) {
      const currentFile = await githubApiRequest(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(file.filePath)}?ref=${encodeURIComponent(branch)}`);
      if (currentFile.sha !== file.baseSha) {
        const staleError = new Error(`File has changed on ${branch}: ${file.filePath}. Please reload before saving.`);
        staleError.status = 409;
        staleError.code = 'STALE_BASE_SHA';
        throw staleError;
      }
    }
  }

  const tree = await githubApiRequest(env, `/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((file) => ({
        path: file.filePath,
        mode: '100644',
        type: 'blob',
        content: file.content
      }))
    })
  });

  const finalCommitMessage = commitMessage.startsWith('[owner-direct-update]')
    ? commitMessage
    : `[owner-direct-update] ${commitMessage}`;

  const commit = await githubApiRequest(env, `/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: finalCommitMessage,
      tree: tree.sha,
      parents: [headSha]
    })
  });

  await githubApiRequest(env, `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sha: commit.sha,
      force: false
    })
  });

  return {
    commitSha: commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    files: files.map((file) => file.filePath)
  };
}

