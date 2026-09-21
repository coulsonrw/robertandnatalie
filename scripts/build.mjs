#!/usr/bin/env node
// Builds the static site in dist/ from content/site.config.json.
//   node scripts/build.mjs            build
//   node scripts/build.mjs --check    validate configuration only
//   node scripts/build.mjs --register write docs/CONTENT_APPROVAL_REGISTER.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zonedParts, clockLabel, longDate, formalDateLines, formalTimeLine, timeZoneLabel } from './lib/format.mjs';
import { buildIcs } from './lib/ics.mjs';
import { mapsLinks } from './lib/html.mjs';
import { renderIndex } from './templates/index.mjs';
import { renderRsvp } from './templates/rsvp.mjs';
import { renderPrivacy } from './templates/privacy.mjs';
import { renderNotFound } from './templates/notfound.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const WRITE_REGISTER = args.has('--register');

const APPROVAL_STATES = ['approved', 'draft', 'carried-forward', 'publisher-claim', 'pending'];
const CANONICAL_CLOSING_LINE = 'Where the ancient Moeli waters meet the Bahia Del Espiritu Santo';
const DAY_PARTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const errors = [];
const warnings = [];
const approvals = []; // { path, state, owner, source, reviewed, note }

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function collectApprovals(node, trail = 'config') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n, i) => collectApprovals(n, `${trail}[${n?.id ?? i}]`)); return; }
  if (node.approval) {
    const a = node.approval;
    if (!APPROVAL_STATES.includes(a.state)) fail(`${trail}.approval.state must be one of ${APPROVAL_STATES.join(', ')} (got ${a.state})`);
    if (!a.owner) fail(`${trail}.approval.owner is required`);
    if (!a.reviewed || !/^\d{4}-\d{2}-\d{2}$/.test(a.reviewed)) fail(`${trail}.approval.reviewed must be an ISO date`);
    approvals.push({ path: trail, ...a });
  }
  for (const [k, v] of Object.entries(node)) if (k !== 'approval') collectApprovals(v, `${trail}.${k}`);
}

function validTimeZone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

