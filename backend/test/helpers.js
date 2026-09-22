// Shared fixtures: synthetic guests only (DATA-03). The roster matches the PRD's acceptance
// fixture mix: an individual, a couple, a family, an authorised plus-one and a guest invited to
// only one event.
import { env, SELF } from 'cloudflare:test';

export const OWNER = 'owner@example.invalid';
export const COORDINATOR = 'coordinator@example.invalid';
export const BASE = 'https://api.robertandnatalie.wedding';

export const ROSTER_CSV = [
  'household_id,household_label,household_contact_email,guest_id,guest_kind,guest_name,host_guest_id,events',
  'hh_example,The Example Household,,g_alex,named,Alex Example,,ceremony|reception',
  'hh_example,The Example Household,,g_sam,named,Sam Example,,ceremony|reception',
  'hh_example,The Example Household,,g_alex_guest,plus-one,,g_alex,ceremony|reception',
  'hh_example,The Example Household,,g_jordan,named,Jordan Example,,reception',
  'hh_solo,Taylor Sample,,g_taylor,named,Taylor Sample,,ceremony|reception',
  'hh_family,The Sample Family,,g_morgan,named,Morgan Sample,,ceremony|reception',
  'hh_family,The Sample Family,,g_riley,named,Riley Sample,,ceremony|reception',
  'hh_family,The Sample Family,,g_casey,named,Casey Sample,,ceremony|reception',
  '',
].join('\n');

const TABLES = [
  'audit_event', 'coordinator_alert', 'mail_outbox', 'idempotency_record', 'content_version', 'rate_limit', 'session',
  'access_credential', 'restricted_guest_needs', 'response_history', 'response', 'household_revision', 'household_response',
  'invitation_entitlement', 'guest', 'household', 'import_batch', 'event',
];

export async function resetDb() {
  // guest.host_guest_id is ON DELETE RESTRICT, which SQLite checks per row: remove plus-one slots first.
  const statements = [];
  for (const t of TABLES) {
    if (t === 'guest') statements.push(env.DB.prepare("DELETE FROM guest WHERE kind = 'plus-one'"));
    statements.push(env.DB.prepare(`DELETE FROM ${t}`));
  }
  await env.DB.batch(statements);
}

export function admin(email, method, path, { body, contentType, headers } = {}) {
  const h = { 'x-dev-access-email': email, 'X-Requested-With': 'rsvp-admin', ...(headers || {}) };
  let payload;
  if (body !== undefined) {
    if (contentType) { h['Content-Type'] = contentType; payload = body; } else { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  }
  return SELF.fetch(`${BASE}${path}`, { method, headers: h, body: payload });
}

export async function seedEvents() {
  const config = JSON.parse(env.TEST_SITE_CONFIG);
  const res = await admin(OWNER, 'PUT', '/admin/events', { body: config });
  if (res.status !== 200) throw new Error(`seedEvents failed: ${res.status} ${await res.text()}`);
}

export async function importRoster(csv = ROSTER_CSV) {
  const preview = await admin(OWNER, 'POST', '/admin/import/preview', { body: csv, contentType: 'text/csv' });
  const plan = await preview.json();
  if (preview.status !== 200 || !plan.canCommit) throw new Error(`import preview failed: ${preview.status} ${JSON.stringify(plan.errors || plan)}`);
  const commit = await admin(OWNER, 'POST', '/admin/import/commit', { body: { batchId: plan.batchId } });
  if (commit.status !== 200) throw new Error(`import commit failed: ${commit.status} ${await commit.text()}`);
  return plan;
}

export async function issue(householdId, kind = 'code') {
  const res = await admin(OWNER, 'POST', `/admin/households/${householdId}/credentials`, { body: { kind, label: 'test' } });
  if (res.status !== 201) throw new Error(`issue failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function openSession(code, extraHeaders) {
  const res = await SELF.fetch(`${BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://robertandnatalie.wedding', ...(extraHeaders || {}) },
    body: JSON.stringify({ code }),
  });
  const setCookie = res.headers.get('Set-Cookie') || '';
  const cookie = setCookie.split(';')[0];
  return { res, cookie, snapshot: res.status === 200 ? await res.json() : null };
}

export function guest(cookie, method, path, body) {
  const headers = { Cookie: cookie, Origin: 'https://robertandnatalie.wedding' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return SELF.fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

// Fresh database with events, roster and one code for hh_example. Returns an open session.
export async function freshSession(householdId = 'hh_example') {
  await resetDb();
  await seedEvents();
  await importRoster();
  const cred = await issue(householdId, 'code');
  const opened = await openSession(cred.secret);
  if (opened.res.status !== 200) throw new Error(`session failed: ${opened.res.status}`);
  return { ...opened, cred };
}

export function fullAnswer(snapshot, status = 'attending', overrides = {}) {
  return {
    requestId: crypto.randomUUID(),
    revision: snapshot.revision,
    responses: snapshot.entitlements.map((e) => ({ guestId: e.guestId, eventId: e.eventId, status })),
    plusOneNames: status === 'attending' ? { g_alex_guest: 'Casey Example' } : {},
    contactEmail: status === 'attending' ? 'alex@example.invalid' : '',
    notes: status === 'attending' ? 'Vegetarian, please.' : '',
    ...overrides,
  };
}

export async function count(sql, ...params) {
  const row = await env.DB.prepare(sql).bind(...params).first();
  return row ? row.n : 0;
}
