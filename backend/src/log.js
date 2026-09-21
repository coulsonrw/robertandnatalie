// Request logging with redaction (SEC-02, SEC-04). Never logs query strings, cookies, bodies,
// emails, names or credentials. Anything that looks like a token or a code is masked.

const TOKEN_LIKE = /[A-Za-z0-9_-]{20,}/g;
const CODE_LIKE = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/gi;
const EMAIL_LIKE = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g;

export function redact(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(CODE_LIKE, '[code]')
    .replace(EMAIL_LIKE, '[email]')
    .replace(TOKEN_LIKE, '[token]');
}

export function requestLog(request, status, startedAt, extra) {
  const url = new URL(request.url);
  const entry = {
    t: new Date().toISOString(),
    method: request.method,
    path: url.pathname, // never the query string
    status,
    ms: Date.now() - startedAt,
    ray: request.headers.get('CF-Ray') || null,
  };
  if (extra && extra.error) entry.error = redact(extra.error);
  if (extra && extra.code) entry.code = extra.code;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
  return entry;
}
