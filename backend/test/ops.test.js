import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF, createExecutionContext, createScheduledController, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index.js';
import { readConfig } from '../src/config.js';
import { processOutbox } from '../src/mail/outbox.js';
import { applyRetention } from '../src/retention.js';
import { BASE, OWNER, COORDINATOR, admin, guest, freshSession, fullAnswer, count } from './helpers.js';

describe('mail outbox worker (RSVP-07, ARCH-03, AT-11)', () => {
  let s;
  beforeEach(async () => {
    s = await freshSession();
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
  });

  it('the cron handler sends queued confirmation mail through the provider', async () => {
    const ctx = createExecutionContext();
    const result = await worker.scheduled(createScheduledController({ cron: '*/5 * * * *' }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(result.mail).toEqual({ attempted: 1, sent: 1, failed: 0, abandoned: 0 });
    expect(result.retention.applied).toBe(false);
    const row = await env.DB.prepare('SELECT state, attempts, provider_message_id FROM mail_outbox').first();
    expect(row).toMatchObject({ state: 'sent', attempts: 1 });
    expect(row.provider_message_id).toMatch(/^stub-/);
    const second = await processOutbox(env, readConfig(env));
    expect(second.attempted).toBe(0);
  });

  it('retries with backoff, then abandons after MAIL_MAX_ATTEMPTS and raises a coordinator alert', async () => {
    const failing = { name: 'failing', async send() { throw new Error('provider down: token=abcdefghijklmnopqrstuvwxyz0123456789 to bob@example.invalid'); } };
    const cfg = readConfig(env);
    const r1 = await processOutbox(env, cfg, { provider: failing });
    expect(r1).toEqual({ attempted: 1, sent: 0, failed: 1, abandoned: 0 });
    let row = await env.DB.prepare('SELECT state, attempts, next_attempt_at, last_error FROM mail_outbox').first();
    expect(row.state).toBe('queued');
    expect(Date.parse(row.next_attempt_at)).toBeGreaterThan(Date.now() + 4 * 60_000);
    expect(row.last_error).not.toContain('abcdefghijklmnopqrstuvwxyz0123456789');
    expect(row.last_error).not.toContain('bob@example.invalid');
    // Force the row due again and exhaust attempts (MAIL_MAX_ATTEMPTS = 3 in vitest.config).
    for (let i = 0; i < 2; i++) {
      await env.DB.prepare("UPDATE mail_outbox SET next_attempt_at = '2000-01-01T00:00:00.000Z' WHERE kind = 'confirmation'").run();
      await processOutbox(env, cfg, { provider: failing });
    }
    row = await env.DB.prepare("SELECT state, attempts FROM mail_outbox WHERE kind = 'confirmation'").first();
    expect(row).toEqual({ state: 'abandoned', attempts: 3 });
    const alerts = (await (await admin(COORDINATOR, 'GET', '/admin/alerts')).json()).alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe('mail-abandoned');
    expect(alerts[0].details.householdId).toBe('hh_example');
    // The alert itself is emailed to the coordinator (a second outbox row), and the guest's saved RSVP is untouched.
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'coordinator-alert' AND state = 'queued'")).toBe(1);
    const session = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(session.revision).toBe(1);
    const ack = await admin(COORDINATOR, 'POST', `/admin/alerts/${alerts[0].id}/ack`, { body: {} });
    expect(ack.status).toBe(200);
    // A failing alert mail is abandoned without raising another alert (no loop).
    await env.DB.prepare("UPDATE mail_outbox SET next_attempt_at = '2000-01-01T00:00:00.000Z', attempts = 2 WHERE kind = 'coordinator-alert'").run();
    await processOutbox(env, cfg, { provider: failing });
    expect(await count('SELECT COUNT(*) AS n FROM coordinator_alert')).toBe(1);
  });

  it('abandons mail older than MAIL_MAX_AGE_HOURS on the next failure', async () => {
    const failing = { name: 'failing', async send() { throw new Error('nope'); } };
    await env.DB.prepare("UPDATE mail_outbox SET created_at = '2020-01-01T00:00:00.000Z'").run();
    const r = await processOutbox(env, readConfig(env), { provider: failing });
    expect(r.abandoned).toBe(1);
  });

  it('the coordinator can see the outbox and an owner can run it by hand', async () => {
    const view = await (await admin(COORDINATOR, 'GET', '/admin/outbox?state=queued')).json();
    expect(view.summary.queued).toBe(1);
    expect(view.rows[0].kind).toBe('confirmation');
    expect(view.rows[0].body_text).toBeUndefined();
    const run = await admin(OWNER, 'POST', '/admin/mail/process', { body: {} });
    expect(run.status).toBe(200);
    expect((await run.json()).sent).toBe(1);
  });
});

describe('retention (SEC-06)', () => {
  it('deletes response, contact and restricted data when due, is idempotent and audited', async () => {
    const s = await freshSession();
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
    const cfg = readConfig(env);
    const notYet = await applyRetention(env, cfg);
    expect(notYet.applied).toBe(false);
    expect(notYet.dueAt).toBe('2027-03-20T00:00:00.000Z'); // 2026-12-19 + 90 days + 1
    const run = await admin(OWNER, 'POST', '/admin/retention/run', { body: { force: true } });
    expect(run.status).toBe(200);
    const result = await run.json();
    expect(result.applied).toBe(true);
    expect(result.deleted).toEqual({ responses: 15, notes: 1, contacts: 1, plusOneNames: 1 });
    expect(await count('SELECT COUNT(*) AS n FROM response')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM restricted_guest_needs')).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'confirmation'")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'coordinator-alert'")).toBe(1); // the alert about the deletion
    expect(await count('SELECT COUNT(*) AS n FROM household WHERE contact_email IS NOT NULL')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM guest WHERE plus_one_name IS NOT NULL')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM household')).toBe(3); // structure kept
    expect(await count("SELECT COUNT(*) AS n FROM audit_event WHERE action = 'retention.apply'")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM coordinator_alert WHERE kind = 'retention-applied'")).toBe(1);
    // Sessions and credentials are gone/revoked; the guest is signed out.
    expect((await guest(s.cookie, 'GET', '/session')).status).toBe(401);
    // Second run: nothing to delete, no second alert.
    const again = await (await admin(OWNER, 'POST', '/admin/retention/run', { body: { force: true } })).json();
    expect(again.deleted).toEqual({ responses: 0, notes: 0, contacts: 0, plusOneNames: 0 });
    expect(await count("SELECT COUNT(*) AS n FROM coordinator_alert WHERE kind = 'retention-applied'")).toBe(1);
  });
});

describe('content versions (ADMIN-04, OPS-02)', () => {
  beforeEach(async () => { await freshSession(); });

  it('publishes the urgent banner with history, rollback and a public cacheable read', async () => {
    const empty = await SELF.fetch(`${BASE}/content/urgent-banner`);
    expect(empty.status).toBe(200);
    expect((await empty.json()).body).toBeNull();
    const v1 = await admin(OWNER, 'PUT', '/admin/content/urgent-banner', { body: { body: { active: true, message: 'Chapel parking has moved to the north lot.', linkUrl: 'https://robertandnatalie.wedding/#wedding-day', linkLabel: 'Directions' }, note: 'Coordinator call' } });
    expect(v1.status).toBe(200);
    expect((await v1.json()).version).toBe(1);
    const invalid = await admin(OWNER, 'PUT', '/admin/content/urgent-banner', { body: { body: { active: true, message: '' } } });
    expect(invalid.status).toBe(400);
    const v2 = await admin(OWNER, 'PUT', '/admin/content/urgent-banner', { body: { body: { active: false, message: null, linkUrl: null, linkLabel: null } } });
    expect((await v2.json()).version).toBe(2);
    const pub = await SELF.fetch(`${BASE}/content/urgent-banner`, { headers: { Origin: 'https://robertandnatalie.wedding' } });
    expect(pub.headers.get('Cache-Control')).toBe('public, max-age=60');
    expect((await pub.json()).body.active).toBe(false);
    const rb = await admin(OWNER, 'POST', '/admin/content/urgent-banner/rollback', { body: { version: 1 } });
    expect(rb.status).toBe(200);
    const rolled = await rb.json();
    expect(rolled.version).toBe(3);
    expect(rolled.body.message).toBe('Chapel parking has moved to the north lot.');
    const hist = await (await admin(COORDINATOR, 'GET', '/admin/content/urgent-banner')).json();
    expect(hist.history.map((h) => h.version)).toEqual([3, 2, 1]);
    expect(hist.history[0].current).toBe(true);
    const coordinatorWrite = await admin(COORDINATOR, 'PUT', '/admin/content/urgent-banner', { body: { body: { active: false } } });
    expect(coordinatorWrite.status).toBe(403);
    expect(await count("SELECT COUNT(*) AS n FROM audit_event WHERE action IN ('content.publish', 'content.rollback')")).toBe(3);
  });

  it('closing editing through rsvp-settings makes the guest window closed even without a cutoff', async () => {
    const set = await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: null, open: false }, note: 'after the wedding' } });
    expect(set.status).toBe(200);
    const status = await (await admin(COORDINATOR, 'GET', '/admin/status')).json();
    expect(status.rsvp).toEqual({ open: false, cutoffAt: null });
    expect(status.retention.days).toBe(90);
    expect(status.events.map((e) => e.id)).toEqual(['ceremony', 'reception']);
  });
});
