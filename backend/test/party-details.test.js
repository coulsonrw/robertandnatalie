import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { freshSession, guest, fullAnswer, openParty, resetDb, seedEvents, importRoster, listGuests } from './helpers.js';

function extraAnswer(snapshot, extras = {}) {
  return fullAnswer(snapshot, 'attending', extras);
}

describe('party details: names, contact, extra guests', () => {
  let s;
  beforeEach(async () => { s = await freshSession(); });

  it('lets a party edit named-guest names and save per-guest dietary plus phone and address', async () => {
    const payload = extraAnswer(s.snapshot, {
      guestNames: { g_alex: 'Alex Rivera', g_sam: 'Sam Rivera', g_jordan: 'Jordan Rivera' },
      guestDietary: { g_alex: 'Vegetarian', g_sam: '', g_jordan: 'No shellfish', g_alex_guest: 'None' },
      contactPhone: '251-555-0100',
      mailingAddress: '1 Sample Way\nFairhope, AL',
    });
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.household.guests.find((g) => g.id === 'g_alex').name).toBe('Alex Rivera');
    expect(snap.household.guests.find((g) => g.id === 'g_alex').dietary).toBe('Vegetarian');
    expect(snap.household.guests.find((g) => g.id === 'g_jordan').dietary).toBe('No shellfish');
    expect(snap.household.contactPhone).toBe('251-555-0100');
    expect(snap.household.mailingAddress).toBe('1 Sample Way\nFairhope, AL');
    expect(snap.extraGuestCap).toBe(2);
    expect(snap.household.contactEmail).toBe('alex@example.invalid');
    const row = await env.DB.prepare("SELECT display_name, origin FROM guest WHERE id = 'g_alex'").first();
    expect(row.display_name).toBe('Alex Rivera');
    expect(row.origin).toBe('roster');
  });

  it('adds an extra guest, keeps them on reopen, and honors the cap of 2 extras', async () => {
    const first = extraAnswer(s.snapshot, {
      addedGuests: [{
        name: 'Casey Added',
        dietary: 'Peanuts',
        responses: [
          { eventId: 'ceremony', status: 'attending' },
          { eventId: 'reception', status: 'attending' },
        ],
      }],
    });
    const saved = await guest(s.cookie, 'PUT', '/response', first);
    expect(saved.status).toBe(200);
    const snap = await saved.json();
    const added = snap.household.guests.find((g) => g.added);
    expect(added).toBeTruthy();
    expect(added.name).toBe('Casey Added');
    expect(added.kind).toBe('plus-one');
    expect(added.dietary).toBe('Peanuts');
    expect(snap.responses.filter((r) => r.guestId === added.id)).toHaveLength(2);
    expect(snap.extraGuestsRemaining).toBe(0); // roster plus-one + this extra = 2 of 2

    const again = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(again.household.guests.find((g) => g.id === added.id).name).toBe('Casey Added');
    expect(again.revision).toBe(1);

    const over = extraAnswer(again, {
      addedGuests: [
        { name: 'Four', dietary: '', responses: [{ eventId: 'ceremony', status: 'declining' }, { eventId: 'reception', status: 'declining' }] },
        { name: 'Five', dietary: '', responses: [{ eventId: 'ceremony', status: 'declining' }, { eventId: 'reception', status: 'declining' }] },
        { name: 'Six', dietary: '', responses: [{ eventId: 'ceremony', status: 'declining' }, { eventId: 'reception', status: 'declining' }] },
      ],
    });
    const blocked = await guest(s.cookie, 'PUT', '/response', over);
    expect(blocked.status).toBe(400);
    expect((await blocked.json()).error.fields.some((f) => f.path === 'addedGuests')).toBe(true);
  });

  it('removes a guest-added extra and keeps 409 conflict handling', async () => {
    const created = await (await guest(s.cookie, 'PUT', '/response', extraAnswer(s.snapshot, {
      addedGuests: [{
        name: 'Pat Extra',
        dietary: '',
        responses: [{ eventId: 'ceremony', status: 'declining' }, { eventId: 'reception', status: 'declining' }],
      }],
    }))).json();
    const extra = created.household.guests.find((g) => g.added);
    expect(extra).toBeTruthy();

    const stale = extraAnswer(s.snapshot, { notes: 'stale' });
    const conflict = await guest(s.cookie, 'PUT', '/response', stale);
    expect(conflict.status).toBe(409);
    const body = await conflict.json();
    expect(body.latest.revision).toBe(1);
    expect(body.latest.household.guests.some((g) => g.id === extra.id)).toBe(true);
    expect(body.latest.household).toHaveProperty('contactPhone');
    expect(body.latest.household).toHaveProperty('mailingAddress');

    const removed = extraAnswer(body.latest, { removedGuestIds: [extra.id] });
    const after = await guest(s.cookie, 'PUT', '/response', removed);
    expect(after.status).toBe(200);
    const snap = await after.json();
    expect(snap.revision).toBe(2);
    expect(snap.household.guests.some((g) => g.id === extra.id)).toBe(false);
    const row = await env.DB.prepare('SELECT state FROM guest WHERE id = ?').bind(extra.id).first();
    expect(row.state).toBe('revoked');
  });

  it('refuses to remove a roster plus-one and never puts contact details on GET /guests', async () => {
    const bad = extraAnswer(s.snapshot, { removedGuestIds: ['g_alex_guest'] });
    const res = await guest(s.cookie, 'PUT', '/response', bad);
    expect(res.status).toBe(400);

    await resetDb();
    await seedEvents();
    await importRoster();
    const dir = await (await listGuests()).json();
    expect(dir.guests.every((g) => Object.keys(g).sort().join(',') === 'name,partyId')).toBe(true);
    expect(JSON.stringify(dir)).not.toMatch(/contact|phone|address|email|dietary|notes|@/i);
  });
});

describe('extra guests on a single-name party', () => {
  it('allows two extras on a household with no roster plus-one and refuses a third', async () => {
    await resetDb();
    await seedEvents();
    await importRoster();
    const opened = await openParty('hh_solo');
    expect(opened.res.status).toBe(200);
    const extras = [1, 2].map((n) => ({
      name: `Guest ${n}`,
      dietary: '',
      responses: [
        { eventId: 'ceremony', status: 'attending' },
        { eventId: 'reception', status: 'attending' },
      ],
    }));
    const payload = {
      requestId: crypto.randomUUID(),
      revision: opened.snapshot.revision,
      responses: opened.snapshot.entitlements.map((e) => ({ guestId: e.guestId, eventId: e.eventId, status: 'attending' })),
      guestNames: { g_taylor: 'Taylor Sample' },
      addedGuests: extras,
      contactEmail: 'taylor@example.invalid',
      hotelStay: 'no',
    };
    const res = await guest(opened.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.household.guests.filter((g) => g.added)).toHaveLength(2);
    expect(snap.extraGuestsRemaining).toBe(0);

    const third = {
      requestId: crypto.randomUUID(),
      revision: snap.revision,
      responses: snap.entitlements.map((e) => ({ guestId: e.guestId, eventId: e.eventId, status: 'attending' })),
      addedGuests: [{
        name: 'Guest 3',
        dietary: '',
        responses: [
          { eventId: 'ceremony', status: 'attending' },
          { eventId: 'reception', status: 'attending' },
        ],
      }],
      contactEmail: 'taylor@example.invalid',
      hotelStay: 'no',
    };
    const blocked = await guest(opened.cookie, 'PUT', '/response', third);
    expect(blocked.status).toBe(400);
    expect((await blocked.json()).error.fields.some((f) => f.path === 'addedGuests')).toBe(true);
  });
});
