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
import { renderIndex, renderCelebration, renderStoryPreview } from './templates/index.mjs';
import { storyPreviewFixture } from './fixtures/story-preview.mjs';
import { renderRsvp } from './templates/rsvp.mjs';
import { renderPrivacy } from './templates/privacy.mjs';
import { renderNotFound } from './templates/notfound.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist');
const CONFIG_PATH = process.env.SITE_CONFIG ? path.resolve(process.env.SITE_CONFIG) : path.join(ROOT, 'content', 'site.config.json');
const STORY_DERIVATIVES = process.env.STORY_DERIVATIVES_DIR ? path.resolve(process.env.STORY_DERIVATIVES_DIR) : path.join(ROOT, 'assets', 'story', 'derivatives');
const PREVIEW_BUILD = process.env.SITE_PREVIEW !== '0'; // deploy.yml sets SITE_PREVIEW=0 so previews never reach the public site
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const WRITE_REGISTER = args.has('--register');
const STRICT = args.has('--strict'); // exit non-zero while launch blockers remain (RELEASE-01)

const APPROVAL_STATES = ['approved', 'draft', 'carried-forward', 'publisher-claim', 'pending'];
const CANONICAL_CLOSING_LINE = 'Where the ancient Moeli waters meet the Bahia Del Espiritu Santo';
const CANONICAL_REQUEST = 'with joy and gratitude, request the pleasure of your company for their wedding in {destination}';
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
  if (!['pre-event', 'post-event'].includes(c.site?.phase)) fail('site.phase must be pre-event or post-event');
  if (c.site?.phase === 'post-event') {
    if (!c.postEvent?.message || c.postEvent?.approval?.state === 'pending') fail('site.phase is post-event but postEvent.message is missing or still pending approval (OPS-03)');
  }
  if (c.banner?.active) {
    if (!c.banner.message) fail('banner.active is true but banner.message is empty');
    if (c.banner.approval?.state === 'pending') fail('banner.active is true but banner.approval.state is pending; approve the wording first (ADMIN-04)');
    if (c.banner.linkUrl && !/^(https?:\/\/|\/|#)/.test(c.banner.linkUrl)) fail('banner.linkUrl must be an absolute URL, a site path or an anchor');
    if (c.banner.linkUrl && !c.banner.linkLabel) fail('banner.linkLabel is required when banner.linkUrl is set');
  }
  const { couple, wedding, events } = c;
  if (!couple?.displayName || !Array.isArray(couple.names) || couple.names.length !== 2) fail('couple.displayName and couple.names[2] are required');
  else if (couple.displayName !== couple.names.join(` ${couple.conjunction} `)) fail(`couple.displayName ("${couple.displayName}") must equal the names joined with the conjunction`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wedding?.date ?? '')) fail('wedding.date must be YYYY-MM-DD');
  if (!validTimeZone(wedding?.timezone)) fail(`wedding.timezone is not a valid IANA zone: ${wedding?.timezone}`);
  if (!Array.isArray(wedding?.closingLine) || wedding.closingLine.length < 2) fail('wedding.closingLine must be an array of at least two lines');
  else if (wedding.closingLine.join(' ') !== CANONICAL_CLOSING_LINE) {
    if (wedding.closingLineChangeApproved === true) warn(`wedding.closingLine differs from the PRD wording and the change is marked approved: "${wedding.closingLine.join(' ')}"`);
    else fail(`wedding.closingLine differs from the approved wording ("${CANONICAL_CLOSING_LINE}"); set wedding.closingLineChangeApproved to true only with owner approval`);
  }
  if (!Array.isArray(c.invitation?.requestLines) || !c.invitation.requestLines.length) fail('invitation.requestLines is required');
  else {
    const joined = c.invitation.requestLines.join(' ').replace(/\s+/g, ' ').trim();
    if (joined.toLowerCase() !== CANONICAL_REQUEST) fail(`invitation.requestLines wording differs from the PRD §06 content master ("${joined}")`);
    else if (joined !== CANONICAL_REQUEST && !/capitalis|capitaliz/i.test(c.invitation.approval?.note ?? '')) warn('invitation.requestLines use different capitalisation from the PRD text; record the owner decision in invitation.approval.note');
  }
  if (typeof c.site?.launchApproved !== 'boolean') fail('site.launchApproved must be true or false (G3 record, RELEASE-01)');

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
  const OFFSET_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/; // an explicit offset, as the RSVP service requires (audit QA-19)
  if (r?.cutoffAt != null && (!OFFSET_ISO.test(r.cutoffAt) || Number.isNaN(Date.parse(r.cutoffAt)))) fail('rsvp.cutoffAt must be an ISO date-time with an explicit offset (for example 2026-11-20T23:59:59-06:00) or null');
  if (r?.opensAt != null && (!OFFSET_ISO.test(r.opensAt) || Number.isNaN(Date.parse(r.opensAt)))) fail('rsvp.opensAt must be an ISO date-time with an explicit offset or null');
  if (r?.opensAt && r?.mode !== 'coming-soon') warn('rsvp.opensAt is set but rsvp.mode is not coming-soon; the opening date is only shown in the not-yet-open state');
  if (r?.opensAt && r?.cutoffAt && Date.parse(r.opensAt) >= Date.parse(r.cutoffAt)) fail('rsvp.opensAt must be before rsvp.cutoffAt');
  const mc = r?.mealChoices;
  if (mc && (mc.eventId || (mc.options ?? []).length)) {
    if (!(events ?? []).some((e) => e.id === mc.eventId)) fail('rsvp.mealChoices.eventId must name an event');
    if (!Array.isArray(mc.options) || mc.options.length < 2 || mc.options.some((o) => typeof o !== 'string' || !o.trim())) fail('rsvp.mealChoices.options needs at least two non-empty strings');
  }
  if (r?.allowPreview) {
    const hhs = r.preview?.households;
    if (!Array.isArray(hhs) || !hhs.length) fail('rsvp.preview.households[] is required when allowPreview is true');
    else {
      const codes = new Set(); const hids = new Set();
      const eids = new Set((events ?? []).map((e) => e.id));
      for (const hh of hhs) {
        if (!hh.code || !/^[A-Z0-9]{4,}$/i.test(hh.code)) fail(`preview household ${hh.id}: code should be a short alphanumeric code`);
        if (codes.has((hh.code ?? '').toUpperCase())) fail(`preview household code duplicated: ${hh.code}`); codes.add((hh.code ?? '').toUpperCase());
        if (!hh.id || hids.has(hh.id)) fail(`preview household id missing or duplicated: ${hh.id}`); hids.add(hh.id);
        const gids = new Set();
        for (const g of hh.guests ?? []) {
          if (!g.id || gids.has(g.id)) fail(`preview guest id missing or duplicated: ${g.id}`); gids.add(g.id);
          if (!['named', 'plus-one'].includes(g.kind)) fail(`preview guest ${g.id}: kind must be named or plus-one`);
          if (g.kind === 'named' && !g.name) fail(`preview guest ${g.id}: named guests need a name`);
          if (g.kind === 'plus-one' && !(hh.guests ?? []).some((x) => x.id === g.hostGuestId && x.kind === 'named')) fail(`preview guest ${g.id}: hostGuestId must reference a named guest`);
        }
        const seen = new Set();
        for (const e of hh.entitlements ?? []) {
          const k = `${e.guestId}|${e.eventId}`;
          if (seen.has(k)) fail(`preview entitlement duplicated: ${k}`); seen.add(k);
          if (!gids.has(e.guestId)) fail(`preview entitlement references unknown guest ${e.guestId}`);
          if (!eids.has(e.eventId)) fail(`preview entitlement references unknown event ${e.eventId}`);
        }
      }
    }
  }

  for (const f of c.faqs ?? []) {
    if (!f.id || !f.question) fail(`faq entry missing id or question`);
    if (f.approval?.state !== 'pending' && !f.answer) fail(`faq ${f.id}: answer is required unless approval.state is pending`);
    if (f.approval?.state === 'pending' && f.answer) warn(`faq ${f.id}: has an answer but is pending, so it will not be published`);
    if (f.answerWithCutoff != null && (typeof f.answerWithCutoff !== 'string' || !f.answerWithCutoff.includes('{cutoff}'))) fail(`faq ${f.id}: answerWithCutoff must be a string containing {cutoff}`);
  }
  for (const a of c.travel?.gettingThere?.airports ?? []) {
    const t = `travel.gettingThere.airports[${a.code ?? a.name}]`;
    if (!a.name || !a.code) fail(`${t}: name and code are required`);
    if (a.website && !/^https:\/\//.test(a.website)) fail(`${t}: website must be an https URL`);
    if (!a.approval) fail(`${t}: an approval block is required; each airport is published only when its own approval is not pending (audit IMP-15)`);
  }
  validateStory(c);
  if (c.contact?.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.contact.email)) fail('contact.email does not look like an email address');
  if (!Number.isInteger(c.privacy?.retentionDaysAfterWedding)) fail('privacy.retentionDaysAfterWedding must be an integer');
  if (c.travel?.hotel?.roomBlock) {
    const rb = c.travel.hotel.roomBlock;
    if (!rb.url || !/^https?:\/\//.test(rb.url)) fail('travel.hotel.roomBlock.url must be an absolute URL');
    if (rb.approval?.state !== 'approved') fail('travel.hotel.roomBlock requires its own approval.state "approved" before it is published (CONTENT-03)');
    for (const k of ['code', 'rate', 'cutoffDate', 'cancellation']) if (rb[k] != null && typeof rb[k] !== 'string') fail(`travel.hotel.roomBlock.${k} must be a string or null`);
    if (rb.cutoffDate && !/^\d{4}-\d{2}-\d{2}$/.test(rb.cutoffDate)) fail('travel.hotel.roomBlock.cutoffDate must be YYYY-MM-DD');
    if (rb.inclusions != null && (!Array.isArray(rb.inclusions) || rb.inclusions.some((x) => typeof x !== 'string'))) fail('travel.hotel.roomBlock.inclusions must be an array of strings');
    if (!rb.code && !rb.rate && !rb.cutoffDate && !(rb.inclusions ?? []).length && !rb.cancellation) fail('travel.hotel.roomBlock needs at least one supplied term (code, rate, cutoffDate, inclusions, cancellation)');
  }
  collectApprovals(c);
}

let storyManifestCache;
function storyManifest() {
  if (storyManifestCache === undefined) {
    const f = path.join(STORY_DERIVATIVES, 'manifest.json');
    storyManifestCache = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  }
  return storyManifestCache;
}
function storyDerivatives(id) { return storyManifest()?.images?.[id] ?? null; }
function storyPublished(c) { const s = c.story; return !!(s && s.enabled && s.approval?.state === 'approved' && s.visibility === 'public'); }

// Our Story (audit IMP-12/13, QA-06–08): nothing reaches the public build until the owners have
// approved the copy, marked it public and recorded rights and subject approval for every picture.
function validateStory(c) {
  const s = c.story;
  if (!s) return;
  if (typeof s.enabled !== 'boolean') fail('story.enabled must be true or false');
  if (s.visibility != null && s.visibility !== 'public') fail('story.visibility must be "public" or null; a private story needs server-side access control, which static hosting cannot provide (docs/OUR_STORY_INTAKE.md)');
  const imgs = s.images ?? [];
  const ids = new Set();
  for (const im of imgs) {
    const t = `story.images[${im.id}]`;
    if (!im.id || ids.has(im.id)) fail(`${t}: id missing or duplicated`); ids.add(im.id);
    if (!['lead', 'supporting', 'milestone'].includes(im.role)) fail(`${t}: role must be lead, supporting or milestone`);
    if (!im.source || !/^assets\/story\/originals\//.test(im.source)) fail(`${t}: source must be a file under assets/story/originals/ (never copied to the public build)`);
    const fp = im.focalPoint;
    if (fp && !(fp.x >= 0 && fp.x <= 1 && fp.y >= 0 && fp.y <= 1)) fail(`${t}: focalPoint.x and .y must be between 0 and 1`);
  }
  if (imgs.filter((i) => i.role === 'lead').length > 1) fail('story.images: only one image may have the role "lead"');
  if (imgs.length > 6) fail('story.images: at most six images (audit §06 selection limit)');
  for (const m of s.milestones ?? []) {
    if (!m.id || !m.title || !m.description) fail(`story.milestones[${m.id}]: id, title and description are required`);
    if (m.imageId && !ids.has(m.imageId)) fail(`story.milestones[${m.id}]: imageId "${m.imageId}" is not in story.images`);
  }
  if (!s.enabled) return;
  if (s.approval?.state !== 'approved') fail('story.enabled is true but story.approval.state is not "approved"; the section stays out of the public build until the owners approve the copy and photographs (audit IMP-12)');
  if (s.visibility !== 'public') fail('story.enabled is true but story.visibility is not "public" (owner visibility decision, audit IMP-03)');
  const paras = s.narrative?.paragraphs ?? [];
  if (!paras.length || paras.some((x) => typeof x !== 'string' || !x.trim())) fail('story.narrative.paragraphs must hold at least one non-empty paragraph when the story is enabled');
  if (paras.length > 3) warn('story.narrative has more than three paragraphs; the audit brief suggests three short paragraphs');
  const words = paras.join(' ').split(/\s+/).filter(Boolean).length;
  if (words < 150 || words > 250) warn(`story.narrative is ${words} words; the audit brief targets 150–250`);
  if (!imgs.some((i) => i.role === 'lead')) fail('story.images needs one image with the role "lead" when the story is enabled');
  for (const im of imgs) {
    const t = `story.images[${im.id}]`;
    if (!im.alt || !im.alt.trim()) fail(`${t}: alt text is required (audit §06)`);
    for (const k of ['rightsConfirmed', 'subjectsApproved', 'publicationApproved']) if (im[k] !== true) fail(`${t}: ${k} must be true before publication`);
    if (im.visibility !== 'public') fail(`${t}: visibility must be "public"`);
    const d = storyDerivatives(im.id);
    if (!d || !d.sizes?.length) fail(`${t}: no derivatives in ${path.relative(ROOT, STORY_DERIVATIVES)}/manifest.json; run npm run images`);
    else for (const sz of d.sizes) for (const k of ['webp', 'jpg']) if (!fs.existsSync(path.join(STORY_DERIVATIVES, sz[k]))) fail(`${t}: derivative ${sz[k]} is missing; run npm run images`);
  }
}

function storyView(c) {
  const s = c.story;
  if (!storyPublished(c)) return { published: false, preview: PREVIEW_BUILD && !!s };
  const images = (s.images ?? []).map((im) => {
    const d = storyDerivatives(im.id);
    return { id: im.id, role: im.role, alt: im.alt, caption: im.caption ?? null, photographer: im.photographer ?? null, focal: im.focalPoint ?? { x: 0.5, y: 0.5 }, width: d.width, height: d.height, sizes: d.sizes.map((sz) => ({ w: sz.w, h: sz.h, webp: `/img/story/${sz.webp}`, jpg: `/img/story/${sz.jpg}` })) };
  });
  return {
    published: true,
    preview: false,
    heading: s.heading || 'Our Story',
    paragraphs: s.narrative.paragraphs,
    milestones: (s.milestones ?? []).map((m) => ({ id: m.id, title: m.title, description: m.description, when: m.when ?? null, place: m.place ?? null, image: m.imageId ? images.find((i) => i.id === m.imageId) ?? null : null })),
    images,
  };
}

function cutoffLabel(iso, tz) {
  const parts = zonedParts(iso, tz);
  return `${longDate(parts)} at ${clockLabel(parts)} ${timeZoneLabel(tz, parts)}`;
}

function isPublished(block) {
  return block && block.approval && block.approval.state !== 'pending';
}

function roomBlockView(rb) {
  if (!rb || rb.approval?.state !== 'approved') return null;
  const rows = [];
  if (rb.code) rows.push({ label: 'Booking code', value: rb.code });
  if (rb.rate) rows.push({ label: 'Rate', value: rb.rate });
  if (rb.cutoffDate) rows.push({ label: 'Book by', value: longDate(zonedParts(`${rb.cutoffDate}T12:00:00Z`, 'UTC')) });
  for (const inc of rb.inclusions ?? []) rows.push({ label: 'Included', value: inc });
  if (rb.cancellation) rows.push({ label: 'Cancellation', value: rb.cancellation });
  return { url: rb.url, rows };
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
  const cutoff = c.rsvp.cutoffAt ? cutoffLabel(c.rsvp.cutoffAt, tz) : null;
  const opensAt = c.rsvp.opensAt ? cutoffLabel(c.rsvp.opensAt, tz) : null;
  const faqs = (c.faqs ?? []).filter((f) => isPublished(f) && f.answer).map((f) => ({ id: f.id, question: f.question, answer: cutoff && f.answerWithCutoff ? f.answerWithCutoff.replace('{cutoff}', cutoff) : f.answer }));
  const contactPublished = isPublished(c.contact) && (c.contact.email || c.contact.phone);
  const betweenVenues = isPublished(c.travel.betweenVenues) && c.travel.betweenVenues.text ? c.travel.betweenVenues.text : null;
  const reviewed = new Date(`${c.lastReviewed}T12:00:00Z`);

  const postEvent = c.site.phase === 'post-event';
  const banner = c.banner?.active && isPublished(c.banner) ? { message: c.banner.message, linkUrl: c.banner.linkUrl ?? null, linkLabel: c.banner.linkLabel ?? null, updatedAt: c.banner.updatedAt ?? null } : null;
  return {
    basePath: c.site.basePath ?? '',
    site: c.site,
    phase: c.site.phase,
    postEvent: postEvent ? { heading: c.postEvent.heading || 'Thank you', message: c.postEvent.message } : null,
    banner,
    couple: c.couple,
    wedding: { ...c.wedding, destinationShort },
    invitation: { requestLines: c.invitation.requestLines.map(sub) },
    formalDateLines: formalDateLines(weddingParts),
    longDate: longDate(weddingParts),
    events,
    weddingDay: { intro: sub(c.weddingDay.intro), venueChangeNote: isPublished(c.weddingDay) ? c.weddingDay.venueChangeNote : null },
    travel: {
      hotel: { ...c.travel.hotel, roomBlock: roomBlockView(c.travel.hotel.roomBlock) },
      gettingThere: {
        paragraphs: c.travel.gettingThere.paragraphs,
        airports: (c.travel.gettingThere.airports ?? []).filter(isPublished).map((a) => ({ name: a.name, code: a.code, website: a.website ?? null, note: a.note ?? null })),
        airportsNote: c.travel.gettingThere.airportsNote ?? null,
      },
      betweenVenues,
    },
    faqs,
    contact: contactPublished ? { email: c.contact.email, phone: c.contact.phone, phoneDisplay: c.contact.phoneDisplay, note: c.contact.note } : null,
    // The synthetic preview is disabled in deployed review builds (SITE_PREVIEW=0, set by deploy.yml) so that
    // review previews stay out of the public domain (PRD TPL-09); local builds keep it.
    rsvp: { ...(postEvent ? { ...c.rsvp, mode: 'closed', allowPreview: false, closedText: c.postEvent.message } : (PREVIEW_BUILD ? c.rsvp : { ...c.rsvp, allowPreview: false })), cutoffLabel: cutoff, opensAtLabel: opensAt },
    story: storyView(c),
    privacy: c.privacy,
    lastReviewedLabel: reviewed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    crestAlt: `The family crest: two silver dolphins with gold collars joined by a gold chain around the ${c.couple.monogram} monogram above blue waves, with the motto “Je mourrai pour ceux que j’aime”.`,
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
  fs.writeFileSync(path.join(DIST, 'celebration.html'), renderCelebration(view));
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
  if (view.story.published) {
    // Only the derivatives of published images are copied; originals and manifest never are.
    fs.mkdirSync(path.join(DIST, 'img', 'story'), { recursive: true });
    for (const im of view.story.images) for (const sz of im.sizes) for (const k of ['webp', 'jpg']) fs.copyFileSync(path.join(STORY_DERIVATIVES, path.basename(sz[k])), path.join(DIST, 'img', 'story', path.basename(sz[k])));
  } else if (view.story.preview) {
    fs.writeFileSync(path.join(DIST, 'story-preview.html'), renderStoryPreview(view, storyPreviewFixture(view)));
  }
  const cname = path.join(ROOT, 'CNAME');
  if (fs.existsSync(cname)) fs.copyFileSync(cname, path.join(DIST, 'CNAME'));
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
}

function readiness(c) {
  const items = []; // { level: 'blocker' | 'review' | 'info', item, detail }
  const add = (level, item, detail) => items.push({ level, item, detail });
  const launching = c.rsvp.mode === 'live';
  if (!c.site.launchApproved) add('blocker', 'Guest release (G3) not recorded', 'site.launchApproved is false. Set it to true only when RELEASE-01 is satisfied and the owners have approved release; `npm run build -- --strict` fails while any blocker remains.');
  if (c.rsvp.mode !== 'live') add('blocker', 'RSVP is not live', `rsvp.mode is "${c.rsvp.mode}"; guests see the ${c.rsvp.mode} message. A backend service and rsvp.apiBaseUrl are required (PRD §08–§11).`);
  if (!c.rsvp.cutoffAt) add('blocker', 'RSVP cutoff not set', 'rsvp.cutoffAt is null (PRD §16, RSVP-04).');
  if (!c.contact.email && !c.contact.phone) add('blocker', 'No private contact route', 'contact.email / contact.phone are null (PRD CONTENT-04, §03 exception path).');
  if (!c.privacy.rsvpProvider) add('blocker', 'RSVP provider not named in the privacy notice', 'privacy.rsvpProvider is null (PRD SEC-04).');
  for (const ev of c.events) {
    for (const k of ['entrance', 'parking']) if (ev.venue[k] == null) add(launching && k === 'entrance' ? 'blocker' : 'review', `${ev.name}: ${k} unconfirmed`, `events[${ev.id}].venue.${k} is null; omitted from the page (PRD CONTENT-02, §16).${launching && k === 'entrance' ? ' Essential for guest launch (PRD §15 risk controls).' : ''}`);
    if (launching && ['carried-forward', 'publisher-claim', 'draft'].includes(ev.approval?.state)) add('blocker', `${ev.name}: venue details not confirmed`, `events[${ev.id}].approval.state is "${ev.approval.state}"; the coordinator must confirm the address before RSVP goes live (PRD §15 risk controls, §16).`);
  }
  if (process.env.SITE_PREVIEW === '0') add('info', 'Synthetic preview disabled for this build', 'SITE_PREVIEW=0: /rsvp.html?preview=1 is off in the deployed build; use npm run build && npm run serve locally to review the RSVP flow.');
  if (c.site.phase === 'post-event') add('info', 'Site is in post-event phase', 'RSVP calls to action are replaced by the thank-you content and online responses are closed (OPS-03).');
  if (!c.banner?.active) add('info', 'Urgent logistics banner is off', 'Set banner.active with an approved message to publish wedding-day logistics above every page (ADMIN-04, OPS-02).');
  if (c.rsvp.allowPreview) add('review', 'Synthetic RSVP preview is enabled', 'rsvp.allowPreview is true, so /rsvp.html?preview=1 shows the labeled synthetic household. Set it to false before guest launch (PRD RELEASE-01).');
  if (!c.travel.hotel.roomBlock) add('info', 'No wedding room block published', 'travel.hotel.roomBlock is null; only general hotel information is shown (PRD CONTENT-03).');
  if (c.rsvp.mode === 'coming-soon') add('info', c.rsvp.opensAt ? 'RSVP opening date announced' : 'RSVP opening date not announced', c.rsvp.opensAt ? `rsvp.opensAt is ${c.rsvp.opensAt}; the not-yet-open state names it (audit IMP-02).` : 'rsvp.opensAt is null; the not-yet-open state names no date. Set it only once the owners approve an opening date (audit IMP-02).');
  if (!storyPublished(c)) add('info', 'config.story: Our Story not published', `story.enabled=${c.story?.enabled ?? 'absent'}, approval ${c.story?.approval?.state ?? 'absent'}, visibility ${c.story?.visibility ?? 'null'}. Optional module (PRD CONTENT-01, audit IMP-12/13): local and CI builds render a synthetic-fixture layout preview at /story-preview.html; the deployed build omits the section, its navigation link and every story image. Intake: docs/OUR_STORY_INTAKE.md.`);
  else add('review', 'config.story: Our Story is published', `${c.story.images.length} image(s) with recorded rights, subject and publication approval; confirm captions and copy before guest launch (audit QA-07).`);
  const pendingAirports = (c.travel.gettingThere.airports ?? []).filter((a) => a.approval?.state === 'pending').map((a) => a.code);
  if (pendingAirports.length) add('review', 'Airports awaiting verification', `${pendingAirports.join(', ')} are prefilled but unpublished until the coordinator verifies December 2026 service and approves them (audit IMP-15).`);
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
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
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
if (STRICT && items.some((i) => i.level === 'blocker')) {
  console.error('Strict mode: launch blockers remain; refusing to treat this build as releasable.');
  process.exit(2);
}
