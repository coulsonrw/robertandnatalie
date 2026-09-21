// Plain-text mail bodies (RSVP-07). Confirmation mail carries the date, the attendance summary
// and safe correction instructions. It never contains dietary/access notes (SEC-05).

function localTime(iso, timezone) {
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function longDate(dateIso, timezone) {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone }).format(new Date(`${dateIso}T12:00:00Z`));
  } catch {
    return dateIso;
  }
}

export function confirmationMail(cfg, { reference, events, summary, householdLabel }) {
  const lines = [];
  lines.push(`Thank you for responding to the wedding invitation of ${cfg.coupleDisplayName}.`);
  lines.push('');
  lines.push(`Reference: ${reference}`);
  lines.push(`Invitation: ${householdLabel}`);
  lines.push(`${longDate(cfg.weddingDate, cfg.eventTimezone)} · ${cfg.weddingDestination}`);
  lines.push('');
  for (const block of summary) {
    const ev = block.event;
    lines.push(`${ev.label} — ${ev.name}, ${localTime(ev.starts_at_utc, ev.timezone)} (local time)`);
    if (block.attending.length) lines.push(`  Attending: ${block.attending.join(', ')}`);
    if (block.declining.length) lines.push(`  Declining: ${block.declining.join(', ')}`);
    if (!block.attending.length && !block.declining.length) lines.push('  No answer recorded');
    lines.push('');
  }
  lines.push('To change your response before responses close, return to');
  lines.push(cfg.siteRsvpUrl);
  lines.push('and enter the code from your invitation. Please keep this reference for your records.');
  lines.push('');
  lines.push('This message was sent because a response was saved for your invitation. It contains no dietary or access notes.');
  return { subject: `Your response for the wedding of ${cfg.coupleDisplayName} (${reference})`, text: `${lines.join('\n')}\n` };
}

export function coordinatorAlertMail(cfg, alert) {
  const text = [
    `A coordinator alert was raised by the RSVP service.`,
    ``,
    `Kind: ${alert.kind}`,
    `Subject: ${alert.subject}`,
    `Raised: ${alert.created_at}`,
    ``,
    `Details are available in the admin API (GET /admin/alerts). This message contains no guest data.`,
  ].join('\n');
  return { subject: `[RSVP] ${alert.subject}`, text: `${text}\n` };
}
