import { esc, linesWithBreaks } from '../lib/html.mjs';
import { shell, header, footer, icon } from './layout.mjs';

function corner(pos) {
  return `<svg class="corner corner-${pos}" aria-hidden="true" focusable="false"><use href="#corner-flourish"/></svg>`;
}

// The invitation card: live text, one DOM node that the entry script moves between the
// envelope, the opened stage, the bottom-left keepsake and the dialog (HOME-01, HOME-03).
function invitationCard(view) {
  const p = view.basePath;
  const [name1, name2] = view.couple.names;
  return `<article class="invitation-card" id="invitation-card" aria-labelledby="invitation-title">
    ${corner('tl')}${corner('tr')}${corner('bl')}${corner('br')}
    <div class="invitation-body">
      <picture class="crest">
        <source srcset="${p}/img/crest-360.webp 360w, ${p}/img/crest-720.webp 720w" sizes="(min-width: 760px) 168px, 116px" type="image/webp">
        <img src="${p}/img/crest-360.png" width="360" height="556" alt="${esc(view.crestAlt)}" fetchpriority="high" decoding="async">
      </picture>
      <h2 class="names" id="invitation-title"><span class="name">${esc(name1)}</span><span class="conj">${esc(view.couple.conjunction)}</span><span class="name">${esc(name2)}</span></h2>
      <p class="formal request">${linesWithBreaks(view.invitation.requestLines)}</p>
      <p class="formal date">${linesWithBreaks(view.formalDateLines, 'always-break')}</p>
      ${view.events.map((ev) => `<p class="venue-script">${esc(ev.name)}</p>
      <p class="formal">${esc(ev.formalLine)}</p>`).join('\n      ')}
      <p class="formal closing">${linesWithBreaks(view.wedding.closingLine)}</p>
    </div>
  </article>`;
}

function entryStage(view) {
  const p = view.basePath;
  return `<main class="entry" id="entry" aria-label="Invitation" hidden>
  <div class="entry-bar">
    <span class="entry-brand">${esc(view.couple.displayName)}</span>
    <div class="entry-bar-actions">
      <a class="entry-skip" href="#main" data-action="enter">Skip to the wedding details</a>
      ${view.postEvent ? '' : `<a class="btn btn-primary btn-rsvp" href="${p}/rsvp.html">RSVP</a>`}
    </div>
  </div>
  <div class="entry-stage">
    <div class="entry-scene" id="entry-scene">
      <div class="envelope" id="envelope">
        <div class="envelope-back"></div>
        <div class="envelope-liner"></div>
        <div class="envelope-clip"><div class="envelope-lift" id="envelope-slot"></div></div>
        <div class="envelope-pocket"></div>
        <div class="envelope-flap"></div>
        <button class="seal" id="seal" type="button" aria-label="Open the invitation" aria-describedby="entry-hint">
          <span class="seal-monogram" aria-hidden="true">${esc(view.couple.monogram)}</span>
        </button>
      </div>
      <p class="entry-hint" id="entry-hint">Tap the seal to open your invitation.</p>
      <p class="entry-glance"><span>${esc(view.longDate)}</span><span class="dot" aria-hidden="true">·</span><span>${esc(view.wedding.destination)}</span></p>
    </div>
    <div class="entry-open" id="entry-open" hidden>
      <div class="entry-card-slot" id="entry-card-slot"></div>
      <p class="entry-hint" id="entry-open-hint">Tap the invitation to continue to the website.</p>
      <div class="actions">
        <button class="btn btn-primary" type="button" data-action="enter">Continue to the website</button>
        ${view.postEvent ? '' : `<a class="btn btn-secondary" href="${p}/rsvp.html">RSVP</a>`}
      </div>
    </div>
  </div>
</main>`;
}

