// Acceptance scenarios from the external audit (QA-10..QA-22, docs/audit/BACKEND_QA_MATRIX.md)
// that the other suites did not cover explicitly. Synthetic guests only (DATA-03).
import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { readConfig } from '../src/config.js';
import { applyRetention } from '../src/retention.js';
import { rsvpWindow } from '../src/snapshot.js';
import { parseCsv } from '../src/csv.js';
import { BASE, OWNER, COORDINATOR, admin, resetDb, seedEvents, importRoster, issue, openSession, guest, freshSession, fullAnswer, count } from './helpers.js';

const MEALS = ['Gulf fish', 'Roast chicken', 'Vegetarian'];

async function configureMeals() {
  const config = JSON.parse(env.TEST_SITE_CONFIG);
  config.rsvp = { mealChoices: { eventId: 'reception', options: MEALS } };
  const res = await admin(OWNER, 'PUT', '/admin/events', { body: config });
  if (res.status !== 200) throw new Error(`meal config failed: ${res.status}`);
}

describe('QA-11 invalid, revoked, expired credentials', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); await importRoster(); });

  it('an expired credential is refused with the same body as an unknown code; a reissued one works', async () => {
    const issued = await admin(OWNER, 'POST', '/admin/households/hh_example/credentials', { body: { kind: 'code', expiresAt: '2020-01-01T00:00:00Z' } });
    expect(issued.status).toBe(201);
    const cred = await issued.json();
    const expired = await openSession(cred.secret);
    expect(expired.res.status).toBe(403);
    const unknown = await openSession('ZZZZ-ZZZZ-ZZZZ');
    expect(await expired.res.json()).toEqual(await unknown.res.json());
    expect(expired.res.headers.get('Set-Cookie')).toBeNull();
    expect(await count('SELECT COUNT(*) AS n FROM session')).toBe(0);
    const fresh = await issue('hh_example', 'code');
    expect((await openSession(fresh.secret)).res.status).toBe(200);
    expect((await openSession(cred.secret)).res.status).toBe(403);
  });

  it('rate limits repeated attempts on one code even from different IPs (per-code bucket)', async () => {
    let last;
    for (let i = 0; i < 11; i++) last = await openSession('GUES-SGUE-SSGU', { 'CF-Connecting-IP': `203.0.113.${i + 1}` });
    expect(last.res.status).toBe(429);
    expect((await last.res.json()).error.code).toBe('rate_limited');
    const other = await openSession('OTHE-ROTH-EROT', { 'CF-Connecting-IP': '203.0.113.200' });
    expect(other.res.status).toBe(403); // a different code from a fresh IP is judged on its own
  });

  it('revoking a link credential ends its open session at once', async () => {
    const cred = await issue('hh_example', 'link');
    const { cookie, snapshot } = await openSession(cred.secret);
    expect((await admin(OWNER, 'POST', `/admin/credentials/${cred.id}/revoke`, { body: {} })).status).toBe(200);
    expect((await guest(cookie, 'GET', '/session')).status).toBe(401);
    expect((await guest(cookie, 'PUT', '/response', fullAnswer(snapshot))).status).toBe(401);
    expect((await openSession(cred.secret)).res.status).toBe(403);
  });
});

