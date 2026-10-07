import { describe, it, expect, beforeEach } from 'vitest';
import { SELF } from 'cloudflare:test';
import { parseGuestSheet, rosterToImportCsv, linkPlan, splitNamedPeople, parsePlusOneCell } from '../src/roster.js';
import { buildAnswersRow } from '../src/sheets.js';
import { BASE, resetDb, seedEvents, guest, freshSession, fullAnswer } from './helpers.js';

const FIXTURE = [
  'Guest Name,Phone Number,Email Address,Plus One Name(s),Group,RSVP,Dietary Requirements,Accommodation,Notes',
  '"Alex & Sam",,,2,Family,,,,',
  'Abby,15551212,,1 unnamed plus-one(s),Family,,,,',
  'Taylor,,,,Family,,,,',
  '"Morgan, Jamie, & Riley",,,1 Unnamed,Family,,,,',
  'Jordan Example,15550000,jordan@example.invalid,Casey Example; Quinn Example,Family,,,,',
  'Avery,,,1 unnamed,Friends,,,,',
  '"Winne Sample & Francois Sample",,,,Friends,,,,',
  'Pat Sample,,,Nomzamo Sample,Friends,,,,',
  'Winnie Sample,,,Francoise Sample,Friends,,,,',
  '"Mama & Daddy",,,,Family,,,,',
  '"Shelly & Ken",,,,Family,,,,',
  '',
].join('\n');

