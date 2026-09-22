// Unit tests for the build helpers plus the automated AT-02 check (one configuration change moves
// every derived output together). Run: npm test  (node:test, no dependencies).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { numberWords, ordinalWords, yearWords, zonedParts, clockLabel, formalDateLines, formalTimeLine } from './lib/format.mjs';
import { icsText, foldLine, buildIcs } from './lib/ics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('number and ordinal words match the approved invitation wording', () => {
  assert.equal(yearWords(2026), 'Two Thousand Twenty-Six');
  assert.equal(ordinalWords(19), 'Nineteenth');
  assert.equal(ordinalWords(21), 'Twenty-First');
  assert.equal(numberWords(45), 'Forty-Five');
});

test('event times resolve in the event time zone', () => {
  const p = zonedParts('2026-12-19T14:00:00-06:00', 'America/Chicago');
  assert.equal(p.isoDate, '2026-12-19');
  assert.equal(p.weekday, 'Saturday');
  assert.equal(p.offset, '-06:00');
  assert.equal(clockLabel(p), '2:00 p.m.');
  assert.deepEqual(formalDateLines(p), ['On Saturday, The Nineteenth of December', 'Two Thousand Twenty-Six']);
  assert.equal(formalTimeLine('Ceremony', p, 'Afternoon'), 'Ceremony at Two O’Clock in the Afternoon');
  assert.equal(formalTimeLine('Reception', zonedParts('2026-12-19T16:00:00-06:00', 'America/Chicago'), 'Evening'), 'Reception at Four O’Clock in the Evening');
  assert.equal(formalTimeLine('Ceremony', zonedParts('2026-12-19T15:30:00-06:00', 'America/Chicago'), 'Afternoon'), 'Ceremony at Half Past Three in the Afternoon');
});

test('iCalendar text escaping and line folding follow RFC 5545', () => {
  assert.equal(icsText('a;b,c\\d\nnew'), 'a\;b\\,c\\\\d\\nnew');
  const folded = foldLine('DESCRIPTION:' + 'x'.repeat(200));
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, 'folded lines are at most 75 octets');
  assert.equal(folded.split('\r\n').slice(1).every((l) => l.startsWith(' ')), true);
  const ics = buildIcs({ prodId: '-//test//EN', timeZone: 'America/Chicago', dtstamp: '20260921T000000Z', events: [{ uid: 'u1', startLocal: '20261219T140000', summary: 'S', location: 'L', description: 'D', url: 'https://example.invalid/' }] });
  assert.match(ics, /DTSTART;TZID=America\/Chicago:20261219T140000\r\n/);
  assert.doesNotMatch(ics, /DTEND/);
  assert.match(ics, /BEGIN:VTIMEZONE[\s\S]*TZID:America\/Chicago/);
});

