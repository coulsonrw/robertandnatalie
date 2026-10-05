// Google Sheets writer for the RSVP Answers tab. Natalie's original guest-list tab is read-only
// from this module: writes always target a separately named answers tab and refuse to use the
// source tab title. Missing credentials are a no-op so the Worker stays safe before secrets exist.

import { all, loadHousehold } from './db.js';

export const ANSWERS_HEADER = [
  'Household ID',
  'Guest Name',
  'Group',
  'RSVP',
  'Headcount',
  'Ceremony attending',
  'Reception attending',
  'Attending names',
  'Declining names',
  'Plus-one names',
  'Dietary',
  'Grand Hotel stay',
  'Contact email',
  'Notes',
  'Reference',
  'Submitted at',
  'Revision',
];

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function b64urlJson(obj) {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function b64url(bytes) {
  let s = '';
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const b of view) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem) {
  const b64 = String(pem)
    .replace(/-----BEGIN [A-Z ]+-----/, '')
    .replace(/-----END [A-Z ]+-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function sheetsConfigured(cfg) {
  return !!(cfg.sheets && cfg.sheets.spreadsheetId && cfg.sheets.serviceAccountEmail && cfg.sheets.privateKey);
}

export async function googleAccessToken(cfg, fetchImpl = fetch) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: 'RS256', typ: 'JWT' });
  const claim = b64urlJson({
    iss: cfg.sheets.serviceAccountEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(cfg.sheets.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Google token exchange failed (${res.status})`);
  }
  return body.access_token;
}

function quoteSheet(title) {
  return `'${String(title).replace(/'/g, "''")}'`;
}

async function sheetsFetch(url, token, { method = 'GET', body } = {}, fetchImpl = fetch) {
  const res = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Sheets API ${method} ${url} failed (${res.status})`);
  return data;
}

export async function readSheetValues(cfg, tabTitle, fetchImpl = fetch) {
  const token = await googleAccessToken(cfg, fetchImpl);
  const range = `${quoteSheet(tabTitle)}!A:Z`;
  const url = `${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const data = await sheetsFetch(url, token, {}, fetchImpl);
  const values = data.values || [];
  if (!values.length) return { header: [], records: [] };
  const header = values[0].map((h) => String(h || '').trim());
  const records = values.slice(1).map((row, idx) => {
    const o = { _line: idx + 2 };
    header.forEach((h, i) => { o[h] = row[i] == null ? '' : String(row[i]).trim(); });
    return o;
  });
  return { header, records, raw: values };
}

export async function ensureAnswersTab(cfg, fetchImpl = fetch) {
  const answers = cfg.sheets.answersTab;
  const source = cfg.sheets.sourceTab;
  if (!answers) throw new Error('GOOGLE_SHEETS_ANSWERS_TAB is empty.');
  if (source && answers.toLowerCase() === source.toLowerCase()) {
    throw new Error('Answers tab title must differ from the original guest-list tab.');
  }
  const token = await googleAccessToken(cfg, fetchImpl);
  const meta = await sheetsFetch(`${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}?fields=sheets.properties`, token, {}, fetchImpl);
  const titles = (meta.sheets || []).map((s) => s.properties && s.properties.title).filter(Boolean);
  if (source && !titles.includes(source) && titles.length) {
    // Source tab name is optional; an empty sourceTab means "first sheet, never write it".
  }
  if (titles[0] && titles[0].toLowerCase() === answers.toLowerCase()) {
    throw new Error('Refusing to use the first sheet as the answers tab; Natalie’s list stays untouched.');
  }
  if (!titles.includes(answers)) {
    await sheetsFetch(`${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}:batchUpdate`, token, {
      method: 'POST',
      body: { requests: [{ addSheet: { properties: { title: answers } } }] },
    }, fetchImpl);
    await sheetsFetch(
      `${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}/values/${encodeURIComponent(`${quoteSheet(answers)}!A1`)}?valueInputOption=RAW`,
      token,
      { method: 'PUT', body: { range: `${quoteSheet(answers)}!A1`, majorDimension: 'ROWS', values: [ANSWERS_HEADER] } },
      fetchImpl,
    );
  }
  return answers;
}

function hotelLabel(value) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  if (value === 'undecided') return 'Not sure';
  return '';
}

