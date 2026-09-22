// Guest register import (ADMIN-02): CSV -> validated plan (preview) -> commit by batch id.
//
// CSV columns (header row required, order free, case-insensitive):
//   household_id, household_label, household_contact_email, guest_id, guest_kind (named|plus-one),
//   guest_name, host_guest_id (plus-one only), events (event ids separated by |)
// One row per guest. Households repeat their columns on each row. IDs are immutable and
// owner-supplied; names are never used as keys. Re-import never touches response rows.

import { HttpError } from '../http.js';
import { parseCsvObjects } from '../csv.js';
import { newId, sha256Hex } from '../crypto.js';
import { all, one, stmt, batch, audit, nowIso, loadEvents } from '../db.js';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REQUIRED = ['household_id', 'household_label', 'guest_id', 'guest_kind', 'guest_name', 'host_guest_id', 'events'];

export async function buildImportPlan(db, csvText) {
  const { header, records } = parseCsvObjects(csvText);
  const errors = [];
  const warnings = [];
  for (const col of REQUIRED) if (!header.includes(col)) errors.push({ line: 1, message: `Missing column "${col}".` });
  if (errors.length) return { errors, warnings, households: [], guests: [], entitlements: [], summary: {} };

  const events = await loadEvents(db);
  const eventIds = new Set(events.map((e) => e.id));
  if (!eventIds.size) errors.push({ line: 1, message: 'No events are configured. Run the events sync first.' });

  const existingHouseholds = new Map((await all(db, 'SELECT * FROM household')).map((h) => [h.id, h]));
  const existingGuests = new Map((await all(db, 'SELECT * FROM guest')).map((g) => [g.id, g]));
  const existingEnt = await all(db, 'SELECT id, guest_id, event_id, revoked_at FROM invitation_entitlement');
  const existingEntByKey = new Map(existingEnt.map((e) => [`${e.guest_id}|${e.event_id}`, e]));
  const responded = new Set((await all(db, `SELECT ie.guest_id || '|' || ie.event_id AS k FROM response r JOIN invitation_entitlement ie ON ie.id = r.entitlement_id WHERE r.status != 'pending'`)).map((r) => r.k));

  const households = new Map();
  const guests = new Map();
  const fileEntitlements = new Set();

  for (const rec of records) {
    const line = rec._line;
    const hid = rec.household_id;
    const gid = rec.guest_id;
    if (!ID_RE.test(hid)) { errors.push({ line, message: 'household_id is missing or not a valid id.' }); continue; }
    if (!ID_RE.test(gid)) { errors.push({ line, message: 'guest_id is missing or not a valid id.' }); continue; }
    if (guests.has(gid)) { errors.push({ line, message: `Duplicate guest_id "${gid}" in this file.` }); continue; }
    const existingGuest = existingGuests.get(gid);
    if (existingGuest && existingGuest.household_id !== hid) {
      errors.push({ line, message: `guest_id "${gid}" already belongs to a different household; ids are immutable.` });
      continue;
    }
    const email = (rec.household_contact_email || '').trim();
    if (email && !EMAIL_RE.test(email)) errors.push({ line, message: 'household_contact_email is not a valid address.' });
    if (!rec.household_label) errors.push({ line, message: 'household_label is required.' });

    if (!households.has(hid)) {
      households.set(hid, { id: hid, label: rec.household_label, contactEmail: email || null, line });
    } else {
      const h = households.get(hid);
      if (h.label !== rec.household_label) errors.push({ line, message: `Conflicting household_label for "${hid}" (line ${h.line} differs).` });
    }

    const kind = rec.guest_kind;
    if (kind !== 'named' && kind !== 'plus-one') { errors.push({ line, message: 'guest_kind must be named or plus-one.' }); continue; }
    if (kind === 'named' && !rec.guest_name) errors.push({ line, message: 'guest_name is required for a named guest.' });
    if (kind === 'plus-one' && !ID_RE.test(rec.host_guest_id || '')) errors.push({ line, message: 'host_guest_id is required for a plus-one slot.' });
    if (kind === 'named' && rec.host_guest_id) warnings.push({ line, message: 'host_guest_id is ignored for a named guest.' });

    const evs = (rec.events || '').split('|').map((s) => s.trim()).filter(Boolean);
    if (!evs.length) errors.push({ line, message: 'events must list at least one event id.' });
    for (const ev of evs) {
      if (!eventIds.has(ev)) errors.push({ line, message: `Unknown event id "${ev}".` });
      fileEntitlements.add(`${gid}|${ev}`);
    }
    guests.set(gid, { id: gid, householdId: hid, kind, name: kind === 'named' ? rec.guest_name : null, hostGuestId: kind === 'plus-one' ? rec.host_guest_id : null, events: evs, line, sortOrder: guests.size });
  }

  // Cross-row checks.
  for (const g of guests.values()) {
    if (g.kind !== 'plus-one') continue;
    const host = guests.get(g.hostGuestId);
    if (!host) errors.push({ line: g.line, message: `host_guest_id "${g.hostGuestId}" is not in this file.` });
    else if (host.householdId !== g.householdId) errors.push({ line: g.line, message: 'A plus-one slot must belong to the same household as its host.' });
    else if (host.kind !== 'named') errors.push({ line: g.line, message: 'A plus-one slot must be hosted by a named guest.' });
  }

  // Diff.
  const householdOps = [];
  for (const h of households.values()) {
    const ex = existingHouseholds.get(h.id);
    if (!ex) householdOps.push({ op: 'create', ...h });
    else if (ex.label !== h.label || (ex.contact_email || null) !== (h.contactEmail || null) || ex.state !== 'active') {
      // Never overwrite a guest-supplied contact email with an empty import cell.
      const contactEmail = h.contactEmail || ex.contact_email || null;
      const changes = [];
      if (ex.label !== h.label) changes.push('label');
      if ((ex.contact_email || null) !== contactEmail) changes.push('contactEmail');
      if (ex.state !== 'active') {
        changes.push('state');
        warnings.push({ line: h.line, message: `Household "${h.id}" is revoked and would be reinstated by this import.` });
      }
      if (changes.length) householdOps.push({ op: 'update', ...h, contactEmail, changes });
      else householdOps.push({ op: 'unchanged', id: h.id });
    } else householdOps.push({ op: 'unchanged', id: h.id });
  }
  const missingHouseholds = [...existingHouseholds.keys()].filter((id) => !households.has(id));

  const guestOps = [];
  for (const g of guests.values()) {
    const ex = existingGuests.get(g.id);
    if (!ex) { guestOps.push({ op: 'create', ...g }); continue; }
    const changes = [];
    if (ex.kind !== g.kind) changes.push('kind');
    if ((ex.display_name || null) !== (g.name || null)) changes.push('name');
    if ((ex.host_guest_id || null) !== (g.hostGuestId || null)) changes.push('hostGuestId');
    if (ex.state !== 'active') {
      changes.push('state');
      warnings.push({ line: g.line, message: `Guest "${g.id}" is revoked and would be reinstated by this import.` });
    }
    guestOps.push(changes.length ? { op: 'update', ...g, changes } : { op: 'unchanged', id: g.id });
  }
  const missingGuests = [...existingGuests.values()].filter((g) => !guests.has(g.id) && g.state === 'active').map((g) => g.id);
  for (const id of missingGuests) warnings.push({ line: null, message: `Guest "${id}" exists but is not in this file. It is left unchanged (revoke it explicitly if intended).` });

  const entitlementOps = [];
  for (const key of fileEntitlements) {
    const ex = existingEntByKey.get(key);
    if (!ex) entitlementOps.push({ op: 'create', key });
    else if (ex.revoked_at) entitlementOps.push({ op: 'reinstate', key, id: ex.id });
    else entitlementOps.push({ op: 'unchanged', key, id: ex.id });
  }
  for (const [key, ex] of existingEntByKey) {
    const [gid] = key.split('|');
    if (!guests.has(gid) || ex.revoked_at || fileEntitlements.has(key)) continue;
    entitlementOps.push({ op: 'revoke', key, id: ex.id, hadResponse: responded.has(key) });
    if (responded.has(key)) warnings.push({ line: null, message: `Entitlement ${key} would be revoked although a response exists; the response is retained but hidden from the guest.` });
  }

  const count = (ops, op) => ops.filter((o) => o.op === op).length;
  const summary = {
    households: { create: count(householdOps, 'create'), update: count(householdOps, 'update'), unchanged: count(householdOps, 'unchanged'), missingFromFile: missingHouseholds.length },
    guests: { create: count(guestOps, 'create'), update: count(guestOps, 'update'), unchanged: count(guestOps, 'unchanged'), missingFromFile: missingGuests.length },
    entitlements: { create: count(entitlementOps, 'create'), reinstate: count(entitlementOps, 'reinstate'), revoke: count(entitlementOps, 'revoke'), unchanged: count(entitlementOps, 'unchanged') },
    errors: errors.length,
    warnings: warnings.length,
    responsesTouched: 0,
  };
  return { errors, warnings, households: householdOps, guests: guestOps, entitlements: entitlementOps, missingHouseholds, missingGuests, summary };
}

