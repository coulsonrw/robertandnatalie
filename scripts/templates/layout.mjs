import { esc } from '../lib/html.mjs';

// Inline SVG sprite: functional icons plus the two decorative ornaments.
export const SVG_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-defs" aria-hidden="true" focusable="false">
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.6"/></symbol>
  <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18h.01"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path d="M6 12h12"/></symbol>
  <symbol id="corner-flourish" viewBox="0 0 120 120">
    <path d="M6 6C34 8 52 20 56 46c2 14-8 22-16 16-7-5-2-16 6-12" fill="none"/>
    <path d="M6 6c2 28 14 46 40 50 14 2 22-8 16-16-5-7-16-2-12 6" fill="none"/>
    <path d="M6 6c14 10 20 20 24 34" fill="none"/>
    <path d="M22 11c7-5 14-2 16 5-7 3-14 2-16-5z" fill="currentColor" stroke="none"/>
    <path d="M11 22c-5 7-2 14 5 16 3-7 2-14-5-16z" fill="currentColor" stroke="none"/>
    <path d="m30 40 4 4-4 4-4-4z" fill="currentColor" stroke="none"/>
    <path d="M62 8c10 0 18 2 24 6M8 62c0 10 2 18 6 24" fill="none" opacity=".7"/>
  </symbol>
  <symbol id="ornament-rule" viewBox="0 0 200 16">
    <path d="M0 8h78M122 8h78" fill="none"/>
    <path d="m100 2 6 6-6 6-6-6z" fill="currentColor" stroke="none"/>
    <circle cx="88" cy="8" r="1.6" fill="currentColor" stroke="none"/><circle cx="112" cy="8" r="1.6" fill="currentColor" stroke="none"/>
  </symbol>
</svg>`;

export function icon(id, extraClass = '') {
  return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
}

export function banner(view) {
  const b = view.banner;
  if (!b) return '';
  return `<div class="site-banner" role="status">
  <div class="container site-banner-inner">${icon('i-alert')}<p><strong>Update:</strong> ${esc(b.message)}${b.linkUrl ? ` <a href="${esc(b.linkUrl)}">${esc(b.linkLabel)}</a>` : ''}</p></div>
</div>`;
}

export function header({ view, currentPage }) {
  const p = view.basePath;
  const home = currentPage === 'index' || currentPage === 'celebration' ? '' : `${p}/`;
  const rsvpButton = view.postEvent
    ? `<a class="btn btn-primary btn-rsvp" href="${home}#thank-you">Thank you</a>`
    : `<a class="btn btn-primary btn-rsvp" href="${p}/rsvp.html"${currentPage === 'rsvp' ? ' aria-current="page"' : ''}>RSVP</a>`;
  return `${banner(view)}<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${home || p + '/'}#top" aria-label="${esc(view.couple.displayName)} — home">
      <picture>
        <source srcset="${p}/img/crest-120.webp" type="image/webp">
        <img src="${p}/img/crest-64.png" width="26" height="40" alt="" decoding="async">
      </picture>
      <span class="brand-name">${esc(view.couple.displayName)}</span>
    </a>
    <nav class="site-nav" aria-label="Primary">
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-menu">
        <span class="nav-toggle-bars" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="nav-toggle-text">Menu</span>
      </button>
      <ul id="primary-menu" class="nav-menu">
        <li><a href="${home}#wedding-day">Wedding Day</a></li>
        <li><a href="${home}#travel-stay">Travel &amp; Stay</a></li>
        <li><a href="${home}#questions">Questions</a></li>
      </ul>
    </nav>
    ${rsvpButton}
  </div>
</header>`;
}

export function footer({ view }) {
  const p = view.basePath;
  return `<footer class="site-footer">
  <div class="container">
    <p class="footer-names">${esc(view.couple.displayName)}</p>
    <p class="footer-meta">${esc(view.longDate)} <span class="dot" aria-hidden="true">·</span> ${esc(view.wedding.destination)}</p>
    <p class="footer-links"><a href="${p}/privacy.html">Privacy</a></p>
  </div>
</footer>`;
}

export function shell({ view, title, description, bodyClass = '', bodyAttrs = '', body, scripts = [] }) {
  const p = view.basePath;
  const fullTitle = title ? `${title} — ${view.couple.displayName}` : `${view.couple.displayName} — ${view.longDate} — ${view.wedding.destination}`;
  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<script>document.documentElement.className = document.documentElement.className.replace('no-js', 'js');</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description ?? view.site.description)}">
${view.site.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F7F3EA">
<link rel="icon" href="${p}/img/crest-64.png" type="image/png">
<link rel="apple-touch-icon" href="${p}/img/crest-360.png">
<link rel="preload" href="${p}/fonts/pinyon-script-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${p}/fonts/cormorant-sc-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${p}/fonts/cormorant-garamond-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${p}/styles/site.css">
</head>
<body class="${esc(bodyClass)}"${bodyAttrs ? ' ' + bodyAttrs : ''}>
<a class="skip-link" href="#main">Skip to content</a>
${SVG_SPRITE}
${body}
<script src="${p}/js/site.js" defer></script>
${scripts.map((s) => `<script src="${p}${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

export function page({ view, currentPage, title, description, bodyClass = '', main, scripts = [] }) {
  const body = `<span id="top"></span>
${header({ view, currentPage })}
${main}
${footer({ view })}`;
  return shell({ view, title, description, bodyClass, body, scripts });
}
