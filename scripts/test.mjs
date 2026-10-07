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
  for (const id of ['wedding-day', 'travel-stay', 'questions', 'invitation', 'main', 'top', 'our-story']) assert.ok(index.includes(`id="${id}"`), `anchor #${id} exists`);
  assert.match(index, /href="#our-story">Our Story<\/a>/);
  assert.ok(!b.exists('story-preview.html'), 'story preview absent from the deployed build');
  assert.ok(b.exists('img/story'), 'published story derivatives are copied');
  assert.ok(!b.exists('img/story/manifest.json'), 'story manifest is not published');
  assert.doesNotMatch(index, /Nearest/i, 'no proximity claim about airports (audit IMP-15)');
  assert.match(index, /rel="canonical" href="https:\/\/robertandnatalie\.wedding\/"/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-06 (build level): local and CI builds carry a labelled synthetic story preview that the deployed build omits', () => {
  const config = readConfig();
  config.story = { ...config.story, enabled: false, visibility: null, approval: { ...config.story.approval, state: 'pending' } };
  const local = buildWith(config, { preview: true });
  local.run();
  assert.ok(local.exists('story-preview.html'));
  const html = local.read('story-preview.html');
  assert.match(html, /Protected preview/);
  assert.match(html, /synthetic layout fixture/i);
  assert.match(html, /id="our-story"/);
  assert.ok(!local.read('index.html').includes('id="our-story"'), 'the home page still has no story section while unpublished');
  fs.rmSync(local.tmp, { recursive: true, force: true });
  const deployed = buildWith(config, { preview: false });
  deployed.run();
  assert.ok(!deployed.exists('story-preview.html'), 'story preview absent from the deployed build');
  fs.rmSync(deployed.tmp, { recursive: true, force: true });
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

test('QA-07/08 timeline: published chapters 1–6 and 10, sequential labels, no coming-soon drafts, continued beat', () => {
  const b = buildWith(readConfig(), { preview: false });
  b.run();
  const index = b.read('index.html');
  const css = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'story.css'), 'utf8');
  assert.match(index, /<section id="our-story" class="section story story-timeline"/);
  assert.match(index, /href="#our-story">Our Story<\/a>/);
  assert.match(index, /Somewhere Between Africa &amp; America/);
  assert.match(index, /A Love Without Borders/);
  for (const [n, title] of [['I', 'Two Worlds'], ['II', 'With love, from Cairo'], ['III', 'Cape Town'], ['IV', 'An African Safari like no other'], ['V', 'Closing the Distance'], ['VI', 'Around the globe in 40 Hours'], ['VII', 'Sweet Home Alabama']]) {
    assert.match(index, new RegExp(`Chapter ${n}`));
    assert.ok(index.includes(title), `chapter title ${title}`);
  }
  assert.doesNotMatch(index, /The Land of the Sand/);
  assert.doesNotMatch(index, /From Jozi Girl/);
  assert.doesNotMatch(index, /Back to Harvard/);
  assert.doesNotMatch(index, /id="story-ch7"/);
  assert.doesNotMatch(index, /id="story-ch8"/);
  assert.doesNotMatch(index, /id="story-ch9"/);
  assert.equal((index.match(/id="story-ch\d+"/g) || []).length, 7);
  assert.doesNotMatch(index, /Coming soon/);
  assert.match(index, /id="story-continued"/);
  assert.match(index, /To be continued/);
  assert.match(index, /is-real-photo/);
  assert.match(index, /\/img\/story\/ch1-harvard-law-/);
  assert.match(index, /\/img\/story\/ch2-cairo-/);
  assert.match(index, /\/img\/story\/ch3-boat-/);
  assert.match(index, /\/img\/story\/ch4-engagement-/);
  assert.match(index, /\/img\/story\/ch5-awards-/);
  assert.match(index, /\/img\/story\/ch6-rooftop-/);
  assert.match(index, /\/img\/story\/monogram-rn-/);
  assert.doesNotMatch(index, /\/img\/story\/placeholder-monogram-/);
  assert.ok(!b.exists('img/story/placeholder-monogram-800.webp'), 'unpublished placeholder art is not deployed');
  assert.match(index, /data-draw="scrub"/);
  for (const n of [1, 2, 3, 4, 5, 6]) {
    assert.match(index, new RegExp(`class="chapter has-photo has-sketch" id="story-ch${n}"`));
    assert.match(index, new RegExp(`data-sketch="/img/story/ch${n}-sketch\\.svg"`));
    assert.ok(b.exists(`img/story/ch${n}-sketch.svg`), `ch${n} sketch copied`);
  }
  function chapterHtml(id) {
    const needle = `id="story-${id}"`;
    const start = index.indexOf(needle);
    assert.notEqual(start, -1, `story-${id} is present`);
    const rest = index.slice(start + needle.length);
    const next = rest.indexOf('\n<li class="chapter');
    return index.slice(start, next === -1 ? undefined : start + needle.length + next);
  }
  assert.match(chapterHtml('ch1'), /ch1-harvard-law-/);
  assert.match(chapterHtml('ch10'), /monogram-rn-/);
  assert.match(chapterHtml('ch10'), /Chapter VII/);
  assert.doesNotMatch(chapterHtml('ch10'), /ch1-harvard-law-/);
  assert.match(chapterHtml('ch1'), /data-sketch="\/img\/story\/ch1-sketch\.svg"/);
  assert.doesNotMatch(chapterHtml('ch10'), /data-sketch|class="sketch"|has-sketch/);
  assert.doesNotMatch(index, /sepia\(/);
  assert.doesNotMatch(css, /sepia\(|grayscale\(/);
  assert.match(css, /--sketch-ink: #2c2414/);
  assert.match(css, /\.sketch-photo \{ opacity: 1; \}/);
  assert.match(css, /\.sketch-svg \{ opacity: 0;/);
  assert.doesNotMatch(index, /style="object-position/);
  assert.match(index, /styles\/story\.css/);
  assert.match(index, /js\/story\.js/);
  assert.ok(b.exists('img/story/ch1-harvard-law-800.webp'));
  assert.ok(b.exists('img/story/ch2-cairo-800.webp'));
  assert.ok(!b.exists('story-preview.html'));
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-07/08 timeline: flipping published: true on a draft chapter shows it and remumbers later chapters', () => {
  const config = readConfig();
  const ch7 = config.story.chapters.find((ch) => ch.id === 'ch7');
  ch7.comingSoon = false;
  ch7.published = true;
  ch7.textApproved = true;
  ch7.paragraphs = ['Approved draft copy for the Dubai chapter.'];
  const b = buildWith(config, { preview: false });
  b.run();
  const index = b.read('index.html');
  assert.match(index, /id="story-ch7"/);
  assert.match(index, /The Land of the Sand/);
  assert.match(index, /Chapter VII/);
  const html7Start = index.indexOf('id="story-ch7"');
  const html10Start = index.indexOf('id="story-ch10"');
  assert.ok(html7Start > -1 && html10Start > html7Start, 'ch7 appears before ch10');
  assert.match(index.slice(html7Start, html10Start), /Chapter VII/);
  assert.match(index.slice(html10Start), /Chapter VIII/);
  assert.doesNotMatch(index, /id="story-ch8"/);
  assert.match(index, /id="story-continued"/);
  assert.doesNotMatch(index, /Coming soon/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-07/08 timeline: a published coming-soon chapter fails the build', () => {
  const config = readConfig();
  const ch7 = config.story.chapters.find((ch) => ch.id === 'ch7');
  ch7.published = true;
  const b = buildWith(config, { preview: false });
  assert.throws(() => b.run(), /cannot use coming-soon placeholder copy/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('QA-07/08 timeline: a missing sketch overlay file fails the build', () => {
  const config = readConfig();
  config.story.images = config.story.images.map((im) => im.id === 'ch2-cairo' ? { ...im, sketch: 'assets/story/sketches/missing-sketch.svg' } : im);
  const b = buildWith(config, { preview: false });
  assert.throws(() => b.run(), /sketch file .* is missing/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('IMP-02/07: the opening date and the deadline appear only when set, and then everywhere at once', () => {
  const live = buildWith(readConfig(), { preview: false }); live.run();
  assert.match(live.read('rsvp.html'), /"cutoffAt":"2026-11-15T23:59:59-06:00"/);
  assert.match(live.read('index.html'), /Please respond by Sunday, November 15, 2026 at 11:59 p\.m\. Central Time \(CST\)\./);
  assert.doesNotMatch(live.read('index.html'), /Responses are not open yet/);
  fs.rmSync(live.tmp, { recursive: true, force: true });

  const soon = readConfig();
  soon.rsvp.mode = 'coming-soon';
  soon.rsvp.opensAt = null;
  soon.rsvp.cutoffAt = null;
  const before = buildWith(soon, { preview: false }); before.run();
  assert.match(before.read('rsvp.html'), /Not yet open/);
  assert.doesNotMatch(before.read('rsvp.html'), /Responses open on/);
  assert.match(before.read('index.html'), /Responses are not open yet\./);
  assert.match(before.read('index.html'), /deadline will be published here/);
  fs.rmSync(before.tmp, { recursive: true, force: true });
  const config = readConfig();
  config.rsvp.mode = 'coming-soon';
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

test('P2 #4: RSVP calls to action follow rsvp.mode: outlined "opens soon" until live, solid RSVP only when live', () => {
  const ctas = (html) => [...html.matchAll(/<a class="(btn [^"]*)" href="\/rsvp\.html"[^>]*>([^<]*)<\/a>/g)].map((m) => ({ cls: m[1], label: m[2] }));
  const soonCfg = readConfig(); soonCfg.rsvp.mode = 'coming-soon'; soonCfg.rsvp.opensAt = null;
  const soon = buildWith(soonCfg, { preview: false }); soon.run();
  const idx = ctas(soon.read('index.html'));
  assert.equal(idx.length, 3, 'header, hero and opened invitation (none in the entry bar while closed)');
  for (const c of idx) { assert.match(c.cls, /btn-pending/); assert.doesNotMatch(c.cls, /btn-primary/); assert.equal(c.label, 'RSVP opens soon'); }
  assert.match(soon.read('index.html'), /<a class="btn btn-primary" href="#wedding-day">View Wedding Day<\/a>/);
  assert.equal(ctas(soon.read('privacy.html'))[0].label, 'RSVP opens soon');
  fs.rmSync(soon.tmp, { recursive: true, force: true });

  const dated = readConfig(); dated.rsvp.mode = 'coming-soon'; dated.rsvp.opensAt = '2026-10-15T09:00:00-05:00';
  const d = buildWith(dated, { preview: false }); d.run();
  assert.ok(ctas(d.read('index.html')).every((c) => c.label === 'RSVP opens October 15'));
  fs.rmSync(d.tmp, { recursive: true, force: true });

  const live = readConfig(); live.rsvp.mode = 'live'; live.rsvp.apiBaseUrl = 'https://api.robertandnatalie.wedding';
  const l = buildWith(live, { preview: false }); l.run();
  const lc = ctas(l.read('index.html'));
  assert.equal(lc.length, 4, 'entry bar, header, hero and opened invitation');
  assert.ok(lc.every((c) => c.label === 'RSVP' && !/btn-pending/.test(c.cls)));
  assert.ok(lc.some((c) => /btn-primary/.test(c.cls)));
  fs.rmSync(l.tmp, { recursive: true, force: true });

  const closed = readConfig(); closed.rsvp.mode = 'closed';
  const c = buildWith(closed, { preview: false }); c.run();
  assert.ok(ctas(c.read('index.html')).every((x) => x.label === 'RSVP closed' && /btn-pending/.test(x.cls)));
  fs.rmSync(c.tmp, { recursive: true, force: true });
});

test('live RSVP: private-link API origin is in CSP and the form asks about The Grand Hotel', () => {
  const b = buildWith(readConfig(), { preview: false }); b.run();
  const rsvp = b.read('rsvp.html');
  assert.match(rsvp, /connect-src 'self' https:\/\/api\.robertandnatalie\.wedding/);
  assert.match(rsvp, /"apiBaseUrl":"https:\/\/api\.robertandnatalie\.wedding"/);
  assert.match(rsvp, /"mode":"live"/);
  assert.match(b.read('js/rsvp.js'), /Will you stay at The Grand Hotel\?/);
  assert.match(b.read('js/rsvp.js'), /hotelStay/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('P2 #6: the menu carries an "Invitation" link on every page (it replaces the parked keepsake below 1256px)', () => {
  const b = buildWith(readConfig(), { preview: false }); b.run();
  assert.match(b.read('index.html'), /<li class="nav-invitation"><a href="#invitation">Invitation<\/a><\/li>/);
  assert.match(b.read('rsvp.html'), /<li class="nav-invitation"><a href="\/#invitation">Invitation<\/a><\/li>/);
  assert.match(b.read('styles/site.css'), /@media \(max-width: 1255\.98px\) \{\s*\.keepsake \{ visibility: hidden; pointer-events: none; \}/);
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('Details (Rob, 4 Oct 2026): direction A cards render from config, with TBD rows for every unknown and no invented copy', () => {
  const section = (html) => html.slice(html.indexOf('<section id="details"'), html.indexOf('</section>', html.indexOf('<section id="details"')));
  const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const b = buildWith(readConfig(), { preview: false }); b.run();
  const html = b.read('index.html');
  const d = section(html);
  assert.ok(html.indexOf('id="details"') > html.indexOf('class="hero"') && html.indexOf('id="details"') < html.indexOf('id="wedding-day"'), 'between the hero and Wedding Day');
  assert.match(d, /<h2 id="details-title">The Details<\/h2>/);
  assert.deepEqual([...d.matchAll(/<li>(.*?)<\/li>/g)].map((m) => text(m[1])), ['Saturday, December 19, 2026', '2:00 p.m. · Ceremony', '4:00 p.m. · Reception']);
  const cards = [...d.matchAll(/<article class="details-card([^"]*)"[\s\S]*?<\/article>/g)].map((m) => ({ full: /--full/.test(m[1]), title: text(m[0].match(/<h3[^>]*>(.*?)<\/h3>/)[1]), body: [...m[0].matchAll(/<p class="details-card-body">(.*?)<\/p>/g)].map((x) => text(x[1])), tbd: (m[0].match(/<span class="tbd-note">(.*?)<\/span>/) || [])[1] ?? null, badgeHidden: /<span class="tbd-badge" aria-hidden="true">TBD<\/span>/.test(m[0]) }));
  assert.deepEqual(cards.map((c) => c.title), ['Dress Code', 'Between Ceremony & Reception', 'Transport & Parking', 'Children', 'Charity', 'Contact Us']);
  assert.deepEqual(cards.map((c) => c.tbd), ['Dress code TBD.', 'Plans for the time between TBD.', 'Parking and shuttle details TBD.', 'Children policy TBD.', 'TBD', 'Email and phone TBD.']);
  assert.ok(cards.every((c) => c.badgeHidden), 'the badge is visual only; the note carries the word TBD');
  assert.deepEqual(cards.map((c) => c.full), [false, false, false, false, false, true], 'Contact Us spans the grid');
  assert.deepEqual(cards[1].body, ['Ceremony 2:00 p.m. at Saint Francis Chapel, reception 4:00 p.m. at The Grand Hotel — about two hours apart.']);
  assert.deepEqual(cards[2].body, [
    'Saint Francis Chapel: 17280 Scenic Highway 98, Fairhope, Alabama 36532. The Grand Hotel: One Grand Boulevard, Point Clear, Alabama 36564.',
    'The Grand Hotel — general reservations (251) 928-9201 · Reservations website.',
  ]);
  assert.match(d, /<a href="tel:\+12519289201">\(251\) 928-9201<\/a>/);
  assert.match(d, /<a href="https:\/\/www\.marriott\.com\/en-us\/hotels\/ptlak-the-grand-hotel-golf-resort-and-spa-autograph-collection\/overview\/" rel="noopener">Reservations website<\/a>/);
  assert.doesNotMatch(d, /Room Block|Room block rate/, 'no Room Block card or TBD');
  for (const i of [0, 3, 4, 5]) assert.deepEqual(cards[i].body, [], `${cards[i].title} has no body until the owners supply it`);
  assert.doesNotMatch(d, /Registry|celebrate with you|Everything you need/i, 'no registry and no copy in the couple\'s voice');
  assert.doesNotMatch(b.read('styles/site.css').split('The Details (direction A')[1].split('*/').slice(1).join('').replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-f]{3,8}\b|Playfair|Inter\b|teal/i, 'the details styles use site tokens only');
  const css = b.read('styles/site.css');
  assert.match(css, /\.details-band \{[^}]*background: var\(--ink\);/, 'the title band is the footer\'s dark ink (Rob, 3:22 PM ET)');
  assert.doesNotMatch(css.match(/\.details-band \{[^}]*\}/)[0], /border/, 'no hairline under the dark band');
  for (const sel of ['\\.details-band h2', '\\.details-waves', '\\.details-flourish']) assert.match(css, new RegExp(`${sel} \\{[^}]*var\\(--gold-footer\\)`), `${sel} uses --gold-footer on the dark band`);
  assert.doesNotMatch([...css.matchAll(/\.details-(?:band|waves|flourish)[^{]*\{[^}]*\}/g)].map((m) => m[0]).join(''), /--gold-text|--gold\)/, 'no --gold or --gold-text on the band');
  assert.match(css, /\.footer-names \{[^}]*color: var\(--gold-footer\)/, 'the footer names share the variable');
  fs.rmSync(b.tmp, { recursive: true, force: true });

  // Supplying a fact removes its TBD row and shows the fact; nothing else changes.
  const c = readConfig();
  c.details.dressCode = { ...c.details.dressCode, text: 'Example dress code.', approval: { ...c.details.dressCode.approval, state: 'approved' } };
  c.contact = { ...c.contact, email: 'hello@example.invalid', approval: { ...c.contact.approval, state: 'approved' } };
  c.travel.betweenVenues = { text: 'Example plans.', approval: { ...c.travel.betweenVenues.approval, state: 'approved' } };
  const s = buildWith(c, { preview: false }); s.run();
  const d2 = section(s.read('index.html'));
  assert.match(d2, /<p class="details-card-body">Example dress code\.<\/p>/);
  assert.match(d2, /<a href="mailto:hello@example\.invalid">hello@example\.invalid<\/a>/);
  assert.match(d2, /<p class="details-card-body">Example plans\.<\/p>/);
  for (const gone of ['Dress code TBD.', 'Email and phone TBD.', 'Plans for the time between TBD.']) assert.ok(!d2.includes(gone), `${gone} removed`);
  assert.ok(d2.includes('Parking and shuttle details TBD.'), 'parking stays TBD until a venue confirms it');
  fs.rmSync(s.tmp, { recursive: true, force: true });

  // details.enabled false omits the section; a TBD note without the word TBD is refused.
  const off = readConfig(); off.details.enabled = false;
  const o = buildWith(off, { preview: false }); o.run();
  assert.ok(!o.read('index.html').includes('id="details"'));
  fs.rmSync(o.tmp, { recursive: true, force: true });
  const bad = readConfig(); bad.details.tbdNotes.contact = 'Coming soon.';
  const x = buildWith(bad, { preview: false });
  assert.throws(() => x.run(), /details\.tbdNotes\.contact must be a string containing the word "TBD"/);
  fs.rmSync(x.tmp, { recursive: true, force: true });
});

test('One place per fact (Rob, Q12): addresses, the hotel number and the contact route appear once, in The Details', () => {
  const visible = (html) => html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const count = (hay, needle) => hay.split(needle).length - 1;
  const section = (html, id) => { const i = html.indexOf(`<section id="${id}"`); return html.slice(i, html.indexOf('</section>', i)); };
  const FACTS = ['17280 Scenic Highway 98', 'Fairhope, Alabama 36532', 'One Grand Boulevard', 'Point Clear, Alabama 36564', '(251) 928-9201', 'hello@example.invalid', '(555) 010-0199'];
  const withContact = (cfg) => { cfg.contact = { ...cfg.contact, email: 'hello@example.invalid', phone: '+15550100199', phoneDisplay: '(555) 010-0199', approval: { ...cfg.contact.approval, state: 'approved' } }; return cfg; };
  for (const enabled of [true, false]) {
    const cfg = withContact(readConfig()); cfg.details.enabled = enabled;
    const b = buildWith(cfg, { preview: false }); b.run();
    for (const file of ['index.html', 'celebration.html']) {
      const html = b.read(file); const text = visible(html);
      for (const f of FACTS) assert.equal(count(text, f), 1, `${f} appears once on ${file} (details.enabled=${enabled})`);
      if (enabled) {
        const d = visible(section(html, 'details'));
        for (const f of FACTS) assert.equal(count(d, f), 1, `${f} lives in The Details`);
        for (const id of ['wedding-day', 'travel-stay', 'questions']) for (const f of FACTS) assert.ok(!visible(section(html, id)).includes(f), `${f} is not repeated in #${id}`);
        assert.match(section(html, 'wedding-day'), /See <a href="#details-transport">Transport &amp; Parking in The Details<\/a> for both venue addresses\./);
        assert.match(section(html, 'travel-stay'), /See <a href="#details-transport">Transport &amp; Parking in The Details<\/a> for the hotel's address, general reservations number and reservations website\./);
        assert.match(section(html, 'questions'), /see <a href="#details-contact">Contact Us in The Details<\/a> for how to reach us\./);
        for (const id of ['details-transport', 'details-contact']) assert.match(html, new RegExp(`id="${id}"`), `pointer target #${id} exists`);
        assert.doesNotMatch(html, /details-room-block|Room Block/, 'no Room Block pointer or card');
      } else {
        assert.doesNotMatch(html, /see-details|#details-/, 'no pointers when the Details section is off');
      }
    }
    // Wedding Day keeps its own content: times, directions, calendar files and venue links.
    const wd = section(b.read('index.html'), 'wedding-day');
    for (const keep of ['Directions', 'Add to calendar', 'Open in Apple Maps', 'Venue website', '2:00 p.m.', '4:00 p.m.']) assert.ok(wd.includes(keep), `Wedding Day keeps ${keep}`);
    fs.rmSync(b.tmp, { recursive: true, force: true });
  }
});

test('Times read "2:00 p.m." everywhere (Rob, Q13): no AM/PM variants in any rendered page', () => {
  const visible = (html) => html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const cfg = readConfig(); cfg.events[0].startsAt = '2026-12-19T10:30:00-06:00'; cfg.events[0].formalDayPart = 'Morning';
  cfg.rsvp.opensAt = '2026-10-15T09:00:00-05:00'; cfg.rsvp.cutoffAt = '2026-11-15T23:59:00-06:00';
  const b = buildWith(cfg, { preview: true }); b.run();
  const pages = fs.readdirSync(b.dist).filter((f) => f.endsWith('.html'));
  for (const f of pages) {
    const text = visible(b.read(f));
    assert.doesNotMatch(text, /\d{1,2}(:\d{2})?\s?(AM|PM|A\.M\.|P\.M\.|am|pm)\b/, `${f}: no AM/PM clock strings`);
    for (const m of text.match(/\d{1,2}:\d{2}\s?[ap]\.?m\.?/gi) ?? []) assert.match(m, /^\d{1,2}:\d{2} [ap]\.m\.$/, `${f}: "${m}" is in the 2:00 p.m. style`);
  }
  const index = b.read('index.html');
  assert.match(index, /<time datetime="2026-12-19T10:30:00-06:00">10:30 a\.m\.<\/time> <span aria-hidden="true">·<\/span> Ceremony<\/li>/, 'Details pill');
  assert.match(index, /Ceremony 10:30 a\.m\. at Saint Francis Chapel, reception 4:00 p\.m\. at The Grand Hotel/, 'Details between card');
  fs.rmSync(b.tmp, { recursive: true, force: true });
});

test('IMP-15: only airports with their own non-pending approval are published, each with its official site', () => {
  const b = buildWith(readConfig(), { preview: false }); b.run();
  const index = b.read('index.html');
  assert.match(index, /Mobile Regional Airport<\/strong> \(MOB\)/);
  assert.match(index, /href="https:\/\/www\.mobileairportauthority\.com\/"/);
  assert.match(index, /Pensacola International Airport<\/strong> \(PNS\)/);
  assert.match(index, /href="https:\/\/www\.flypensacola\.com\/"/);
  assert.doesNotMatch(index, /Jack Edwards|flyjka\.com|\(JKA\)/);
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
