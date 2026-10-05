import { esc, linesWithBreaks } from '../lib/html.mjs';
import { shell, header, footer, icon, page, rsvpCta } from './layout.mjs';


// The invitation card: live text, one DOM node that the entry script moves between the
// envelope, the opened stage, the bottom-left keepsake and the dialog (HOME-01, HOME-03).
function invitationCard(view) {
  const p = view.basePath;
  const [name1, name2] = view.couple.names;
  // The card face is the approved artwork (A2) with its wording removed; every line of text is
  // live and positioned over it at the artwork's own coordinates (HOME-01, DES-01, DES-03).
  return `<article class="invitation-card" id="invitation-card" aria-labelledby="invitation-title">
    <picture class="frame">
      <source type="image/webp" srcset="${p}/img/invitation-frame-560.webp 560w, ${p}/img/invitation-frame-800.webp 800w, ${p}/img/invitation-frame-1122.webp 1122w" sizes="(min-width: 800px) 760px, 100vw">
      <img src="${p}/img/invitation-frame-800.jpg" width="1122" height="1402" alt="${esc(view.crestAlt)}" fetchpriority="high" decoding="async">
    </picture>
    <div class="invitation-body">
      <h2 class="names" id="invitation-title" role="heading" aria-level="1"><span class="name">${esc(name1)}</span><span class="conj">${esc(view.couple.conjunction)}</span><span class="name">${esc(name2)}</span></h2>
      <p class="formal request">${linesWithBreaks(view.invitation.requestLines)}</p>
      <p class="formal date">${linesWithBreaks(view.formalDateLines, 'always-break')}</p>
      ${view.events.map((ev, i) => `<p class="venue-script venue-${i + 1}">${esc(ev.name)}</p>
      <p class="formal time-${i + 1}">${esc(ev.formalLine)}</p>`).join('\n      ')}
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
      ${view.rsvpCta?.open ? rsvpCta(view, { extraClass: 'btn-rsvp' }) : ''}
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
          <picture class="seal-crest" aria-hidden="true">
            <source srcset="${p}/img/crest-120.webp" type="image/webp">
            <img src="${p}/img/crest-64.png" width="34" height="52" alt="" decoding="async">
          </picture>
        </button>
      </div>
      <p class="entry-hint" id="entry-hint">Tap the seal to open your invitation.</p>
      <p class="entry-glance"><span>${esc(view.longDate)}</span><span class="dot" aria-hidden="true">·</span><span>${esc(view.wedding.destination)}</span></p>
    </div>
    <div class="entry-open" id="entry-open" hidden>
      <div class="entry-card-slot" id="entry-card-slot"></div>
      <div class="entry-open-aside">
        <p class="entry-enlarge"><button class="text-button" type="button" data-action="enlarge-invitation" aria-haspopup="dialog">Enlarge the invitation</button></p>
        <div class="actions">
          <button class="btn btn-primary" type="button" data-action="enter">Continue to the website</button>
          ${rsvpCta(view, { openClass: 'btn btn-secondary' })}
        </div>
      </div>
    </div>
    <button class="btn btn-secondary entry-skip-animation" id="entry-skip-animation" type="button" data-action="skip-animation" hidden>Skip animation</button>
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
      ${view.postEvent ? `<a class="btn btn-primary" href="#thank-you">${esc(view.postEvent.heading)}</a>
      <a class="btn btn-secondary" href="#wedding-day">View Wedding Day</a>` : view.rsvpCta.open ? `${rsvpCta(view)}
      <a class="btn btn-secondary" href="#wedding-day">View Wedding Day</a>` : `<a class="btn btn-primary" href="#wedding-day">View Wedding Day</a>
      ${rsvpCta(view)}`}
    </div>
    ${view.rsvp.mode === 'coming-soon' && !view.postEvent ? `<p class="hero-note">Responses are not open yet${view.rsvp.opensAtLabel ? `; they open on ${esc(view.rsvp.opensAtLabel)}` : ''}.</p>` : ''}
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
    ${view.details ? '' : `<div><dt>${icon('i-pin')}<span class="sr-only">Address</span></dt><dd>${ev.addressLines.map(esc).join('<br>')}</dd></div>`}
  </dl>
  ${notes ? `<ul class="event-notes">${notes}</ul>` : ''}
  <div class="card-actions">
    <a class="btn btn-secondary" href="${esc(ev.maps.google)}" rel="noopener">${icon('i-pin')} Directions</a>
    <a class="btn btn-tertiary" href="${p}${esc(ev.calendarPath)}" download="${esc(ev.calendarFile)}">${icon('i-calendar')} Add to calendar</a>
  </div>
  <p class="card-links"><a href="${esc(ev.maps.apple)}" rel="noopener">Open in Apple Maps</a>${ev.website ? ` <span class="dot" aria-hidden="true">·</span> <a href="${esc(ev.website)}" rel="noopener">Venue website</a>` : ''}</p>
</article>`;
}

