# Robert and Natalie — wedding website

Saturday, 19 December 2026 · Point Clear, Alabama. Live at **https://robertandnatalie.wedding** (GitHub Pages).

This is a small static site generated from one configuration file. There is no framework, no build dependency and no tracking. The visual system follows the approved ivory, gold and charcoal invitation and the original-color Coulson crest (see `docs/DECISION_RECORD.md` for how this relates to the PRD).

## The guest experience

1. **Sealed envelope** at `/`. A gold seal with the RN monogram; the entry bar carries "Skip to the wedding details" and RSVP so nobody is forced through the animation (PRD HOME-03).
2. **Opened invitation.** The flap folds back, the invitation card rises out of the envelope and settles centred: the approved artwork's own frame, flourishes, paper and crest, with the wording as live text laid over it at the artwork's positions. Tap the card, or use "Continue to the website".
3. **The website.** The card glides to the bottom-left corner as a keepsake; the site opens on a compact hero (crest, names, date, destination, both start times, RSVP and Wedding Day actions), then Wedding Day, Travel & Stay and Questions.
4. **Bring the invitation back.** Tap the keepsake (or "View the invitation" in the hero) and the card returns to the centre in a modal dialog; Escape, the close button or the backdrop sends it back to the corner.

Deep links such as `/#wedding-day`, the `/celebration.html` route and a return within the same browser session skip the envelope. `/?envelope=1` forces it. Reduced-motion users get the same states without animation; without JavaScript the invitation simply sits at the top of the page.

Event details (venues, start times) come from the owners' instructions in the PRD and are confirmed by the coordinator before guest launch; nothing on the site claims to have verified a booking.

## How it is organized

| Path | Purpose |
|---|---|
| `content/site.config.json` | **The single source of truth.** Names, date, time zone, events, venues, travel, FAQs, contact, RSVP mode and privacy values. Every guest-facing date, time, invitation line and calendar file is derived from it. |
| `scripts/build.mjs` | Validates the configuration, renders `dist/`, writes the two `.ics` files and prints a launch-readiness report. |
| `scripts/templates/` | HTML templates for the home page (envelope entry, invitation, site), the `/celebration.html` direct route, RSVP, privacy and 404. |
| `src/styles`, `src/js`, `src/img`, `src/fonts` | Stylesheet, progressive-enhancement scripts, crest renditions, self-hosted fonts. |
| `assets/` | Original artwork (A1 crest, A2 invitation) and the asset manifest. Photos of unconfirmed provenance sit in `assets/review/` and are not published. |
| `docs/` | PRD, decision record and register, gap analysis and traceability, delivery plan, acceptance tests and results log, runbook, changelog, sources, RSVP API contract, content approval register, selection package, evidence, proofs and font licences. |
| `AGENT_START_HERE.md` | Reading order, stop rules and commands for anyone picking the work up. |
| `backend/` | RSVP service reference implementation (Cloudflare Workers + D1) with tests; not deployed. |
| `.github/workflows/` | `ci.yml` validates and builds on pull requests; `deploy.yml` builds and publishes `main` to GitHub Pages; `domain-check.yml` (run by hand) reports the custom domain's DNS and HTTPS state as GitHub sees it. |

## Editing content

1. Edit `content/site.config.json`. Every block carries an `approval` object (`state`, `owner`, `source`, `reviewed`, `note`). Use `pending` for anything not yet supplied or approved: pending blocks are never published.
2. Run `npm run check` to validate, or `npm run build` to build. The build refuses inconsistent data (for example an event that is not on the wedding date or whose UTC offset is wrong for `America/Chicago`) and prints what still blocks guest launch.
3. Run `npm run register` to refresh `docs/CONTENT_APPROVAL_REGISTER.md`, then commit both files.

`content/site.config.json` is the PRD's `content-config.example.json`: schema 1.0, document version 1.2 (`docs/PRD_v1_2.md`), synthetic guests only, no credentials, and not launch-ready until the pending blocks are approved. The v1.2 modules (gallery and guest uploads, charity note in lieu of gifts, chapel-to-reception directions) are specified but not yet built; each waits on the owner and coordinator inputs listed in `docs/DECISION_REGISTER.md` rows 25–27.

