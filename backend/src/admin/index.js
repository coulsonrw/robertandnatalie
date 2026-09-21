// Admin routes under /admin (ADMIN-01..04). Every route requires an Access-authenticated staff
// identity (or the documented local bypass) and a role; mutations also require the
// X-Requested-With header. All responses are private, no-store.

import { HttpError, json, text, readJson } from '../http.js';
import { one, all, stmt, batch, audit, nowIso, loadHousehold, loadEvents } from '../db.js';
import { buildSnapshot, rsvpWindow } from '../snapshot.js';
import { requireAdmin, requireAdminMutationHeader } from './auth.js';
import { previewImport, commitImport } from './importer.js';
import { eventReport, householdReport, peopleReport, generalExportCsv, restrictedExportCsv } from './reports.js';
import { issueCredential, revokeCredential, setHouseholdState, listCredentials } from './credentials.js';
import { currentContent, contentHistory, publishContent, rollbackContent, CONTENT_KEYS } from './content.js';
import { validatePayload, commitResponse } from '../response.js';
import { processOutbox, outboxSummary } from '../mail/outbox.js';
import { applyRetention, retentionDueAt } from '../retention.js';
import { normaliseEvents, UPSERT_EVENT_SQL, eventParams } from '../events.js';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function match(pattern, pathname) {
  const p = pattern.split('/');
  const s = pathname.split('/');
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) {
      if (!ID_RE.test(s[i]) && !/^[a-z0-9-]{1,64}$/.test(s[i])) return null;
      params[p[i].slice(1)] = decodeURIComponent(s[i]);
    } else if (p[i] !== s[i]) return null;
  }
  return params;
}

function csvResponse(body, filename) {
  return text(200, body, 'text/csv; charset=utf-8', { 'Content-Disposition': `attachment; filename="${filename}"` });
}

