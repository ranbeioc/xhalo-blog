# Cloudflare Access JWT Verification

This document details how `xhalo-blog` validates JSON Web Tokens (JWTs) cryptographically at the edge for requests protected by Cloudflare Access.

---

## Architecture Overview

When an operator makes requests to protected admin endpoints (e.g. `/api/drafts/publish`), the request passes through Cloudflare Access. Once authenticated, Access injects the signed JWT into the `Cf-Access-Jwt-Assertion` header.

The `xhalo-blog` API Worker interceptor validates this token directly using the browser-native **Web Crypto API**, ensuring that:
1. The token has not expired (`exp` claim validation).
2. The issuer matches your Cloudflare Access team domain (`iss` claim validation).
3. The audience matches your Access application Audience Tag (`aud` claim validation).
4. The cryptographic signature is valid, signed by one of the public keys retrieved from Cloudflare's JWKS endpoint (`https://<team-domain>.cloudflareaccess.com/cdn-cgi/access/certs`).

---

## Configuration

To enable JWT validation, populate the following environment variables in your Workers configuration (`wrangler.toml` or Cloudflare Dashboard):

| Variable Name | Description | Example Value |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | Your Cloudflare Access Team name / subdomain. | `my-team` |
| `ACCESS_AUDIENCE_TAG` | The unique Application Audience Tag (found in Access configuration). | `0123456789abcdef0123456789abcdef` |

If these variables are omitted, JWT signature verification will fail or be skipped.

---

## Hybrid Auth & Fallback

To support automated API integrations and local admin panels that do not pass through Access boundaries directly, `verifyAdminRequest` implements a hybrid check:

```javascript
// 1. If an Access assertion token is present, validate it.
if (request.headers.has('cf-access-jwt-assertion')) {
  const isJwtValid = await verifyAccessJwt(request, env);
  if (isJwtValid) return true;
}

// 2. If JWT is missing or invalid, fall back to checking the shared secret token.
const provided = request.headers.get('x-xhalo-admin-secret') || '';
return Boolean(provided) && provided === env.ADMIN_API_SHARED_SECRET;
```

This ensures zero-lockout and maintains full compatibility with programmatic scripts sending the `x-xhalo-admin-secret` header.

---

## Local Development & Testing

During unit tests, making external HTTPS calls to Cloudflare’s JWKS endpoints is bypassed to allow fast, offline execution.

To bypass signature verification while still parsing and validating standard claim sets (`exp`, `iss`, `aud`), configure:

```ini
ACCESS_BYPASS_SIGNATURE_FOR_TESTING=true
```

This flag is automatically set during `npm test` environments.