// Our Story (audit IMP-12/13). Rendered only when story.published (approved, public, rights recorded)
// or, on the protected preview page, from the synthetic fixture. Captions never depend on hover;
// no carousel, no lightbox, no autoplay.
function storyImage(im, { eager = false, sizes = '(min-width: 900px) 45vw, 100vw' } = {}) {
  const pos = `${Math.round((im.focal?.x ?? 0.5) * 100)}% ${Math.round((im.focal?.y ?? 0.5) * 100)}%`;
  const attrs = `width="${im.width}" height="${im.height}" alt="${esc(im.alt)}" decoding="async"${eager ? '' : ' loading="lazy"'} style="object-position: ${pos}"`;
  if (im.sizes.length === 1 && im.sizes[0].src) return `<img src="${im.sizes[0].src}" ${attrs}>`;
  const largest = im.sizes[im.sizes.length - 1];
  return `<picture>
      <source type="image/webp" srcset="${im.sizes.map((s) => `${esc(s.webp)} ${s.w}w`).join(', ')}" sizes="${sizes}">
      <img src="${esc(largest.jpg)}" srcset="${im.sizes.map((s) => `${esc(s.jpg)} ${s.w}w`).join(', ')}" sizes="${sizes}" ${attrs}>
    </picture>`;
}

function storyFigure(im, opts) {
  const credit = im.photographer ? `<span class="credit">Photograph: ${esc(im.photographer)}</span>` : '';
  return `<figure class="story-figure">${storyImage(im, opts)}${im.caption || credit ? `<figcaption>${im.caption ? esc(im.caption) : ''}${im.caption && credit ? ' ' : ''}${credit}</figcaption>` : ''}</figure>`;
}

function storySection(view, { headingLevel = 2 } = {}) {
  const s = view.story;
  if (!s || (!s.published && !s.fixture)) return '';
  const H = `h${headingLevel}`; // h2 under the home page's h1; h1 on the standalone preview page
  const M = `h${headingLevel + 1}`; // milestone titles sit one level below the section heading
  const lead = s.images.find((i) => i.role === 'lead');
  const supporting = s.images.filter((i) => i.role === 'supporting');
  const milestones = s.milestones || [];
  return `<section id="our-story" class="section story" aria-labelledby="story-title">
  <div class="container">
    <header class="section-head">
      <${H} id="story-title">${esc(s.heading)}</${H}>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
    </header>
    <div class="story-lead">
      ${lead ? storyFigure(lead, { eager: true }) : ''}
      <div class="story-narrative">
        ${s.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('\n        ')}
      </div>
    </div>
    ${supporting.length ? `<div class="story-grid${supporting.length >= 3 ? ' cols-3' : ''}">
      ${supporting.map((im) => storyFigure(im, { sizes: '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw' })).join('\n      ')}
    </div>` : ''}
    ${milestones.length ? `<ol class="story-milestones" aria-label="Milestones">
      ${milestones.map((m) => `<li>${m.when || m.place ? `<p class="when">${[m.when, m.place].filter(Boolean).map(esc).join(' <span class="dot" aria-hidden="true">·</span> ')}</p>` : ''}<${M}>${esc(m.title)}</${M}><p>${esc(m.description)}</p>${m.image ? storyFigure(m.image, { sizes: '(min-width: 900px) 40vw, 100vw' }) : ''}</li>`).join('\n      ')}
    </ol>` : ''}
  </div>
</section>`;
}

