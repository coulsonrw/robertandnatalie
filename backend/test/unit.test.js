import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { parseCsv, parseCsvObjects, csvCell, toCsv } from '../src/csv.js';
import { redact, requestLog } from '../src/log.js';
import { newLinkToken, newFallbackCode, normaliseCredential, credentialDigest } from '../src/crypto.js';
import { eventsToSql, normaliseEvents } from '../src/events.js';
import { confirmationMail } from '../src/mail/templates.js';
import { readConfig } from '../src/config.js';

describe('csv', () => {
  it('parses quoted fields, embedded commas and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y","he said ""hi"""\r\n\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'he said "hi"']]);
    expect(parseCsvObjects('A,B\n1,2').records).toEqual([{ _line: 2, a: '1', b: '2' }]);
  });
  it('neutralises formula-looking cells', () => {
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
    expect(csvCell('+1')).toBe('"\'+1"');
    expect(csvCell('-x')).toBe('"\'-x"');
    expect(csvCell('@cmd')).toBe('"\'@cmd"');
    expect(csvCell('\tx')).toBe('"\'\tx"');
    expect(csvCell('\rx')).toBe('"\'\rx"');
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(toCsv(['a'], [{ a: '=1' }])).toBe('a\r\n"\'=1"\r\n');
  });
});

describe('log redaction (SEC-02, SEC-04)', () => {
  it('masks tokens, codes and emails', () => {
    const s = redact('code ABCD-EFGH-JKLM token kJ8s_dQ2xR9vT4wY7zA1bC3dE5fG6hI0 mail a.b@example.invalid');
    expect(s).toBe('code [code] token [token] mail [email]');
  });
  it('never logs the query string', () => {
    const entry = requestLog(new Request('https://api.example/session?code=SECRET-CODE-HERE'), 200, Date.now());
    expect(JSON.stringify(entry)).not.toContain('SECRET');
    expect(entry.path).toBe('/session');
  });
});

describe('credentials (SEC-02)', () => {
  it('link tokens are 256-bit base64url and codes are 12 symbols without ambiguous letters', () => {
    const t = newLinkToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newLinkToken()).not.toBe(t);
    const c = newFallbackCode();
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
  it('normalises typed codes and keeps link tokens case-sensitive', async () => {
    expect(normaliseCredential(' abcd-efgh-jklm ')).toBe('ABCDEFGHJKLM');
    expect(normaliseCredential('abcdefghjklm')).toBe('ABCDEFGHJKLM');
    expect(normaliseCredential('kJ8s_dQ2x R9vT4')).toBe('kJ8s_dQ2xR9vT4');
    const a = await credentialDigest('pepper', 'ABCD-EFGH-JKLM');
    const b = await credentialDigest('pepper', 'abcdefghjklm');
    expect(a).toBe(b);
    expect(await credentialDigest('other', 'abcdefghjklm')).not.toBe(a);
  });
});

describe('events from site.config.json (DATA-01)', () => {
  it('derives UTC instants, keeps the local value and timezone, and never invents an end', () => {
    const config = JSON.parse(env.TEST_SITE_CONFIG);
    const events = normaliseEvents(config);
    expect(events.map((e) => e.id)).toEqual(['ceremony', 'reception']);
    expect(events[0]).toMatchObject({ startsAtUtc: '2026-12-19T20:00:00.000Z', startsAtLocal: '2026-12-19T14:00:00-06:00', timezone: 'America/Chicago', endsAtUtc: null, name: 'Saint Francis Chapel' });
    expect(events[1]).toMatchObject({ startsAtUtc: '2026-12-19T22:00:00.000Z', name: 'The Grand Hotel' });
    const sql = eventsToSql(config, '2026-09-21T00:00:00.000Z');
    expect(sql).toContain("INSERT INTO event");
    expect(sql).toContain("'2026-12-19T14:00:00-06:00'");
    expect(sql).not.toContain('?');
  });
});

describe('confirmation mail (RSVP-07, SEC-05)', () => {
  it('includes date, summary and correction route, and has no notes field at all', () => {
    const cfg = readConfig(env);
    const events = [{ id: 'ceremony', label: 'Ceremony', name: 'Saint Francis Chapel', starts_at_utc: '2026-12-19T20:00:00.000Z', timezone: 'America/Chicago' }];
    const mail = confirmationMail(cfg, { reference: 'RN-TESTTEST', householdLabel: 'The Example Household', events, summary: [{ event: events[0], attending: ['Alex Example'], declining: ['Sam Example'] }] });
    expect(mail.subject).toContain('RN-TESTTEST');
    expect(mail.text).toContain('Saturday, December 19, 2026 · Point Clear, Alabama');
    expect(mail.text).toContain('Ceremony — Saint Francis Chapel, 2:00 PM (local time)');
    expect(mail.text).toContain('Attending: Alex Example');
    expect(mail.text).toContain('Declining: Sam Example');
    expect(mail.text).toContain('https://robertandnatalie.wedding/rsvp.html');
    expect(mail.text.toLowerCase()).not.toContain('dietary:');
  });
});