function validate(c) {
  if (c.schemaVersion !== '1.0') fail(`schemaVersion must be "1.0" (got ${c.schemaVersion})`);
  if (!c.site?.name || !c.site?.baseUrl) fail('site.name and site.baseUrl are required');
  if (c.site?.basePath && !/^\/[A-Za-z0-9._-]+$/.test(c.site.basePath)) fail('site.basePath must look like "/subpath" (no trailing slash)');
  const { couple, wedding, events } = c;
  if (!couple?.displayName || !Array.isArray(couple.names) || couple.names.length !== 2) fail('couple.displayName and couple.names[2] are required');
  else if (couple.displayName !== couple.names.join(` ${couple.conjunction} `)) fail(`couple.displayName ("${couple.displayName}") must equal the names joined with the conjunction`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wedding?.date ?? '')) fail('wedding.date must be YYYY-MM-DD');
  if (!validTimeZone(wedding?.timezone)) fail(`wedding.timezone is not a valid IANA zone: ${wedding?.timezone}`);
  if (!Array.isArray(wedding?.closingLine) || wedding.closingLine.length < 2) fail('wedding.closingLine must be an array of at least two lines');
  else if (wedding.closingLine.join(' ') !== CANONICAL_CLOSING_LINE) warn(`wedding.closingLine differs from the approved wording: "${CANONICAL_CLOSING_LINE}"`);
  if (!Array.isArray(c.invitation?.requestLines) || !c.invitation.requestLines.length) fail('invitation.requestLines is required');

  if (!Array.isArray(events) || !events.length) fail('events must be a non-empty array');
  else {
    const ids = new Set();
    let lastStart = -Infinity;
    for (const ev of events) {
      const t = `events[${ev.id}]`;
      if (!ev.id || ids.has(ev.id)) fail(`${t}: id missing or duplicated`); ids.add(ev.id);
      if (!ev.label || !ev.name) fail(`${t}: label and name are required`);
      if (!DAY_PARTS.includes(ev.formalDayPart)) fail(`${t}: formalDayPart must be one of ${DAY_PARTS.join(', ')}`);
      const m = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.exec(ev.startsAt ?? '');
      if (!m) { fail(`${t}: startsAt must be an ISO 8601 date-time with an explicit offset`); continue; }
      const parts = zonedParts(ev.startsAt, wedding.timezone);
      if (parts.isoDate !== wedding.date) fail(`${t}: startsAt falls on ${parts.isoDate} in ${wedding.timezone}, not wedding.date ${wedding.date}`);
      const declared = m[2] === 'Z' ? '+00:00' : m[2];
      if (declared !== parts.offset) fail(`${t}: startsAt offset ${declared} does not match ${wedding.timezone} on that date (${parts.offset})`);
      const startMs = Date.parse(ev.startsAt);
      if (startMs < lastStart) warn(`${t}: events are not in chronological order`);
      lastStart = startMs;
      if (ev.endsAt != null) {
        if (Number.isNaN(Date.parse(ev.endsAt))) fail(`${t}: endsAt is not a valid date-time`);
        else if (Date.parse(ev.endsAt) <= startMs) fail(`${t}: endsAt must be after startsAt`);
      }
      if (!Array.isArray(ev.venue?.addressLines) || !ev.venue.addressLines.length) fail(`${t}: venue.addressLines is required`);
      if (!ev.calendar?.uid || !ev.calendar?.summary) fail(`${t}: calendar.uid and calendar.summary are required`);
    }
  }

  const r = c.rsvp;
  if (!['coming-soon', 'live', 'closed'].includes(r?.mode)) fail('rsvp.mode must be coming-soon, live or closed');
  if (r?.mode === 'live' && !r.apiBaseUrl) fail('rsvp.mode is live but rsvp.apiBaseUrl is not set');
  if (r?.apiBaseUrl && !/^https:\/\//.test(r.apiBaseUrl)) fail('rsvp.apiBaseUrl must use https');
  if (r?.cutoffAt != null && Number.isNaN(Date.parse(r.cutoffAt))) fail('rsvp.cutoffAt must be an ISO date-time or null');
  if (r?.allowPreview) {
    const hh = r.preview?.household;
    if (!r.preview?.code || !hh) fail('rsvp.preview.code and rsvp.preview.household are required when allowPreview is true');
    else {
      const gids = new Set();
      for (const g of hh.guests ?? []) {
        if (!g.id || gids.has(g.id)) fail(`preview guest id missing or duplicated: ${g.id}`); gids.add(g.id);
        if (!['named', 'plus-one'].includes(g.kind)) fail(`preview guest ${g.id}: kind must be named or plus-one`);
        if (g.kind === 'named' && !g.name) fail(`preview guest ${g.id}: named guests need a name`);
        if (g.kind === 'plus-one' && !(hh.guests ?? []).some((x) => x.id === g.hostGuestId && x.kind === 'named')) fail(`preview guest ${g.id}: hostGuestId must reference a named guest`);
      }
      const eids = new Set((events ?? []).map((e) => e.id));
      const seen = new Set();
      for (const e of hh.entitlements ?? []) {
        const k = `${e.guestId}|${e.eventId}`;
        if (seen.has(k)) fail(`preview entitlement duplicated: ${k}`); seen.add(k);
        if (!gids.has(e.guestId)) fail(`preview entitlement references unknown guest ${e.guestId}`);
        if (!eids.has(e.eventId)) fail(`preview entitlement references unknown event ${e.eventId}`);
      }
      if (/^[A-Z0-9]{4,}$/i.test(r.preview.code) === false) fail('rsvp.preview.code should be a short alphanumeric code');
    }
  }

  for (const f of c.faqs ?? []) {
    if (!f.id || !f.question) fail(`faq entry missing id or question`);
    if (f.approval?.state !== 'pending' && !f.answer) fail(`faq ${f.id}: answer is required unless approval.state is pending`);
    if (f.approval?.state === 'pending' && f.answer) warn(`faq ${f.id}: has an answer but is pending, so it will not be published`);
  }
  if (c.contact?.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.contact.email)) fail('contact.email does not look like an email address');
  if (!Number.isInteger(c.privacy?.retentionDaysAfterWedding)) fail('privacy.retentionDaysAfterWedding must be an integer');
  if (c.travel?.hotel?.roomBlock) {
    const rb = c.travel.hotel.roomBlock;
    if (!rb.url || !Array.isArray(rb.details) || !rb.details.length) fail('travel.hotel.roomBlock needs url and details[]');
  }
  collectApprovals(c);
}

function isPublished(block) {
  return block && block.approval && block.approval.state !== 'pending';
}