export function renderStoryPreview(view, fixture) {
  const v = { ...view, story: fixture };
  const main = `<main id="main" class="page-story-preview">
  <div class="container"><div class="notice preview-notice" role="note">${icon('i-info')}<span><strong>Protected preview.</strong> This is a synthetic layout fixture: the pictures are labelled placeholder graphics and the text is placeholder copy supplied by the build, not the couple's story or photographs. The page exists only in local and CI builds and is never part of the deployed site (audit IMP-12, QA-06). Publishing steps: docs/OUR_STORY_INTAKE.md.</span></div></div>
${storySection(v, { headingLevel: 1 })}
</main>`;
  return page({ view: v, currentPage: 'story-preview', title: 'Our Story (layout preview)', description: 'Layout preview with synthetic fixtures; not published.', main, bodyClass: 'story-preview' });
}

// The Details (direction A card layout in the site palette; Rob, 4 Oct 2026; Figma 67:584 / 67:706).
// Content comes from view.details (scripts/build.mjs detailsView): facts derived from config, TBD rows otherwise.
// The TBD badge is visual only; the note beside it carries the word "TBD", so it is announced once.
function detailsInline(parts) {
  return parts.map((x) => {
    if (typeof x === 'string') return esc(x);
    const rel = /^https?:\/\//i.test(x.href) ? ' rel="noopener"' : '';
    return `<a href="${esc(x.href)}"${rel}>${esc(x.text)}</a>`;
  }).join('');
}

function detailsCard(c) {
  return `<article class="details-card${c.full ? ' details-card--full' : ''}" id="details-${esc(c.id)}" aria-labelledby="details-${esc(c.id)}-title">
        <div class="details-card-head"><span class="details-icon">${icon(c.icon)}</span><h3 id="details-${esc(c.id)}-title">${esc(c.title)}</h3></div>
        ${(c.body ?? []).map((p) => `<p class="details-card-body">${detailsInline(p)}</p>`).join('\n        ')}
        ${c.tbd ? `<p class="tbd-row"><span class="tbd-badge" aria-hidden="true">TBD</span><span class="tbd-note">${esc(c.tbd)}</span></p>` : ''}
      </article>`;
}

function detailsSection(view) {
  const d = view.details;
  if (!d) return '';
  const divider = '<div class="details-divider" aria-hidden="true"><span></span><span class="diamond"></span><span></span></div>';
  return `<section id="details" class="details" aria-labelledby="details-title">
  <header class="details-band">
    <svg class="details-waves" aria-hidden="true" focusable="false"><use href="#d-waves"/></svg>
    <h2 id="details-title">${esc(d.heading)}</h2>
    <svg class="details-flourish" aria-hidden="true" focusable="false"><use href="#ornament-flourish"/></svg>
  </header>
  <div class="details-body">
    <ul class="glance">
      ${d.glance.map((g) => `<li><time datetime="${esc(g.datetime)}">${esc(g.time)}</time>${g.label ? ` <span aria-hidden="true">·</span> ${esc(g.label)}` : ''}</li>`).join('\n      ')}
    </ul>
    ${divider}
    <div class="details-grid">
      ${d.cards.map(detailsCard).join('\n      ')}
    </div>
    ${divider}
  </div>
</section>`;
}

// One place per fact (Rob, Q12, 4 Oct 2026; hotel phone + reservations website folded into Transport & Parking on
// 5 Oct 2026): while The Details is on, venue addresses, the hotel's general reservations and the guest contact
// route are shown only there; Wedding Day, Travel & Stay and Questions keep their own content and point to the
// Details card that holds the fact. With details.enabled false the facts render in place.
function detailsPointer(view, html) {
  return view.details ? `<p class="see-details">${html}</p>` : '';
}

