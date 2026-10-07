// Public guest-name directory for the name-picker RSVP flow.
// Returns only display names and party (household) ids — never emails, phones,
// addresses, notes, answers or plus-one slots without a roster name.

import { json } from './http.js';
import { all } from './db.js';
import { enforceIpRateLimit } from './ratelimit.js';

const DIRECTORY_QUERY = `
  SELECT g.display_name AS name, g.household_id AS partyId
    FROM guest g
    JOIN household h ON h.id = g.household_id
   WHERE g.kind = 'named'
     AND g.state = 'active'
     AND h.state = 'active'
     AND g.display_name IS NOT NULL
     AND TRIM(g.display_name) != ''
   ORDER BY g.display_name COLLATE NOCASE, g.household_id, g.id
`;

export async function listPublicGuests(request, env, cfg) {
  await enforceIpRateLimit(env.DB, cfg, request, 'dir', cfg.rateLimit.perDirectory);
  const rows = await all(env.DB, DIRECTORY_QUERY);
  const guests = rows.map((row) => ({
    name: String(row.name),
    partyId: String(row.partyId),
  }));
  return json(200, { guests }, { 'Cache-Control': 'public, max-age=60' });
}
