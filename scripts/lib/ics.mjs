// Minimal RFC 5545 writer for the two calendar downloads (CONTENT-05, ARCH-05).
// Events are written with a DTSTART in the event time zone and, deliberately,
// no DTEND when the end time is unconfirmed.

const VTIMEZONES = {
  'America/Chicago': [
    'BEGIN:VTIMEZONE',
    'TZID:America/Chicago',
    'X-LIC-LOCATION:America/Chicago',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ],
};

export function icsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Fold content lines longer than 75 octets (RFC 5545 §3.1).
export function foldLine(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const out = [];
  let chunk = '';
  let chunkBytes = 0;
  for (const ch of line) {
    const len = Buffer.byteLength(ch, 'utf8');
    const limit = out.length === 0 ? 75 : 74; // continuation lines begin with a space
    if (chunkBytes + len > limit) {
      out.push(chunk);
      chunk = '';
      chunkBytes = 0;
    }
    chunk += ch;
    chunkBytes += len;
  }
  if (chunk) out.push(chunk);
  return out.map((c, i) => (i === 0 ? c : ' ' + c)).join('\r\n');
}

export function buildIcs({ prodId, timeZone, dtstamp, events }) {
  const tz = VTIMEZONES[timeZone];
  if (!tz) throw new Error(`No VTIMEZONE definition for ${timeZone}; add one to scripts/lib/ics.mjs`);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...tz,
  ];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;TZID=${timeZone}:${ev.startLocal}`);
    if (ev.endLocal) lines.push(`DTEND;TZID=${timeZone}:${ev.endLocal}`);
    lines.push(`SUMMARY:${icsText(ev.summary)}`);
    if (ev.location) lines.push(`LOCATION:${icsText(ev.location)}`);
    if (ev.description) lines.push(`DESCRIPTION:${icsText(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
