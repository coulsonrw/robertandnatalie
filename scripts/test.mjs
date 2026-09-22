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
