import { esc } from '../lib/html.mjs';
import { page } from './layout.mjs';

export function renderPrivacy(view) {
  const pr = view.privacy;
  const c = view.contact;
  const contact = c
    ? `${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}${c.email && c.phone ? ' or ' : ''}${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phoneDisplay || c.phone)}</a>` : ''}`
    : `${esc(view.couple.displayName)} directly`;
  const main = `<main id="main" class="page-privacy">
  <div class="container narrow prose">
    <h1 class="page-title">Privacy</h1>
    <p class="lede">This website exists to share the details of our wedding with the people we have invited and to collect their responses. This page explains, in plain language, what it does with information.</p>

    <h2>What this website is</h2>
    <p>The website itself is a set of static pages: the invitation, the wedding-day details, travel information and questions. Viewing those pages does not require an account, and we do not use analytics, advertising pixels, session recording or any other tracking on them.</p>

    <h2>What we collect when you RSVP</h2>
    <ul>
      <li><strong>Who you are responding for.</strong> The names on your invitation are supplied by us, not entered by you. If a name is wrong, please contact us rather than editing it yourself.</li>
      <li><strong>Your attendance.</strong> Whether each named person will attend the ceremony and the reception.</li>
      <li><strong>A contact email address</strong>, so that we can confirm your response and reach you with any change of plan.</li>
      <li><strong>An optional note</strong>, for example a dietary or access need. Share only what you would like us to know.</li>
    </ul>
    <p>We do not ask for dates of birth, addresses, travel itineraries or any medical detail.</p>

    <h2>How it is used and who sees it</h2>
    <p>Responses are used to plan the day: seating, catering numbers and looking after guests with particular needs. Attendance is seen by ${esc(view.couple.displayName)} and our wedding coordinator. Optional notes are passed only to the people who need them, such as the caterer or the venue, and are left out of confirmation messages and general guest lists.</p>

    <h2>Where it is kept</h2>
    <p>The website pages are hosted on ${esc(pr.websiteHost)}. RSVP responses are stored by ${pr.rsvpProvider ? esc(pr.rsvpProvider) : 'a separate RSVP service that will be named here before responses open'}. Your invitation link or code is personal to your household; anyone who has it can view and change your household's response, so please do not forward it.</p>

    <h2>How long we keep it</h2>
    <p>We plan to delete responses, contact details and notes from the live system ${esc(String(pr.retentionDaysAfterWedding))} days after the wedding. We may keep a simple record of who attended for our own memories, without contact details or notes.</p>

    <h2>Correcting or removing your information</h2>
    <p>You can change your response through your invitation link until responses close. To correct or remove anything after that, contact ${contact}.</p>

    <p class="fine">Last reviewed ${esc(view.lastReviewedLabel)}. This notice describes how the website is built and operated; it is written for guests rather than as a legal statement.</p>
    <p class="back-link"><a href="${view.basePath}/">Back to the invitation</a></p>
  </div>
</main>`;
  return page({ view, currentPage: 'privacy', title: 'Privacy', description: `How the wedding website of ${view.couple.displayName} handles guest information.`, main, bodyClass: 'privacy', canonicalPath: '/privacy.html' });
}