export async function previewImport(db, csvText, admin) {
  if (typeof csvText !== 'string' || !csvText.trim()) throw new HttpError(400, 'validation', 'Send the CSV as the request body (text/csv).');
  if (csvText.length > 2_000_000) throw new HttpError(413, 'validation', 'CSV is too large.');
  const plan = await buildImportPlan(db, csvText);
  const id = newId('imp');
  const now = nowIso();
  await batch(db, [
    stmt(db, 'INSERT INTO import_batch (id, csv_digest, plan_json, summary_json, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)', id, await sha256Hex(csvText), JSON.stringify(plan), JSON.stringify(plan.summary), admin.email, now),
    audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: 'import.preview', targetType: 'import_batch', targetId: id, details: plan.summary }),
  ]);
  return { batchId: id, canCommit: plan.errors.length === 0, summary: plan.summary, errors: plan.errors, warnings: plan.warnings, households: plan.households, guests: plan.guests, entitlements: plan.entitlements };
}

export async function commitImport(db, batchId, admin) {
  const row = await one(db, 'SELECT * FROM import_batch WHERE id = ?', batchId);
  if (!row) throw new HttpError(404, 'not_found', 'Unknown import batch.');
  if (row.committed_at) throw new HttpError(409, 'conflict', 'This batch was already committed.');
  const plan = JSON.parse(row.plan_json);
  if (plan.errors.length) throw new HttpError(400, 'validation', 'This batch has validation errors and cannot be committed.');
  const now = nowIso();
  const statements = [];

  for (const h of plan.households) {
    if (h.op === 'create') {
      statements.push(stmt(db, 'INSERT INTO household (id, label, contact_email, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', h.id, h.label, h.contactEmail, 'active', now, now));
      statements.push(stmt(db, 'INSERT INTO household_response (household_id, revision) VALUES (?, 0)', h.id));
    } else if (h.op === 'update') {
      statements.push(stmt(db, 'UPDATE household SET label = ?, contact_email = ?, state = ?, updated_at = ? WHERE id = ?', h.label, h.contactEmail, 'active', now, h.id));
    }
  }
  // Named guests before plus-one slots so host references resolve.
  const ordered = [...plan.guests].sort((a, b) => (a.kind === 'plus-one') - (b.kind === 'plus-one'));
  for (const g of ordered) {
    if (g.op === 'create') {
      statements.push(stmt(db, 'INSERT INTO guest (id, household_id, kind, display_name, host_guest_id, sort_order, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', g.id, g.householdId, g.kind, g.name, g.hostGuestId, g.sortOrder, 'active', now, now));
    } else if (g.op === 'update') {
      statements.push(stmt(db, 'UPDATE guest SET kind = ?, display_name = ?, host_guest_id = ?, state = ?, updated_at = ? WHERE id = ?', g.kind, g.name, g.hostGuestId, 'active', now, g.id));
    }
  }
  for (const e of plan.entitlements) {
    const [guestId, eventId] = e.key.split('|');
    if (e.op === 'create') {
      const id = newId('ie');
      statements.push(stmt(db, 'INSERT INTO invitation_entitlement (id, guest_id, event_id, created_at) VALUES (?, ?, ?, ?)', id, guestId, eventId, now));
      statements.push(stmt(db, 'INSERT INTO response (id, entitlement_id, status, revision, updated_at) VALUES (?, ?, ?, 0, ?)', newId('r'), id, 'pending', now));
    } else if (e.op === 'reinstate') {
      statements.push(stmt(db, 'UPDATE invitation_entitlement SET revoked_at = NULL WHERE id = ?', e.id));
    } else if (e.op === 'revoke') {
      statements.push(stmt(db, 'UPDATE invitation_entitlement SET revoked_at = ? WHERE id = ?', now, e.id));
    }
  }
  statements.push(stmt(db, 'UPDATE import_batch SET committed_at = ?, committed_by = ? WHERE id = ?', now, admin.email, batchId));
  statements.push(audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: 'import.commit', targetType: 'import_batch', targetId: batchId, details: plan.summary }));
  await batch(db, statements);
  return { batchId, committedAt: now, summary: plan.summary };
}