describe('QA-13 plus-one and children policy', () => {
  it('extra guests and children cannot be added; only the approved slot takes a name; no capacity expansion', async () => {
    const s = await freshSession();
    const extra = fullAnswer(s.snapshot);
    extra.responses.push({ guestId: 'g_extra_child', eventId: 'reception', status: 'attending' });
    expect((await guest(s.cookie, 'PUT', '/response', extra)).status).toBe(400);
    const namedSlot = fullAnswer(s.snapshot, 'attending', { plusOneNames: { g_alex_guest: 'Casey Example', g_jordan: 'Jordan Plus One' } });
    expect((await guest(s.cookie, 'PUT', '/response', namedSlot)).status).toBe(400);
    // The family has children as named invitees and no plus-one slot at all.
    const fam = await issue('hh_family', 'code');
    const f = await openSession(fam.secret);
    expect(f.snapshot.household.guests.every((g) => g.kind === 'named')).toBe(true);
    const child = fullAnswer(f.snapshot, 'attending', { plusOneNames: { g_riley: 'Extra Child' }, contactEmail: 'morgan@example.invalid' });
    expect((await guest(f.cookie, 'PUT', '/response', child)).status).toBe(400);
    expect(await count('SELECT COUNT(*) AS n FROM guest')).toBe(8);
    expect(await count("SELECT COUNT(*) AS n FROM response WHERE status != 'pending'")).toBe(0);
  });
});

describe('QA-14 full decline', () => {
  it('saves declines without meals, notes or a plus-one name; a confirmation lists declines only', async () => {
    const s = await freshSession();
    await configureMeals(); // meals exist for the reception but must not be demanded of decliners
    const payload = fullAnswer(s.snapshot, 'declining', { contactEmail: 'alex@example.invalid', notes: 'Vegetarian, please.' });
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.responses.every((r) => r.status === 'declining')).toBe(true);
    expect(snap.responses.filter((r) => r.eventId === 'reception').every((r) => r.meal === null)).toBe(true);
    expect(snap.notes).toBe('');
    expect(await count('SELECT COUNT(*) AS n FROM restricted_guest_needs')).toBe(0);
    expect(snap.household.guests.find((g) => g.id === 'g_alex_guest').name).toBeNull();
    expect(snap.reference).toMatch(/^RN-/);
    expect(snap.emailQueued).toBe(true);
    const mail = await env.DB.prepare("SELECT body_text FROM mail_outbox WHERE kind = 'confirmation'").first();
    expect(mail.body_text).toContain('Declining:');
    expect(mail.body_text).not.toContain('Attending:');
    expect(mail.body_text).not.toContain('Vegetarian');
  });
});

describe('QA-15 field-level validation', () => {
  let s;
  beforeEach(async () => { s = await freshSession(); });

  it('returns every guest-fixable problem together, each with a path the client can announce', async () => {
    const payload = fullAnswer(s.snapshot, 'attending', { plusOneNames: {}, contactEmail: 'not-an-email' });
    payload.responses = payload.responses.filter((r) => r.guestId !== 'g_jordan');
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation');
    expect(body.error.fields).toHaveLength(3);
    expect(body.error.fields).toEqual(expect.arrayContaining([
      { path: 'responses.g_jordan.reception.status', message: 'Please choose attending or declining.' },
      { path: 'plusOneNames.g_alex_guest', message: 'Please enter the name of the guest who will attend.' },
      { path: 'contactEmail', message: 'Please enter a valid email address.' },
    ]));
    expect(body.error.message).toMatch(/^3 answers need attention/);
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(0);
  });

  it('a single problem is the message itself, and a foreign id never appears in a path', async () => {
    const one = await (await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { contactEmail: '' }))).json();
    expect(one.error.fields).toEqual([{ path: 'contactEmail', message: 'A contact email is needed so we can confirm your response.' }]);
    expect(one.error.message).toBe(one.error.fields[0].message);
    const foreign = fullAnswer(s.snapshot);
    foreign.responses.push({ guestId: 'g_taylor', eventId: 'ceremony', status: 'attending' });
    const denied = await (await guest(s.cookie, 'PUT', '/response', foreign)).json();
    expect(denied.error.fields).toEqual([{ path: 'responses', message: expect.any(String) }]);
    expect(JSON.stringify(denied)).not.toMatch(/g_taylor|Taylor/);
    const noRevision = await (await guest(s.cookie, 'PUT', '/response', { ...fullAnswer(s.snapshot), revision: 'x' })).json();
    expect(noRevision.error.fields).toEqual([{ path: 'revision', message: 'revision is required.' }]);
  });

  it('meal problems name the guest and event concerned', async () => {
    await configureMeals();
    const payload = fullAnswer(s.snapshot);
    payload.responses = payload.responses.map((r) => (r.guestId === 'g_alex' && r.eventId === 'reception' ? { ...r, meal: 'Lobster' } : r));
    const body = await (await guest(s.cookie, 'PUT', '/response', payload)).json();
    expect(body.error.fields).toEqual(expect.arrayContaining([
      { path: 'responses.g_alex.reception.meal', message: 'That meal choice is not one of the options.' },
      { path: 'responses.g_sam.reception.meal', message: 'Please choose a meal for this guest.' },
    ]));
    expect(body.error.fields.every((f) => /^responses\.g_[a-z_]+\.reception\.meal$/.test(f.path))).toBe(true);
  });
});

