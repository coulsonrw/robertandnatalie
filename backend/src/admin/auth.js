// Admin authentication (ADMIN-01, SEC-03). /admin* is placed behind a Cloudflare Access
// application whose policy requires MFA and named staff accounts. Access forwards a signed JWT in
// the Cf-Access-Jwt-Assertion header; this module verifies its signature against the team's
// published keys, its issuer, audience and expiry, then maps the email to a role from
// OWNER_EMAILS / COORDINATOR_EMAILS. Anyone not on those lists is refused (deny by default).
//
// The header/claim names and the certificate URL below follow Cloudflare's published guidance for
// validating Access JWTs. They could not be re-verified from this build environment (the docs host
// was blocked), so the owners must confirm them against the current Cloudflare documentation
// during deployment; a mismatch fails closed (403), it does not open access.
//
// Local development/tests: when ENVIRONMENT != "production" and ACCESS_DEV_BYPASS = "true", the
// request may declare its identity in the x-dev-access-email header. Production ignores this.

import { HttpError } from '../http.js';

const ROLE_RANK = { coordinator: 1, owner: 2 };
const keyCache = new Map(); // teamDomain -> { fetchedAt, keys }

function b64urlToBytes(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function fetchKeys(teamDomain) {
  const cached = keyCache.get(teamDomain);
  if (cached && Date.now() - cached.fetchedAt < 10 * 60_000) return cached.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`certs fetch failed: ${res.status}`);
  const body = await res.json();
  const keys = Array.isArray(body.keys) ? body.keys : [];
  keyCache.set(teamDomain, { fetchedAt: Date.now(), keys });
  return keys;
}

export async function verifyAccessJwt(token, cfg) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  if (header.alg !== 'RS256') throw new Error('unexpected alg');
  const keys = await fetchKeys(cfg.access.teamDomain);
  const jwk = keys.find((k) => k.kid === header.kid) || null;
  if (!jwk) throw new Error('unknown key id');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), data);
  if (!ok) throw new Error('bad signature');
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) throw new Error('expired');
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) throw new Error('not yet valid');
  if (payload.iss !== `https://${cfg.access.teamDomain}`) throw new Error('bad issuer');
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(cfg.access.aud)) throw new Error('bad audience');
  if (typeof payload.email !== 'string' || !payload.email) throw new Error('no email claim');
  return { email: payload.email.toLowerCase() };
}

function roleFor(email, cfg) {
  if (cfg.access.ownerEmails.includes(email)) return 'owner';
  if (cfg.access.coordinatorEmails.includes(email)) return 'coordinator';
  return null;
}

export async function requireAdmin(request, cfg, minRole = 'coordinator') {
  let identity = null;
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (jwt && cfg.access.teamDomain && cfg.access.aud) {
    try {
      identity = await verifyAccessJwt(jwt, cfg);
    } catch {
      identity = null;
    }
  } else if (cfg.access.devBypass) {
    const email = (request.headers.get('x-dev-access-email') || '').trim().toLowerCase();
    if (email) identity = { email };
  }
  if (!identity) throw new HttpError(401, 'unauthenticated', 'Administrator authentication is required.');
  const role = roleFor(identity.email, cfg);
  if (!role) throw new HttpError(403, 'forbidden', 'This account is not authorised.');
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) throw new HttpError(403, 'forbidden', 'This action needs the owner role.');
  return { email: identity.email, role };
}

// Cheap CSRF defence for admin mutations in addition to the Origin check: a browser form cannot
// set custom headers, and a cross-site script cannot without CORS approval.
export function requireAdminMutationHeader(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  if (request.headers.get('X-Requested-With') !== 'rsvp-admin') {
    throw new HttpError(403, 'forbidden', 'Missing X-Requested-With: rsvp-admin header.');
  }
}
