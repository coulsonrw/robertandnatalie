// Credential issue and revocation (RSVP-01, SEC-02). The plaintext link token or code is returned
// exactly once, in the issue response, for the owners to send to the household. Only the digest
// is stored.

import { HttpError } from '../http.js';
import { newId, newLinkToken, newFallbackCode, credentialDigest } from '../crypto.js';
import { one, all, stmt, batch, audit, nowIso } from '../db.js';

export async function issueCredential(db, cfg, householdId, body, admin) {
  const household = await one(db, 'SELECT id, state FROM household WHERE id = ?', householdId);
  if (!household) throw new HttpError(404, 'not_found', 'Unknown household.');
  if (household.state !== 'active') throw new HttpError(409, 'conflict', 'This household is revoked.');
  const kind = body.kind === 'code' ? 'code' : body.kind === 'link' ? 'link' : null;
  if (!kind) throw new HttpError(400, 'validation', 'kind must be "link" or "code".');
  const label = typeof body.label === 'string' ? body.label.slice(0, 80) : null;
  let expiresAt = null;
  if (body.expiresAt) {
    if (!Number.isFinite(Date.parse(body.expiresAt))) throw new HttpError(400, 'validation', 'expiresAt must be an ISO 8601 timestamp.');
    expiresAt = new Date(Date.parse(body.expiresAt)).toISOString();
  }
  const secret = kind === 'link' ? newLinkToken() : newFallbackCode();
  const digest = await credentialDigest(cfg.secrets.credentialPepper, secret);
  const id = newId('cred');
  const now = nowIso();
  await batch(db, [
    stmt(db, 'INSERT INTO access_credential (id, household_id, kind, digest, label, issued_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, householdId, kind, digest, label, admin.email, now, expiresAt),
    audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: 'credential.issue', householdId, targetType: 'access_credential', targetId: id, details: { kind, expiresAt } }),
  ]);
  const out = { id, householdId, kind, label, expiresAt, createdAt: now, secret };
  if (kind === 'link') out.link = `${cfg.siteRsvpUrl}#t=${secret}`;
  return out;
}

export async function revokeCredential(db, credentialId, admin) {
  const cred = await one(db, 'SELECT id, household_id, revoked_at FROM access_credential WHERE id = ?', credentialId);
  if (!cred) throw new HttpError(404, 'not_found', 'Unknown credential.');
  const now = nowIso();
  await batch(db, [
    stmt(db, 'UPDATE access_credential SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ?', now, credentialId),
    stmt(db, 'UPDATE session SET revoked_at = COALESCE(revoked_at, ?) WHERE credential_id = ?', now, credentialId),
    audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: 'credential.revoke', householdId: cred.household_id, targetType: 'access_credential', targetId: credentialId }),
  ]);
  return { id: credentialId, revokedAt: cred.revoked_at || now };
}

export async function setHouseholdState(db, householdId, state, admin) {
  const household = await one(db, 'SELECT id FROM household WHERE id = ?', householdId);
  if (!household) throw new HttpError(404, 'not_found', 'Unknown household.');
  const now = nowIso();
  const statements = [
    stmt(db, 'UPDATE household SET state = ?, updated_at = ? WHERE id = ?', state, now, householdId),
    audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: state === 'revoked' ? 'household.revoke' : 'household.reinstate', householdId, targetType: 'household', targetId: householdId, fields: ['state'] }),
  ];
  if (state === 'revoked') {
    statements.push(stmt(db, 'UPDATE access_credential SET revoked_at = COALESCE(revoked_at, ?) WHERE household_id = ?', now, householdId));
    statements.push(stmt(db, 'UPDATE session SET revoked_at = COALESCE(revoked_at, ?) WHERE household_id = ?', now, householdId));
  }
  await batch(db, statements);
  return { id: householdId, state };
}

export async function listCredentials(db, householdId) {
  return all(db, 'SELECT id, kind, label, issued_by, created_at, expires_at, revoked_at, last_used_at FROM access_credential WHERE household_id = ? ORDER BY created_at DESC', householdId);
}
