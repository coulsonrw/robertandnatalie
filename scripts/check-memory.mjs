// Checks memory/ for the agent notes. Exit 1 when a note is missing front matter,
// an INDEX.md link does not resolve, or a related path is not in the repo.
// A note whose updated date is more than 180 days old prints a warning and still exits 0.
//
// Usage: node scripts/check-memory.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEMORY = path.join(ROOT, 'memory');
const SKIP = new Set(['README.md', 'INDEX.md']);
const STALE_DAYS = 180;
const REQUIRED = ['title', 'updated', 'verified_against', 'related'];

const errors = [];
const warnings = [];

function parseFrontMatter(text, file) {
  if (!text.startsWith('---\n')) {
    errors.push(`${file}: missing opening front matter (---)`);
    return null;
  }
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) {
    errors.push(`${file}: front matter is not closed with ---`);
    return null;
  }
  const body = text.slice(4, end);
  const data = {};
  let listKey = null;
  for (const line of body.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.+?)\s*$/);
    if (item) {
      if (!listKey) {
        errors.push(`${file}: list item without a key: ${line.trim()}`);
        continue;
      }
      const value = item[1].replace(/^['"]|['"]$/g, '');
      if (!Array.isArray(data[listKey])) data[listKey] = [];
      data[listKey].push(value);
      continue;
    }
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) {
      errors.push(`${file}: could not read front-matter line: ${line}`);
      listKey = null;
      continue;
    }
    listKey = field[1];
    const raw = field[2].trim();
    if (raw === '' || raw === '|' || raw === '>') {
      data[field[1]] = [];
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      data[field[1]] = raw.slice(1, -1).split(',').map((part) => part.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      listKey = null;
    } else {
      data[field[1]] = raw.replace(/^['"]|['"]$/g, '');
      listKey = null;
    }
  }
  return data;
}

function checkNote(name) {
  const rel = `memory/${name}`;
  const text = fs.readFileSync(path.join(MEMORY, name), 'utf8');
  const data = parseFrontMatter(text, rel);
  if (!data) return;
  for (const key of REQUIRED) {
    if (data[key] == null || data[key] === '' || (Array.isArray(data[key]) && data[key].length === 0)) {
      errors.push(`${rel}: front matter needs ${key}`);
    }
  }
  if (typeof data.updated === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated) || Number.isNaN(Date.parse(`${data.updated}T00:00:00Z`))) {
      errors.push(`${rel}: updated must be YYYY-MM-DD (got ${data.updated})`);
    } else {
      const ageDays = (Date.now() - Date.parse(`${data.updated}T00:00:00Z`)) / 86400000;
      if (ageDays > STALE_DAYS) {
        warnings.push(`${rel}: updated ${data.updated} is ${Math.floor(ageDays)} days old (over ${STALE_DAYS}). Re-read it and bump updated.`);
      }
    }
  }
  if (typeof data.verified_against === 'string' && !/^[0-9a-f]{7,40}$/i.test(data.verified_against)) {
    errors.push(`${rel}: verified_against must be a commit SHA (got ${data.verified_against})`);
  }
  const related = Array.isArray(data.related) ? data.related : [];
  for (const item of related) {
    if (typeof item !== 'string' || item.includes('..') || path.isAbsolute(item)) {
      errors.push(`${rel}: related path is not a repo-relative file: ${item}`);
      continue;
    }
    if (!fs.existsSync(path.join(ROOT, item))) {
      errors.push(`${rel}: related file does not exist: ${item}`);
    }
  }
}

function checkIndex() {
  const indexPath = path.join(MEMORY, 'INDEX.md');
  if (!fs.existsSync(indexPath)) {
    errors.push('memory/INDEX.md is missing');
    return;
  }
  const text = fs.readFileSync(indexPath, 'utf8');
  const links = [...text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  if (links.length === 0) errors.push('memory/INDEX.md has no links to notes');
  for (const href of links) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) continue;
    const target = href.split('#')[0];
    if (!target) continue;
    const resolved = path.resolve(MEMORY, target);
    const inside = resolved === MEMORY || resolved.startsWith(MEMORY + path.sep);
    if (!inside || !fs.existsSync(resolved)) {
      errors.push(`memory/INDEX.md: link does not resolve: ${href}`);
    }
  }
}

if (!fs.existsSync(MEMORY)) {
  console.error('memory/ is missing');
  process.exit(1);
}

const notes = fs.readdirSync(MEMORY).filter((name) => name.endsWith('.md') && !SKIP.has(name)).sort();
if (notes.length === 0) errors.push('memory/ has no topic notes');
for (const name of notes) checkNote(name);
checkIndex();

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`memory check failed (${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log(`memory check ok (${notes.length} note${notes.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
