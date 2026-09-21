import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { BASE, OWNER, COORDINATOR, ROSTER_CSV, admin, resetDb, seedEvents, importRoster, guest, freshSession, fullAnswer, count } from './helpers.js';

describe('admin authentication (ADMIN-01, SEC-03)', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); });

  it('refuses unauthenticated, unlisted and under-privileged callers', async () => {
    const anon = await SELF.fetch(`${BASE}/admin/report/events`);
    expect(anon.status).toBe(401);
    const stranger = await admin('stranger@example.invalid', 'GET', '/admin/report/events');
    expect(stranger.status).toBe(403);
    const coord = await admin(COORDINATOR, 'GET', '/admin/report/events');
    expect(coord.status).toBe(200);
    const coordExport = await admin(COORDINATOR, 'GET', '/admin/export/restricted.csv');
    expect(coordExport.status).toBe(403);
    const noHeader = await SELF.fetch(`${BASE}/admin/import/commit`, { method: 'POST', headers: { 'x-dev-access-email': OWNER, 'Content-Type': 'application/json' }, body: '{}' });
    expect(noHeader.status).toBe(403);
    const jwtGarbage = await SELF.fetch(`${BASE}/admin/report/events`, { headers: { 'Cf-Access-Jwt-Assertion': 'a.b.c' } });
    expect(jwtGarbage.status).toBe(401);
  });
});

describe('CSV import (ADMIN-02)', () => {
  beforeEach(async () => { await resetDb(); await seedEvents(); });

  it('previews with validation errors and refuses to commit them', async () => {
    const bad = [
      'household_id,household_label,household_contact_email,guest_id,guest_kind,guest_name,host_guest_id,events',
      'hh_x,The X Household,,g_1,named,One X,,ceremony|brunch',
      'hh_x,The X Household,,g_1,named,One Again,,ceremony',
      'hh_x,The X Household,,g_2,plus-one,,g_9,ceremony',
      'hh_x,The X Household,,g_3,named,,,',
    ].join('\n');
    const res = await admin(OWNER, 'POST', '/admin/import/preview', { body: bad, contentType: 'text/csv' });
    expect(res.status).toBe(200);
    const plan = await res.json();
    expect(plan.canCommit).toBe(false);
    const messages = plan.errors.map((e) => e.message).join('\n');
    expect(messages).toMatch(/Unknown event id "brunch"/);
    expect(messages).toMatch(/Duplicate guest_id "g_1"/);
    expect(messages).toMatch(/host_guest_id "g_9" is not in this file/);
    expect(messages).toMatch(/guest_name is required/);
    const commit = await admin(OWNER, 'POST', '/admin/import/commit', { body: { batchId: plan.batchId } });
    expect(commit.status).toBe(400);
    expect(await count('SELECT COUNT(*) AS n FROM household')).toBe(0);
  });

  it('commits a valid roster with immutable ids and pending responses', async () => {
    const plan = await importRoster();
    expect(plan.summary.households.create).toBe(3);
    expect(plan.summary.guests.create).toBe(8);
    expect(plan.summary.entitlements.create).toBe(15);
    expect(await count('SELECT COUNT(*) AS n FROM guest')).toBe(8);
    expect(await count("SELECT COUNT(*) AS n FROM response WHERE status = 'pending'")).toBe(15);
    const again = await admin(OWNER, 'POST', '/admin/import/commit', { body: { batchId: plan.batchId } });
    expect(again.status).toBe(409);
  });

  it('re-import preserves responses and flags conflicts (AT-13)', async () => {
    const s = await freshSession();
    const saved = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot));
    expect(saved.status).toBe(200);
    // Rename a household label, add a guest, drop Jordan's reception entitlement, keep the rest.
    const csv2 = ROSTER_CSV
      .replace(/The Example Household/g, 'The Example-Smith Household')
      .replace('hh_example,The Example-Smith Household,,g_jordan,named,Jordan Example,,reception\n', 'hh_example,The Example-Smith Household,,g_jordan,named,Jordan Example,,ceremony\n')
      .replace('hh_solo,', 'hh_family,The Sample Family,,g_new,named,New Sample,,reception\nhh_solo,');
    const preview = await (await admin(OWNER, 'POST', '/admin/import/preview', { body: csv2, contentType: 'text/csv' })).json();
    expect(preview.canCommit).toBe(true);
    expect(preview.summary.households.update).toBe(1);
    expect(preview.summary.guests.create).toBe(1);
    expect(preview.summary.entitlements.revoke).toBe(1);
    expect(preview.summary.entitlements.create).toBe(2);
    expect(preview.warnings.map((w) => w.message).join('\n')).toMatch(/g_jordan\|reception would be revoked although a response exists/);
    const commit = await admin(OWNER, 'POST', '/admin/import/commit', { body: { batchId: preview.batchId } });
    expect(commit.status).toBe(200);
    // Existing answers untouched; revision untouched; contact email kept although the CSV cell is empty.
    const after = await (await guest(s.cookie, 'GET', '/session')).json();
    expect(after.revision).toBe(1);
    expect(after.household.label).toBe('The Example-Smith Household');
    expect(after.household.contactEmail).toBe('alex@example.invalid');
    expect(after.responses.filter((r) => r.guestId === 'g_alex').every((r) => r.status === 'attending')).toBe(true);
    expect(after.entitlements.find((e) => e.guestId === 'g_jordan')).toEqual({ guestId: 'g_jordan', eventId: 'ceremony' });
    expect(after.responses.find((r) => r.guestId === 'g_jordan').status).toBe('pending');
    expect(await count("SELECT COUNT(*) AS n FROM response WHERE status = 'attending'")).toBe(7); // revoked pair retained
    // A guest id cannot move households.
    const moved = ROSTER_CSV.replace('hh_solo,Taylor Sample,,g_taylor', 'hh_family,The Sample Family,,g_taylor');
    const bad = await (await admin(OWNER, 'POST', '/admin/import/preview', { body: moved, contentType: 'text/csv' })).json();
    expect(bad.canCommit).toBe(false);
    expect(bad.errors[0].message).toMatch(/already belongs to a different household/);
  });
});

