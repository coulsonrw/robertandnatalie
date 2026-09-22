import { esc } from '../lib/html.mjs';
import { page } from './layout.mjs';

export function renderNotFound(view) {
  const main = `<main id="main" class="page-notfound">
  <div class="container narrow prose">
    <h1 class="page-title">Page not found</h1>
    <p class="lede">That page does not exist. The invitation, wedding-day details and RSVP are all reachable from the links below.</p>
    <div class="actions">
      <a class="btn btn-primary" href="${view.basePath}/">Back to the invitation</a>
      <a class="btn btn-secondary" href="${view.basePath}/rsvp.html">RSVP</a>
    </div>
  </div>
</main>`;
  return page({ view, currentPage: 'notfound', title: 'Page not found', description: esc(view.site.description), main, bodyClass: 'notfound' });
}