function namesFor(loaded, eventId, status) {
  const guestsById = new Map(loaded.guests.map((g) => [g.id, g]));
  const names = [];
  for (const e of loaded.entitlements) {
    if (e.event_id !== eventId) continue;
    if ((e.status || 'pending') !== status) continue;
    const g = guestsById.get(e.guest_id);
    if (!g) continue;
    names.push(g.kind === 'plus-one' ? (g.plus_one_name || 'Guest') : g.display_name);
  }
  return names;
}

export function buildAnswersRow(loaded, extra = {}) {
  const attendingAny = new Set();
  const decliningAll = new Set(loaded.guests.map((g) => g.id));
  let ceremony = 0;
  let reception = 0;
  for (const e of loaded.entitlements) {
    if (e.status === 'attending') {
      attendingAny.add(e.guest_id);
      decliningAll.delete(e.guest_id);
      if (e.event_id === 'ceremony') ceremony += 1;
      if (e.event_id === 'reception') reception += 1;
    } else if (e.status !== 'declining') {
      decliningAll.delete(e.guest_id);
    }
  }
  let rsvp = 'No response';
  if (loaded.state.revision > 0) {
    if (attendingAny.size && decliningAll.size !== loaded.guests.length - attendingAny.size && attendingAny.size !== loaded.guests.filter((g) => loaded.entitlements.some((e) => e.guest_id === g.id)).length) {
      rsvp = attendingAny.size ? 'Mixed' : 'No';
    }
    if (attendingAny.size === 0) rsvp = 'No';
    else if (attendingAny.size === loaded.guests.length) rsvp = 'Yes';
    else rsvp = 'Mixed';
  }
  const plusOnes = loaded.guests.filter((g) => g.kind === 'plus-one' && g.plus_one_name).map((g) => g.plus_one_name);
  return [
    loaded.household.id,
    extra.guestName || loaded.household.label,
    extra.group || '',
    rsvp,
    String(attendingAny.size),
    String(ceremony),
    String(reception),
    namesFor(loaded, 'ceremony', 'attending').concat(namesFor(loaded, 'reception', 'attending').filter((n, i, a) => a.indexOf(n) === i)).filter((n, i, a) => a.indexOf(n) === i).join(', '),
    [...new Set([...namesFor(loaded, 'ceremony', 'declining'), ...namesFor(loaded, 'reception', 'declining')])].join(', '),
    plusOnes.join(', '),
    loaded.notes || '',
    hotelLabel(loaded.state.hotel_stay),
    loaded.household.contact_email || '',
    loaded.notes || '',
    loaded.state.reference || '',
    loaded.state.last_submitted_at || '',
    String(loaded.state.revision || 0),
  ];
}

export async function upsertAnswersRow(env, cfg, householdId, fetchImpl = fetch) {
  if (!sheetsConfigured(cfg)) return { skipped: true, reason: 'sheets_unconfigured' };
  const loaded = await loadHousehold(env.DB, householdId);
  if (!loaded) return { skipped: true, reason: 'unknown_household' };
  const extra = {};
  const rosterMeta = await all(env.DB, 'SELECT label FROM household WHERE id = ?', householdId);
  extra.guestName = rosterMeta[0]?.label || loaded.household.label;
  const tab = await ensureAnswersTab(cfg, fetchImpl);
  const token = await googleAccessToken(cfg, fetchImpl);
  const range = `${quoteSheet(tab)}!A:Q`;
  const url = `${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const existing = await sheetsFetch(url, token, {}, fetchImpl);
  const values = existing.values && existing.values.length ? existing.values : [ANSWERS_HEADER];
  if (!values.length) values.push(ANSWERS_HEADER);
  const row = buildAnswersRow(loaded, extra);
  let target = values.findIndex((r, i) => i > 0 && r[0] === householdId);
  if (target === -1) {
    values.push(row);
    target = values.length - 1;
  } else {
    values[target] = row;
  }
  const a1 = `${quoteSheet(tab)}!A${target + 1}:Q${target + 1}`;
  await sheetsFetch(
    `${SHEETS_API}/${encodeURIComponent(cfg.sheets.spreadsheetId)}/values/${encodeURIComponent(a1)}?valueInputOption=RAW`,
    token,
    { method: 'PUT', body: { range: a1, majorDimension: 'ROWS', values: [row] } },
    fetchImpl,
  );
  return { skipped: false, tab, row };
}

export async function syncHouseholdToSheet(env, cfg, householdId, fetchImpl = fetch) {
  try {
    return await upsertAnswersRow(env, cfg, householdId, fetchImpl);
  } catch (err) {
    return { skipped: true, reason: 'sheets_error', error: err && err.message ? err.message : String(err) };
  }
}
