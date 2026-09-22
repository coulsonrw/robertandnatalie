export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escapes text and turns the approved line breaks into <br> that only apply on wide screens.
export function linesWithBreaks(lines, breakClass = 'wide-break') {
  return lines.map(esc).join(` <br class="${breakClass}">`);
}

export function jsonForScript(value) {
  const seps = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(seps, (ch) => '\\u' + ch.charCodeAt(0).toString(16));
}

export function mapsLinks(name, addressLines) {
  const q = encodeURIComponent([name, ...addressLines].join(', '));
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
  };
}
