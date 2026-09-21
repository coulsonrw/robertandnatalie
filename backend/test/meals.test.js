// Meal choices (RSVP-03, DATA-02): collected only where configured, only for attending guests,
// only from the configured list; exported with attendance; never for declining guests.
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { OWNER, admin, resetDb, importRoster, issue, openSession, guest, fullAnswer } from './helpers.js';

const MEALS = ['Gulf fish', 'Roast chicken', 'Vegetarian'];

async function seedEventsWithMeals(options = MEALS) {
  const config = JSON.parse(env.TEST_SITE_CONFIG);
  config.rsvp = { mealChoices: { eventId: 'reception', options } };
  const res = await admin(OWNER, 'PUT', '/admin/events', { body: config });
  if (res.status !== 200) throw new Error(`seed failed: ${res.status} ${await res.text()}`);
}

async function session(householdId = 'hh_solo') {
  const cred = await issue(householdId, 'code');
  const opened = await openSession(cred.secret);
  expect(opened.res.status).toBe(200);
  return opened;
}

function withMeals(payload, mealFor) {
  return { ...payload, responses: payload.responses.map((r) => (r.eventId === 'reception' && r.status === 'attending' ? { ...r, meal: mealFor(r) } : r)) };
}

describe('meal choices', () => {
  beforeEach(async () => { await resetDb(); await seedEventsWithMeals(); await importRoster(); });

  it('exposes the configured options only on the configured event and requires a choice when attending', async () => {
    const { cookie, snapshot } = await session();
    expect(snapshot.responses.find((r) => r.eventId === 'reception')).toHaveProperty('meal', null);
    expect(snapshot.responses.find((r) => r.eventId === 'ceremony')).not.toHaveProperty('meal');
    const payload = fullAnswer(snapshot, 'attending', { plusOneNames: {}, contactEmail: 'taylor@example.invalid', notes: '' });
    const missing = await guest(cookie, 'PUT', '/response', payload);
    expect(missing.status).toBe(400);
    expect((await missing.json()).error.message).toMatch(/choose a meal/i);
  });

  it('rejects a meal outside the configured list and a meal for an event without meals', async () => {
    const { cookie, snapshot } = await session();
    const base = fullAnswer(snapshot, 'attending', { plusOneNames: {}, contactEmail: 'taylor@example.invalid', notes: '' });
    const bad = await guest(cookie, 'PUT', '/response', withMeals(base, () => 'Lobster'));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.message).toMatch(/not one of the options/i);
    const wrongEvent = { ...base, responses: base.responses.map((r) => (r.eventId === 'ceremony' ? { ...r, meal: MEALS[0] } : { ...r, meal: MEALS[0] })) };
    const res = await guest(cookie, 'PUT', '/response', wrongEvent);
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/not collected/i);
  });

  it('stores a valid choice, returns it in the snapshot, and clears it when the guest later declines', async () => {
    const { cookie, snapshot } = await session();
    const payload = withMeals(fullAnswer(snapshot, 'attending', { plusOneNames: {}, contactEmail: 'taylor@example.invalid', notes: '' }), () => 'Vegetarian');
    const saved = await guest(cookie, 'PUT', '/response', payload);
    expect(saved.status).toBe(200);
    const snap = await saved.json();
    expect(snap.responses.find((r) => r.eventId === 'reception').meal).toBe('Vegetarian');
    const row = await env.DB.prepare("SELECT r.meal_value FROM response r JOIN invitation_entitlement ie ON ie.id = r.entitlement_id WHERE ie.guest_id = 'g_taylor' AND ie.event_id = 'reception'").first();
    expect(row.meal_value).toBe('Vegetarian');
    // A declining answer never keeps a meal (RSVP-03).
    const decline = fullAnswer(snap, 'declining', { requestId: crypto.randomUUID(), revision: snap.revision });
    const declined = await guest(cookie, 'PUT', '/response', decline);
    expect(declined.status).toBe(200);
    expect((await declined.json()).responses.find((r) => r.eventId === 'reception').meal).toBeNull();
    const after = await env.DB.prepare("SELECT r.meal_value FROM response r JOIN invitation_entitlement ie ON ie.id = r.entitlement_id WHERE ie.guest_id = 'g_taylor' AND ie.event_id = 'reception'").first();
    expect(after.meal_value).toBeNull();
  });

  it('is exported with attendance and appears in the audit trail only as a field name', async () => {
    const { cookie, snapshot } = await session();
    const payload = withMeals(fullAnswer(snapshot, 'attending', { plusOneNames: {}, contactEmail: 'taylor@example.invalid', notes: 'No nuts, please.' }), () => 'Gulf fish');
    expect((await guest(cookie, 'PUT', '/response', payload)).status).toBe(200);
    const csv = await admin(OWNER, 'GET', '/admin/export/general.csv');
    expect(csv.status).toBe(200);
    const text = await csv.text();
    expect(text).toMatch(/Gulf fish/);
    expect(text).not.toMatch(/No nuts/);
    const audit = await env.DB.prepare("SELECT details_json FROM audit_event WHERE action = 'response.save' ORDER BY id DESC LIMIT 1").first();
    expect(audit).toBeTruthy();
    expect(audit.details_json).not.toMatch(/Gulf fish|No nuts/);
  });
});