describe('reporting and exports (ADMIN-03, SEC-05)', () => {
  let s;
  beforeEach(async () => {
    s = await freshSession();
    const payload = fullAnswer(s.snapshot);
    payload.responses = payload.responses.map((r) => (r.guestId === 'g_sam' ? { ...r, status: 'declining' } : r));
    payload.notes = '=SUM(A1:A9) nut allergy';
    payload.contactEmail = '=HYPERLINK("https://evil.example")@example.invalid';
    const res = await guest(s.cookie, 'PUT', '/response', payload);
    expect(res.status).toBe(200);
  });

  it('counts people by event and classifies households (AT-06)', async () => {
    const events = (await (await admin(COORDINATOR, 'GET', '/admin/report/events')).json()).events;
    const ceremony = events.find((e) => e.eventId === 'ceremony');
    const reception = events.find((e) => e.eventId === 'reception');
    expect(ceremony.people).toEqual({ entitled: 7, attending: 2, declining: 1, pending: 4 });
    expect(reception.people).toEqual({ entitled: 8, attending: 3, declining: 1, pending: 4 });
    const households = (await (await admin(COORDINATOR, 'GET', '/admin/report/households')).json()).households;
    const byId = Object.fromEntries(households.map((h) => [h.id, h.status]));
    expect(byId).toEqual({ hh_example: 'complete', hh_solo: 'no_response', hh_family: 'no_response' });
    const outstanding = (await (await admin(COORDINATOR, 'GET', '/admin/report/households?status=no_response,incomplete')).json()).households;
    expect(outstanding.map((h) => h.id).sort()).toEqual(['hh_family', 'hh_solo']);
    const example = households.find((h) => h.id === 'hh_example');
    expect(example.guests.find((g) => g.id === 'g_alex_guest').name).toBe('Casey Example');
    expect(JSON.stringify(households)).not.toContain('nut allergy');
  });

  it('the general export excludes restricted notes and neutralises formula cells', async () => {
    const res = await admin(COORDINATOR, 'GET', '/admin/export/general.csv');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="attendance-\d{4}-\d{2}-\d{2}T.*\.csv"/);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const csv = await res.text();
    expect(csv).not.toContain('nut allergy');
    expect(csv).not.toContain('=SUM');
    expect(csv).toContain('"\'=HYPERLINK(""https://evil.example"")@example.invalid"');
    expect(csv.split('\r\n')[0]).toContain('exported_at,exported_by');
    expect(csv).toContain(`,${COORDINATOR}`);
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(1 + 15);
    expect(await count("SELECT COUNT(*) AS n FROM audit_event WHERE action = 'export.general' AND actor_id = ?", COORDINATOR)).toBe(1);
  });

  it('the restricted export is owner-only, audited and neutralised', async () => {
    const res = await admin(OWNER, 'GET', '/admin/export/restricted.csv');
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("\"'=SUM(A1:A9) nut allergy\"");
    expect(csv).toContain('hh_example,The Example Household,,(household)');
    expect(await count("SELECT COUNT(*) AS n FROM audit_event WHERE action = 'export.restricted' AND actor_id = ?", OWNER)).toBe(1);
    const detail = await (await admin(COORDINATOR, 'GET', '/admin/households/hh_example')).json();
    expect(detail.notes).toBeUndefined();
    expect(detail.credentials[0].digest).toBeUndefined();
  });
});
