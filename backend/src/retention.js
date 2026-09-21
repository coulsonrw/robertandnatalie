// Retention (SEC-06): N days after the wedding (RETENTION_DAYS_AFTER_WEDDING, mirrored from
// content/site.config.json privacy.retentionDaysAfterWedding) delete guest response and contact
// data and restricted notes from the live system. Idempotent, so it can be re-run after a
// restore ("reapply deletion rules after restores"). Keeps: household/guest ids and labels,
// events, content versions, audit events (which carry no personal data) and the retention record.

import { one, stmt, batch, audit, nowIso } from './db.js';
import { raiseAlert } from './mail/outbox.js';

export function retentionDueAt(cfg) {
  const d = new Date(`${cfg.weddingDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + cfg.retentionDaysAfterWedding + 1); // the day after N full days
  return d.toISOString();
}

export async function applyRetention(env, cfg, { force = false, actor = { kind: 'system', id: 'retention' } } = {}) {
  const db = env.DB;
  const dueAt = retentionDueAt(cfg);
  const now = nowIso();
  if (!force && now < dueAt) return { applied: false, dueAt };

  const before = {
    responses: (await one(db, 'SELECT COUNT(*) AS n FROM response'))?.n ?? 0,
    notes: (await one(db, 'SELECT COUNT(*) AS n FROM restricted_guest_needs'))?.n ?? 0,
    contacts: (await one(db, 'SELECT COUNT(*) AS n FROM household WHERE contact_email IS NOT NULL'))?.n ?? 0,
    plusOneNames: (await one(db, 'SELECT COUNT(*) AS n FROM guest WHERE plus_one_name IS NOT NULL'))?.n ?? 0,
  };
  const alreadyClean = !before.responses && !before.notes && !before.contacts && !before.plusOneNames;

  await batch(db, [
    stmt(db, 'DELETE FROM restricted_guest_needs'),
    stmt(db, 'DELETE FROM response_history'),
    stmt(db, 'DELETE FROM response'),
    stmt(db, 'DELETE FROM idempotency_record'),
    stmt(db, 'DELETE FROM mail_outbox'),
    stmt(db, 'DELETE FROM session'),
    stmt(db, 'UPDATE access_credential SET revoked_at = COALESCE(revoked_at, ?)', now),
    stmt(db, 'UPDATE guest SET plus_one_name = NULL, updated_at = ? WHERE plus_one_name IS NOT NULL', now),
    stmt(db, 'UPDATE household SET contact_email = NULL, updated_at = ? WHERE contact_email IS NOT NULL', now),
    stmt(db, 'UPDATE household_response SET first_submitted_at = NULL, last_submitted_at = NULL, last_origin = NULL, last_email_queued = 0'),
    audit(db, { at: now, actorKind: actor.kind, actorId: actor.id, action: 'retention.apply', details: { dueAt, forced: force, deleted: before } }),
  ]);

  if (!alreadyClean) {
    await raiseAlert(db, cfg, { kind: 'retention-applied', subject: 'Guest response data was deleted under the retention rule', details: { dueAt, deleted: before } });
  }
  return { applied: true, dueAt, deleted: before };
}