Three owner-controlled switches live in the same file:

- **Urgent logistics banner** (`banner`): set `active: true` with an approved `message` (and optional link) and rebuild; it appears above every page in navy with an alert icon (PRD ADMIN-04, OPS-02). The build refuses an active banner whose approval is still pending.
- **Post-wedding phase** (`site.phase: "post-event"` with approved `postEvent` content): every RSVP call to action becomes a "Thank you" link to the thank-you section, the RSVP page reports responses closed with the thank-you text, and the synthetic preview is disabled (PRD OPS-03).
- **RSVP mode** (`rsvp.mode`, `rsvp.apiBaseUrl`, `rsvp.cutoffAt`): see RSVP status below. Personal invitation links take the form `/rsvp.html#t=<token>`; the page removes the token from the address bar on load and sends it only when the guest presses "Open my invitation" (PRD SEC-02).

Approved wording that must not drift: the couple's display name, the closing line ("Where the ancient Moeli waters meet the Bahia Del Espiritu Santo"), the venue names and the start times. The build warns if the closing line changes.

## Local preview

```bash
npm run build      # writes dist/
npm run serve      # http://127.0.0.1:8080/
npm run proofs     # Playwright screenshots + checks into docs/proofs/ (needs Playwright installed): four widths, entry flow, keyboard, reduced motion, 200% text, RSVP preview, story layout preview
npm run images     # story photographs → metadata-free WebP/JPEG derivatives + manifest (docs/OUR_STORY_INTAKE.md)
npm run capture:public   # read-only capture of the public routes (from the live-site audit handoff); AUDIT_BASE_URL overrides the origin
```

Node 20 or newer; no `npm install` is required for the build.

## Deploying to GitHub Pages

`deploy.yml` builds `dist/` and publishes it with the official Pages actions on every push to `main`.

The workflow switches **Settings → Pages → Build and deployment → Source** to **GitHub Actions** through the API on its first run and enables *Enforce HTTPS* once the certificate is issued; each run prints the Pages state (source, custom domain, certificate) in its job summary. If the token is not allowed to change the setting, the run warns and the setting must be made once by hand; until then GitHub's own build of the branch root overwrites every deployment. Keep the custom domain `robertandnatalie.wedding`. The `CNAME` file is copied into the artifact for completeness.

## RSVP status

GitHub Pages serves static files only. It cannot authorize a household, keep guest data private or store a response, and the PRD rules out a client-only or email-only RSVP as the final design. So:

- `rsvp.mode` is `coming-soon`: guests see a clear message and no form.
- The full guest-facing RSVP flow is already built (`src/js/rsvp.js`) against the API in `docs/RSVP_API_CONTRACT.md`. Review it with synthetic guests at `/rsvp.html?preview=1` (code `PREVIEW`); a banner states that nothing is saved.
- To go live: deploy a small backend that implements the contract (Cloudflare Workers + D1, or Supabase, are the candidates), set `rsvp.apiBaseUrl` and `rsvp.mode: "live"`, set `rsvp.cutoffAt`, name the provider in `privacy.rsvpProvider`, and rebuild.

## Our Story

The section is built and switched off. Local and CI builds render a labelled synthetic layout preview at `/story-preview.html`; the deployed build contains no story text, images or navigation link until the owners supply and approve the copy and photographs (`docs/OUR_STORY_INTAKE.md`).

## Live-site audit (22 September 2026)

The audit handoff, its 24-task backlog and 32 acceptance scenarios are tracked with honest statuses in `docs/audit/` (start with `LIVE_SITE_AUDIT_RESPONSE.md`).

## Before guests are invited

`npm run build` lists the blockers. At the time of writing they are: RSVP backend not deployed, RSVP cutoff not set, no private contact route, RSVP provider not named in the privacy notice. Items marked *review* (chapel entrance and parking, transport between venues, dress code, room block, draft wording) need an owner or coordinator decision but do not block a build.
