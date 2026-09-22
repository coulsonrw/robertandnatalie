// Small structured content editor (ADMIN-04, OPS-02): versioned bodies with rollback for a fixed
// set of keys. Not a page builder.
//
//   urgent-banner  { active, message, linkUrl, linkLabel }   mirrors content/site.config.json "banner"
//   rsvp-settings  { cutoffAt, open }                        overrides RSVP_CUTOFF_AT / closes editing (OPS-03)

import { HttpError } from '../http.js';
import { one, all, stmt, batch, audit, nowIso } from '../db.js';

const HTTPS_RE = /^https:\/\/[^\s]+$/;

const VALIDATORS = {
  'urgent-banner'(body) {
    const active = body.active === true;
    const message = body.message === null || body.message === undefined ? null : String(body.message).trim().slice(0, 500);
    const linkUrl = body.linkUrl ? String(body.linkUrl).trim() : null;
    const linkLabel = body.linkLabel ? String(body.linkLabel).trim().slice(0, 80) : null;
    if (active && !message) throw new HttpError(400, 'validation', 'An active banner needs a message.');
    if (linkUrl && !HTTPS_RE.test(linkUrl)) throw new HttpError(400, 'validation', 'linkUrl must be an https URL.');
    if (linkUrl && !linkLabel) throw new HttpError(400, 'validation', 'A link needs a label.');
    return { active, message, linkUrl, linkLabel };
  },
  'rsvp-settings'(body) {
    let cutoffAt = null;
    if (body.cutoffAt !== null && body.cutoffAt !== undefined && body.cutoffAt !== '') {
      if (typeof body.cutoffAt !== 'string' || !Number.isFinite(Date.parse(body.cutoffAt))) throw new HttpError(400, 'validation', 'cutoffAt must be ISO 8601 with an offset.');
      cutoffAt = body.cutoffAt;
    }
    return { cutoffAt, open: body.open !== false };
  },
};

export const CONTENT_KEYS = Object.keys(VALIDATORS);

export async function currentContent(db, key) {
  const row = await one(db, 'SELECT key, version, body_json, editor, note, created_at FROM content_version WHERE key = ? AND is_current = 1', key);
  return row ? { key: row.key, version: row.version, body: JSON.parse(row.body_json), editor: row.editor, note: row.note, updatedAt: row.created_at } : { key, version: 0, body: null, updatedAt: null };
}

export async function contentHistory(db, key) {
  const rows = await all(db, 'SELECT version, editor, note, is_current, created_at FROM content_version WHERE key = ? ORDER BY version DESC', key);
  return rows.map((r) => ({ version: r.version, editor: r.editor, note: r.note, current: !!r.is_current, createdAt: r.created_at }));
}

async function writeVersion(db, key, body, admin, note, action, details) {
  const latest = await one(db, 'SELECT MAX(version) AS v FROM content_version WHERE key = ?', key);
  const version = (latest && latest.v ? latest.v : 0) + 1;
  const now = nowIso();
  await batch(db, [
    stmt(db, 'UPDATE content_version SET is_current = 0 WHERE key = ? AND is_current = 1', key),
    stmt(db, 'INSERT INTO content_version (key, version, body_json, editor, note, is_current, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)', key, version, JSON.stringify(body), admin.email, note, now),
    audit(db, { at: now, actorKind: admin.role, actorId: admin.email, action, targetType: 'content_version', targetId: `${key}@${version}`, fields: Object.keys(body), details: { ...details, version } }),
  ]);
  return { key, version, body, editor: admin.email, note, updatedAt: now };
}

export async function publishContent(db, key, payload, admin) {
  const validate = VALIDATORS[key];
  if (!validate) throw new HttpError(404, 'not_found', 'Unknown content key.');
  if (!payload || typeof payload.body !== 'object' || payload.body === null) throw new HttpError(400, 'validation', 'Expected { body, note? }.');
  const body = validate(payload.body);
  const note = typeof payload.note === 'string' ? payload.note.slice(0, 200) : null;
  return writeVersion(db, key, body, admin, note, 'content.publish', {});
}

export async function rollbackContent(db, key, payload, admin) {
  if (!VALIDATORS[key]) throw new HttpError(404, 'not_found', 'Unknown content key.');
  const version = Number.parseInt(payload && payload.version, 10);
  if (!Number.isInteger(version) || version < 1) throw new HttpError(400, 'validation', 'version is required.');
  const row = await one(db, 'SELECT body_json FROM content_version WHERE key = ? AND version = ?', key, version);
  if (!row) throw new HttpError(404, 'not_found', 'Unknown version.');
  return writeVersion(db, key, JSON.parse(row.body_json), admin, `rollback to version ${version}`, 'content.rollback', { rolledBackTo: version });
}
