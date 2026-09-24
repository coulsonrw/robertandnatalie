# Decision record — design foundation and hosting

PRD reference: Robert and Natalie Wedding Website PRD v1.2 (22 September 2026; Section 05 and its identifiers are unchanged from v1.1), Section 05 (TPL-01 to TPL-12) and Section 16.

## Status at a glance

| Item | Status |
|---|---|
| Design foundation | **Custom component-based composition** (the PRD's preferred starting hypothesis, TPL-08). No template was purchased or used. |
| Hosting | **GitHub Pages**, static, at the owner's direction ("hosted on the GitHub Pages"). Custom domain `robertandnatalie.wedding` already attached to this repository. RSVP service: Cloudflare Workers + D1 in the owners' Cloudflare account at `api.robertandnatalie.wedding` (deployed 23 September 2026); the DNS zone moved to Cloudflare the same day and the apex is still served by GitHub Pages. |
| Direction to build | Given by the owner (Robert) on 21 September 2026 in the request that produced this implementation: "Review this PRD and start building the website." |
| G1 concept approval | **Pending.** The owner has directed the build; a formal record of concept approval (owner name, date) is still to be entered below. |
| G2 production-build authorization | **Pending.** Visual baseline captured in `docs/proofs/`; awaiting owner visual sign-off and technical-lead validation. |
| G3 guest release | **Not started.** See the launch-readiness report from `npm run build`. |
| Procurement | Not applicable. All fonts are SIL Open Font License; no paid template, plugin or media. |

## Why the custom composition, and why no template competition was run

The PRD asks for a six-to-eight candidate register and three branded proofs before a production build. The owner instead instructed a start on the website itself. This record therefore documents the choice actually made and leaves the competition as an open item rather than fabricating candidates, scores or prices.

The custom composition was chosen because:

- The invitation must be live HTML text with the original crest, exact wording, script names and a same-size closing line (HOME-01, DES-01 to DES-04). A hand-built section meets this directly; a template would be adapted to the same result.
- The site is small (one guest page, RSVP, privacy) and the PRD's architecture restraint (§11) favors one maintainable application with no framework dependency.
- Static hosting on GitHub Pages removes any template's server-side or builder dependency from consideration.
- All reused components (three OFL typefaces) pass the source/rights gate; there is nothing else to license.

If the owners want the comparison run later, `TPL-03` to `TPL-09` remain valid and this build serves as the custom benchmark.

## Opening experience (HOME-03)

At the owner's request (21 September 2026) the landing page is a sealed envelope that opens to reveal the invitation; the next click takes the guest into the site while the invitation docks in the lower-left corner, from where a click brings it back centred and enlarged. Constraints kept from the PRD: skippable (entry bar link and RSVP always visible), keyboard operable (seal, card and dialog are focusable; Escape closes), static under `prefers-reduced-motion`, no autoplay audio, no forced scrolling, no 3D engine, the same live-text card in every state, and deep links bypass the envelope so a wedding-day guest reaches directions in one action (IA-01/02). The docked keepsake is `aria-hidden` and exposed through a labelled button; the dialog is a native modal `<dialog>`.

On 22 September 2026 the owner re-supplied the invitation file (identical to A2 apart from JPEG re-encoding) with the instruction "Change the invitation with the attached file". The card face is now that artwork itself: its wording was removed and the area repainted with parchment sampled from the same file, while the frame, flourishes, paper and crest are untouched pixels of A2 (`src/img/invitation-frame-*`, provenance in `assets/ASSET_MANIFEST.md`). The names, request, date, venues, times and closing line remain live text (HOME-01) and are positioned over the face at the artwork's own coordinates, using container-relative units so the composition holds in the envelope, the keepsake, the dialog and print. The gold script is Pinyon Script and the small caps Cormorant SC, as before; both sit within about 1% of the artwork's line positions and widths at 760px. The SVG corner flourishes were retired. Owner visual sign-off of this composition (G2) is still to be recorded below.

## What GitHub Pages changes relative to the PRD

| PRD requirement | Effect of static hosting | Handling |
|---|---|---|
| RSVP-01/02/05, ARCH-01 to ARCH-03, ADMIN-01 to ADMIN-04 (server-side household authorization, atomic saves, coordinator tools) | Cannot run on GitHub Pages. | The guest-facing RSVP flow is built; it calls a separate API defined in `docs/RSVP_API_CONTRACT.md`. The service is deployed at `https://api.robertandnatalie.wedding` (23 September 2026); `rsvp.mode` stays `coming-soon` until Access, the mail provider, the cutoff and the roster are in place and G3 is recorded. |
| SEC-01 invitation-only visibility | A static site cannot gate pages server-side; client-side gating is explicitly rejected by the PRD. | The site publishes event logistics only (no guest data). `noindex` is set as a supplementary measure. Owner approval of public visibility for the logistics pages is **required** and recorded below when given. |
| ARCH-04 private cache policy | Not applicable to public pages; applies to the future API. | Documented in the API contract. |
| NFR-04 self-hosted fonts | Met. | Fonts in `src/fonts/`, licenses in `docs/licenses/`. |

## Screening gates for the custom composition (TPL-05, TPL-06)

The custom composition ("CUSTOM-01") was screened against all six mandatory gates. "Custom" is not a waiver.

| Gate | Result | Evidence |
|---|---|---|
| Editable source and ownership | pass — all source in this owner-controlled repository; no proprietary hosting or visual builder; deploys with GitHub Actions | `README.md`, `.github/workflows/deploy.yml` |
| Template, font and media rights | pass — no template; three OFL typefaces with licence texts; crest and invitation are owner-supplied; unverified photos excluded; vendored axe-core is MPL-2.0 (tooling only) | `assets/ASSET_MANIFEST.md`, `docs/licenses/` |
| Technical viability | pass — clean build reproduced with `npm run build` (Node 22.22.2, no runtime dependencies); external requests from the pages: none; form handlers: the RSVP page posts only to the configured API origin | "Build validation" below, `docs/evidence/PERFORMANCE.md` resource list |
| Visual adaptability | pass — original crest, live invitation text, type hierarchy, charcoal copy, matching-size closing line, responsive layouts | `docs/proofs/CHECKLIST.md` |
| Guest-system integration | pending verification — the service is deployed on `api.robertandnatalie.wedding` (23 September 2026; `/health` ok, CORS preflight from the site origin observed 24 September); household context and server-side RSVP are not proven until credentials exist (Access application, roster) and AT-04 to AT-13 are run | `docs/RSVP_API_CONTRACT.md`, `backend/README.md` "Deployment status", `docs/TEST_RESULTS.md` |
| Accessible and performant path | pass (lab) — axe clean, budgets met; manual screen-reader and cross-browser runs outstanding | `docs/evidence/` |

## Build validation (TPL-06)

- Revision: the pull request head at the time of G2 review (record the commit hash here at sign-off).
- Runtime: Node 22.22.2; `npm run check`, `npm test`, `npm run build`, `npm run register`; Playwright 1.56.1 with Chromium 141 for `npm run proofs` and `npm run audit` (development tooling only, not shipped).
- Dependencies shipped to guests: none. Development dependencies: `playwright` (root), `wrangler`, `vitest`, `@cloudflare/vitest-pool-workers` (backend).
- External requests made by the built pages: none (self-hosted fonts and images; map, hotel and chapel links open on the guest's action).
- Acquisition, purchase and post-acquisition revalidation: not applicable (nothing acquired).

## Recorded deviations and notes

- **HOME-02 / AT-03 with the envelope landing.** On a first visit the full page is two actions away (open the seal, continue). Mitigations kept: date, destination and both start times are visible under the sealed envelope; "Skip to the wedding details" and RSVP are always in the entry bar; deep links, `/celebration.html` and same-session returns bypass the envelope; reduced motion shows the invitation immediately. This is the owner-directed composition (21 September 2026) and is treated as an approved deviation once the owners sign the approvals table. The envelope remains P1 (HOME-03) in PRD terms.
- **Contrast records (HOME-04, §13).** Ink #292A28 on paper #F7F3EA 13.0:1; text gold #856119 on paper 5.1:1; deep gold #6E4F12 on paper 6.8:1 and on card #FBF8F1 about 7.4:1 (tertiary buttons, menu border, links); paper on ink (primary buttons) 13.0:1. Decorative gold #B38A39 (2.9:1) is used only for ornament, never for text or control borders.
- **Public review builds.** Until G3, `main` deploys to the public domain as a review build with `noindex` and the synthetic RSVP preview disabled (`SITE_PREVIEW=0` in `deploy.yml`); collaborators get a preview-enabled build as a CI artifact. If the owners want no public review builds, switch `deploy.yml` to `workflow_dispatch` only; that is a decision recorded in `docs/DECISION_REGISTER.md`.
- **Hosting reliability (§13).** GitHub Pages publishes no availability SLA; the PRD's 99.9% target applies to the RSVP service, deployed 23 September 2026; the external uptime check on `https://api.robertandnatalie.wedding/health` (GET) is still to be configured (see `docs/RUNBOOK.md` §11).
- **Field performance data (NFR-02).** Lab runs are the evidence; the site has no analytics or RUM by design (SEC-04), so 75th-percentile field INP will not be collected.
- **Remaining effort at owner direction.** Keep/adapt/replace for external templates was not costed before the build. Remaining implementation work is estimated in `docs/DELIVERY_PLAN.md` as a single "custom" line.

## Approvals (to be completed by the owners)

| Gate | Approver | Date | Decision / notes |
|---|---|---|---|
| G1 — concept | | | |
| Visibility decision (public logistics pages) | | | |
| G2 — production build | | | |
| Typeface proof (Pinyon Script, Cormorant Garamond, Cormorant SC) | | | |
| G3 — guest release | | | |

## Baseline

- Source revision: see the merge commit of the pull request that introduced this record.
- Visual baseline: `docs/proofs/*.png` (320, 390, 768, 1440 CSS px; Chromium headless).
- Tokens: `src/styles/site.css` `:root`. Text gold `#856119` measures 5.1:1 on the ivory paper `#F7F3EA`; charcoal ink `#292A28` measures 13:1.
- Assets: `assets/ASSET_MANIFEST.md`.

## Change control

A later change to the foundation, hosting approach, crest, typefaces or approved composition requires an impact note in `docs/CHANGELOG.md`, updated proofs and renewed approval at the affected gate (TPL-12); it also reopens AT-17 to AT-22. Anything acquired later (a template, component or paid asset) must be validated after acquisition with the scorecard and proof re-run before G2 is renewed (TPL-06). Routine defect fixes need regression evidence (re-run `npm run proofs` and `npm run audit`) but not a new selection. The envelope, keepsake and dialog composition of 21 September 2026 is recorded retroactively in the change log.
