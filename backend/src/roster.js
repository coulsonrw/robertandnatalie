// Turns Natalie's guest-sheet CSV (one invitation row per household) into the admin import CSV
// and one private link per named guest. Plus-ones stay on the host household and cannot be added
// beyond the slots the row already allows. Synthetic fixtures only in tests (DATA-03); production
// names are read at runtime from the sheet or a local CSV and are never committed.

import { parseCsvObjects, toCsv } from './csv.js';

const EVENTS = 'ceremony|reception';
const IMPORT_HEADER = [
  'household_id', 'household_label', 'household_contact_email',
  'guest_id', 'guest_kind', 'guest_name', 'host_guest_id', 'events',
];

const SHEET_COLUMNS = {
  guestName: ['guest name', 'name'],
  phone: ['phone number', 'phone'],
  email: ['email address', 'email'],
  plusOnes: ['plus one name(s)', 'plus one names', 'plus one', 'plus ones'],
  group: ['group'],
};

export function slugId(value, prefix) {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'guest';
  const id = `${prefix}${slug}`;
  return id.length <= 64 ? id : id.slice(0, 64);
}

export function splitNamedPeople(cell) {
  return String(cell || '')
    .replace(/\s+&\s+/g, ',')
    .replace(/\s+and\s+/gi, ',')
    .split(',')
    .map((part) => part.replace(/^[&]+/, '').trim())
    .filter(Boolean);
}

export function parsePlusOneCell(cell, namedCount) {
  const raw = String(cell || '').trim();
  if (!raw) return { named: [], unnamedSlots: 0, flags: [] };

  const unnamed = raw.match(/^(\d+)\s*unnamed(?:\s+plus-?one(?:s|\(s\))?)?\.?$/i);
  if (unnamed) return { named: [], unnamedSlots: Number(unnamed[1]), flags: [] };

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n === namedCount) {
      return {
        named: [],
        unnamedSlots: 0,
        flags: ['plus_one_cell_equals_named_count_treated_as_party_size'],
      };
    }
    return { named: [], unnamedSlots: n, flags: ['plus_one_cell_is_bare_number'] };
  }

  const named = raw.split(/[;\n]/).map((part) => part.trim()).filter(Boolean);
  return { named, unnamedSlots: 0, flags: [] };
}

function cell(record, aliases) {
  for (const key of aliases) {
    if (record[key] != null && String(record[key]).trim() !== '') return String(record[key]).trim();
  }
  return '';
}

function uniqueId(base, used) {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    const suffix = `_${n}`;
    id = `${base.slice(0, 64 - suffix.length)}${suffix}`;
    n += 1;
  }
  used.add(id);
  return id;
}

export function parseGuestSheet(csvText) {
  const { header, records } = parseCsvObjects(csvText);
  if (!header.length) throw new Error('Guest sheet CSV is empty.');
  const hasName = SHEET_COLUMNS.guestName.some((k) => header.includes(k));
  if (!hasName) throw new Error('Guest sheet CSV needs a "Guest Name" column.');

  const usedHouseholds = new Set();
  const usedGuests = new Set();
  const households = [];
  const flags = [];

  records.forEach((rec, index) => {
    const guestName = cell(rec, SHEET_COLUMNS.guestName);
    if (!guestName) return;
    const named = splitNamedPeople(guestName);
    if (!named.length) return;

    const plus = parsePlusOneCell(cell(rec, SHEET_COLUMNS.plusOnes), named.length);
    const householdId = uniqueId(slugId(guestName, 'hh_'), usedHouseholds);
    const hostId = uniqueId(slugId(`${householdId}_${named[0]}`, 'g_'), usedGuests);
    const guests = named.map((name, i) => ({
      id: i === 0 ? hostId : uniqueId(slugId(`${householdId}_${name}`, 'g_'), usedGuests),
      kind: 'named',
      name,
      hostGuestId: null,
      receivesLink: true,
    }));

    plus.named.forEach((name) => {
      guests.push({
        id: uniqueId(slugId(`${householdId}_${name}`, 'g_'), usedGuests),
        kind: 'named',
        name,
        hostGuestId: null,
        receivesLink: false,
      });
    });

    for (let i = 0; i < plus.unnamedSlots; i += 1) {
      guests.push({
        id: uniqueId(slugId(`${householdId}_plus_${i + 1}`, 'g_'), usedGuests),
        kind: 'plus-one',
        name: null,
        hostGuestId: hostId,
        receivesLink: false,
      });
    }

    plus.flags.forEach((code) => {
      flags.push({ householdId, label: guestName, code, detail: cell(rec, SHEET_COLUMNS.plusOnes) });
    });

    households.push({
      id: householdId,
      label: guestName,
      contactEmail: cell(rec, SHEET_COLUMNS.email),
      group: cell(rec, SHEET_COLUMNS.group),
      phone: cell(rec, SHEET_COLUMNS.phone),
      sourceRow: rec._line,
      sheetIndex: index,
      guests,
      plusOneCapacity: plus.named.length + plus.unnamedSlots,
    });
  });

  return {
    households,
    flags,
    counts: {
      invitationRows: households.length,
      namedGuests: households.reduce((n, h) => n + h.guests.filter((g) => g.kind === 'named' && g.receivesLink).length, 0),
      namedPlusOnes: households.reduce((n, h) => n + h.guests.filter((g) => g.kind === 'named' && !g.receivesLink).length, 0),
      unnamedPlusOneSlots: households.reduce((n, h) => n + h.guests.filter((g) => g.kind === 'plus-one').length, 0),
      privateLinks: households.reduce((n, h) => n + h.guests.filter((g) => g.receivesLink).length, 0),
    },
  };
}

export function rosterToImportCsv(parsed) {
  const rows = [];
  for (const h of parsed.households) {
    for (const g of h.guests) {
      rows.push({
        household_id: h.id,
        household_label: h.label,
        household_contact_email: h.contactEmail,
        guest_id: g.id,
        guest_kind: g.kind,
        guest_name: g.kind === 'named' ? g.name : '',
        host_guest_id: g.hostGuestId || '',
        events: EVENTS,
      });
    }
  }
  return toCsv(IMPORT_HEADER, rows);
}

export function linkPlan(parsed) {
  const links = [];
  for (const h of parsed.households) {
    for (const g of h.guests) {
      if (!g.receivesLink) continue;
      links.push({
        householdId: h.id,
        householdLabel: h.label,
        guestId: g.id,
        guestName: g.name,
        label: `private link for ${g.name}`,
      });
    }
  }
  return links;
}
