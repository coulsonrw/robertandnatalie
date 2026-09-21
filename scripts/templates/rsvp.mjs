import { esc, jsonForScript } from '../lib/html.mjs';
import { page, icon } from './layout.mjs';

function contactLine(view) {
  const c = view.contact;
  if (!c) return `<p>If you have any difficulty, please contact ${esc(view.couple.displayName)} directly.</p>`;
  const items = [];
  if (c.email) items.push(`<a href="mailto:${esc(c.email)}">${icon('i-mail')} ${esc(c.email)}</a>`);
  if (c.phone) items.push(`<a href="tel:${esc(c.phone)}">${icon('i-phone')} ${esc(c.phoneDisplay || c.phone)}</a>`);
  return `<p>If you have any difficulty, please contact us: ${items.join(' <span class="dot" aria-hidden="true">·</span> ')}</p>`;
}

export function renderRsvp(view) {
  const r = view.rsvp;
  let staticBlock;
  if (r.mode === 'live') {
    staticBlock = `<noscript><div class="card card-notice"><p>${icon('i-info')} The RSVP form needs JavaScript. ${contactLine(view)}</p></div></noscript>`;
  } else if (r.mode === 'closed') {
    staticBlock = `<div class="card card-notice" id="rsvp-static"><p class="kicker">Responses closed</p><p>${esc(r.closedText)}</p>${contactLine(view)}</div>`;
  } else {
    staticBlock = `<div class="card card-notice" id="rsvp-static"><p class="kicker">Coming soon</p><p>${esc(r.comingSoonText)}</p>${contactLine(view)}</div>`;
  }

  const clientConfig = {
    mode: r.mode,
    apiBaseUrl: r.apiBaseUrl,
    cutoffAt: r.cutoffAt,
    allowPreview: r.allowPreview,
    preview: r.allowPreview ? r.preview : null,
    closedText: r.closedText,
    notesPurpose: r.notesPurpose,
    contact: view.contact,
    couple: view.couple.displayName,
    events: view.events.map((ev) => ({ id: ev.id, label: ev.label, name: ev.name, when: `${ev.longDate}, ${ev.clock} ${ev.tzLabel}`, shortWhen: `${ev.clock}` })),
  };

  const main = `<main id="main" class="page-rsvp">
  <div class="container narrow">
    <h1 class="page-title">RSVP</h1>
    <p class="lede">Respond for each member of your household for the ceremony and the reception. You can return to update your response until responses close.</p>
    ${staticBlock}
    <div id="rsvp-app" hidden></div>
    <script type="application/json" id="rsvp-config">${jsonForScript(clientConfig)}</script>
    <p class="back-link"><a href="${view.basePath}/#wedding-day">Back to the wedding details</a></p>
  </div>
</main>`;
  return page({ view, currentPage: 'rsvp', title: 'RSVP', description: `RSVP for the wedding of ${view.couple.displayName}.`, main, bodyClass: 'rsvp', scripts: ['/js/rsvp.js'] });
}
