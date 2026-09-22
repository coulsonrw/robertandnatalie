// Builds the session snapshot defined in docs/RSVP_API_CONTRACT.md from a loaded household.
// The browser receives only this household's permitted data (ARCH-01).

import { one } from './db.js';
import { mealOptionsOf } from './events.js';

// A cutoff must carry its own UTC offset (or Z) so it means the same instant everywhere; a bare
// local time would be read in the Worker's clock (UTC), not the event's (RSVP-04, QA-19).
const CUTOFF_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

// Returns the cutoff instant in ms, or NaN when the value is absent or malformed.
export function parseCutoff(value) {
  if (typeof value !== 'string' || !CUTOFF_RE.test(value)) return NaN;
  return Date.parse(value);
}

// Effective RSVP window: the owner-editable 'rsvp-settings' content (if any) overrides the
// RSVP_CUTOFF_AT variable. Both are ISO 8601 with the event-local offset (RSVP-04). A cutoff
// that is configured but malformed closes the window (fail closed) and is flagged as
// `cutoffInvalid` for /admin/status; the guest snapshot only ever sees { open, cutoffAt }.
export async function rsvpWindow(db, cfg, now = Date.now()) {
  let cutoffAt = cfg.rsvpCutoffAt || null;
  let forcedClosed = false;
  const row = await one(db, 'SELECT body_json FROM content_version WHERE key = ? AND is_current = 1', 'rsvp-settings');
  if (row) {
    try {
      const body = JSON.parse(row.body_json);
      if (typeof body.cutoffAt === 'string' && body.cutoffAt) cutoffAt = body.cutoffAt;
      if (body.open === false) forcedClosed = true;
    } catch {
      // ignore malformed settings; fall back to configuration
    }
  }
  const cutoffMs = cutoffAt ? parseCutoff(cutoffAt) : NaN;
  const cutoffInvalid = !!cutoffAt && !Number.isFinite(cutoffMs);
  const open = !forcedClosed && !cutoffInvalid && !(Number.isFinite(cutoffMs) && now > cutoffMs);
  const window = { open, cutoffAt: cutoffAt || null };
  if (cutoffInvalid) window.cutoffInvalid = true;
  return window;
}

export function buildSnapshot(loaded, window) {
  const { household, guests, entitlements, state, notes } = loaded;
  return {
    household: {
      id: household.id,
      label: household.label,
      contactEmail: household.contact_email || '',
      guests: guests.map((g) => (g.kind === 'plus-one'
        ? { id: g.id, kind: 'plus-one', hostGuestId: g.host_guest_id, name: g.plus_one_name || null }
        : { id: g.id, kind: 'named', name: g.display_name })),
    },
    entitlements: entitlements.map((e) => ({ guestId: e.guest_id, eventId: e.event_id })),
    responses: entitlements.map((e) => {
      const r = { guestId: e.guest_id, eventId: e.event_id, status: e.status || 'pending' };
      if (mealOptionsOf(e)) r.meal = e.meal_value || null; // present only where meals are configured
      return r;
    }),
    notes: notes || '',
    revision: state.revision,
    reference: state.reference || null,
    submittedAt: state.last_submitted_at || null,
    emailQueued: !!state.last_email_queued,
    rsvp: { open: window.open, cutoffAt: window.cutoffAt },
  };
}