function buildView(c) {
  const tz = c.wedding.timezone;
  const weddingParts = zonedParts(`${c.wedding.date}T12:00:00Z`, tz);
  const events = c.events.map((ev) => {
    const parts = zonedParts(ev.startsAt, tz);
    const v = ev.venue;
    const noteDefs = [['Entrance', v.entrance], ['Arrival', v.arrival], ['Parking', v.parking], ['Accessibility', v.accessibility]];
    return {
      id: ev.id,
      label: ev.label,
      name: ev.name,
      startsAt: ev.startsAt,
      endsAt: ev.endsAt ?? null,
      parts,
      clock: clockLabel(parts),
      longDate: longDate(parts),
      tzLabel: timeZoneLabel(tz, parts),
      formalLine: formalTimeLine(ev.label, parts, ev.formalDayPart),
      alsoKnownAs: v.alsoKnownAs ?? null,
      addressLines: v.addressLines,
      website: v.website ?? null,
      maps: mapsLinks(v.name, v.addressLines),
      calendarPath: `/calendar/${ev.id}.ics`,
      calendarFile: `${ev.id}-robert-and-natalie.ics`,
      calendar: ev.calendar,
      notes: noteDefs.filter(([, text]) => text).map(([label, text]) => ({ label, text })),
    };
  });

  const destinationShort = c.wedding.destination.split(',')[0].trim();
  const sub = (s) => String(s).replace('{destination}', c.wedding.destination).replace('{longDate}', longDate(weddingParts));
  const faqs = (c.faqs ?? []).filter((f) => isPublished(f) && f.answer).map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  const contactPublished = isPublished(c.contact) && (c.contact.email || c.contact.phone);
  const betweenVenues = isPublished(c.travel.betweenVenues) && c.travel.betweenVenues.text ? c.travel.betweenVenues.text : null;
  const reviewed = new Date(`${c.lastReviewed}T12:00:00Z`);

  return {
    basePath: c.site.basePath ?? '',
    site: c.site,
    couple: c.couple,
    wedding: { ...c.wedding, destinationShort },
    invitation: { requestLines: c.invitation.requestLines.map(sub) },
    formalDateLines: formalDateLines(weddingParts),
    longDate: longDate(weddingParts),
    events,
    weddingDay: { intro: sub(c.weddingDay.intro), venueChangeNote: isPublished(c.weddingDay) ? c.weddingDay.venueChangeNote : null },
    travel: {
      hotel: { ...c.travel.hotel, roomBlock: c.travel.hotel.roomBlock ?? null },
      gettingThere: { paragraphs: c.travel.gettingThere.paragraphs, airports: c.travel.gettingThere.airports ?? [] },
      betweenVenues,
    },
    faqs,
    contact: contactPublished ? { email: c.contact.email, phone: c.contact.phone, phoneDisplay: c.contact.phoneDisplay, note: c.contact.note } : null,
    rsvp: c.rsvp,
    privacy: c.privacy,
    lastReviewedLabel: reviewed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    crestAlt: `The Coulson crest: two silver dolphins with gold collars joined by a gold chain around the ${c.couple.monogram} monogram above blue waves, with the motto “Je mourrai pour ceux que j’aime”.`,
  };
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function emit(c, view) {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'calendar'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), renderIndex(view));
  fs.writeFileSync(path.join(DIST, 'rsvp.html'), renderRsvp(view));
  fs.writeFileSync(path.join(DIST, 'privacy.html'), renderPrivacy(view));
  fs.writeFileSync(path.join(DIST, '404.html'), renderNotFound(view));

  const dtstamp = `${c.lastReviewed.replace(/-/g, '')}T000000Z`;
  for (const ev of view.events) {
    const ics = buildIcs({
      prodId: `-//${c.site.domain}//Wedding//EN`,
      timeZone: c.wedding.timezone,
      dtstamp,
      events: [{
        uid: ev.calendar.uid,
        startLocal: ev.parts.icsLocal,
        endLocal: ev.endsAt ? zonedParts(ev.endsAt, c.wedding.timezone).icsLocal : null,
        summary: ev.calendar.summary,
        description: ev.calendar.description,
        location: [ev.name, ...ev.addressLines].join(', '),
        url: `${c.site.baseUrl}${view.basePath}/#wedding-day`,
      }],
    });
    fs.writeFileSync(path.join(DIST, 'calendar', `${ev.id}.ics`), ics);
  }

  for (const dir of ['styles', 'js', 'img', 'fonts']) copyDir(path.join(ROOT, 'src', dir), path.join(DIST, dir));
  const cname = path.join(ROOT, 'CNAME');
  if (fs.existsSync(cname)) fs.copyFileSync(cname, path.join(DIST, 'CNAME'));
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
}

