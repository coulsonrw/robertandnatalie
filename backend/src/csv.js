// Small RFC 4180 CSV reader/writer. The writer neutralises spreadsheet formula injection
// (ADMIN-03): any cell starting with = + - @ or a tab/CR is prefixed with a single quote and
// quoted, so Excel/Sheets treat it as text.

export function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const s = String(input || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function parseCsvObjects(input) {
  const rows = parseCsv(input);
  if (!rows.length) return { header: [], records: [] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const records = rows.slice(1).map((r, idx) => {
    const o = { _line: idx + 2 };
    header.forEach((h, i) => { o[h] = (r[i] === undefined ? '' : r[i]).trim(); });
    return o;
  });
  return { header, records };
}

const DANGEROUS_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (DANGEROUS_START.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s) || s.startsWith("'")) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header, rows) {
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) lines.push(header.map((h) => csvCell(r[h])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}
