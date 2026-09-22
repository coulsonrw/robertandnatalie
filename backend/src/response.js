// PUT /response (RSVP-01..07, ARCH-03, SEC-05) and the shared save routine that the admin
// correction endpoint reuses.
//
// Validation is deny-by-default: every guest/event id in the payload must belong to the session's
// household and appear in its entitlements; every entitled pair must be answered. Plus-one names
// are required only when the slot attends. The save is one D1 batch that also inserts the
// idempotency record, the revision guard row, the mail-outbox row and the audit event.

import { HttpError, json, validationError } from './http.js';
import { newId, newReference } from './crypto.js';
import { one, stmt, batch, audit, nowIso, loadHousehold, loadEvents } from './db.js';
import { buildSnapshot, rsvpWindow } from './snapshot.js';
import { requireSession } from './session.js';
import { confirmationMail } from './mail/templates.js';
import { retentionDueAt } from './retention.js';
import { mealOptionsOf } from './events.js';

const STATUSES = new Set(['attending', 'declining']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_NOTES = 500;
const MAX_NAME = 80;

function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Validates a guest payload against the loaded household. Returns the normalised change set.
// `partial` (admin corrections) allows answering only some pairs.
//
// Two classes of problem (QA-15): structural or authorisation problems (wrong types, an id that
// is not part of this invitation, a duplicate) fail immediately and name no foreign id; problems a
// guest can fix at an input (an unanswered pair, a missing plus-one name or meal, a bad email) are
// collected and returned together as error.fields = [{ path, message }].
export function validatePayload(payload, loaded, { partial = false } = {}) {
  const problems = [];
  const problem = (path, message) => problems.push({ path, message });
  const fail = (path, message) => validationError(message, [{ path, message }]);
  const entitledByKey = new Map();
  for (const e of loaded.entitlements) entitledByKey.set(`${e.guest_id}|${e.event_id}`, e);
  const guestsById = new Map(loaded.guests.map((g) => [g.id, g]));

  if (!Array.isArray(payload.responses)) throw fail('responses', 'responses must be an array.');
  const answered = new Map();
  const meals = new Map(); // key -> meal value or null, for answered pairs only
  for (const r of payload.responses) {
    if (!isPlainObject(r) || typeof r.guestId !== 'string' || typeof r.eventId !== 'string') {
      throw fail('responses', 'Each response needs guestId, eventId and status.');
    }
    const key = `${r.guestId}|${r.eventId}`;
    if (!entitledByKey.has(key)) {
      // Cross-household or uninvited pair: refuse without saying which (SEC-03).
      throw fail('responses', 'One of the answers is not part of this invitation.');
    }
    const path = `responses.${r.guestId}.${r.eventId}`;
    if (!STATUSES.has(r.status)) throw fail(`${path}.status`, 'Each answer must be attending or declining.');
    if (answered.has(key)) throw fail(`${path}.status`, 'Duplicate answer for the same guest and event.');
    answered.set(key, r.status);
    // Meal choice: only where the event has configured options, only for attending guests,
    // only from the configured list (RSVP-03, DATA-02). Ignored (stored NULL) otherwise.
    const options = mealOptionsOf(entitledByKey.get(key));
    if (r.meal !== undefined && r.meal !== null && typeof r.meal !== 'string') throw fail(`${path}.meal`, 'meal must be text.');
    if (options && r.status === 'attending') {
      const meal = typeof r.meal === 'string' ? r.meal.trim() : '';
      if (meal && !options.includes(meal)) problem(`${path}.meal`, 'That meal choice is not one of the options.');
      else if (!meal && !partial) problem(`${path}.meal`, 'Please choose a meal for this guest.');
      // A partial (admin) correction that names no meal keeps the stored choice (commitResponse
      // falls back to the existing value for attending guests) instead of clearing it.
      else if (meal || !partial) meals.set(key, meal || null);
    } else {
      if (r.meal && !options) throw fail(`${path}.meal`, 'Meal choices are not collected for that event.');
      meals.set(key, null);
    }
  }
  if (!partial) {
    for (const [key, e] of entitledByKey) {
      if (!answered.has(key)) problem(`responses.${e.guest_id}.${e.event_id}.status`, 'Please choose attending or declining.');
    }
  }

  // Effective status per guest after this save (for plus-one and email rules).
  const attendingGuests = new Set();
  for (const e of loaded.entitlements) {
    const key = `${e.guest_id}|${e.event_id}`;
    const status = answered.has(key) ? answered.get(key) : (e.status || 'pending');
    if (status === 'attending') attendingGuests.add(e.guest_id);
  }

  const plusOneNames = isPlainObject(payload.plusOneNames) ? payload.plusOneNames : {};
  const nameUpdates = new Map();
  for (const [gid, name] of Object.entries(plusOneNames)) {
    const g = guestsById.get(gid);
    // Not a plus-one slot of this household (a named guest, a child, or a foreign/unknown id):
    // there is no capacity to expand (RSVP-02), and the id is not echoed back.
    if (!g || g.kind !== 'plus-one') throw fail('plusOneNames', 'A guest name was given for someone not on this invitation.');
    if (typeof name !== 'string') throw fail(`plusOneNames.${gid}`, 'Guest names must be text.');
    nameUpdates.set(gid, name.trim().slice(0, MAX_NAME));
  }
  for (const g of loaded.guests) {
    if (g.kind !== 'plus-one') continue;
    if (attendingGuests.has(g.id)) {
      const name = nameUpdates.has(g.id) ? nameUpdates.get(g.id) : (g.plus_one_name || '');
      if (!name || name.trim().length < 2) problem(`plusOneNames.${g.id}`, 'Please enter the name of the guest who will attend.');
      else nameUpdates.set(g.id, name.trim());
    } else {
      nameUpdates.set(g.id, null); // slot not used: no name is kept (RSVP-02)
    }
  }

  // A partial (admin) correction that omits contactEmail keeps the household's stored address;
  // only an explicit value (including '') changes it (RSVP-04: no silent overwrite).
  let contactEmail = payload.contactEmail === undefined || payload.contactEmail === null
    ? (partial ? (loaded.household.contact_email || '') : '')
    : payload.contactEmail;
  if (typeof contactEmail !== 'string') throw fail('contactEmail', 'contactEmail must be text.');
  contactEmail = contactEmail.trim();
  const anyoneAttending = attendingGuests.size > 0;
  if (contactEmail.length > 254 || (contactEmail && !EMAIL_RE.test(contactEmail))) {
    problem('contactEmail', 'Please enter a valid email address.');
  } else if (anyoneAttending && !contactEmail && !partial) {
    problem('contactEmail', 'A contact email is needed so we can confirm your response.');
  }

  let notes = payload.notes === undefined || payload.notes === null ? '' : payload.notes;
  if (typeof notes !== 'string') throw fail('notes', 'notes must be text.');
  notes = notes.trim().slice(0, MAX_NOTES);
  if (!anyoneAttending) notes = ''; // declining households skip practical details (RSVP-03)

  if (problems.length) {
    const message = problems.length === 1 ? problems[0].message : `${problems.length} answers need attention. Please review them and try again.`;
    throw validationError(message, problems);
  }
  return { answered, meals, nameUpdates, contactEmail, notes, anyoneAttending };
}

// Replayed idempotency bodies are stored without the restricted note; attach the household's current note.
async function withCurrentNotes(db, householdId, body) {
  if (!body || typeof body !== 'object') return body;
  const row = await one(db, 'SELECT note FROM restricted_guest_needs WHERE household_id = ? AND guest_id IS NULL', householdId);
  return { ...body, notes: row ? row.note : '' };
}

function attendanceSummary(loaded, answered, events, nameUpdates) {
  const guestsById = new Map(loaded.guests.map((g) => [g.id, g]));
  const byEvent = new Map(events.map((ev) => [ev.id, { event: ev, attending: [], declining: [] }]));
  for (const e of loaded.entitlements) {
    const key = `${e.guest_id}|${e.event_id}`;
    const status = answered.has(key) ? answered.get(key) : (e.status || 'pending');
    const g = guestsById.get(e.guest_id);
    const bucket = byEvent.get(e.event_id);
    if (!g || !bucket) continue;
    const name = g.kind === 'plus-one' ? (nameUpdates.get(g.id) || g.plus_one_name || 'Guest') : g.display_name;
    if (status === 'attending') bucket.attending.push(name);
    else if (status === 'declining') bucket.declining.push(name);
  }
  return Array.from(byEvent.values());
}

// Commits a validated change set. Returns the new snapshot. Throws HttpError(409) with the latest
// snapshot if the revision guard fails, or returns the stored result if requestId was already
// committed (a concurrent retry).
export async function commitResponse({ env, cfg, loaded, change, expectedRevision, requestId, origin, actor, reason, retention }) {
  const db = env.DB;
  const now = nowIso();
  const nextRevision = expectedRevision + 1;
  const events = await loadEvents(db);
  const statements = [];
  const changedFields = [];
  const statusChanges = {};

  statements.push(stmt(db, 'INSERT INTO household_revision (household_id, revision, committed_at, origin) VALUES (?, ?, ?, ?)', loaded.household.id, nextRevision, now, origin));

  for (const e of loaded.entitlements) {
    const key = `${e.guest_id}|${e.event_id}`;
    if (!change.answered.has(key)) continue;
    const status = change.answered.get(key);
    const previous = e.status || 'pending';
    const meal = change.meals && change.meals.has(key) ? change.meals.get(key) : (status === 'attending' ? (e.meal_value || null) : null);
    if (e.response_id) {
      statements.push(stmt(db, 'UPDATE response SET status = ?, meal_value = ?, revision = ?, submitted_at = ?, origin = ?, updated_at = ? WHERE entitlement_id = ?', status, meal, nextRevision, now, origin, now, e.id));
    } else {
      statements.push(stmt(db, 'INSERT INTO response (id, entitlement_id, status, meal_value, revision, submitted_at, origin, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', newId('r'), e.id, status, meal, nextRevision, now, origin, now));
    }
    if ((e.meal_value || null) !== meal && !changedFields.includes('meals')) changedFields.push('meals');
    if (previous !== status) {
      statements.push(stmt(db, 'INSERT INTO response_history (entitlement_id, previous_status, new_status, revision, origin, actor, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', e.id, previous, status, nextRevision, origin, actor.id, now));
      statusChanges[key] = { from: previous, to: status };
    }
  }
  if (Object.keys(statusChanges).length) changedFields.push('responses');

  for (const [gid, name] of change.nameUpdates) {
    const g = loaded.guests.find((x) => x.id === gid);
    if ((g.plus_one_name || null) !== name) {
      statements.push(stmt(db, 'UPDATE guest SET plus_one_name = ?, updated_at = ? WHERE id = ? AND household_id = ?', name, now, gid, loaded.household.id));
      if (!changedFields.includes('plusOneNames')) changedFields.push('plusOneNames');
    }
  }

  if ((loaded.household.contact_email || '') !== change.contactEmail) {
    statements.push(stmt(db, 'UPDATE household SET contact_email = ?, updated_at = ? WHERE id = ?', change.contactEmail || null, now, loaded.household.id));
    changedFields.push('contactEmail');
  }

  if ((loaded.notes || '') !== change.notes) {
    statements.push(stmt(db, 'DELETE FROM restricted_guest_needs WHERE household_id = ? AND guest_id IS NULL', loaded.household.id));
    if (change.notes) {
      statements.push(stmt(db, 'INSERT INTO restricted_guest_needs (id, household_id, guest_id, note, retention_until, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?)', newId('rn'), loaded.household.id, change.notes, retention, now, now));
    }
    changedFields.push('notes'); // field name only; the text never enters the audit trail (SEC-05)
  }

  const reference = loaded.state.reference || newReference();
  const emailQueued = !!change.contactEmail;
  const hasState = !!(await one(db, 'SELECT 1 AS x FROM household_response WHERE household_id = ?', loaded.household.id));
  if (hasState) {
    statements.push(stmt(
      db,
      `UPDATE household_response SET revision = ?, reference = COALESCE(reference, ?), first_submitted_at = COALESCE(first_submitted_at, ?),
         last_submitted_at = ?, last_origin = ?, last_email_queued = ? WHERE household_id = ? AND revision = ?`,
      nextRevision, reference, now, now, origin, emailQueued ? 1 : 0, loaded.household.id, expectedRevision,
    ));
  } else {
    statements.push(stmt(
      db,
      `INSERT INTO household_response (household_id, revision, reference, first_submitted_at, last_submitted_at, last_origin, last_email_queued) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      loaded.household.id, nextRevision, reference, now, now, origin, emailQueued ? 1 : 0,
    ));
  }

  // The snapshot the caller will receive: computed from the same values the batch writes.
  const after = {
    household: { ...loaded.household, contact_email: change.contactEmail || null },
    guests: loaded.guests.map((g) => (change.nameUpdates.has(g.id) ? { ...g, plus_one_name: change.nameUpdates.get(g.id) } : g)),
    entitlements: loaded.entitlements.map((e) => {
      const key = `${e.guest_id}|${e.event_id}`;
      if (!change.answered.has(key)) return e;
      const status = change.answered.get(key);
      const meal = change.meals && change.meals.has(key) ? change.meals.get(key) : (status === 'attending' ? (e.meal_value || null) : null);
      return { ...e, status, meal_value: meal, submitted_at: now, origin };
    }),
    state: { ...loaded.state, revision: nextRevision, reference, first_submitted_at: loaded.state.first_submitted_at || now, last_submitted_at: now, last_origin: origin, last_email_queued: emailQueued ? 1 : 0 },
    notes: change.notes,
  };
  const snapshot = buildSnapshot(after, await rsvpWindow(db, cfg));

  if (emailQueued) {
    const mail = confirmationMail(cfg, { reference, events, summary: attendanceSummary(loaded, change.answered, events, change.nameUpdates), householdLabel: loaded.household.label });
    statements.push(stmt(
      db,
      `INSERT INTO mail_outbox (id, household_id, kind, to_email, subject, body_text, dedupe_key, state, attempts, next_attempt_at, created_at)
       VALUES (?, ?, 'confirmation', ?, ?, ?, ?, 'queued', 0, ?, ?)`,
      newId('m'), loaded.household.id, change.contactEmail, mail.subject, mail.text, `confirmation:${loaded.household.id}:${nextRevision}`, now, now,
    ));
  }

  if (requestId) {
    // The stored replay body never carries the restricted note (SEC-05); it is re-attached on replay.
    statements.push(stmt(db, 'INSERT INTO idempotency_record (household_id, request_id, status_code, response_json, created_at) VALUES (?, ?, 200, ?, ?)', loaded.household.id, requestId, JSON.stringify({ ...snapshot, notes: '' }), now));
  }

  statements.push(audit(db, {
    at: now,
    actorKind: actor.kind,
    actorId: actor.id,
    action: origin === 'guest' ? 'response.save' : 'response.correct',
    householdId: loaded.household.id,
    targetType: 'household_response',
    targetId: loaded.household.id,
    fields: changedFields,
    details: { revision: nextRevision, origin, statusChanges, emailQueued, reason: reason || undefined },
    requestId: requestId || null,
  }));

  try {
    await batch(db, statements);
  } catch (err) {
    // The batch was rolled back. Either a concurrent retry with the same requestId won, or a
    // concurrent save took this revision.
    if (requestId) {
      const stored = await one(db, 'SELECT response_json FROM idempotency_record WHERE household_id = ? AND request_id = ?', loaded.household.id, requestId);
      if (stored) return withCurrentNotes(db, loaded.household.id, JSON.parse(stored.response_json));
    }
    const fresh = await loadHousehold(db, loaded.household.id);
    if (fresh && fresh.state.revision !== expectedRevision) {
      throw new HttpError(409, 'conflict', 'This response was updated from another device.', { latest: buildSnapshot(fresh, await rsvpWindow(db, cfg)) });
    }
    throw err;
  }
  return snapshot;
}


export async function putResponse(request, env, cfg, payload) {
  const { householdId } = await requireSession(request, env, cfg);
  const db = env.DB;

  if (typeof payload.requestId !== 'string' || !/^[A-Za-z0-9-]{8,128}$/.test(payload.requestId)) {
    throw validationError('requestId is required.', [{ path: 'requestId', message: 'requestId is required.' }]);
  }
  if (!Number.isInteger(payload.revision) || payload.revision < 0) {
    throw validationError('revision is required.', [{ path: 'revision', message: 'revision is required.' }]);
  }

  // Idempotent retry (RSVP-05): return the stored result, no second write.
  const stored = await one(db, 'SELECT status_code, response_json FROM idempotency_record WHERE household_id = ? AND request_id = ?', householdId, payload.requestId);
  if (stored) return json(stored.status_code, await withCurrentNotes(db, householdId, JSON.parse(stored.response_json)));

  const window = await rsvpWindow(db, cfg);
  if (!window.open) throw new HttpError(423, 'closed', 'Online responses have closed.');

  const loaded = await loadHousehold(db, householdId);
  if (!loaded) throw new HttpError(401, 'invalid_session', 'Your session has ended.');
  if (payload.revision !== loaded.state.revision) {
    throw new HttpError(409, 'conflict', 'This response was updated from another device.', { latest: buildSnapshot(loaded, window) });
  }

  const change = validatePayload(payload, loaded);
  const snapshot = await commitResponse({
    env, cfg, loaded, change,
    expectedRevision: loaded.state.revision,
    requestId: payload.requestId,
    origin: 'guest',
    actor: { kind: 'guest', id: householdId },
    retention: retentionDueAt(cfg),
  });
  return json(200, snapshot);
}
