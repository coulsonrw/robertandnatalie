// Confirmation and coordinator-alert mail (RSVP-07).
//
// Confirmation mail lists this household only: who is attending which event, extra guests
// they added, and per-guest dietary notes (Rob, 7 October 2026 — guests asked for a copy
// of what they submitted). The household "message to the couple" is still omitted (SEC-05).
// Never include another party's data.

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

function cutoffLine(cfg) {
  const raw = cfg.rsvpCutoffAt;
  if (!raw) return 'You can update this response until responses close.';
  try {
    const d = new Date(raw);
    const when = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: cfg.eventTimezone,
      timeZoneName: 'short',
    }).format(d);
    return `You can update this response until ${when}.`;
  } catch {
    return 'You can update this response until responses close.';
  }
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function confirmationMail(cfg, { reference, events, summary, householdLabel, extraGuests = [], dietary = [] }) {
  const couple = cfg.coupleDisplayName;
  const editUrl = cfg.siteRsvpUrl;
  const until = cutoffLine(cfg);
  const lines = [];
  lines.push(`Dear ${householdLabel},`);
  lines.push('');
  lines.push(`Thank you for responding to the wedding invitation of ${couple}. Here is a copy of what we have saved for your party.`);
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
  if (extraGuests.length) {
    lines.push('Extra guests you added');
    extraGuests.forEach((name) => lines.push(`  ${name}`));
    lines.push('');
  }
  if (dietary.length) {
    lines.push('Dietary notes');
    dietary.forEach((row) => lines.push(`  ${row.name}: ${row.note}`));
    lines.push('');
  }
  lines.push(until);
  lines.push(`Return to ${editUrl} and choose your invitation from the list.`);
  lines.push('');
  lines.push(`With love,`);
  lines.push(couple);

  const eventHtml = summary.map((block) => {
    const ev = block.event;
    const rows = [];
    if (block.attending.length) rows.push(`<p style="margin:4px 0 0;"><strong>Attending:</strong> ${escapeHtml(block.attending.join(', '))}</p>`);
    if (block.declining.length) rows.push(`<p style="margin:4px 0 0;"><strong>Declining:</strong> ${escapeHtml(block.declining.join(', '))}</p>`);
    if (!block.attending.length && !block.declining.length) rows.push('<p style="margin:4px 0 0;">No answer recorded</p>');
    return `<h2 style="font-size:16px;margin:20px 0 6px;color:#292A28;">${escapeHtml(ev.label)} — ${escapeHtml(ev.name)}</h2>
<p style="margin:0;color:#5A5A55;">${escapeHtml(localTime(ev.starts_at_utc, ev.timezone))} (local time)</p>
${rows.join('\n')}`;
  }).join('\n');

  const extraHtml = extraGuests.length
    ? `<h2 style="font-size:16px;margin:20px 0 6px;color:#292A28;">Extra guests you added</h2>
<ul style="margin:0;padding-left:20px;">${extraGuests.map((name) => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
    : '';
  const dietHtml = dietary.length
    ? `<h2 style="font-size:16px;margin:20px 0 6px;color:#292A28;">Dietary notes</h2>
<ul style="margin:0;padding-left:20px;">${dietary.map((row) => `<li>${escapeHtml(row.name)}: ${escapeHtml(row.note)}</li>`).join('')}</ul>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Your RSVP</title></head>
<body style="margin:0;padding:0;background:#F7F3EA;color:#292A28;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="margin:0 0 8px;letter-spacing:0.12em;text-transform:uppercase;font-size:12px;color:#856119;">RSVP confirmation</p>
    <h1 style="font-size:26px;font-weight:normal;margin:0 0 16px;">Thank you, ${escapeHtml(householdLabel)}</h1>
    <p>Thank you for responding to the wedding invitation of ${escapeHtml(couple)}. Here is a copy of what we have saved for your party.</p>
    <p style="margin:16px 0;"><strong>Reference:</strong> ${escapeHtml(reference)}<br>
    <strong>Invitation:</strong> ${escapeHtml(householdLabel)}<br>
    ${escapeHtml(longDate(cfg.weddingDate, cfg.eventTimezone))} · ${escapeHtml(cfg.weddingDestination)}</p>
    ${eventHtml}
    ${extraHtml}
    ${dietHtml}
    <p style="margin:24px 0 8px;">${escapeHtml(until)}</p>
    <p style="margin:0 0 24px;"><a href="${escapeHtml(editUrl)}" style="color:#856119;">${escapeHtml(editUrl)}</a></p>
    <p style="margin:0;">With love,<br>${escapeHtml(couple)}</p>
  </div>
</body>
</html>
`;

  return {
    subject: `Your response for the wedding of ${couple} (${reference})`,
    text: `${lines.join('\n')}\n`,
    html,
  };
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