export async function handleAdmin(request, env, cfg, url) {
  const db = env.DB;
  const method = request.method.toUpperCase();
  const path = url.pathname;
  requireAdminMutationHeader(request);
  const coordinator = () => requireAdmin(request, cfg, 'coordinator');
  const owner = () => requireAdmin(request, cfg, 'owner');
  let m;

  // ---- status ----
  if (method === 'GET' && path === '/admin/status') {
    const admin = await coordinator();
    const window = await rsvpWindow(db, cfg);
    return json(200, {
      you: admin,
      rsvp: window,
      retention: { days: cfg.retentionDaysAfterWedding, dueAt: retentionDueAt(cfg) },
      mail: await outboxSummary(db),
      alerts: (await one(db, 'SELECT COUNT(*) AS n FROM coordinator_alert WHERE acknowledged_at IS NULL'))?.n ?? 0,
      events: await loadEvents(db),
    });
  }

  // ---- events (owner): body is the site.config.json shape ----
  if (method === 'PUT' && path === '/admin/events') {
    const admin = await owner();
    const events = normaliseEvents(await readJson(request));
    const now = nowIso();
    await batch(db, [
      ...events.map((ev) => stmt(db, UPSERT_EVENT_SQL, ...eventParams(ev, now))),
      audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action: 'events.sync', targetType: 'event', details: { ids: events.map((e) => e.id) } }),
    ]);
    return json(200, { events: await loadEvents(db) });
  }

  // ---- import (owner) ----
  if (method === 'POST' && path === '/admin/import/preview') {
    const admin = await owner();
    const type = (request.headers.get('Content-Type') || '').toLowerCase();
    if (!type.startsWith('text/csv') && !type.startsWith('text/plain')) throw new HttpError(400, 'validation', 'Send the CSV with Content-Type: text/csv.');
    return json(200, await previewImport(db, await request.text(), admin));
  }
  if (method === 'POST' && path === '/admin/import/commit') {
    const admin = await owner();
    const body = await readJson(request);
    if (typeof body.batchId !== 'string') throw new HttpError(400, 'validation', 'batchId is required.');
    return json(200, await commitImport(db, body.batchId, admin));
  }
  if (method === 'GET' && (m = match('/admin/import/batches/:id', path))) {
    await owner();
    const row = await one(db, 'SELECT id, csv_digest, summary_json, created_by, created_at, committed_at, committed_by FROM import_batch WHERE id = ?', m.id);
    if (!row) throw new HttpError(404, 'not_found', 'Unknown import batch.');
    return json(200, { ...row, summary: JSON.parse(row.summary_json), summary_json: undefined });
  }

  // ---- reporting (coordinator) ----
  if (method === 'GET' && path === '/admin/report/events') { await coordinator(); return json(200, { events: await eventReport(db) }); }
  if (method === 'GET' && path === '/admin/report/households') {
    await coordinator();
    return json(200, { households: await householdReport(db, { status: url.searchParams.get('status') || undefined }) });
  }
  if (method === 'GET' && path === '/admin/report/people') { await coordinator(); return json(200, { people: await peopleReport(db) }); }

  // ---- exports ----
  if (method === 'GET' && path === '/admin/export/general.csv') {
    const admin = await coordinator();
    const exportedAt = nowIso();
    const body = await generalExportCsv(db, { exportedAt, exportedBy: admin.email });
    await batch(db, [audit(db, { at: exportedAt, actorKind: admin.role, actorId: admin.email, action: 'export.general', details: { rows: body.split('\r\n').length - 2 } })]);
    return csvResponse(body, `attendance-${exportedAt.replace(/[:.]/g, '-')}.csv`);
  }
  if (method === 'GET' && path === '/admin/export/restricted.csv') {
    const admin = await owner();
    const exportedAt = nowIso();
    const body = await restrictedExportCsv(db, { exportedAt, exportedBy: admin.email });
    await batch(db, [audit(db, { at: exportedAt, actorKind: admin.role, actorId: admin.email, action: 'export.restricted', details: { rows: body.split('\r\n').length - 2 } })]);
    return csvResponse(body, `restricted-notes-${exportedAt.replace(/[:.]/g, '-')}.csv`);
  }

  // ---- households, credentials, corrections ----
  if (method === 'GET' && (m = match('/admin/households/:id', path))) {
    await coordinator();
    const loaded = await loadHousehold(db, m.id);
    if (!loaded) throw new HttpError(404, 'not_found', 'Unknown household.');
    const snapshot = buildSnapshot({ ...loaded, notes: '' }, await rsvpWindow(db, cfg)); // notes stay restricted
    delete snapshot.notes;
    return json(200, { ...snapshot, state: loaded.household.state, credentials: await listCredentials(db, m.id) });
  }
  if (method === 'POST' && (m = match('/admin/households/:id/credentials', path))) {
    const admin = await owner();
    return json(201, await issueCredential(db, cfg, m.id, await readJson(request), admin));
  }
  if (method === 'POST' && (m = match('/admin/credentials/:id/revoke', path))) {
    const admin = await owner();
    return json(200, await revokeCredential(db, m.id, admin));
  }
  if (method === 'POST' && (m = match('/admin/households/:id/revoke', path))) {
    const admin = await owner();
    return json(200, await setHouseholdState(db, m.id, 'revoked', admin));
  }
  if (method === 'POST' && (m = match('/admin/households/:id/reinstate', path))) {
    const admin = await owner();
    return json(200, await setHouseholdState(db, m.id, 'active', admin));
  }
  if (method === 'PUT' && (m = match('/admin/households/:id/response', path))) {
    const admin = await coordinator();
    const body = await readJson(request);
    const origin = body.origin;
    const allowed = admin.role === 'owner' ? ['owner-correction', 'coordinator-phone', 'coordinator-email'] : ['coordinator-phone', 'coordinator-email'];
    if (!allowed.includes(origin)) throw new HttpError(400, 'validation', `origin must be one of ${allowed.join(', ')}.`);
    if (typeof body.reason !== 'string' || body.reason.trim().length < 3) throw new HttpError(400, 'validation', 'A short reason is required.');
    const loaded = await loadHousehold(db, m.id);
    if (!loaded) throw new HttpError(404, 'not_found', 'Unknown household.');
    if (body.revision !== undefined && body.revision !== loaded.state.revision) {
      throw new HttpError(409, 'conflict', 'The household response changed; reload and retry.', { latest: buildSnapshot({ ...loaded, notes: '' }, await rsvpWindow(db, cfg)) });
    }
    // Restricted notes are never edited through this path; keep what is stored.
    const change = validatePayload({ ...body, notes: loaded.notes }, loaded, { partial: true });
    change.notes = loaded.notes || '';
    const snapshot = await commitResponse({
      env, cfg, loaded, change,
      expectedRevision: loaded.state.revision,
      requestId: null,
      origin,
      actor: { kind: admin.role, id: admin.email },
      reason: body.reason.trim().slice(0, 200),
      retention: retentionDueAt(cfg),
    });
    delete snapshot.notes;
    return json(200, snapshot);
  }
  if (method === 'GET' && (m = match('/admin/households/:id/history', path))) {
    await coordinator();
    const rows = await all(
      db,
      `SELECT rh.entitlement_id, ie.guest_id, ie.event_id, rh.previous_status, rh.new_status, rh.revision, rh.origin, rh.actor, rh.changed_at
         FROM response_history rh JOIN invitation_entitlement ie ON ie.id = rh.entitlement_id JOIN guest g ON g.id = ie.guest_id
        WHERE g.household_id = ? ORDER BY rh.changed_at DESC, rh.id DESC`,
      m.id,
    );
    return json(200, { history: rows });
  }

  // ---- content ----
  if (method === 'GET' && (m = match('/admin/content/:key', path))) {
    await coordinator();
    if (!CONTENT_KEYS.includes(m.key)) throw new HttpError(404, 'not_found', 'Unknown content key.');
    return json(200, { current: await currentContent(db, m.key), history: await contentHistory(db, m.key) });
  }
  if (method === 'PUT' && (m = match('/admin/content/:key', path))) {
    const admin = await owner();
    return json(200, await publishContent(db, m.key, await readJson(request), admin));
  }
  if (method === 'POST' && (m = match('/admin/content/:key/rollback', path))) {
    const admin = await owner();
    return json(200, await rollbackContent(db, m.key, await readJson(request), admin));
  }

  // ---- operations ----
  if (method === 'GET' && path === '/admin/outbox') {
    await coordinator();
    const state = url.searchParams.get('state') || 'queued';
    const rows = await all(db, 'SELECT id, household_id, kind, state, attempts, next_attempt_at, last_error, created_at, sent_at FROM mail_outbox WHERE state = ? ORDER BY created_at DESC LIMIT 200', state);
    return json(200, { summary: await outboxSummary(db), rows });
  }
  if (method === 'POST' && path === '/admin/mail/process') {
    const admin = await owner();
    const result = await processOutbox(env, cfg);
    await batch(db, [audit(db, { actorKind: admin.role, actorId: admin.email, action: 'mail.process', details: result })]);
    return json(200, result);
  }
  if (method === 'GET' && path === '/admin/alerts') {
    await coordinator();
    const rows = await all(db, 'SELECT * FROM coordinator_alert ORDER BY created_at DESC LIMIT 200');
    return json(200, { alerts: rows.map((r) => ({ ...r, details: JSON.parse(r.details_json), details_json: undefined })) });
  }
  if (method === 'POST' && (m = match('/admin/alerts/:id/ack', path))) {
    const admin = await coordinator();
    const now = nowIso();
    const res = await stmt(db, 'UPDATE coordinator_alert SET acknowledged_at = ?, acknowledged_by = ? WHERE id = ? AND acknowledged_at IS NULL', now, admin.email, m.id).run();
    if (!res.meta || !res.meta.changes) throw new HttpError(404, 'not_found', 'Unknown or already acknowledged alert.');
    return json(200, { id: m.id, acknowledgedAt: now });
  }
  if (method === 'GET' && path === '/admin/audit') {
    await owner();
    const hid = url.searchParams.get('householdId');
    const rows = hid
      ? await all(db, 'SELECT * FROM audit_event WHERE household_id = ? ORDER BY id DESC LIMIT 500', hid)
      : await all(db, 'SELECT * FROM audit_event ORDER BY id DESC LIMIT 500');
    return json(200, { events: rows.map((r) => ({ ...r, fields: JSON.parse(r.fields_json), details: JSON.parse(r.details_json), fields_json: undefined, details_json: undefined })) });
  }
  if (method === 'POST' && path === '/admin/retention/run') {
    const admin = await owner();
    const body = await readJson(request);
    return json(200, await applyRetention(env, cfg, { force: body.force === true, actor: { kind: admin.role, id: admin.email } }));
  }

  throw new HttpError(404, 'not_found', 'No such admin route.');
}
