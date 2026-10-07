import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { BASE, OWNER, admin, resetDb, seedEvents, importRoster, openParty, listGuests, guest, fullAnswer, count } from './helpers.js';

describe('GET /guests (public name directory)', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); });

  it('returns an empty list when the roster has not been imported', async () => {
    const res = await listGuests();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ guests: [] });
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
  });

  it('returns one party label per household, sorted A to Z, with no other guest data', async () => {
    await importRoster();
    const res = await listGuests();
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://robertandnatalie.wedding');
    const body = await res.json();
    expect(Object.keys(body)).toEqual(['guests']);
    expect(body.guests.every((g) => Object.keys(g).sort().join(',') === 'name,partyId')).toBe(true);
    expect(body.guests.map((g) => g.name)).toEqual([
      'Taylor Sample',
      'The Example Household',
      'The Sample Family',
    ]);
    expect(body.guests.map((g) => g.partyId)).toEqual(['hh_solo', 'hh_example', 'hh_family']);
    const payload = JSON.stringify(body);
    expect(payload).not.toMatch(/@|phone|email|address|notes|Vegetarian|plus-one|g_alex_guest|contact|Alex Example|Jordan Example|mailing|dietary/i);
    expect(payload).not.toContain('alex@example');
  });

  it('omits a revoked household', async () => {
    await importRoster();
    await admin(OWNER, 'POST', '/admin/households/hh_solo/revoke', { body: {} });
    const body = await (await listGuests()).json();
    expect(body.guests.map((g) => g.name)).not.toContain('Taylor Sample');
    expect(body.guests.some((g) => g.partyId === 'hh_solo')).toBe(false);
    expect(body.guests).toHaveLength(2);
  });

  it('rate limits repeated directory reads per IP', async () => {
    let last;
    for (let i = 0; i < 61; i++) last = await listGuests({ 'CF-Connecting-IP': '198.51.100.20' });
    expect(last.status).toBe(429);
    expect((await last.json()).error.code).toBe('rate_limited');
  });
});

describe('POST /session with partyId', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); await importRoster(); });

  it('opens a session for that household and returns only its snapshot', async () => {
    const { res, snapshot } = await openParty('hh_example');
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/^rn_session=[A-Za-z0-9_-]{40,}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=\d+$/);
    expect(snapshot.household.id).toBe('hh_example');
    expect(snapshot.household.guests.map((g) => g.id)).toEqual(['g_alex', 'g_sam', 'g_alex_guest', 'g_jordan']);
    expect(JSON.stringify(snapshot)).not.toMatch(/hh_solo|hh_family|Taylor|Morgan|Riley|Casey Sample|g_taylor|g_morgan/);
    expect(await count('SELECT COUNT(*) AS n FROM session')).toBe(1);
    const opened = await env.DB.prepare('SELECT credential_id FROM session').first();
    expect(opened.credential_id).toBeNull();
  });

  it('treats an unknown or revoked party the same as an unknown code', async () => {
    const missing = await openParty('hh_nobody');
    expect(missing.res.status).toBe(403);
    expect((await missing.res.json()).error.code).toBe('invalid_code');
    expect(missing.res.headers.get('Set-Cookie')).toBeNull();
    await admin(OWNER, 'POST', '/admin/households/hh_solo/revoke', { body: {} });
    const revoked = await openParty('hh_solo');
    expect(revoked.res.status).toBe(403);
    expect(await revoked.res.json()).toEqual(await (await SELF.fetch(`${BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://robertandnatalie.wedding' },
      body: '{"code":"NOPE-NOPE-NOPE"}',
    })).json());
  });

  it('rejects a malformed party id without hitting the roster', async () => {
    const res = await openParty('hh_example!!!');
    expect(res.res.status).toBe(403);
    expect(await count('SELECT COUNT(*) AS n FROM guest')).toBe(8);
  });

  it('lets a party reopen an existing response and save an update (last write with revision)', async () => {
    const first = await openParty('hh_example');
    expect((await guest(first.cookie, 'PUT', '/response', fullAnswer(first.snapshot))).status).toBe(200);
    const again = await openParty('hh_example');
    expect(again.snapshot.reference).toMatch(/^RN-/);
    expect(again.snapshot.revision).toBe(1);
    expect(again.snapshot.responses.every((r) => r.status === 'attending')).toBe(true);
    const update = fullAnswer(again.snapshot, 'declining');
    const saved = await guest(again.cookie, 'PUT', '/response', update);
    expect(saved.status).toBe(200);
    expect((await saved.json()).revision).toBe(2);
  });

  it('rate limits repeated party opens per IP', async () => {
    let last;
    for (let i = 0; i < 21; i++) last = await openParty('hh_example', { 'CF-Connecting-IP': '203.0.113.40' });
    expect(last.res.status).toBe(429);
    expect((await last.res.json()).error.code).toBe('rate_limited');
  });
});
