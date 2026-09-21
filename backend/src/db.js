// Thin helpers over the D1 binding. No ORM. All timestamps are ISO 8601 UTC strings.

export function nowIso() {
  return new Date().toISOString();
}

export async function one(db, sql, ...params) {
  return db.prepare(sql).bind(...params).first();
}

export async function all(db, sql, ...params) {
  const { results } = await db.prepare(sql).bind(...params).all();
  return results || [];
}

export async function run(db, sql, ...params) {
  return db.prepare(sql).bind(...params).run();
}

export function stmt(db, sql, ...params) {
  return db.prepare(sql).bind(...params);
}

// A batch is submitted to D1 as one unit; the local emulator (miniflare) executes it inside a
// single SQLite transaction (verified in node_modules/miniflare/dist/src/workers/d1/database.worker.js,
// method #txn). Production D1 documents the same behaviour (publisher claim; see README).
export async function batch(db, statements) {
  if (!statements.length) return [];
  return db.batch(statements);
}

export function audit(db, entry) {
  return stmt(
    db,
    `INSERT INTO audit_event (at, actor_kind, actor_id, action, household_id, target_type, target_id, fields_json, details_json, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.at || nowIso(),
    entry.actorKind,
    entry.actorId,
    entry.action,
    entry.householdId || null,
    entry.targetType || null,
    entry.targetId || null,
    JSON.stringify(entry.fields || []),
    JSON.stringify(entry.details || {}),
    entry.requestId || null,
  );
}

// Loads everything the API needs to know about one household, in one round of queries.
export async function loadHousehold(db, householdId) {
  const household = await one(db, 'SELECT * FROM household WHERE id = ?', householdId);
  if (!household) return null;
  const guests = await all(db, 'SELECT * FROM guest WHERE household_id = ? AND state = ? ORDER BY sort_order, id', householdId, 'active');
  const entitlements = await all(
    db,
    `SELECT ie.id, ie.guest_id, ie.event_id, r.id AS response_id, r.status, r.meal_value, r.submitted_at, r.origin, ev.sort_order, ev.meal_options_json
       FROM invitation_entitlement ie
       JOIN guest g ON g.id = ie.guest_id
       JOIN event ev ON ev.id = ie.event_id
       LEFT JOIN response r ON r.entitlement_id = ie.id
      WHERE g.household_id = ? AND g.state = 'active' AND ie.revoked_at IS NULL
      ORDER BY g.sort_order, g.id, ev.sort_order, ev.id`,
    householdId,
  );
  const state = (await one(db, 'SELECT * FROM household_response WHERE household_id = ?', householdId)) || {
    household_id: householdId, revision: 0, reference: null, first_submitted_at: null, last_submitted_at: null, last_origin: null, last_email_queued: 0,
  };
  const needs = await one(db, 'SELECT note FROM restricted_guest_needs WHERE household_id = ? AND guest_id IS NULL', householdId);
  return { household, guests, entitlements, state, notes: needs ? needs.note : '' };
}

export async function loadEvents(db) {
  return all(db, 'SELECT * FROM event ORDER BY sort_order, id');
}