describe('QA-16 double-click and timed-out retry', () => {
  it('two simultaneous submissions with the same requestId commit once and both receive the same result', async () => {
    const s = await freshSession();
    const payload = fullAnswer(s.snapshot);
    const [a, b] = await Promise.all([guest(s.cookie, 'PUT', '/response', payload), guest(s.cookie, 'PUT', '/response', payload)]);
    expect([a.status, b.status]).toEqual([200, 200]);
    const [ja, jb] = [await a.json(), await b.json()];
    expect(ja).toEqual(jb);
    expect(ja.revision).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM mail_outbox')).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM idempotency_record')).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM audit_event WHERE action = 'response.save'")).toBe(1);
    // A retry long after the fact (the client kept its requestId) replays, even once responses have closed.
    await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: null, open: false } } });
    const late = await guest(s.cookie, 'PUT', '/response', payload);
    expect(late.status).toBe(200);
    expect((await late.json()).reference).toBe(ja.reference);
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(1);
  });
});

describe('QA-17 simultaneous edits and audited corrections', () => {
  it('a guest save after a coordinator phone correction is refused with 409; the correction carries its origin and no note text', async () => {
    const s = await freshSession();
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
    const fix = await admin(COORDINATOR, 'PUT', '/admin/households/hh_example/response', {
      body: { origin: 'coordinator-phone', reason: 'Sam called on 3 October', responses: [{ guestId: 'g_sam', eventId: 'ceremony', status: 'declining' }] },
    });
    expect(fix.status).toBe(200);
    const stale = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { revision: 1 }));
    expect(stale.status).toBe(409);
    const body = await stale.json();
    expect(body.error.code).toBe('conflict');
    expect(body.latest.revision).toBe(2);
    expect(body.latest.responses.find((r) => r.guestId === 'g_sam' && r.eventId === 'ceremony').status).toBe('declining');
    const row = await env.DB.prepare("SELECT r.origin FROM response r JOIN invitation_entitlement ie ON ie.id = r.entitlement_id WHERE ie.guest_id = 'g_sam' AND ie.event_id = 'ceremony'").first();
    expect(row.origin).toBe('coordinator-phone');
    const hist = await env.DB.prepare('SELECT origin, actor, previous_status, new_status FROM response_history ORDER BY id DESC LIMIT 1').first();
    expect(hist).toEqual({ origin: 'coordinator-phone', actor: COORDINATOR, previous_status: 'attending', new_status: 'declining' });
    const audit = await env.DB.prepare("SELECT actor_kind, actor_id, fields_json, details_json FROM audit_event WHERE action = 'response.correct'").first();
    expect(audit.actor_kind).toBe('coordinator');
    expect(audit.actor_id).toBe(COORDINATOR);
    expect(JSON.parse(audit.details_json).origin).toBe('coordinator-phone');
    expect(JSON.parse(audit.fields_json)).not.toContain('notes');
    expect(audit.details_json).not.toContain('Vegetarian');
    expect(await count("SELECT COUNT(*) AS n FROM restricted_guest_needs WHERE note = 'Vegetarian, please.'")).toBe(1);
  });
});

