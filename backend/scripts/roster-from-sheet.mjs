#!/usr/bin/env node
// Build the admin import CSV (and a counts/flags report) from Natalie's guest-sheet CSV.
// Does not print guest names unless --print-names is passed. Never writes the original sheet.

import fs from 'node:fs';
import path from 'node:path';
import { parseGuestSheet, rosterToImportCsv, linkPlan } from '../src/roster.js';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
}

const csvPath = arg('--csv');
if (!csvPath || csvPath === true) {
  console.error('Usage: node backend/scripts/roster-from-sheet.mjs --csv path/to/guest-list.csv [--out import.csv] [--print-names]');
  console.error('Download the first tab of the guest sheet as CSV. This script never writes Natalie’s original tab.');
  process.exit(1);
}

const csvText = fs.readFileSync(path.resolve(csvPath), 'utf8');
const parsed = parseGuestSheet(csvText);
const out = arg('--out');
const importCsv = rosterToImportCsv(parsed);
if (out && out !== true) fs.writeFileSync(path.resolve(out), importCsv);

const report = {
  source: path.resolve(csvPath),
  counts: parsed.counts,
  flags: parsed.flags,
  households: parsed.households.map((h) => ({
    id: h.id,
    group: h.group,
    namedGuests: h.guests.filter((g) => g.receivesLink).length,
    namedPlusOnes: h.guests.filter((g) => g.kind === 'named' && !g.receivesLink).length,
    unnamedPlusOneSlots: h.guests.filter((g) => g.kind === 'plus-one').length,
    plusOneCapacity: h.plusOneCapacity,
    ...(arg('--print-names') ? { label: h.label, guests: h.guests.map((g) => ({ id: g.id, kind: g.kind, name: g.name, receivesLink: g.receivesLink })) } : {}),
  })),
  linksToIssue: linkPlan(parsed).length,
};
if (arg('--print-names')) report.importCsv = importCsv;

console.log(JSON.stringify(report, null, 2));
