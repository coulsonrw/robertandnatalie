// Public party directory for the name-picker RSVP flow.
// One row per active household: the invitation label and party id only.
// Never emails, phones, addresses, notes, answers or individual guest names.

import { json } from './http.js';
import { all } from './db.js';
import { enforceIpRateLimit } from './ratelimit.js';

const DIRECTORY_QUERY = `
  SELECT h.label AS name, h.id AS partyId
    FROM household h
   WHERE h.state = 'active'
     AND h.label IS NOT NULL
     AND TRIM(h.label) != ''
   ORDER BY h.label COLLATE NOCASE, h.id
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
