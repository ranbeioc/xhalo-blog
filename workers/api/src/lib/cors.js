export function handleCors(request, response, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return response;

  const allowedOrigins = [];
  if (env.ADMIN_FRONTEND_BASE_URL) {
    allowedOrigins.push(env.ADMIN_FRONTEND_BASE_URL.replace(/\/$/, ''));
  }
  // Allow localhost for local development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowedOrigins.push(origin);
  }
  if (env.ADMIN_AUTH_BASE_URL) {
    allowedOrigins.push(env.ADMIN_AUTH_BASE_URL.replace(/\/$/, ''));
  }

  const isAllowed = allowedOrigins.includes(origin);
  if (isAllowed) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-xhalo-admin-secret, x-xhalo-turnstile-token, cf-turnstile-token, cf-access-jwt-assertion');
    newHeaders.set('Vary', 'Origin');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  return response;
}