describe('QA-19 event-local cutoff', () => {
  it('a future cutoff allows saves; a past one refuses them with 423 closed and writes nothing', async () => {
    const s = await freshSession();
    expect((await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2099-11-20T23:59:59-06:00', open: true } } })).status).toBe(200);
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
    expect((await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2020-11-20T23:59:59-06:00', open: true } } })).status).toBe(200);
    const current = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(current.rsvp).toEqual({ open: false, cutoffAt: '2020-11-20T23:59:59-06:00' });
    const closed = await guest(s.cookie, 'PUT', '/response', fullAnswer(current, 'declining'));
    expect(closed.status).toBe(423);
    expect((await closed.json()).error.code).toBe('closed');
    expect(await count('SELECT COUNT(*) AS n FROM household_revision')).toBe(1);
  });

  it('the cutoff is read in its own offset, not the server clock', async () => {
    await resetDb();
    const cfg = { ...readConfig(env), rsvpCutoffAt: '2026-11-20T23:59:59-06:00' }; // = 2026-11-21T05:59:59Z
    expect((await rsvpWindow(env.DB, cfg, Date.parse('2026-11-21T05:59:00Z'))).open).toBe(true);
    expect((await rsvpWindow(env.DB, cfg, Date.parse('2026-11-21T06:00:00Z'))).open).toBe(false);
  });

  it('a cutoff without an explicit offset is refused by the editor, and a malformed configured cutoff fails closed', async () => {
    await resetDb();
    const bad = await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2026-11-20T23:59:59', open: true } } });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.message).toMatch(/explicit offset/);
    const cfg = { ...readConfig(env), rsvpCutoffAt: '20 November 2026' };
    expect(await rsvpWindow(env.DB, cfg)).toEqual({ open: false, cutoffAt: '20 November 2026', cutoffInvalid: true });
    const good = await admin(OWNER, 'PUT', '/admin/content/rsvp-settings', { body: { body: { cutoffAt: '2026-11-20T23:59:59-06:00', open: true } } });
    expect(good.status).toBe(200);
  });
});

describe('QA-20 household isolation and guessed ids', () => {
  it('a guest session cannot read, write or export through admin routes, and naming another household changes nothing', async () => {
    const s = await freshSession();
    for (const path of ['/admin/households/hh_solo', '/admin/export/general.csv', '/admin/export/restricted.csv', '/admin/report/people', '/admin/audit?householdId=hh_solo']) {
      const res = await guest(s.cookie, 'GET', path);
      expect(res.status).toBe(401);
      expect(await res.text()).not.toMatch(/Taylor|Sample|hh_solo/);
    }
    const put = await SELF.fetch(`${BASE}/admin/households/hh_solo/response`, {
      method: 'PUT',
      headers: { Cookie: s.cookie, Origin: 'https://robertandnatalie.wedding', 'Content-Type': 'application/json', 'X-Requested-With': 'rsvp-admin' },
      body: JSON.stringify({ origin: 'coordinator-phone', reason: 'guessing', responses: [] }),
    });
    expect(put.status).toBe(401);
    // Guest endpoints take no household id: extra members are ignored and the session decides.
    const read = await (await guest(s.cookie, 'GET', '/session?householdId=hh_solo')).json();
    expect(read.household.id).toBe('hh_example');
    const write = await guest(s.cookie, 'PUT', '/response', { ...fullAnswer(s.snapshot), householdId: 'hh_solo' });
    expect(write.status).toBe(200);
    expect(await count("SELECT COUNT(*) AS n FROM response r JOIN invitation_entitlement ie ON ie.id = r.entitlement_id WHERE ie.guest_id = 'g_taylor' AND r.status != 'pending'")).toBe(0);
  });

  it('link-preview style GET and HEAD requests never open a session, consume the token or save anything', async () => {
    await resetDb(); await seedEvents(); await importRoster();
    const cred = await issue('hh_example', 'link');
    for (const method of ['GET', 'HEAD']) {
      const res = await SELF.fetch(`${BASE}/session?code=${cred.secret}&t=${cred.secret}`, { method });
      expect([401, 405]).toContain(res.status);
      expect(res.headers.get('Set-Cookie')).toBeNull();
    }
    expect((await SELF.fetch(`${BASE}/response?code=${cred.secret}`)).status).toBe(405);
    expect(await count('SELECT COUNT(*) AS n FROM session')).toBe(0);
    expect((await env.DB.prepare('SELECT last_used_at FROM access_credential WHERE id = ?').bind(cred.id).first()).last_used_at).toBeNull();
    expect(await count("SELECT COUNT(*) AS n FROM response WHERE status != 'pending'")).toBe(0);
    expect((await openSession(cred.secret)).res.status).toBe(200); // still usable: nothing was consumed
  });
});

describe('QA-21 import roles', () => {
  it('import is owner-only; a coordinator is refused before any preview is stored', async () => {
    await resetDb(); await seedEvents();
    const res = await admin(COORDINATOR, 'POST', '/admin/import/preview', { body: 'household_id\n', contentType: 'text/csv' });
    expect(res.status).toBe(403);
    expect(await count('SELECT COUNT(*) AS n FROM import_batch')).toBe(0);
  });
});

describe('QA-22 counts and exports agree', () => {
  it('event totals, the people report and the general export reconcile row for row', async () => {
    const s = await freshSession();
    const payload = fullAnswer(s.snapshot);
    payload.responses = payload.responses.map((r) => (r.guestId === 'g_sam' ? { ...r, status: 'declining' } : r));
    expect((await guest(s.cookie, 'PUT', '/response', payload)).status).toBe(200);
    const solo = await openSession((await issue('hh_solo', 'code')).secret);
    expect((await guest(solo.cookie, 'PUT', '/response', fullAnswer(solo.snapshot, 'declining'))).status).toBe(200);

    const events = (await (await admin(COORDINATOR, 'GET', '/admin/report/events')).json()).events;
    const people = (await (await admin(COORDINATOR, 'GET', '/admin/report/people')).json()).people;
    const rows = parseCsv(await (await admin(COORDINATOR, 'GET', '/admin/export/general.csv')).text());
    const header = rows[0];
    const col = (name) => header.indexOf(name);
    const csv = rows.slice(1);
    expect(people).toHaveLength(15);
    expect(csv).toHaveLength(15);
    for (const ev of events) {
      const p = people.filter((x) => x.eventId === ev.eventId);
      const c = csv.filter((r) => r[col('event_id')] === ev.eventId);
      for (const status of ['attending', 'declining', 'pending']) {
        expect(p.filter((x) => x.status === status)).toHaveLength(ev.people[status]);
        expect(c.filter((r) => r[col('status')] === status)).toHaveLength(ev.people[status]);
      }
      expect(ev.people.attending + ev.people.declining + ev.people.pending).toBe(ev.people.entitled);
      expect(p).toHaveLength(ev.people.entitled);
    }
    expect(events.find((e) => e.eventId === 'ceremony').people).toEqual({ entitled: 7, attending: 2, declining: 2, pending: 3 });
    expect(events.find((e) => e.eventId === 'reception').people).toEqual({ entitled: 8, attending: 3, declining: 2, pending: 3 });
    expect(header).not.toContain('note');
  });
});

describe('retention on schedule (SEC-06)', () => {
  it('applies without force once the retention date has passed', async () => {
    const s = await freshSession();
    expect((await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot))).status).toBe(200);
    const result = await applyRetention(env, { ...readConfig(env), weddingDate: '2020-01-01' });
    expect(result.applied).toBe(true);
    expect(result.dueAt).toBe('2020-04-01T00:00:00.000Z'); // 2020-01-01 + 90 days + 1
    expect(await count('SELECT COUNT(*) AS n FROM restricted_guest_needs')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM response')).toBe(0);
  });
});