test('AT-02: changing the ceremony start once moves the invitation, cards, RSVP labels and calendar together', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-at02-'));
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.config.json'), 'utf8'));
  config.events[0].startsAt = '2026-12-19T15:30:00-06:00';
  const cfgPath = path.join(tmp, 'site.config.json');
  fs.writeFileSync(cfgPath, JSON.stringify(config));
  const dist = path.join(tmp, 'dist');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs')], { env: { ...process.env, SITE_CONFIG: cfgPath, DIST_DIR: dist }, stdio: 'pipe' });
  const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const rsvp = fs.readFileSync(path.join(dist, 'rsvp.html'), 'utf8');
  const ics = fs.readFileSync(path.join(dist, 'calendar', 'ceremony.ics'), 'utf8');
  assert.match(index, /Ceremony at Half Past Three in the Afternoon/);
  assert.match(index, /<time datetime="2026-12-19T15:30:00-06:00">3:30 p\.m\.<\/time>/);
  assert.match(index, /Saint Francis Chapel, 3:30 p\.m\./);
  assert.match(rsvp, /3:30 p\.m\. Central Time \(CST\)/);
  assert.match(ics, /DTSTART;TZID=America\/Chicago:20261219T153000/);
  assert.doesNotMatch(index, /Two O’Clock/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('the build refuses a changed closing line and changed request-line wording', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-guard-'));
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.config.json'), 'utf8'));
  config.wedding.closingLine = ['Where the ancient waters meet', 'the bay'];
  const cfgPath = path.join(tmp, 'site.config.json');
  fs.writeFileSync(cfgPath, JSON.stringify(config));
  assert.throws(() => execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs'), '--check'], { env: { ...process.env, SITE_CONFIG: cfgPath, DIST_DIR: path.join(tmp, 'dist') }, stdio: 'pipe' }));
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ---------- Audit follow-ups (22 September 2026): build-level acceptance checks ----------
// These are lab checks in Node; the client-side scenarios they inform (calendar imports, screen
// readers, real devices) stay "not run" in docs/audit/acceptance-tests.json until run for real.
function readConfig() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.config.json'), 'utf8')); }
function buildWith(config, { preview = true, env = {} } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-audit-'));
  const cfgPath = path.join(tmp, 'site.config.json');
  fs.writeFileSync(cfgPath, JSON.stringify(config));
  const dist = path.join(tmp, 'dist');
  const run = () => execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs')], { env: { ...process.env, SITE_CONFIG: cfgPath, DIST_DIR: dist, SITE_PREVIEW: preview ? '1' : '0', ...env }, stdio: 'pipe' });
  return { tmp, dist, run, read: (f) => fs.readFileSync(path.join(dist, f), 'utf8'), exists: (f) => fs.existsSync(path.join(dist, f)) };
}
function icsProps(text) {
  const unfolded = text.replace(/\r\n[ \t]/g, '');
  return unfolded.split('\r\n').filter(Boolean);
}
function instantOf(tzidLine) {
  // DTSTART;TZID=America/Chicago:20261219T140000 → epoch ms using the same conversion as the build
  const m = /TZID=([^:]+):(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(tzidLine);
  const local = `${m[2]}-${m[3]}-${m[4]}T${m[5]}:${m[6]}:${m[7]}`;
  const guess = zonedParts(`${local}Z`, m[1]); // offset in force on that date
  return Date.parse(`${local}${guess.offset}`);
}

test('QA-23 (file level): calendar files parse, start at 20:00Z and 22:00Z on the wedding day, keep stable UIDs and invent no end time', () => {
  const b = buildWith(readConfig(), { preview: false });
  b.run();
  const expected = { ceremony: '2026-12-19T20:00:00Z', reception: '2026-12-19T22:00:00Z' };
  const uids = {};
  for (const [id, iso] of Object.entries(expected)) {
    const text = b.read(`calendar/${id}.ics`);
    assert.ok(text.includes('\r\n') && !/[^\r]\n/.test(text), `${id}.ics uses CRLF line endings`);
    for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `${id}.ics line within 75 octets: ${line}`);
    const props = icsProps(text);
    assert.ok(props.includes('BEGIN:VCALENDAR') && props.includes('END:VCALENDAR') && props.includes('BEGIN:VEVENT'));
    assert.ok(props.some((l) => l.startsWith('TZID:America/Chicago')), 'VTIMEZONE present');
    const event = props.slice(props.indexOf('BEGIN:VEVENT')); // the VTIMEZONE block has its own DTSTART lines
    const dtstart = event.find((l) => l.startsWith('DTSTART'));
    assert.equal(new Date(instantOf(dtstart)).toISOString().replace('.000', ''), iso);
    assert.ok(!event.some((l) => l.startsWith('DTEND')), 'no invented end time');
    assert.ok(props.some((l) => /^LOCATION:/.test(l) && /Alabama/.test(l)), 'venue address in LOCATION');
    uids[id] = event.find((l) => l.startsWith('UID:'));
    assert.match(uids[id], /^UID:.+/);
  }
  // A second build of the same configuration yields the same identifiers (stable for re-import).
  const b2 = buildWith(readConfig(), { preview: false }); b2.run();
  for (const id of Object.keys(expected)) assert.equal(icsProps(b2.read(`calendar/${id}.ics`)).find((l) => l.startsWith('UID:')), uids[id]);
  fs.rmSync(b.tmp, { recursive: true, force: true }); fs.rmSync(b2.tmp, { recursive: true, force: true });
});

test('QA-31 (build level): public routes and anchors exist and unpublished modules are absent from the deployed build', () => {
  const b = buildWith(readConfig(), { preview: false });
  b.run();
  for (const f of ['index.html', 'celebration.html', 'rsvp.html', 'privacy.html', '404.html', 'calendar/ceremony.ics', 'calendar/reception.ics', 'CNAME', '.nojekyll']) assert.ok(b.exists(f), `${f} exists`);
  const index = b.read('index.html');
  for (const id of ['wedding-day', 'travel-stay', 'questions', 'invitation', 'main', 'top']) assert.ok(index.includes(`id="${id}"`), `anchor #${id} exists`);
  assert.ok(!index.includes('id="our-story"'), 'unpublished story section absent');
  assert.ok(!index.includes('#our-story'), 'no navigation link to an unpublished story');
  assert.ok(!b.exists('story-preview.html'), 'story preview absent from the deployed build');
  assert.ok(!b.exists('img/story'), 'no story images in the deployed build');
  assert.doesNotMatch(index, /Nearest/i, 'no proximity claim about airports (audit IMP-15)');
  assert.match(index, /rel="canonical" href="https:\/\/robertandnatalie\.wedding\/"/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-06 (build level): local and CI builds carry a labelled synthetic story preview that the deployed build omits', () => {
  const b = buildWith(readConfig(), { preview: true });
  b.run();
  assert.ok(b.exists('story-preview.html'));
  const html = b.read('story-preview.html');
  assert.match(html, /Protected preview/);
  assert.match(html, /synthetic layout fixture/i);
  assert.match(html, /id="our-story"/);
  assert.ok(!b.read('index.html').includes('id="our-story"'), 'the home page still has no story section');
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-07/08 (build level): the story is refused until every approval is recorded, then publishes with derivatives and a navigation link', () => {
  const config = readConfig();
  config.story = {
    enabled: true, visibility: 'public', heading: 'Our Story',
    narrative: { voice: 'first-person plural', paragraphs: [Array(60).fill('word').join(' '), Array(60).fill('word').join(' '), Array(60).fill('word').join(' ')] },
    milestones: [{ id: 'm1', title: 'A milestone', description: 'Approved description.', when: null, place: null, imageId: 'lead' }],
    images: [{ id: 'lead', role: 'lead', source: 'assets/story/originals/lead.jpg', alt: 'Approved alternative text', caption: 'Approved caption', photographer: null, rightsConfirmed: true, subjectsApproved: true, publicationApproved: false, visibility: 'public', focalPoint: { x: 0.5, y: 0.4 } }],
    approval: { state: 'approved', owner: 'Robert / Natalie', source: 'test', reviewed: '2026-09-22', note: 'test' },
  };
  // 1. publicationApproved is false → the build refuses.
  let b = buildWith(config, { preview: false });
  assert.throws(() => b.run(), /publicationApproved must be true/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
  // 2. Approved but no derivatives → the build refuses (never ships an original or a broken image).
  config.story.images[0].publicationApproved = true;
  const derivTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-deriv-'));
  b = buildWith(config, { preview: false, env: { STORY_DERIVATIVES_DIR: derivTmp } });
  assert.throws(() => b.run(), /no derivatives/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
  // 3. Derivatives present → published with picture sources, alt text, caption, focal point and nav link.
  const manifest = { generatedAt: '2026-09-22T00:00:00Z', images: { lead: { id: 'lead', role: 'lead', source: 'assets/story/originals/lead.jpg', width: 1200, height: 800, sizes: [{ w: 480, h: 320, webp: 'lead-480.webp', jpg: 'lead-480.jpg' }, { w: 1200, h: 800, webp: 'lead-1200.webp', jpg: 'lead-1200.jpg' }] } } };
  fs.writeFileSync(path.join(derivTmp, 'manifest.json'), JSON.stringify(manifest));
  for (const f of ['lead-480.webp', 'lead-480.jpg', 'lead-1200.webp', 'lead-1200.jpg']) fs.writeFileSync(path.join(derivTmp, f), 'x');
  b = buildWith(config, { preview: false, env: { STORY_DERIVATIVES_DIR: derivTmp } });
  b.run();
  const index = b.read('index.html');
  assert.match(index, /<section id="our-story"/);
  assert.match(index, /href="#our-story">Our Story<\/a>/);
  assert.match(index, /srcset="\/img\/story\/lead-480\.webp 480w, \/img\/story\/lead-1200\.webp 1200w"/);
  assert.match(index, /alt="Approved alternative text"/);
  assert.match(index, /object-position: 50% 40%/);
  assert.match(index, /<figcaption>Approved caption<\/figcaption>/);
  assert.ok(b.exists('img/story/lead-1200.webp') && !b.exists('img/story/manifest.json'), 'derivatives copied, manifest not');
  assert.ok(!b.exists('story-preview.html'));
  fs.rmSync(b.tmp, { recursive: true, force: true }); fs.rmSync(derivTmp, { recursive: true, force: true });
});

test('IMP-02/07: the opening date and the deadline appear only when set, and then everywhere at once', () => {
  const before = buildWith(readConfig(), { preview: false }); before.run();
  assert.match(before.read('rsvp.html'), /Not yet open/);
  assert.doesNotMatch(before.read('rsvp.html'), /Responses open on/);
  assert.match(before.read('index.html'), /Responses are not open yet\./);
  assert.match(before.read('index.html'), /deadline will be published here/);
  fs.rmSync(before.tmp, { recursive: true, force: true });
  const config = readConfig();
  config.rsvp.opensAt = '2026-10-01T09:00:00-05:00';
  config.rsvp.cutoffAt = '2026-11-15T23:59:00-06:00';
  const after = buildWith(config, { preview: false }); after.run();
  const rsvp = after.read('rsvp.html'); const index = after.read('index.html');
  assert.match(rsvp, /Responses open on Thursday, October 1, 2026 at 9:00 a\.m\. Central Time \(CDT\)\./);
  assert.match(index, /they open on Thursday, October 1, 2026 at 9:00 a\.m\. Central Time \(CDT\)/);
  assert.match(index, /Please respond by Sunday, November 15, 2026 at 11:59 p\.m\. Central Time \(CST\)\./);
  assert.match(rsvp, /"cutoffAt":"2026-11-15T23:59:00-06:00"/);
  fs.rmSync(after.tmp, { recursive: true, force: true });
});

test('IMP-15: only airports with their own non-pending approval are published, each with its official site', () => {
  const b = buildWith(readConfig(), { preview: false }); b.run();
  const index = b.read('index.html');
  assert.match(index, /Mobile Regional Airport<\/strong> \(MOB\)/);
  assert.match(index, /href="https:\/\/www\.mobileairportauthority\.com\/"/);
  assert.doesNotMatch(index, /Pensacola International Airport/);
  assert.doesNotMatch(index, /flyjka\.com/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('IMP-13: the image pipeline writes metadata-free derivatives at each width without upscaling (skipped without Chromium)', async (t) => {
  let chromiumAvailable = true;
  try { const { chromium } = await import('playwright'); const br = await chromium.launch(); await br.close(); } catch { chromiumAvailable = false; }
  if (!chromiumAvailable) { t.skip('Playwright Chromium is not installed in this environment'); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-images-'));
  const originals = path.join(tmp, 'assets', 'story', 'originals'); fs.mkdirSync(originals, { recursive: true });
  fs.writeFileSync(path.join(originals, 'test.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600"><rect width="1000" height="600" fill="#B38A39"/><circle cx="500" cy="300" r="200" fill="#152B45"/></svg>');
  const { generateDerivatives } = await import('./images.mjs');
  const out = path.join(tmp, 'derivatives');
  const { manifest, problems } = await generateDerivatives({ images: [{ id: 'test', role: 'lead', source: 'assets/story/originals/test.svg' }], storyRoot: tmp, out, log: () => {} });
  assert.deepEqual(problems, []);
  const entry = manifest.images.test;
  assert.equal(entry.width, 1000);
  assert.deepEqual(entry.sizes.map((s) => s.w), [480, 800, 1000], 'no derivative wider than the original');
  for (const s of entry.sizes) {
    assert.equal(s.h, Math.round((600 * s.w) / 1000));
    const jpg = fs.readFileSync(path.join(out, s.jpg));
    assert.equal(jpg.readUInt16BE(0), 0xffd8, 'JPEG magic');
    assert.ok(!jpg.includes(Buffer.from('Exif')), 'no EXIF segment in the derivative');
    assert.equal(fs.readFileSync(path.join(out, s.webp)).toString('ascii', 0, 4), 'RIFF', 'WebP container');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});