function readiness(c) {
  const items = []; // { level: 'blocker' | 'review' | 'info', item, detail }
  const add = (level, item, detail) => items.push({ level, item, detail });
  if (c.rsvp.mode !== 'live') add('blocker', 'RSVP is not live', `rsvp.mode is "${c.rsvp.mode}"; guests see the ${c.rsvp.mode} message. A backend service and rsvp.apiBaseUrl are required (PRD §08–§11).`);
  if (!c.rsvp.cutoffAt) add('blocker', 'RSVP cutoff not set', 'rsvp.cutoffAt is null (PRD §16, RSVP-04).');
  if (!c.contact.email && !c.contact.phone) add('blocker', 'No private contact route', 'contact.email / contact.phone are null (PRD CONTENT-04, §03 exception path).');
  if (!c.privacy.rsvpProvider) add('blocker', 'RSVP provider not named in the privacy notice', 'privacy.rsvpProvider is null (PRD SEC-04).');
  for (const ev of c.events) {
    for (const k of ['entrance', 'parking']) if (ev.venue[k] == null) add('review', `${ev.name}: ${k} unconfirmed`, `events[${ev.id}].venue.${k} is null; omitted from the page (PRD CONTENT-02, §16).`);
  }
  if (c.rsvp.allowPreview) add('review', 'Synthetic RSVP preview is enabled', 'rsvp.allowPreview is true, so /rsvp.html?preview=1 shows the labeled synthetic household. Set it to false before guest launch (PRD RELEASE-01).');
  if (!c.travel.hotel.roomBlock) add('info', 'No wedding room block published', 'travel.hotel.roomBlock is null; only general hotel information is shown (PRD CONTENT-03).');
  for (const a of approvals) {
    if (a.state === 'approved') continue;
    if (a.state === 'pending') add(items.some((i) => i.item.includes(a.path)) ? 'info' : 'review', `${a.path}: pending, not published`, a.note ?? '');
    else add('review', `${a.path}: ${a.state}`, a.note ?? a.source ?? '');
  }
  return items;
}

function printReport(items) {
  const order = { blocker: 0, review: 1, info: 2 };
  items.sort((x, y) => order[x.level] - order[y.level]);
  const counts = { blocker: 0, review: 0, info: 0 };
  for (const i of items) counts[i.level]++;
  console.log('\nLaunch readiness (from content/site.config.json)');
  console.log(`  blockers: ${counts.blocker}   needs owner/coordinator review: ${counts.review}   info: ${counts.info}`);
  for (const i of items) console.log(`  [${i.level.toUpperCase().padEnd(7)}] ${i.item}${i.detail ? ` — ${i.detail}` : ''}`);
  console.log('');
}

function writeRegister(c, items) {
  const rows = approvals.map((a) => `| \`${a.path}\` | ${a.state} | ${a.owner} | ${(a.source ?? '—').replace(/\|/g, '\\|')} | ${a.reviewed} | ${(a.note ?? '').replace(/\|/g, '\\|')} |`);
  const order = { blocker: 0, review: 1, info: 2 };
  const readinessRows = [...items].sort((x, y) => order[x.level] - order[y.level]).map((i) => `| ${i.level} | ${i.item.replace(/\|/g, '\\|')} | ${i.detail.replace(/\|/g, '\\|')} |`);
  const md = `# Content approval register

Generated by \`npm run register\` from \`content/site.config.json\` (document version ${c.documentVersion}, schema ${c.schemaVersion}, last reviewed ${c.lastReviewed}). Edit the configuration, not this file.

Approval states: **approved** (owner-approved), **draft** (wording drafted by the implementation team, owner approval required), **carried-forward** (published on the previous version of the site; confirmation still required), **publisher-claim** (taken from a third-party page and not independently verified), **pending** (not published until supplied and approved).

## Content blocks

| Block | State | Owner | Source | Last review | Note |
|---|---|---|---|---|---|
${rows.join('\n')}

## Launch readiness

| Level | Item | Detail |
|---|---|---|
${readinessRows.join('\n')}

A **blocker** prevents guest launch (PRD RELEASE-01). A **review** item is published or omitted safely but still needs an owner or coordinator decision. **Info** items are recorded for completeness.
`;
  fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'CONTENT_APPROVAL_REGISTER.md'), md);
  console.log('Wrote docs/CONTENT_APPROVAL_REGISTER.md');
}

// ---- main ----
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.config.json'), 'utf8'));
validate(config);
for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} configuration error(s). Nothing was built.`);
  process.exit(1);
}
const view = buildView(config);
if (!CHECK_ONLY) {
  emit(config, view);
  console.log(`Built ${path.relative(ROOT, DIST)}/ — ${view.events.length} events, ${view.faqs.length} published FAQs, rsvp mode "${config.rsvp.mode}".`);
} else {
  console.log('Configuration is valid.');
}
const items = readiness(config);
printReport(items);
if (WRITE_REGISTER) writeRegister(config, items);
