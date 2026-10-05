// Owner bootstrap that does not wait on Cloudflare Access (Access is still unset on the account).
// Gated by OPS_BOOTSTRAP_TOKEN. When the token is missing the routes fail closed. Used to import
// the guest-sheet roster and issue one private link per named guest.

import { HttpError, json, readJson } from './http.js';
import { all } from './db.js';
import { previewImport, commitImport } from './admin/importer.js';
import { issueCredential } from './admin/credentials.js';
import { parseGuestSheet, rosterToImportCsv, linkPlan } from './roster.js';
import { ensureAnswersTab, readSheetValues, sheetsConfigured } from './sheets.js';

const OPS_ACTOR = { email: 'ops-bootstrap@robertandnatalie.wedding', role: 'owner' };

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(String(a || ''));
  const right = new TextEncoder().encode(String(b || ''));
  const len = Math.max(left.length, right.length);
  let out = left.length === right.length ? 0 : 1;
  for (let i = 0; i < len; i += 1) out |= (left[i] || 0) ^ (right[i] || 0);
  return out === 0;
}

export function requireOpsToken(request, cfg) {
  const expected = cfg.opsBootstrapToken;
  if (!expected) throw new HttpError(503, 'bootstrap_unavailable', 'OPS_BOOTSTRAP_TOKEN is not set.');
  const header = request.headers.get('Authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7).trim() : (request.headers.get('X-Ops-Token') || '');
  if (!provided || !timingSafeEqual(provided, expected)) {
    throw new HttpError(401, 'unauthenticated', 'A valid bootstrap token is required.');
  }
}

function recordsToCsv(header, records) {
  const lines = [header.join(',')];
  for (const rec of records) {
    lines.push(header.map((h) => {
      const v = rec[h] == null ? '' : String(rec[h]);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
  }
  return `${lines.join('\n')}\n`;
}

// Reconstruct a Guest Name CSV from Sheets records (header as stored on the source tab).
function sourceRecordsToCsv(header, records) {
  return recordsToCsv(header, records.map((rec) => {
    const row = {};
    header.forEach((h) => { row[h] = rec[h] || ''; });
    return row;
  }));
}

export async function handleOps(request, env, cfg, url) {
  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/\/+$/, '') || '/';
  requireOpsToken(request, cfg);

  if (method === 'GET' && path === '/ops/status') {
    const households = (await all(env.DB, 'SELECT COUNT(*) AS n FROM household'))[0]?.n ?? 0;
    const guests = (await all(env.DB, 'SELECT COUNT(*) AS n FROM guest WHERE kind = ?', 'named'))[0]?.n ?? 0;
    const links = (await all(env.DB, "SELECT COUNT(*) AS n FROM access_credential WHERE kind = 'link' AND revoked_at IS NULL"))[0]?.n ?? 0;
    return json(200, {
      households,
      namedGuests: guests,
      activeLinks: links,
      cutoffAt: cfg.rsvpCutoffAt || null,
      sheets: {
        configured: sheetsConfigured(cfg),
        spreadsheetIdSet: !!cfg.sheets.spreadsheetId,
        answersTab: cfg.sheets.answersTab,
        sourceTab: cfg.sheets.sourceTab || null,
      },
      mailProvider: cfg.mail.provider,
    });
  }

  if (method === 'POST' && path === '/ops/roster/sync') {
    const body = await readJson(request).catch(() => ({}));
    let csvText = typeof body.csv === 'string' ? body.csv : '';
    let source = 'payload';
    if (!csvText && sheetsConfigured(cfg) && cfg.sheets.sourceTab) {
      const sheet = await readSheetValues(cfg, cfg.sheets.sourceTab);
      csvText = sourceRecordsToCsv(sheet.header, sheet.records);
      source = 'google_sheet';
    }
    if (!csvText.trim()) {
      throw new HttpError(400, 'validation', 'Send { "csv": "..." } or configure the Google Sheet source tab.');
    }
    const parsed = parseGuestSheet(csvText);
    const importCsv = rosterToImportCsv(parsed);
    const preview = await previewImport(env.DB, importCsv, OPS_ACTOR);
    if (!preview.canCommit) {
      return json(400, { error: { code: 'validation', message: 'Roster preview failed.' }, errors: preview.errors, warnings: preview.warnings, flags: parsed.flags, counts: parsed.counts });
    }
    const commit = await commitImport(env.DB, preview.batchId, OPS_ACTOR);

    const issued = [];
    const existing = await all(env.DB, "SELECT household_id, label FROM access_credential WHERE kind = 'link' AND revoked_at IS NULL");
    const have = new Set(existing.map((r) => `${r.household_id}|${r.label || ''}`));
    for (const item of linkPlan(parsed)) {
      const key = `${item.householdId}|${item.label}`;
      if (have.has(key) && body.reissue !== true) {
        issued.push({ ...item, issued: false, reason: 'already_issued' });
        continue;
      }
      const cred = await issueCredential(env.DB, cfg, item.householdId, { kind: 'link', label: item.label }, OPS_ACTOR);
      issued.push({ ...item, issued: true, credentialId: cred.id, link: cred.link });
    }

    let answers = { skipped: true, reason: 'sheets_unconfigured' };
    if (sheetsConfigured(cfg)) {
      try {
        const tab = await ensureAnswersTab(cfg);
        answers = { skipped: false, tab };
      } catch (err) {
        answers = { skipped: true, reason: 'sheets_error', error: err.message };
      }
    }

    return json(200, {
      source,
      counts: parsed.counts,
      flags: parsed.flags,
      import: commit,
      links: issued,
      answersTab: answers,
    });
  }

  throw new HttpError(404, 'not_found', 'No such ops route.');
}
