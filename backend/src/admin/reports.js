// Reporting and exports (ADMIN-03, SEC-05). Counts are derived from entitlements and responses,
// never from editable totals (DATA-01). People are counted per event, not invitations.

import { all, loadEvents } from '../db.js';
import { toCsv } from '../csv.js';

const ROWS_SQL = `
  SELECT h.id AS household_id, h.label AS household_label, h.contact_email, h.state AS household_state,
         g.id AS guest_id, g.kind AS guest_kind, g.display_name, g.plus_one_name, g.host_guest_id, g.sort_order AS guest_order,
         ie.id AS entitlement_id, ie.event_id, ev.label AS event_label, ev.sort_order AS event_order,
         COALESCE(r.status, 'pending') AS status, r.meal_value, r.submitted_at, r.origin,
         hr.revision, hr.reference, hr.last_submitted_at
    FROM invitation_entitlement ie
    JOIN guest g ON g.id = ie.guest_id
    JOIN household h ON h.id = g.household_id
    JOIN event ev ON ev.id = ie.event_id
    LEFT JOIN response r ON r.entitlement_id = ie.id
    LEFT JOIN household_response hr ON hr.household_id = h.id
   WHERE ie.revoked_at IS NULL AND g.state = 'active' AND h.state = 'active'
   ORDER BY h.label, h.id, g.sort_order, g.id, ev.sort_order, ev.id`;

function guestName(row) {
  return row.guest_kind === 'plus-one' ? (row.plus_one_name || '') : row.display_name;
}

export function householdStatus(rows) {
  const answered = rows.filter((r) => r.status !== 'pending').length;
  if (answered === 0) return 'no_response';
  if (answered < rows.length) return 'incomplete';
  return 'complete';
}

export async function eventReport(db) {
  const events = await loadEvents(db);
  const rows = await all(db, ROWS_SQL);
  return events.map((ev) => {
    const mine = rows.filter((r) => r.event_id === ev.id);
    return {
      eventId: ev.id,
      label: ev.label,
      name: ev.name,
      startsAtLocal: ev.starts_at_local,
      timezone: ev.timezone,
      people: {
        entitled: mine.length,
        attending: mine.filter((r) => r.status === 'attending').length,
        declining: mine.filter((r) => r.status === 'declining').length,
        pending: mine.filter((r) => r.status === 'pending').length,
      },
    };
  });
}

export async function householdReport(db, { status } = {}) {
  const rows = await all(db, ROWS_SQL);
  const byHousehold = new Map();
  for (const r of rows) {
    if (!byHousehold.has(r.household_id)) byHousehold.set(r.household_id, { rows: [] });
    byHousehold.get(r.household_id).rows.push(r);
  }
  const out = [];
  for (const [id, { rows: hr }] of byHousehold) {
    const st = householdStatus(hr);
    if (status && !status.split(',').includes(st)) continue;
    const guests = new Map();
    for (const r of hr) {
      if (!guests.has(r.guest_id)) guests.set(r.guest_id, { id: r.guest_id, kind: r.guest_kind, name: guestName(r), hostGuestId: r.host_guest_id, responses: {} });
      guests.get(r.guest_id).responses[r.event_id] = r.status;
    }
    out.push({
      id,
      label: hr[0].household_label,
      contactEmail: hr[0].contact_email || '',
      status: st,
      revision: hr[0].revision ?? 0,
      reference: hr[0].reference || null,
      lastSubmittedAt: hr[0].last_submitted_at || null,
      pairs: hr.length,
      answered: hr.filter((r) => r.status !== 'pending').length,
      guests: [...guests.values()],
    });
  }
  return out;
}

export async function peopleReport(db) {
  const rows = await all(db, ROWS_SQL);
  return rows.map((r) => ({
    householdId: r.household_id,
    householdLabel: r.household_label,
    guestId: r.guest_id,
    guestKind: r.guest_kind,
    guestName: guestName(r),
    eventId: r.event_id,
    eventLabel: r.event_label,
    status: r.status,
    meal: r.meal_value || null,
    submittedAt: r.submitted_at || null,
    origin: r.origin || null,
  }));
}

// General export: attendance by guest and event, authorised plus-one names, meal values.
// Excludes restricted notes by construction (the query never joins restricted_guest_needs).
export async function generalExportCsv(db, { exportedAt, exportedBy }) {
  const rows = await all(db, ROWS_SQL);
  const byHousehold = new Map();
  for (const r of rows) {
    if (!byHousehold.has(r.household_id)) byHousehold.set(r.household_id, []);
    byHousehold.get(r.household_id).push(r);
  }
  const header = ['household_id', 'household_label', 'household_status', 'contact_email', 'guest_id', 'guest_kind', 'guest_name', 'host_guest_id', 'event_id', 'event_label', 'status', 'meal', 'submitted_at', 'origin', 'reference', 'exported_at', 'exported_by'];
  const out = rows.map((r) => ({
    household_id: r.household_id,
    household_label: r.household_label,
    household_status: householdStatus(byHousehold.get(r.household_id)),
    contact_email: r.contact_email || '',
    guest_id: r.guest_id,
    guest_kind: r.guest_kind,
    guest_name: guestName(r),
    host_guest_id: r.host_guest_id || '',
    event_id: r.event_id,
    event_label: r.event_label,
    status: r.status,
    meal: r.meal_value || '',
    submitted_at: r.submitted_at || '',
    origin: r.origin || '',
    reference: r.reference || '',
    exported_at: exportedAt,
    exported_by: exportedBy,
  }));
  return toCsv(header, out);
}

// Restricted export (SEC-05): notes only, for named recipients. Audited by the caller.
export async function restrictedExportCsv(db, { exportedAt, exportedBy }) {
  const rows = await all(
    db,
    `SELECT n.household_id, h.label AS household_label, n.guest_id, g.display_name, g.plus_one_name, n.note, n.allowed_recipients, n.retention_until, n.updated_at
       FROM restricted_guest_needs n
       JOIN household h ON h.id = n.household_id
       LEFT JOIN guest g ON g.id = n.guest_id
      ORDER BY h.label, n.household_id, n.guest_id`,
  );
  const header = ['household_id', 'household_label', 'guest_id', 'guest_name', 'note', 'allowed_recipients', 'retention_until', 'updated_at', 'exported_at', 'exported_by'];
  return toCsv(header, rows.map((r) => ({
    household_id: r.household_id,
    household_label: r.household_label,
    guest_id: r.guest_id || '',
    guest_name: r.guest_id ? (r.display_name || r.plus_one_name || '') : '(household)',
    note: r.note,
    allowed_recipients: r.allowed_recipients,
    retention_until: r.retention_until,
    updated_at: r.updated_at,
    exported_at: exportedAt,
    exported_by: exportedBy,
  })));
}