function ops(pathName, { method = 'GET', body, token = 'test-bootstrap-token' } = {}) {
  const headers = { Origin: 'https://robertandnatalie.wedding' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return SELF.fetch(`${BASE}${pathName}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('guest-sheet roster (synthetic names only)', () => {
  it('splits couple and list names without inventing extras', () => {
    expect(splitNamedPeople('Alex & Sam')).toEqual(['Alex', 'Sam']);
    expect(splitNamedPeople('Morgan, Jamie, & Riley')).toEqual(['Morgan', 'Jamie', 'Riley']);
    expect(splitNamedPeople('Mama & Daddy')).toEqual(['Mama', 'Daddy']);
  });

  it('treats a bare number that matches the named count as party size, not extra plus-ones', () => {
    expect(parsePlusOneCell('2', 2)).toEqual({
      named: [],
      unnamedSlots: 0,
      flags: ['plus_one_cell_equals_named_count_treated_as_party_size'],
    });
    expect(parsePlusOneCell('1 unnamed plus-one(s)', 1)).toEqual({ named: [], unnamedSlots: 1, flags: [] });
    expect(parsePlusOneCell('Casey Example; Quinn Example', 1)).toEqual({
      named: ['Casey Example', 'Quinn Example'],
      unnamedSlots: 0,
      flags: [],
    });
  });

  it('builds one household per row, one link per named guest, plus-ones only as allowed', () => {
    const parsed = parseGuestSheet(FIXTURE);
    expect(parsed.counts.invitationRows).toBe(11);
    expect(parsed.counts.namedGuests).toBe(17);
    expect(parsed.counts.namedPlusOnes).toBe(4);
    expect(parsed.counts.unnamedPlusOneSlots).toBe(3);
    expect(parsed.counts.privateLinks).toBe(17);

    const couple = parsed.households.find((h) => h.label === 'Alex & Sam');
    expect(couple.guests.filter((g) => g.kind === 'plus-one')).toHaveLength(0);
    expect(couple.guests.every((g) => g.receivesLink)).toBe(true);

    const abby = parsed.households.find((h) => h.label === 'Abby');
    expect(abby.guests.map((g) => g.kind)).toEqual(['named', 'plus-one']);
    expect(abby.guests[1].hostGuestId).toBe(abby.guests[0].id);
    expect(abby.guests[1].receivesLink).toBe(false);

    const jordan = parsed.households.find((h) => h.label === 'Jordan Example');
    expect(jordan.guests.filter((g) => g.receivesLink)).toHaveLength(1);
    expect(jordan.guests.filter((g) => !g.receivesLink).map((g) => g.name)).toEqual(['Casey Example', 'Quinn Example']);

    const mama = parsed.households.find((h) => h.label === 'Mama & Daddy');
    expect(mama.guests.map((g) => g.name)).toEqual(['Mama', 'Daddy']);

    const csv = rosterToImportCsv(parsed);
    expect(csv).toMatch(/household_id,household_label/);
    expect(csv).toMatch(/plus-one,,g_/);
    expect(linkPlan(parsed).every((item) => item.guestName && item.householdId)).toBe(true);
  });
});

describe('hotel stay + answers row', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); });

  it('requires a Grand Hotel stay answer when anyone is attending', async () => {
    const s = await freshSession();
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { hotelStay: null }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.fields).toEqual(expect.arrayContaining([
      { path: 'hotelStay', message: 'Please say whether you will stay at The Grand Hotel.' },
    ]));
  });

  it('stores hotelStay on a successful save and builds an answers-tab row', async () => {
    const s = await freshSession();
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', { hotelStay: 'undecided' }));
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.hotelStay).toBe('undecided');
    const loaded = {
      household: { id: snap.household.id, label: snap.household.label, contact_email: snap.household.contactEmail },
      guests: snap.household.guests.map((g) => ({
        id: g.id,
        kind: g.kind,
        display_name: g.kind === 'named' ? g.name : null,
        plus_one_name: g.kind === 'plus-one' ? g.name : null,
      })),
      entitlements: snap.responses.map((r) => ({
        guest_id: r.guestId,
        event_id: r.eventId,
        status: r.status,
      })),
      state: { revision: snap.revision, reference: snap.reference, last_submitted_at: snap.submittedAt, hotel_stay: snap.hotelStay },
      notes: snap.notes,
    };
    const row = buildAnswersRow(loaded);
    expect(row[0]).toBe('hh_example');
    expect(['Yes', 'Mixed']).toContain(row[3]);
    expect(Number(row[4])).toBeGreaterThan(0);
    expect(row[11]).toBe('Not sure');
    expect(row[12]).toBe('alex@example.invalid');
  });
});

describe('ops bootstrap', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); });

  it('refuses a missing or wrong bootstrap token', async () => {
    expect((await ops('/ops/status', { token: '' })).status).toBe(401);
    expect((await ops('/ops/status', { token: 'nope' })).status).toBe(401);
  });

  it('imports the synthetic sheet without issuing private links', async () => {
    const status = await (await ops('/ops/status')).json();
    expect(status.households).toBe(0);
    expect(status.sheets.configured).toBe(false);

    const res = await ops('/ops/roster/sync', { method: 'POST', body: { csv: FIXTURE } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.counts.invitationRows).toBe(11);
    expect(body.counts.namedGuests).toBe(17);
    expect(body.links).toEqual([]);
    expect(body.answersTab.skipped).toBe(true);

    const names = await (await SELF.fetch(`${BASE}/guests`, { headers: { Origin: 'https://robertandnatalie.wedding' } })).json();
    expect(names.guests.length).toBe(11); // one dropdown row per invitation, not per named guest
    expect(names.guests.every((g) => g.name && g.partyId)).toBe(true);
    expect(new Set(names.guests.map((g) => g.partyId)).size).toBe(11);

    const again = await ops('/ops/roster/sync', { method: 'POST', body: { csv: FIXTURE } });
    expect(again.status).toBe(200);
    expect((await again.json()).links).toEqual([]);
  });

  it('issues private links only when issueLinks is true', async () => {
    const res = await ops('/ops/roster/sync', { method: 'POST', body: { csv: FIXTURE, issueLinks: true } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.links.filter((l) => l.issued)).toHaveLength(17);
    expect(body.links.every((l) => l.link && l.link.includes('/rsvp.html#t='))).toBe(true);
    const replay = await (await ops('/ops/roster/sync', { method: 'POST', body: { csv: FIXTURE, issueLinks: true } })).json();
    expect(replay.links.filter((l) => l.issued)).toHaveLength(0);
    expect(replay.links.filter((l) => l.reason === 'already_issued')).toHaveLength(17);
  });
});
