// POST / GET / DELETE /session (RSVP-01, SEC-02, SEC-03).
//
// * POST exchanges a link token or fallback code for a server-side session and sets an
//   HttpOnly; Secure; SameSite=Lax cookie. Errors are neutral: unknown, revoked, expired and
//   rate-limited codes all look the same to the caller apart from 429.
// * GET only reads the cookie. It never accepts a credential, so a link preview cannot consume
//   one or change anything.
// * DELETE revokes the session row and clears the cookie.

import { HttpError, json, noContent, parseCookies, clientIp } from './http.js';
import { credentialDigest, sessionDigest, newSessionToken, sha256Hex, normaliseCredential } from './crypto.js';
import { one, run, stmt, batch, audit, nowIso, loadHousehold } from './db.js';
import { buildSnapshot, rsvpWindow } from './snapshot.js';

export const COOKIE_NAME = 'rn_session';

function cookieHeader(value, maxAgeSeconds) {
  const parts = [`${COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  return parts.join('; ');
}

async function bump(db, bucket, windowSeconds) {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();
  const row = await one(
    db,
    `INSERT INTO rate_limit (bucket, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET count = count + 1
     RETURNING count`,
    bucket,
    windowStart,
  );
  return row ? row.count : 1;
}

async function enforceRateLimits(db, cfg, request, digest) {
  const ipHash = (await sha256Hex(`ip:${clientIp(request)}`)).slice(0, 32);
  const ipCount = await bump(db, `ip:${ipHash}`, cfg.rateLimit.windowSeconds);
  const codeCount = await bump(db, `code:${digest.slice(0, 32)}`, cfg.rateLimit.windowSeconds);
  if (ipCount > cfg.rateLimit.perIp || codeCount > cfg.rateLimit.perCode) {
    throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.');
  }
}

const INVALID = () => new HttpError(403, 'invalid_code', 'We could not find an invitation with that code.');

export async function postSession(request, env, cfg, body) {
  const db = env.DB;
  const raw = body && typeof body.code === 'string' ? body.code : '';
  const normalised = normaliseCredential(raw);
  if (!normalised || normalised.length > 128) throw INVALID();
  const digest = await credentialDigest(cfg.secrets.credentialPepper, normalised);
  await enforceRateLimits(db, cfg, request, digest);

  const now = nowIso();
  const cred = await one(
    db,
    `SELECT c.*, h.state AS household_state FROM access_credential c JOIN household h ON h.id = c.household_id WHERE c.digest = ?`,
    digest,
  );
  if (!cred || cred.revoked_at || cred.household_state !== 'active' || (cred.expires_at && cred.expires_at < now)) {
    throw INVALID();
  }

  const token = newSessionToken();
  const sid = await sessionDigest(cfg.secrets.sessionSecret, token);
  const expiresAt = new Date(Date.now() + cfg.sessionTtlMs).toISOString();
  await batch(db, [
    stmt(db, 'INSERT INTO session (id, household_id, credential_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)', sid, cred.household_id, cred.id, now, expiresAt, now),
    stmt(db, 'UPDATE access_credential SET last_used_at = ? WHERE id = ?', now, cred.id),
    audit(db, { at: now, actorKind: 'guest', actorId: cred.household_id, action: 'session.open', householdId: cred.household_id, targetType: 'access_credential', targetId: cred.id, details: { kind: cred.kind } }),
  ]);

  const loaded = await loadHousehold(db, cred.household_id);
  const snapshot = buildSnapshot(loaded, await rsvpWindow(db, cfg));
  return json(200, snapshot, { 'Set-Cookie': cookieHeader(token, Math.floor(cfg.sessionTtlMs / 1000)) });
}

// Resolves the session cookie to a household id, or throws 401. Used by GET /session and PUT /response.
export async function requireSession(request, env, cfg) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token || token.length > 128) throw new HttpError(401, 'invalid_session', 'Your session has ended.');
  const sid = await sessionDigest(cfg.secrets.sessionSecret, token);
  const now = nowIso();
  const row = await one(
    db(env),
    `SELECT s.*, h.state AS household_state FROM session s JOIN household h ON h.id = s.household_id WHERE s.id = ?`,
    sid,
  );
  if (!row || row.revoked_at || row.expires_at < now || row.household_state !== 'active') {
    throw new HttpError(401, 'invalid_session', 'Your session has ended.');
  }
  // Touch at most once a minute to keep writes low.
  if (Date.parse(row.last_seen_at) < Date.now() - 60_000) {
    await run(env.DB, 'UPDATE session SET last_seen_at = ? WHERE id = ?', now, sid);
  }
  return { sessionId: sid, householdId: row.household_id };
}

function db(env) { return env.DB; }

export async function getSession(request, env, cfg) {
  const { householdId } = await requireSession(request, env, cfg);
  const loaded = await loadHousehold(env.DB, householdId);
  if (!loaded) throw new HttpError(401, 'invalid_session', 'Your session has ended.');
  return json(200, buildSnapshot(loaded, await rsvpWindow(env.DB, cfg)));
}

export async function deleteSession(request, env, cfg) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (token && token.length <= 128) {
    const sid = await sessionDigest(cfg.secrets.sessionSecret, token);
    await run(env.DB, 'UPDATE session SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL', nowIso(), sid);
  }
  return noContent({ 'Set-Cookie': cookieHeader('', 0) });
}
