import { createHash } from 'node:crypto';
import { esc } from '../lib/html.mjs';

// The only inline script: swaps the no-js class. Its hash is allowed by the CSP below.
const NOJS_SCRIPT = "document.documentElement.className = document.documentElement.className.replace('no-js', 'js');";
const NOJS_HASH = 'sha256-' + createHash('sha256').update(NOJS_SCRIPT).digest('base64');

export function contentSecurityPolicy(view) {
  const connect = ["'self'"];
  if (view.rsvp && view.rsvp.apiBaseUrl) connect.push(view.rsvp.apiBaseUrl.replace(/\/$/, ''));
  return [
    "default-src 'self'",
    `script-src 'self' '${NOJS_HASH}'`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

// Inline SVG sprite: functional icons, the Details line icons and the decorative ornaments.
// d-* icons and ornament-flourish come from the Figma build file (h9O9RkNe6T5hdTB1oviAXl, components 66:585–66:620
// and 54:53). The d-* line icons are Lucide icons (shirt, clock, car, bed, baby, gift, mail, waves) scaled to a
// 22px grid; Lucide is ISC-licensed, see scripts/vendor/lucide-LICENSE.txt. All take currentColor.
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
  <symbol id="d-shirt" viewBox="0 0 22 22"><path d="M18.6817 3.17167L14.6667 1.83333C14.6667 2.80579 14.2804 3.73843 13.5927 4.42606C12.9051 5.11369 11.9725 5.5 11 5.5C10.0275 5.5 9.09491 5.11369 8.40727 4.42606C7.71964 3.73843 7.33333 2.80579 7.33333 1.83333L3.31833 3.17167C2.90343 3.30989 2.55161 3.59188 2.32637 3.96673C2.10112 4.34158 2.01729 4.7846 2.09 5.21583L2.62167 8.39667C2.65657 8.612 2.76712 8.80783 2.93346 8.94897C3.0998 9.09011 3.31102 9.1673 3.52917 9.16667H5.5V18.3333C5.5 19.3417 6.325 20.1667 7.33333 20.1667H14.6667C15.1529 20.1667 15.6192 19.9735 15.963 19.6297C16.3068 19.2859 16.5 18.8196 16.5 18.3333V9.16667H18.4708C18.689 9.1673 18.9002 9.09011 19.0665 8.94897C19.2329 8.80783 19.3434 8.612 19.3783 8.39667L19.91 5.21583C19.9827 4.7846 19.8989 4.34158 19.6736 3.96673C19.4484 3.59188 19.0966 3.30989 18.6817 3.17167Z"/></symbol>
  <symbol id="d-clock" viewBox="0 0 22 22"><path d="M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93739 16.0626 1.83333 11 1.83333C5.93739 1.83333 1.83333 5.93739 1.83333 11C1.83333 16.0626 5.93739 20.1667 11 20.1667Z M11 5.5V11L14.6667 12.8333"/></symbol>
  <symbol id="d-car" viewBox="0 0 22 22"><path d="M17.4167 15.5833H19.25C19.8 15.5833 20.1667 15.2167 20.1667 14.6667V11.9167C20.1667 11.0917 19.525 10.3583 18.7917 10.175C17.1417 9.71667 14.6667 9.16667 14.6667 9.16667C14.6667 9.16667 13.475 7.88333 12.65 7.05833C12.1917 6.69167 11.6417 6.41667 11 6.41667H4.58333C4.03333 6.41667 3.575 6.78333 3.3 7.24167L2.01667 9.9C1.89528 10.254 1.83333 10.6257 1.83333 11V14.6667C1.83333 15.2167 2.2 15.5833 2.75 15.5833H4.58333 M6.41667 17.4167C7.42919 17.4167 8.25 16.5959 8.25 15.5833C8.25 14.5708 7.42919 13.75 6.41667 13.75C5.40414 13.75 4.58333 14.5708 4.58333 15.5833C4.58333 16.5959 5.40414 17.4167 6.41667 17.4167Z M8.25 15.5833H13.75 M15.5833 17.4167C16.5959 17.4167 17.4167 16.5959 17.4167 15.5833C17.4167 14.5708 16.5959 13.75 15.5833 13.75C14.5708 13.75 13.75 14.5708 13.75 15.5833C13.75 16.5959 14.5708 17.4167 15.5833 17.4167Z"/></symbol>
  <symbol id="d-bed" viewBox="0 0 22 22"><path d="M1.83333 3.66667V18.3333 M1.83333 7.33333H18.3333C18.8196 7.33333 19.2859 7.52649 19.6297 7.8703C19.9735 8.21412 20.1667 8.68044 20.1667 9.16667V18.3333 M1.83333 15.5833H20.1667 M5.5 7.33333V15.5833"/></symbol>
  <symbol id="d-baby" viewBox="0 0 22 22"><path d="M8.25 11H8.26 M13.75 11H13.76 M9.16667 14.6667C9.625 14.9417 10.2667 15.125 11 15.125C11.7333 15.125 12.375 14.9417 12.8333 14.6667 M17.4167 5.775C18.2471 6.81603 18.8133 8.04263 19.0667 9.35C19.3766 9.50012 19.638 9.73452 19.8209 10.0263C20.0039 10.3182 20.1009 10.6556 20.1009 11C20.1009 11.3444 20.0039 11.6818 19.8209 11.9737C19.638 12.2655 19.3766 12.4999 19.0667 12.65C18.6709 14.4957 17.6542 16.1499 16.1862 17.3365C14.7182 18.5231 12.8876 19.1704 11 19.1704C9.11236 19.1704 7.28181 18.5231 5.81379 17.3365C4.34577 16.1499 3.32907 14.4957 2.93333 12.65C2.62337 12.4999 2.36196 12.2655 2.17905 11.9737C1.99614 11.6818 1.89913 11.3444 1.89913 11C1.89913 10.6556 1.99614 10.3182 2.17905 10.0263C2.36196 9.73452 2.62337 9.50012 2.93333 9.35C3.31308 7.48963 4.3229 5.81718 5.79244 4.61484C7.26198 3.41249 9.10127 2.75383 11 2.75C12.8333 2.75 14.2083 3.75833 14.2083 5.04167C14.2083 6.325 13.3833 7.33333 12.375 7.33333C11.6417 7.33333 11 6.96667 11 6.41667"/></symbol>
  <symbol id="d-gift" viewBox="0 0 22 22"><path d="M18.3333 7.33333H3.66667C3.16041 7.33333 2.75 7.74374 2.75 8.25V10.0833C2.75 10.5896 3.16041 11 3.66667 11H18.3333C18.8396 11 19.25 10.5896 19.25 10.0833V8.25C19.25 7.74374 18.8396 7.33333 18.3333 7.33333Z M11 7.33333V19.25 M17.4167 11V17.4167C17.4167 17.9029 17.2235 18.3692 16.8797 18.713C16.5359 19.0568 16.0696 19.25 15.5833 19.25H6.41667C5.93044 19.25 5.46412 19.0568 5.1203 18.713C4.77649 18.3692 4.58333 17.9029 4.58333 17.4167V11 M6.875 7.33333C6.26721 7.33333 5.68432 7.09189 5.25455 6.66212C4.82478 6.23235 4.58333 5.64945 4.58333 5.04167C4.58333 4.43388 4.82478 3.85098 5.25455 3.42121C5.68432 2.99144 6.26721 2.75 6.875 2.75C7.7593 2.73459 8.62586 3.16365 9.36167 3.98123C10.0975 4.79881 10.6684 5.96695 11 7.33333C11.3316 5.96695 11.9025 4.79881 12.6383 3.98123C13.3741 3.16365 14.2407 2.73459 15.125 2.75C15.7328 2.75 16.3157 2.99144 16.7455 3.42121C17.1752 3.85098 17.4167 4.43388 17.4167 5.04167C17.4167 5.64945 17.1752 6.23235 16.7455 6.66212C16.3157 7.09189 15.7328 7.33333 15.125 7.33333"/></symbol>
  <symbol id="d-mail" viewBox="0 0 22 22"><path d="M18.3333 3.66667H3.66667C2.65414 3.66667 1.83333 4.48748 1.83333 5.5V16.5C1.83333 17.5125 2.65414 18.3333 3.66667 18.3333H18.3333C19.3459 18.3333 20.1667 17.5125 20.1667 16.5V5.5C20.1667 4.48748 19.3459 3.66667 18.3333 3.66667Z M20.1667 6.41667L11.9442 11.6417C11.6612 11.819 11.334 11.913 11 11.913C10.666 11.913 10.3388 11.819 10.0558 11.6417L1.83333 6.41667"/></symbol>
  <symbol id="d-waves" viewBox="0 0 36 36"><path d="M3 9C3.9 9.75 4.8 10.5 6.75 10.5C10.5 10.5 10.5 7.5 14.25 7.5C18.15 7.5 17.85 10.5 21.75 10.5C25.5 10.5 25.5 7.5 29.25 7.5C31.2 7.5 32.1 8.25 33 9 M3 18C3.9 18.75 4.8 19.5 6.75 19.5C10.5 19.5 10.5 16.5 14.25 16.5C18.15 16.5 17.85 19.5 21.75 19.5C25.5 19.5 25.5 16.5 29.25 16.5C31.2 16.5 32.1 17.25 33 18 M3 27C3.9 27.75 4.8 28.5 6.75 28.5C10.5 28.5 10.5 25.5 14.25 25.5C18.15 25.5 17.85 28.5 21.75 28.5C25.5 28.5 25.5 25.5 29.25 25.5C31.2 25.5 32.1 26.25 33 27"/></symbol>
  <symbol id="ornament-flourish" viewBox="0 0 240 24">
    <path d="M6 12H78M162 12H234 M78 12C88 12 92 4 100 5C106 6 106 13 101 13C97 13 97 9 100 8.5 M162 12C152 12 148 4 140 5C134 6 134 13 139 13C143 13 143 9 140 8.5 M78 12C87 12 91 18 98 18 M162 12C153 12 149 18 142 18" fill="none"/>
    <path d="M120 5L127 12L120 19L113 12L120 5Z M108 13.6C108.884 13.6 109.6 12.8837 109.6 12C109.6 11.1163 108.884 10.4 108 10.4C107.116 10.4 106.4 11.1163 106.4 12C106.4 12.8837 107.116 13.6 108 13.6Z M132 13.6C132.884 13.6 133.6 12.8837 133.6 12C133.6 11.1163 132.884 10.4 132 10.4C131.116 10.4 130.4 11.1163 130.4 12C130.4 12.8837 131.116 13.6 132 13.6Z" fill="currentColor" stroke="none"/>
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

// One RSVP call to action, used by the header, the hero and the opened invitation. While responses are
// not open (rsvp.mode "coming-soon" or "closed") it is an outlined link that says so ("RSVP opens soon",
// "RSVP opens October 1", "RSVP closed") instead of a solid RSVP button (review P2 #4).
export function rsvpCta(view, { openClass = 'btn btn-primary', extraClass = '', current = false } = {}) {
  const cta = view.rsvpCta;
  if (!cta) return '';
  const cls = `${cta.open ? openClass : 'btn btn-pending'}${extraClass ? ' ' + extraClass : ''}`;
  return `<a class="${cls}" href="${view.basePath}/rsvp.html"${current ? ' aria-current="page"' : ''}>${esc(cta.label)}</a>`;
}

export function header({ view, currentPage }) {
  const p = view.basePath;
  const home = currentPage === 'index' || currentPage === 'celebration' ? '' : `${p}/`;
  const rsvpButton = view.postEvent
    ? `<a class="btn btn-primary btn-rsvp" href="${home}#thank-you">Thank you</a>`
    : rsvpCta(view, { extraClass: 'btn-rsvp', current: currentPage === 'rsvp' });
  return `${banner(view)}<header class="site-header${view.rsvpCta && !view.rsvpCta.open ? ' rsvp-pending' : ''}${view.story?.published ? ' has-story-nav' : ''}">
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
        ${view.story?.published ? `<li><a href="${home}#our-story">Our Story</a></li>` : ''}
        <li class="nav-invitation"><a href="${home}#invitation">Invitation</a></li>
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

export function shell({ view, title, description, bodyClass = '', bodyAttrs = '', htmlAttrs = '', headExtra = '', body, scripts = [], stylesheets = [], canonicalPath = null }) {
  const p = view.basePath;
  const fullTitle = title ? `${title} — ${view.couple.displayName}` : `${view.couple.displayName} — ${view.longDate} — ${view.wedding.destination}`;
  return `<!DOCTYPE html>
<html lang="en" class="no-js"${htmlAttrs ? ' ' + htmlAttrs : ''}>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(view)}">
<meta name="referrer" content="${view.referrerPolicy || 'strict-origin-when-cross-origin'}">
<script>${NOJS_SCRIPT}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description ?? view.site.description)}">
${view.site.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}${canonicalPath ? `<link rel="canonical" href="${esc(view.site.baseUrl)}${p}${canonicalPath}">\n` : ''}<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F7F3EA">
<link rel="icon" href="${p}/img/crest-64.png" type="image/png">
<link rel="apple-touch-icon" href="${p}/img/crest-360.png">
<link rel="preload" href="${p}/fonts/pinyon-script-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${p}/fonts/cormorant-sc-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${p}/fonts/cormorant-garamond-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${p}/styles/site.css">
${stylesheets.map((s) => `<link rel="stylesheet" href="${p}${s}">`).join('\n')}
${headExtra}
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

export function page({ view, currentPage, title, description, bodyClass = '', htmlAttrs = '', headExtra = '', main, scripts = [], stylesheets = [], canonicalPath = null }) {
  const body = `<span id="top"></span>
${header({ view, currentPage })}
${main}
${footer({ view })}`;
  return shell({ view, title, description, bodyClass, htmlAttrs, headExtra, body, scripts, stylesheets, canonicalPath });
}
