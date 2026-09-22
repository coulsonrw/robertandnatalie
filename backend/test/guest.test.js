import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { BASE, OWNER, admin, resetDb, seedEvents, importRoster, issue, openSession, guest, freshSession, fullAnswer, count } from './helpers.js';

describe('session (RSVP-01, SEC-02, SEC-03)', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); await importRoster(); });

  it('an invalid code is refused neutrally with 403 invalid_code and no hint', async () => {
    const { res } = await openSession('NOPE-NOPE-NOPE');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_code');
    expect(JSON.stringify(body)).not.toMatch(/Example|Sample|hh_/);
    expect(res.headers.get('Set-Cookie')).toBeNull();
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('a revoked credential and a revoked household look identical to an unknown code', async () => {
    const cred = await issue('hh_example', 'code');
    await admin(OWNER, 'POST', `/admin/credentials/${cred.id}/revoke`, { body: {} });
    const a = await openSession(cred.secret);
    expect(a.res.status).toBe(403);
    const cred2 = await issue('hh_solo', 'code');
    await admin(OWNER, 'POST', '/admin/households/hh_solo/revoke', { body: {} });
    const b = await openSession(cred2.secret);
    expect(b.res.status).toBe(403);
    expect(await a.res.json()).toEqual(await b.res.json());
  });

  it('a valid code opens a session, sets a hardened cookie and returns only that household', async () => {
    const cred = await issue('hh_example', 'code');
    const { res, snapshot } = await openSession(cred.secret);
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/^rn_session=[A-Za-z0-9_-]{40,}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=\d+$/);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://robertandnatalie.wedding');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(snapshot.household.id).toBe('hh_example');
    expect(snapshot.household.guests.map((g) => g.id)).toEqual(['g_alex', 'g_sam', 'g_alex_guest', 'g_jordan']);
    expect(snapshot.entitlements).toHaveLength(7);
    expect(snapshot.responses.every((r) => r.status === 'pending')).toBe(true);
    expect(snapshot.revision).toBe(0);
    expect(snapshot.reference).toBeNull();
    expect(snapshot.rsvp.open).toBe(true);
    // Only the digest is stored.
    const row = await env.DB.prepare('SELECT digest FROM access_credential WHERE id = ?').bind(cred.id).first();
    expect(row.digest).not.toContain(cred.secret.replace(/-/g, ''));
    expect(row.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('a link token works, is at least 128 bits, and a GET never consumes it', async () => {
    const cred = await issue('hh_example', 'link');
    expect(cred.secret.length).toBeGreaterThanOrEqual(22); // 256-bit base64url = 43 chars
    expect(cred.link).toBe(`https://robertandnatalie.wedding/rsvp.html#t=${cred.secret}`);
    // Link preview style GETs carry no cookie and must not open or touch anything.
    const preview = await SELF.fetch(`${BASE}/session?code=${cred.secret}`);
    expect(preview.status).toBe(401);
    expect(await count('SELECT COUNT(*) AS n FROM session')).toBe(0);
    const used = await env.DB.prepare('SELECT last_used_at FROM access_credential WHERE id = ?').bind(cred.id).first();
    expect(used.last_used_at).toBeNull();
    const { res } = await openSession(cred.secret);
    expect(res.status).toBe(200);
  });

  it('rate limits repeated bad codes per IP', async () => {
    let last;
    for (let i = 0; i < 25; i++) last = await openSession(`BAD${i}`, { 'CF-Connecting-IP': '203.0.113.9' });
    expect(last.res.status).toBe(429);
    expect((await last.res.json()).error.code).toBe('rate_limited');
  });

  it('rejects a cross-site origin on state-changing requests', async () => {
    const res = await SELF.fetch(`${BASE}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{"code":"x"}' });
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('DELETE /session ends the session and clears the cookie', async () => {
    const cred = await issue('hh_example', 'code');
    const { cookie } = await openSession(cred.secret);
    const del = await guest(cookie, 'DELETE', '/session');
    expect(del.status).toBe(204);
    expect(del.headers.get('Set-Cookie')).toMatch(/Max-Age=0/);
    const after = await guest(cookie, 'GET', '/session');
    expect(after.status).toBe(401);
  });
});

describe('PUT /response (RSVP-02..07, ARCH-03)', () => {
  let s;
  beforeEach(async () => { s = await freshSession(); });

  it('rejects a cross-household guest id even with a valid session (AT-05)', async () => {
    const payload = fullAnswer(s.snapshot);
    payload.responses.push({ guestId: 'g_taylor', eventId: 'ceremony', status: 'attending' });
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation');
    expect(JSON.stringify(body)).not.toMatch(/g_taylor|Taylor/);
    expect(await count("SELECT COUNT(*) AS n FROM response WHERE status != 'pending'")).toBe(0);
  });

  it('rejects an uninvited event for an invited guest (AT-07)', async () => {
    const payload = fullAnswer(s.snapshot);
    payload.responses.push({ guestId: 'g_jordan', eventId: 'ceremony', status: 'attending' });
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(400);
  });

  it('rejects a plus-one name for a named guest and any unknown guest id', async () => {
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { plusOneNames: { g_alex_guest: 'Casey Example', g_sam: 'Someone Else' } }));
    expect(res.status).toBe(400);
    const res2 = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { plusOneNames: { g_alex_guest: 'Casey Example', g_nobody: 'X' } }));
    expect(res2.status).toBe(400);
  });

  it('rejects a household response with an unanswered pair (RSVP-04)', async () => {
    const payload = fullAnswer(s.snapshot);
    payload.responses = payload.responses.filter((r) => !(r.guestId === 'g_jordan'));
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('validation');
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(0);
  });

  it('rejects "maybe" and duplicate answers', async () => {
    const p = fullAnswer(s.snapshot);
    p.responses[0].status = 'maybe';
    expect((await guest(s.cookie, 'PUT', '/response', p)).status).toBe(400);
    const q = fullAnswer(s.snapshot);
    q.responses.push({ ...q.responses[0] });
    expect((await guest(s.cookie, 'PUT', '/response', q)).status).toBe(400);
  });

  it('rejects an attending plus-one without a name, accepts it with one (RSVP-02)', async () => {
    const bad = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { plusOneNames: {} }));
    expect(bad.status).toBe(400);
    const good = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot));
    expect(good.status).toBe(200);
    const snap = await good.json();
    expect(snap.household.guests.find((g) => g.id === 'g_alex_guest').name).toBe('Casey Example');
  });

  it('a plus-one that declines needs no name, and a declining household needs no email (RSVP-03, AT-08)', async () => {
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'declining'));
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.responses.every((r) => r.status === 'declining')).toBe(true);
    expect(snap.reference).toMatch(/^RN-[A-Z2-9]{8}$/);
    expect(snap.emailQueued).toBe(false);
    expect(snap.household.guests.find((g) => g.id === 'g_alex_guest').name).toBeNull();
    expect(await count('SELECT COUNT(*) AS n FROM mail_outbox')).toBe(0);
  });

  it('saves atomically: revision, reference, outbox row and audit event in one commit (ARCH-03)', async () => {
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot));
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.revision).toBe(1);
    expect(snap.reference).toMatch(/^RN-/);
    expect(snap.submittedAt).toBeTruthy();
    expect(snap.emailQueued).toBe(true);
    expect(snap.notes).toBe('Vegetarian, please.');
    expect(snap.household.contactEmail).toBe('alex@example.invalid');
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'confirmation' AND state = 'queued'")).toBe(1);
    const mail = await env.DB.prepare('SELECT body_text, to_email FROM mail_outbox').first();
    expect(mail.to_email).toBe('alex@example.invalid');
    expect(mail.body_text).toContain('Saturday, December 19, 2026');
    expect(mail.body_text).toContain('Casey Example');
    expect(mail.body_text).not.toContain('Vegetarian'); // SEC-05
    const audit = await env.DB.prepare("SELECT * FROM audit_event WHERE action = 'response.save'").first();
    expect(audit.household_id).toBe('hh_example');
    expect(JSON.parse(audit.fields_json)).toContain('notes');
    expect(audit.details_json).not.toContain('Vegetarian');
    expect(audit.details_json).not.toContain('alex@example.invalid');
    expect(await count('SELECT COUNT(*) AS n FROM restricted_guest_needs')).toBe(1);
    // A resumed session sees the same saved state.
    const again = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(again.revision).toBe(1);
    expect(again.reference).toBe(snap.reference);
  });

  it('an idempotent retry returns the same result without a second write (RSVP-05, AT-09)', async () => {
    const payload = fullAnswer(s.snapshot);
    const first = await guest(s.cookie, 'PUT', '/response', payload);
    expect(first.status).toBe(200);
    const a = await first.json();
    const audits = await count('SELECT COUNT(*) AS n FROM audit_event');
    const second = await guest(s.cookie, 'PUT', '/response', payload); // same requestId, same stale revision 0
    expect(second.status).toBe(200);
    const b = await second.json();
    expect(b).toEqual(a);
    expect(a.revision).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM mail_outbox')).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM audit_event')).toBe(audits);
  });

  it('a stale revision gets 409 with the latest snapshot (RSVP-05, AT-10)', async () => {
    const deviceA = fullAnswer(s.snapshot);
    expect((await guest(s.cookie, 'PUT', '/response', deviceA)).status).toBe(200);
    const deviceB = fullAnswer(s.snapshot, 'declining'); // still revision 0
    const res = await guest(s.cookie, 'PUT', '/response', deviceB);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('conflict');
    expect(body.latest.revision).toBe(1);
    expect(body.latest.responses.every((r) => r.status === 'attending')).toBe(true);
    // Retrying with the latest revision succeeds and increments.
    const retry = await guest(s.cookie, 'PUT', '/response', { ...deviceB, revision: body.latest.revision });
    expect(retry.status).toBe(200);
    expect((await retry.json()).revision).toBe(2);
  });

  it('a concurrent pair of saves at the same revision commits exactly one (revision guard)', async () => {
    const [a, b] = await Promise.all([
      guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot)),
      guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'declining')),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(1);
  });

  it('returns 423 closed after the cutoff, while owner corrections stay possible (RSVP-04, AT-12)', async () => {
    const set = await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2026-01-01T23:59:59-06:00', open: true }, note: 'test cutoff' } });
    expect(set.status).toBe(200);
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot));
    expect(res.status).toBe(423);
    expect((await res.json()).error.code).toBe('closed');
    const session = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(session.rsvp.open).toBe(false);
    expect(session.rsvp.cutoffAt).toBe('2026-01-01T23:59:59-06:00');
    // Owner correction after cutoff is audited and bumps the revision.
    const fix = await admin(OWNER, 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'owner-correction', reason: 'Guest telephoned', responses: [{ guestId: 'g_jordan', eventId: 'reception', status: 'declining' }] },
    });
    expect(fix.status).toBe(200);
    const fixed = await fix.json();
    expect(fixed.revision).toBe(1);
    expect(fixed.responses.find((r) => r.guestId === 'g_jordan').status).toBe('declining');
    expect(fixed.notes).toBeUndefined();
    const audit = await env.DB.prepare("SELECT * FROM audit_event WHERE action = 'response.correct'").first();
    expect(audit.actor_id).toBe(OWNER);
    expect(JSON.parse(audit.details_json).statusChanges['g_jordan|reception']).toEqual({ from: 'pending', to: 'declining' });
    expect(await count('SELECT COUNT(*) AS n FROM response_history')).toBe(1);
    // Re-opening: a future cutoff.
    await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2099-01-01T23:59:59-06:00', open: true } } });
    const reopened = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(reopened.rsvp.open).toBe(true);
  });

  it('a coordinator can record a phone response but cannot make an owner correction', async () => {
    const ok = await admin('coordinator@example.invalid', 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'coordinator-phone', reason: 'Called on 1 Oct', responses: [{ guestId: 'g_alex', eventId: 'ceremony', status: 'attending' }], contactEmail: 'alex@example.invalid' },
    });
    expect(ok.status).toBe(200);
    const no = await admin('coordinator@example.invalid', 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'owner-correction', reason: 'x', responses: [] },
    });
    expect(no.status).toBe(400);
  });

  it('an admin correction that omits contactEmail keeps the stored address; an explicit empty value clears it (RSVP-04)', async () => {
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
    const fix = await admin(OWNER, 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'owner-correction', reason: 'Guest telephoned', responses: [{ guestId: 'g_jordan', eventId: 'reception', status: 'declining' }] },
    });
    expect(fix.status).toBe(200);
    expect((await fix.json()).household.contactEmail).toBe('alex@example.invalid');
    const row = await env.DB.prepare("SELECT contact_email FROM household WHERE id = 'hh_example'").first();
    expect(row.contact_email).toBe('alex@example.invalid');
    const clear = await admin(OWNER, 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'owner-correction', reason: 'Guest asked for no email', responses: [], contactEmail: '' },
    });
    expect(clear.status).toBe(200);
    expect((await clear.json()).household.contactEmail).toBe('');
  });

  it('requires a session and rejects malformed bodies', async () => {
    const noCookie = await SELF.fetch(`${BASE}/response`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(noCookie.status).toBe(401);
    const notJson = await SELF.fetch(`${BASE}/response`, { method: 'PUT', headers: { Cookie: s.cookie, 'Content-Type': 'text/plain' }, body: 'x' });
    expect(notJson.status).toBe(400);
    const noRequestId = await guest(s.cookie, 'PUT', '/response', { ...fullAnswer(s.snapshot), requestId: undefined });
    expect(noRequestId.status).toBe(400);
  });

  it('every guest response carries the security headers and no-store', async () => {
    const res = await guest(s.cookie, 'GET', '/session');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    const pre = await SELF.fetch(`${BASE}/response`, { method: 'OPTIONS', headers: { Origin: 'https://robertandnatalie.wedding', 'Access-Control-Request-Method': 'PUT' } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
    const preEvil = await SELF.fetch(`${BASE}/response`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
    expect(preEvil.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
