// Builds the session snapshot defined in docs/RSVP_API_CONTRACT.md from a loaded household.
// The browser receives only this household's permitted data (ARCH-01).

import { one } from './db.js';

// Effective RSVP window: the owner-editable 'rsvp-settings' content (if any) overrides the
// RSVP_CUTOFF_AT variable. Both are ISO 8601 with the event-local offset (RSVP-04).
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
  const cutoffMs = cutoffAt ? Date.parse(cutoffAt) : NaN;
  const open = !forcedClosed && !(Number.isFinite(cutoffMs) && now > cutoffMs);
  return { open, cutoffAt: cutoffAt || null };
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
    responses: entitlements.map((e) => ({ guestId: e.guest_id, eventId: e.event_id, status: e.status || 'pending' })),
    notes: notes || '',
    revision: state.revision,
    reference: state.reference || null,
    submittedAt: state.last_submitted_at || null,
    emailQueued: !!state.last_email_queued,
    rsvp: { open: window.open, cutoffAt: window.cutoffAt },
  };
}