function heroSection(view) {
  const p = view.basePath;
  const [name1, name2] = view.couple.names;
  const times = view.events.map((ev) => `<span>${esc(ev.name)}, ${esc(ev.clock)}</span>`).join('<span class="dot" aria-hidden="true">·</span>') + `<span class="dot" aria-hidden="true">·</span><span>${esc(view.events[0].tzLabel)}</span>`;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="container hero-inner">
    <div class="hero-identity">
      <picture class="hero-crest">
        <source srcset="${p}/img/crest-360.webp" type="image/webp">
        <img src="${p}/img/crest-360.png" width="120" height="185" alt="" decoding="async">
      </picture>
      <h1 id="hero-title" class="hero-names"><span class="name">${esc(name1)}</span><span class="conj">${esc(view.couple.conjunction)}</span><span class="name">${esc(name2)}</span></h1>
    </div>
    <p class="glance-line"><span>${esc(view.longDate)}</span><span class="dot" aria-hidden="true">·</span><span>${esc(view.wedding.destination)}</span></p>
    <p class="glance-times">${times}</p>
    <div class="actions">
      ${view.postEvent ? `<a class="btn btn-primary" href="#thank-you">${esc(view.postEvent.heading)}</a>` : `<a class="btn btn-primary" href="${p}/rsvp.html">RSVP</a>`}
      <a class="btn btn-secondary" href="#wedding-day">View Wedding Day</a>
    </div>
    <p class="hero-keepsake js-only"><button class="text-button" type="button" data-action="view-invitation">View the invitation</button></p>
  </div>
</section>`;
}

function thankYouSection(view) {
  if (!view.postEvent) return '';
  return `<section id="thank-you" class="section" aria-labelledby="thank-you-title">
  <div class="container">
    <header class="section-head">
      <h2 id="thank-you-title">${esc(view.postEvent.heading)}</h2>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
      <p class="section-intro">${esc(view.postEvent.message)}</p>
    </header>
  </div>
</section>`;
}

function eventCard(view, ev) {
  const p = view.basePath;
  const notes = ev.notes.map((n) => `<li><strong>${esc(n.label)}:</strong> ${esc(n.text)}</li>`).join('');
  return `<article class="card event-card" aria-labelledby="ev-${esc(ev.id)}-title">
  <p class="kicker">${esc(ev.label)}</p>
  <h3 id="ev-${esc(ev.id)}-title">${esc(ev.name)}</h3>
  ${ev.alsoKnownAs ? `<p class="event-aka">${esc(ev.alsoKnownAs)}</p>` : ''}
  <dl class="event-facts">
    <div><dt>${icon('i-calendar')}<span class="sr-only">Date</span></dt><dd>${esc(ev.longDate)}</dd></div>
    <div><dt>${icon('i-clock')}<span class="sr-only">Time</span></dt><dd><time datetime="${esc(ev.startsAt)}">${esc(ev.clock)}</time> ${esc(ev.tzLabel)}</dd></div>
    <div><dt>${icon('i-pin')}<span class="sr-only">Address</span></dt><dd>${ev.addressLines.map(esc).join('<br>')}</dd></div>
  </dl>
  ${notes ? `<ul class="event-notes">${notes}</ul>` : ''}
  <div class="card-actions">
    <a class="btn btn-secondary" href="${esc(ev.maps.google)}" rel="noopener">${icon('i-pin')} Directions</a>
    <a class="btn btn-tertiary" href="${p}${esc(ev.calendarPath)}" download="${esc(ev.calendarFile)}">${icon('i-calendar')} Add to calendar</a>
  </div>
  <p class="card-links"><a href="${esc(ev.maps.apple)}" rel="noopener">Open in Apple Maps</a>${ev.website ? ` <span class="dot" aria-hidden="true">·</span> <a href="${esc(ev.website)}" rel="noopener">Venue website</a>` : ''}</p>
</article>`;
}

function weddingDaySection(view) {
  return `<section id="wedding-day" class="section" aria-labelledby="wedding-day-title">
  <div class="container">
    <header class="section-head">
      <h2 id="wedding-day-title">Wedding Day</h2>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
      <p class="section-intro">${esc(view.weddingDay.intro)}</p>
    </header>
    <div class="event-grid">
      ${view.events.map((ev) => eventCard(view, ev)).join('\n      ')}
    </div>
    ${view.weddingDay.venueChangeNote ? `<p class="notice">${icon('i-info')}<span>${esc(view.weddingDay.venueChangeNote)}</span></p>` : ''}
  </div>
</section>`;
}

function travelSection(view) {
  const t = view.travel;
  const hotel = t.hotel;
  const roomBlock = hotel.roomBlock;
  return `<section id="travel-stay" class="section" aria-labelledby="travel-title">
  <div class="container">
    <header class="section-head">
      <h2 id="travel-title">Travel &amp; Stay</h2>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
    </header>
    <div class="travel-grid">
      <article class="card hotel-card" aria-labelledby="hotel-title">
        <p class="kicker">Where to stay</p>
        <h3 id="hotel-title">${esc(hotel.name)}</h3>
        <p>${esc(hotel.intro)}</p>
        <address>
          ${hotel.addressLines.map(esc).join('<br>')}${hotel.phoneDisplay ? `<br><a href="tel:${esc(hotel.phoneTel)}">${icon('i-phone')} ${esc(hotel.phoneDisplay)}</a>` : ''}
        </address>
        <div class="card-actions">
          <a class="btn btn-secondary" href="${esc(hotel.links.website)}" rel="noopener">View hotel &amp; general reservations</a>
          ${roomBlock ? `<a class="btn btn-primary" href="${esc(roomBlock.url)}" rel="noopener">Book our wedding room block</a>` : ''}
        </div>
        ${roomBlock ? `<div class="room-block"><p class="kicker">Wedding room block</p><ul class="plain-list">${roomBlock.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
      </article>
      <article class="card" aria-labelledby="getting-there-title">
        <p class="kicker">Getting there</p>
        <h3 id="getting-there-title">Getting to ${esc(view.wedding.destinationShort)}</h3>
        ${t.gettingThere.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('\n        ')}
        ${t.gettingThere.airports.length ? `<ul class="plain-list">${t.gettingThere.airports.map((a) => `<li>Nearest named airport: ${esc(a.name)}${a.code ? ` (${esc(a.code)})` : ''}</li>`).join('')}</ul>` : ''}
        <p><a class="standalone-link" href="${esc(hotel.links.gettingHere)}" rel="noopener">${esc(hotel.name)}: Getting Here</a></p>
        ${t.betweenVenues ? `<h3 class="h4">Between the venues</h3><p>${esc(t.betweenVenues)}</p>` : ''}
      </article>
    </div>
  </div>
</section>`;
}

function contactBlock(view) {
  const c = view.contact;
  if (!c) {
    return `<p>If you have a question that isn't answered here, please reach out to ${esc(view.couple.displayName)} directly.</p>`;
  }
  const items = [];
  if (c.email) items.push(`<a href="mailto:${esc(c.email)}">${icon('i-mail')} ${esc(c.email)}</a>`);
  if (c.phone) items.push(`<a href="tel:${esc(c.phone)}">${icon('i-phone')} ${esc(c.phoneDisplay || c.phone)}</a>`);
  return `${c.note ? `<p>${esc(c.note)}</p>` : ''}<p class="contact-links">${items.join(' <span class="dot" aria-hidden="true">·</span> ')}</p>`;
}

function questionsSection(view) {
  return `<section id="questions" class="section" aria-labelledby="questions-title">
  <div class="container">
    <header class="section-head">
      <h2 id="questions-title">Questions</h2>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
    </header>
    ${view.faqs.length ? `<div class="faq-list">
      ${view.faqs.map((f) => `<details class="faq" id="faq-${esc(f.id)}">
        <summary>${esc(f.question)}</summary>
        <div class="faq-body"><p>${esc(f.answer)}</p></div>
      </details>`).join('\n      ')}
    </div>` : ''}
    <div class="card contact-card">
      <p class="kicker">Get in touch</p>
      ${contactBlock(view)}
    </div>
  </div>
</section>`;
}

export function renderHome(view, { start }) {
  const currentPage = start === 'site' ? 'celebration' : 'index';
  const body = `${entryStage(view)}
<div id="site" class="site">
<span id="top"></span>
${header({ view, currentPage })}
<main id="main" class="page-home">
<section class="invitation-section" id="invitation">
  ${invitationCard(view)}
</section>
${heroSection(view)}
${thankYouSection(view)}
${weddingDaySection(view)}
${travelSection(view)}
${questionsSection(view)}
</main>
${footer({ view })}
</div>
<div class="keepsake" id="keepsake" hidden>
  <div class="keepsake-scale" id="keepsake-slot"></div>
  <button class="keepsake-btn" type="button" data-action="view-invitation" aria-label="View the invitation" aria-haspopup="dialog"></button>
  <span class="keepsake-caption" aria-hidden="true">Invitation</span>
</div>
<dialog class="invitation-dialog" id="invitation-dialog" aria-label="Your invitation">
  <div class="dialog-frame">
    <button class="dialog-close" type="button" data-action="close-invitation" aria-label="Close the invitation">${icon('i-minus')}<span class="sr-only">Close</span></button>
    <div class="dialog-slot" id="dialog-slot" tabindex="0" role="region" aria-label="Invitation, scrollable"></div>
  </div>
</dialog>`;
  return shell({ view, title: null, bodyClass: 'home', bodyAttrs: `data-start="${start}"`, body });
}

export function renderIndex(view) { return renderHome(view, { start: 'closed' }); }
export function renderCelebration(view) { return renderHome(view, { start: 'site' }); }
