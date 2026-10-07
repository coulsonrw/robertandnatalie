// POST / GET / DELETE /session (RSVP-01, SEC-02, SEC-03).
//
// * POST opens a household session from a public party id (the guest name-picker) or, still,
//   from an optional admin-issued link token / fallback code. Errors are neutral: unknown,
//   revoked and rate-limited attempts look the same apart from 429.
// * GET only reads the cookie. It never accepts a credential, so a link preview cannot consume
//   one or change anything.
// * DELETE revokes the session row and clears the cookie.

import { HttpError, json, noContent, parseCookies } from './http.js';
import { credentialDigest, sessionDigest, newSessionToken, normaliseCredential } from './crypto.js';
import { one, run, stmt, batch, audit, nowIso, loadHousehold } from './db.js';
import { buildSnapshot, rsvpWindow } from './snapshot.js';
import { bump, enforceIpRateLimit } from './ratelimit.js';

export const COOKIE_NAME = 'rn_session';

const PARTY_ID = /^[A-Za-z0-9_-]{1,64}$/;

function cookieHeader(value, maxAgeSeconds) {
  const parts = [`${COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  return parts.join('; ');
}

async function enforceCodeRateLimits(db, cfg, request, digest) {
  const { ipHash } = await enforceIpRateLimit(db, cfg, request, 'ip', cfg.rateLimit.perIp);
  const codeCount = await bump(db, `code:${digest.slice(0, 32)}`, cfg.rateLimit.windowSeconds);
  if (codeCount > cfg.rateLimit.perCode) {
    throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.');
  }
  return ipHash;
}

const INVALID = () => new HttpError(403, 'invalid_code', 'We could not find that invitation.');

async function openHouseholdSession(db, cfg, householdId, { credentialId = null, kind }) {
  const now = nowIso();
  const token = newSessionToken();
  const sid = await sessionDigest(cfg.secrets.sessionSecret, token);
  const expiresAt = new Date(Date.now() + cfg.sessionTtlMs).toISOString();
  const statements = [
    stmt(db, 'INSERT INTO session (id, household_id, credential_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)', sid, householdId, credentialId, now, expiresAt, now),
    audit(db, { at: now, actorKind: 'guest', actorId: householdId, action: 'session.open', householdId, targetType: credentialId ? 'access_credential' : 'household', targetId: credentialId || householdId, details: { kind } }),
  ];
  if (credentialId) statements.splice(1, 0, stmt(db, 'UPDATE access_credential SET last_used_at = ? WHERE id = ?', now, credentialId));
  await batch(db, statements);
  const loaded = await loadHousehold(db, householdId);
  const snapshot = buildSnapshot(loaded, await rsvpWindow(db, cfg));
  return json(200, snapshot, { 'Set-Cookie': cookieHeader(token, Math.floor(cfg.sessionTtlMs / 1000)) });
}

async function postSessionByParty(request, env, cfg, partyId) {
  const db = env.DB;
  if (!PARTY_ID.test(partyId)) throw INVALID();
  await enforceIpRateLimit(db, cfg, request, 'ip', cfg.rateLimit.perIp);
  await enforceIpRateLimit(db, cfg, request, `party:${partyId}`, cfg.rateLimit.perCode);

  const row = await one(db, 'SELECT id, state FROM household WHERE id = ?', partyId);
  if (!row || row.state !== 'active') throw INVALID();

  return openHouseholdSession(db, cfg, row.id, { kind: 'party' });
}

async function postSessionByCode(request, env, cfg, raw) {
  const db = env.DB;
  const normalised = normaliseCredential(raw);
  if (!normalised || normalised.length > 128) throw INVALID();
  const digest = await credentialDigest(cfg.secrets.credentialPepper, normalised);
  await enforceCodeRateLimits(db, cfg, request, digest);

  const now = nowIso();
  const cred = await one(
    db,
    `SELECT c.*, h.state AS household_state FROM access_credential c JOIN household h ON h.id = c.household_id WHERE c.digest = ?`,
    digest,
  );
  if (!cred || cred.revoked_at || cred.household_state !== 'active' || (cred.expires_at && cred.expires_at < now)) {
    throw INVALID();
  }

  return openHouseholdSession(db, cfg, cred.household_id, { credentialId: cred.id, kind: cred.kind });
}

export async function postSession(request, env, cfg, body) {
  const partyId = body && typeof body.partyId === 'string' ? body.partyId.trim() : '';
  if (partyId) return await postSessionByParty(request, env, cfg, partyId);
  const raw = body && typeof body.code === 'string' ? body.code : '';
  return await postSessionByCode(request, env, cfg, raw);
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
