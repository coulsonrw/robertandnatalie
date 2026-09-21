// Mail outbox worker (ARCH-03, RSVP-07). Runs from the cron trigger and from the owner-only
// POST /admin/mail/process. Sends queued rows with exponential backoff; abandons a row after
// MAIL_MAX_ATTEMPTS or once it is older than MAIL_MAX_AGE_HOURS, and raises a coordinator alert
// (a coordinator_alert row, plus an email when COORDINATOR_EMAIL is set).

import { all, one, stmt, batch, audit, nowIso } from '../db.js';
import { newId } from '../crypto.js';
import { providerFor } from './provider.js';
import { coordinatorAlertMail } from './templates.js';
import { redact } from '../log.js';

function backoffMs(attempts) {
  return Math.min(5 * 60_000 * 2 ** Math.max(0, attempts - 1), 6 * 3600_000);
}

export async function raiseAlert(db, cfg, { kind, subject, details }) {
  const now = nowIso();
  const id = newId('al');
  const statements = [
    stmt(db, 'INSERT INTO coordinator_alert (id, kind, subject, details_json, created_at) VALUES (?, ?, ?, ?, ?)', id, kind, subject, JSON.stringify(details || {}), now),
    audit(db, { at: now, actorKind: 'system', actorId: 'outbox', action: 'alert.raise', targetType: 'coordinator_alert', targetId: id, details: { kind } }),
  ];
  if (cfg.mail.coordinatorEmail) {
    const mail = coordinatorAlertMail(cfg, { kind, subject, created_at: now });
    statements.push(stmt(
      db,
      `INSERT INTO mail_outbox (id, household_id, kind, to_email, subject, body_text, dedupe_key, state, attempts, next_attempt_at, created_at)
       VALUES (?, NULL, 'coordinator-alert', ?, ?, ?, ?, 'queued', 0, ?, ?)`,
      newId('m'), cfg.mail.coordinatorEmail, mail.subject, mail.text, `alert:${id}`, now, now,
    ));
  }
  await batch(db, statements);
  return id;
}

export async function processOutbox(env, cfg, { provider, limit = 25 } = {}) {
  const db = env.DB;
  const mailer = providerFor(cfg, provider);
  const now = nowIso();
  const due = await all(db, `SELECT * FROM mail_outbox WHERE state = 'queued' AND next_attempt_at <= ? ORDER BY next_attempt_at LIMIT ?`, now, limit);
  const result = { attempted: 0, sent: 0, failed: 0, abandoned: 0 };

  for (const row of due) {
    result.attempted += 1;
    const attempts = row.attempts + 1;
    try {
      const { messageId } = await mailer.send({ from: cfg.mail.from, to: row.to_email, subject: row.subject, text: row.body_text });
      await batch(db, [
        stmt(db, `UPDATE mail_outbox SET state = 'sent', attempts = ?, sent_at = ?, provider_message_id = ?, last_error = NULL WHERE id = ? AND state = 'queued'`, attempts, nowIso(), messageId || null, row.id),
        audit(db, { actorKind: 'system', actorId: 'outbox', action: 'mail.sent', householdId: row.household_id, targetType: 'mail_outbox', targetId: row.id, details: { kind: row.kind, attempts, provider: mailer.name } }),
      ]);
      result.sent += 1;
    } catch (err) {
      const tooOld = Date.now() - Date.parse(row.created_at) > cfg.mail.maxAgeMs;
      const exhausted = attempts >= cfg.mail.maxAttempts;
      const error = redact(err && err.message ? err.message : String(err)).slice(0, 200);
      if (tooOld || exhausted) {
        await batch(db, [
          stmt(db, `UPDATE mail_outbox SET state = 'abandoned', attempts = ?, last_error = ? WHERE id = ?`, attempts, error, row.id),
          audit(db, { actorKind: 'system', actorId: 'outbox', action: 'mail.abandoned', householdId: row.household_id, targetType: 'mail_outbox', targetId: row.id, details: { kind: row.kind, attempts, reason: tooOld ? 'max-age' : 'max-attempts' } }),
        ]);
        result.abandoned += 1;
        // Alert mail failures must not create further alert mail (no loops).
        if (row.kind !== 'coordinator-alert') {
          await raiseAlert(db, cfg, { kind: 'mail-abandoned', subject: 'A confirmation email could not be delivered', details: { outboxId: row.id, householdId: row.household_id, attempts } });
        }
      } else {
        await batch(db, [
          stmt(db, `UPDATE mail_outbox SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`, attempts, new Date(Date.now() + backoffMs(attempts)).toISOString(), error, row.id),
        ]);
        result.failed += 1;
      }
    }
  }
  return result;
}

export async function outboxSummary(db) {
  const rows = await all(db, `SELECT state, COUNT(*) AS n FROM mail_outbox GROUP BY state`);
  const oldestQueued = await one(db, `SELECT MIN(created_at) AS at FROM mail_outbox WHERE state = 'queued'`);
  const summary = { queued: 0, sent: 0, abandoned: 0, oldestQueuedAt: oldestQueued ? oldestQueued.at : null };
  for (const r of rows) summary[r.state] = r.n;
  return summary;
}
