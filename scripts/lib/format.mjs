// Formatting helpers that derive every guest-facing date and time string from
// the configuration values (DATA-01: one source of truth, nothing hard-coded).

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const ORDINAL_SMALL = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth'];
const ORDINAL_TENS = { 20: 'Twentieth', 30: 'Thirtieth' };

export function numberWords(n) {
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new Error(`numberWords: unsupported value ${n}`);
  if (n === 0) return 'Zero';
  const parts = [];
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (thousands) parts.push(`${ONES[thousands]} Thousand`);
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? '-' + ONES[rest % 10] : ''}`);
  return parts.join(' ');
}

export function ordinalWords(day) {
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error(`ordinalWords: unsupported day ${day}`);
  if (day < 20) return ORDINAL_SMALL[day];
  if (ORDINAL_TENS[day]) return ORDINAL_TENS[day];
  return `${TENS[Math.floor(day / 10)]}-${ORDINAL_SMALL[day % 10]}`;
}

// 2026 -> "Two Thousand Twenty-Six" (matches the approved invitation wording).
export function yearWords(year) {
  const thousands = Math.floor(year / 1000);
  const rest = year % 1000;
  if (rest === 0) return `${ONES[thousands]} Thousand`;
  if (rest < 100) return `${ONES[thousands]} Thousand ${numberWords(rest)}`;
  return numberWords(year);
}

// Returns the wall-clock parts of an instant in a named time zone.
export function zonedParts(iso, timeZone) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${iso}`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const map = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  const offsetFmt = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
  const offsetPart = offsetFmt.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const offset = offsetPart === 'GMT' ? '+00:00' : offsetPart.replace('GMT', '');
  const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(map.month) + 1;
  return {
    weekday: map.weekday,
    year: Number(map.year),
    month: map.month,
    monthNumber: monthIndex,
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    tzAbbrev: map.timeZoneName,
    offset,
    isoDate: `${map.year}-${String(monthIndex).padStart(2, '0')}-${String(map.day).padStart(2, '0')}`,
    icsLocal: `${map.year}${String(monthIndex).padStart(2, '0')}${String(map.day).padStart(2, '0')}T${String(Number(map.hour) % 24).padStart(2, '0')}${String(map.minute).padStart(2, '0')}00`,
  };
}

// "2:00 p.m." style, as used in the PRD.
export function clockLabel(parts) {
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const suffix = parts.hour < 12 ? 'a.m.' : 'p.m.';
  return `${h12}:${String(parts.minute).padStart(2, '0')} ${suffix}`;
}

export function longDate(parts) {
  return `${parts.weekday}, ${parts.month} ${parts.day}, ${parts.year}`;
}

// "On Saturday, The Nineteenth of December" / "Two Thousand Twenty-Six"
export function formalDateLines(parts) {
  return [`On ${parts.weekday}, The ${ordinalWords(parts.day)} of ${parts.month}`, yearWords(parts.year)];
}

// "Ceremony at Two O’Clock in the Afternoon"
export function formalTimeLine(label, parts, dayPart) {
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const hourWord = ONES[h12];
  let time;
  if (parts.minute === 0) time = `${hourWord} O’Clock`;
  else if (parts.minute === 30) time = `Half Past ${hourWord}`;
  else if (parts.minute === 15) time = `Quarter Past ${hourWord}`;
  else if (parts.minute === 45) time = `Quarter to ${ONES[(h12 % 12) + 1]}`;
  else time = `${hourWord} ${numberWords(parts.minute)}`;
  return `${label} at ${time} in the ${dayPart}`;
}

export function timeZoneLabel(timeZone, parts) {
  const names = { 'America/Chicago': 'Central Time', 'America/New_York': 'Eastern Time', 'America/Denver': 'Mountain Time', 'America/Los_Angeles': 'Pacific Time' };
  const name = names[timeZone] ?? timeZone;
  return parts?.tzAbbrev ? `${name} (${parts.tzAbbrev})` : name;
}