function weddingDaySection(view) {
  return `<section id="wedding-day" class="section" aria-labelledby="wedding-day-title">
  <div class="container">
    <header class="section-head">
      <h2 id="wedding-day-title">Wedding Day</h2>
      <svg class="ornament" aria-hidden="true" focusable="false"><use href="#ornament-rule"/></svg>
      <p class="section-intro">${esc(view.weddingDay.intro)}</p>
      ${detailsPointer(view, 'See <a href="#details-transport">Transport &amp; Parking in The Details</a> for both venue addresses.')}
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
        ${view.details
    ? detailsPointer(view, 'See <a href="#details-transport">Transport &amp; Parking in The Details</a> for the hotel\'s address, general reservations number and reservations website.')
    : `${hotel.phoneDisplay || hotel.links?.reservations ? `<address>${hotel.phoneDisplay ? `<a href="tel:${esc(hotel.phoneTel)}">${icon('i-phone')} ${esc(hotel.phoneDisplay)}</a>` : ''}${hotel.phoneDisplay && hotel.links?.reservations ? ' <span class="dot" aria-hidden="true">·</span> ' : ''}${hotel.links?.reservations ? `<a href="${esc(hotel.links.reservations)}" rel="noopener">Reservations website</a>` : ''}</address>` : ''}`}
        <div class="card-actions">
          <a class="btn btn-secondary" href="${esc(hotel.links.website)}" rel="noopener">View hotel website</a>
          ${roomBlock ? `<a class="btn btn-primary" href="${esc(roomBlock.url)}" rel="noopener">Book our wedding room block</a>` : ''}
        </div>
        ${roomBlock ? `<div class="room-block"><p class="kicker">Wedding room block</p><dl class="room-block-terms">${roomBlock.rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('')}</dl></div>` : ''}
      </article>
      <article class="card" aria-labelledby="getting-there-title">
        <p class="kicker">Getting there</p>
        <h3 id="getting-there-title">Getting to ${esc(view.wedding.destinationShort)}</h3>
        ${t.gettingThere.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('\n        ')}
        ${t.gettingThere.airports.length ? `<h3 class="h4">Airports</h3><ul class="airport-list">${t.gettingThere.airports.map((a) => `<li><strong>${esc(a.name)}</strong> (${esc(a.code)})${a.website ? ` <span class="dot" aria-hidden="true">·</span> <a href="${esc(a.website)}" rel="noopener">Official site</a>` : ''}${a.note ? `<br><span class="muted">${esc(a.note)}</span>` : ''}</li>`).join('')}</ul>${t.gettingThere.airportsNote ? `<p class="muted">${esc(t.gettingThere.airportsNote)}</p>` : ''}` : ''}
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
      ${view.details
    ? `${view.contact?.note ? `<p>${esc(view.contact.note)}</p>` : ''}${detailsPointer(view, 'If your question isn\'t answered here, see <a href="#details-contact">Contact Us in The Details</a> for how to reach us.')}`
    : contactBlock(view)}
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
${detailsSection(view)}
${storySection(view)}
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
    <button class="dialog-zoom" type="button" data-action="zoom-invitation">Enlarge text</button>
    <button class="dialog-close" type="button" data-action="close-invitation" aria-label="Close the invitation">${icon('i-minus')}<span class="sr-only">Close</span></button>
    <div class="dialog-slot" id="dialog-slot" tabindex="0" role="region" aria-label="Invitation, scrollable"></div>
  </div>
</dialog>`;
  return shell({ view, title: null, bodyClass: 'home', bodyAttrs: `data-start="${start}"`, body, canonicalPath: '/' });
}

export function renderIndex(view) { return renderHome(view, { start: 'closed' }); }
export function renderCelebration(view) { return renderHome(view, { start: 'site' }); }
