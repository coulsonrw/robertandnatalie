// HTTP helpers: JSON bodies, error envelope, security headers, CORS and CSRF checks.
// Every guest/admin response carries Cache-Control: private, no-store (ARCH-04) and the
// restrictive header set below (SEC-03).

export class HttpError extends Error {
  // `extra` is merged into the top level of the error body (e.g. `latest` on 409 conflict).
  // `fields` is an array of { path, message } placed under error.fields so the client can
  // announce validation problems next to the input concerned (see docs/RSVP_API_CONTRACT.md).
  constructor(status, code, message, extra, fields) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.extra = extra || null;
    this.fields = Array.isArray(fields) && fields.length ? fields : null;
  }
}

// 400 validation with field-level detail. Paths name the payload member concerned:
//   contactEmail | notes | responses | responses.<guestId>.<eventId>.status |
//   responses.<guestId>.<eventId>.meal | plusOneNames.<guestId>
// Only ids that belong to the caller's own household ever appear in a path.
export function validationError(message, fields) {
  return new HttpError(400, 'validation', message, null, fields);
}

export const SECURITY_HEADERS = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export function applySecurityHeaders(headers, overrides) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  if (overrides) for (const [k, v] of Object.entries(overrides)) headers.set(k, v);
  return headers;
}

// Explicit headers passed by a handler win over the defaults (e.g. the public banner's cache policy).
function withDefaults(headers) {
  const h = applySecurityHeaders(new Headers());
  if (headers) for (const [k, v] of Object.entries(headers)) h.set(k, v);
  return h;
}

export function json(status, body, headers) {
  const h = withDefaults(headers);
  h.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: h });
}

export function noContent(headers) {
  const h = withDefaults(headers);
  return new Response(null, { status: 204, headers: h });
}

export function text(status, body, contentType, headers) {
  const h = withDefaults(headers);
  h.set('Content-Type', contentType || 'text/plain; charset=utf-8');
  return new Response(body, { status, headers: h });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    if (err.extra) Object.assign(body, err.extra);
    return json(err.status, body);
  }
  return json(500, { error: { code: 'server_error', message: 'Something went wrong. Nothing has been lost.' } });
}

// CORS: exactly one allowed origin (the static site), credentials allowed (contract).
export function corsHeaders(request, siteOrigin) {
  const origin = request.headers.get('Origin');
  const h = { Vary: 'Origin' };
  if (origin && origin === siteOrigin) {
    h['Access-Control-Allow-Origin'] = siteOrigin;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

export function preflight(request, siteOrigin) {
  const origin = request.headers.get('Origin');
  const h = new Headers(corsHeaders(request, siteOrigin));
  if (origin === siteOrigin) {
    h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    h.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    h.set('Access-Control-Max-Age', '600');
  }
  h.set('Cache-Control', 'private, no-store');
  return new Response(null, { status: 204, headers: h });
}

// CSRF (SEC-03): state-changing requests must come from the site origin when a browser sends an
// Origin header. SameSite=Lax on the cookie plus this check plus a JSON content type (which
// forces a CORS preflight) blocks cross-site form posts.
export function assertSameSite(request, siteOrigin) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;
  const origin = request.headers.get('Origin');
  if (origin && origin !== siteOrigin) throw new HttpError(403, 'forbidden_origin', 'Request origin is not allowed.');
  const site = request.headers.get('Sec-Fetch-Site');
  if (!origin && site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
    throw new HttpError(403, 'forbidden_origin', 'Request origin is not allowed.');
  }
}

export async function readJson(request, maxBytes = 64 * 1024) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(400, 'validation', 'Expected application/json.');
  }
  const raw = await request.text();
  if (raw.length > maxBytes) throw new HttpError(413, 'validation', 'Request body is too large.');
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new HttpError(400, 'validation', 'Expected a JSON object.');
    }
    return value;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, 'validation', 'Body is not valid JSON.');
  }
}

export function parseCookies(request) {
  const out = {};
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0';
}
