export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (let pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key) {
      cookies[key.trim()] = valueParts.join('=').trim();
    }
  }
  return cookies;
}

export async function signSessionPayload(payload, secret) {
  const payloadStr = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(payloadStr);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return payloadStr + '.' + signatureHex;
}

export async function verifySessionCookieValue(sessionValue, secret, allowedLoginsString) {
  if (!sessionValue) return null;
  try {
    const decoded = decodeURIComponent(sessionValue);
    const lastDotIndex = decoded.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const payloadStr = decoded.substring(0, lastDotIndex);
    const providedSig = decoded.substring(lastDotIndex + 1);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = encoder.encode(payloadStr);

    const sigBytes = new Uint8Array(providedSig.length / 2);
    for (let i = 0; i < sigBytes.length; i++) {
      sigBytes[i] = parseInt(providedSig.substr(i * 2, 2), 16);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!isValid) return null;

    const payload = JSON.parse(payloadStr);
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    if (allowedLoginsString) {
      const allowed = allowedLoginsString.split(',').map(s => s.trim().toLowerCase());
      if (!payload.login || !allowed.includes(payload.login.toLowerCase())) {
        return null;
      }
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function verifySessionCookie(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const cookieName = env.ADMIN_SESSION_COOKIE_NAME || 'xhalo_admin_session';
  const sessionValue = cookies[cookieName];
  if (!sessionValue) return null;
  return await verifySessionCookieValue(sessionValue, env.ADMIN_SESSION_SECRET, env.GITHUB_OAUTH_ALLOWED_LOGINS);
}
