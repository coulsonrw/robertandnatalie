import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { freshSession, guest, fullAnswer, count, listGuests, resetDb, seedEvents, importRoster } from './helpers.js';
import { cloudflareProvider, parseFromAddress, providerFor } from '../src/mail/provider.js';
import { confirmationMail } from '../src/mail/templates.js';
import { readConfig } from '../src/config.js';
import { processOutbox } from '../src/mail/outbox.js';

describe('optional confirmation email', () => {
  let s;
  beforeEach(async () => { s = await freshSession(); });

  it('lets a party save without an email when they do not opt in', async () => {
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      contactEmail: '',
      emailConfirmation: false,
    }));
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.emailQueued).toBe(false);
    expect(snap.emailConfirmation).toBe(false);
    expect(snap.household.contactEmail).toBe('');
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'confirmation'")).toBe(0);
  });

  it('requires an email and queues mail when they opt in, including on a later edit', async () => {
    const missing = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      emailConfirmation: true,
      contactEmail: '',
    }));
    expect(missing.status).toBe(400);

    const first = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      emailConfirmation: true,
      contactEmail: 'party@example.invalid',
      guestDietary: { g_alex: 'No shellfish' },
    }));
    expect(first.status).toBe(200);
    const snap = await first.json();
    expect(snap.emailQueued).toBe(true);
    expect(snap.emailConfirmation).toBe(true);
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'confirmation'")).toBe(1);
    const mail = await env.DB.prepare('SELECT to_email, body_text, body_html FROM mail_outbox').first();
    expect(mail.to_email).toBe('party@example.invalid');
    expect(mail.body_text).toContain('No shellfish');
    expect(mail.body_text).toContain('https://robertandnatalie.wedding/rsvp.html');
    expect(mail.body_text).not.toContain('Vegetarian, please.');
    expect(mail.body_html).toContain('No shellfish');
    expect(mail.body_html).toContain('The Example Household');
    expect(mail.body_html).not.toContain('hh_solo');

    const edit = await guest(s.cookie, 'PUT', '/response', fullAnswer(snap, 'attending', {
      emailConfirmation: true,
      contactEmail: 'party@example.invalid',
      notes: 'Updated plans',
    }));
    expect(edit.status).toBe(200);
    expect((await edit.json()).emailQueued).toBe(true);
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'confirmation'")).toBe(2);
  });

  it('does not queue mail when an email is present but the party did not opt in', async () => {
    const res = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      contactEmail: 'keep@example.invalid',
      emailConfirmation: false,
    }));
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.emailQueued).toBe(false);
    expect(snap.emailConfirmation).toBe(false);
    expect(snap.household.contactEmail).toBe('keep@example.invalid');
    expect(await count("SELECT COUNT(*) AS n FROM mail_outbox")).toBe(0);
  });

  it('never puts the opt-in or an email on GET /guests', async () => {
    await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      emailConfirmation: true,
      contactEmail: 'secret@example.invalid',
    }));
    await resetDb();
    await seedEvents();
    await importRoster();
    const dir = await (await listGuests()).json();
    expect(JSON.stringify(dir)).not.toMatch(/secret@|emailConfirmation|contactEmail|opt.in/i);
    expect(dir.guests.every((g) => Object.keys(g).sort().join(',') === 'name,partyId')).toBe(true);
  });
});

describe('Cloudflare Email Sending provider', () => {
  it('parses MAIL_FROM and calls env.EMAIL.send', async () => {
    let sent;
    const provider = cloudflareProvider({
      EMAIL: {
        async send(message) {
          sent = message;
          return { messageId: 'cf-test-1' };
        },
      },
    });
    const result = await provider.send({
      from: 'Robert and Natalie <rsvp@robertandnatalie.wedding>',
      to: 'guest@example.invalid',
      subject: 'Your response',
      text: 'plain',
      html: '<p>plain</p>',
    });
    expect(result.messageId).toBe('cf-test-1');
    expect(sent.from).toEqual({ email: 'rsvp@robertandnatalie.wedding', name: 'Robert and Natalie' });
    expect(sent.to).toBe('guest@example.invalid');
    expect(sent.html).toBe('<p>plain</p>');
  });

  it('throws when the EMAIL binding is missing so the outbox can retry', async () => {
    await expect(cloudflareProvider({}).send({
      from: 'rsvp@robertandnatalie.wedding', to: 'a@b.invalid', subject: 's', text: 't',
    })).rejects.toThrow(/EMAIL send_email binding is not configured/);
    expect(parseFromAddress('rsvp@robertandnatalie.wedding')).toEqual({ email: 'rsvp@robertandnatalie.wedding' });
    expect(() => providerFor({ mail: { provider: 'cloudflare' } })).not.toThrow();
  });

  it('delivers a queued confirmation through the Cloudflare provider', async () => {
    const s = await freshSession();
    const saved = await guest(s.cookie, 'PUT', '/response', fullAnswer(s.snapshot, 'attending', {
      emailConfirmation: true,
      contactEmail: 'queue@example.invalid',
    }));
    expect(saved.status).toBe(200);
    let delivered;
    const result = await processOutbox(env, readConfig(env), {
      provider: cloudflareProvider({
        EMAIL: {
          async send(message) { delivered = message; return { messageId: 'cf-outbox' }; },
        },
      }),
    });
    expect(result.sent).toBe(1);
    expect(delivered.to).toBe('queue@example.invalid');
    expect(delivered.html).toContain('The Example Household');
    const row = await env.DB.prepare("SELECT state, provider_message_id FROM mail_outbox WHERE kind = 'confirmation'").first();
    expect(row.state).toBe('sent');
    expect(row.provider_message_id).toBe('cf-outbox');
  });
});

describe('confirmation mail content', () => {
  it('lists extras and dietary for this household only and ships HTML', () => {
    const cfg = readConfig(env);
    const events = [{ id: 'ceremony', label: 'Ceremony', name: 'Saint Francis Chapel', starts_at_utc: '2026-12-19T20:00:00.000Z', timezone: 'America/Chicago' }];
    const mail = confirmationMail(cfg, {
      reference: 'RN-TESTSAVE',
      householdLabel: 'Andrew & Taylor',
      events,
      summary: [{ event: events[0], attending: ['Andrew', 'Taylor', 'Jordan Guest'], declining: [] }],
      extraGuests: ['Jordan Guest'],
      dietary: [{ name: 'Andrew', note: 'Vegetarian' }],
    });
    expect(mail.html).toContain('Jordan Guest');
    expect(mail.html).toContain('Vegetarian');
    expect(mail.html).toContain('RN-TESTSAVE');
    expect(mail.text).toContain('Extra guests you added');
    expect(mail.text).toContain('Dietary notes');
    expect(mail.text).not.toContain('Mama & Daddy');
    expect(mail.html).not.toContain('Mama & Daddy');
  });
});
