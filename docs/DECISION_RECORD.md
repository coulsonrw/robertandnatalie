# Decision record — design foundation and hosting

PRD reference: Robert and Natalie Wedding Website PRD v1.1 (21 September 2026), Section 05 (TPL-01 to TPL-12) and Section 16.

## Status at a glance

| Item | Status |
|---|---|
| Design foundation | **Custom component-based composition** (the PRD's preferred starting hypothesis, TPL-08). No template was purchased or used. |
| Hosting | **GitHub Pages**, static, at the owner's direction ("hosted on the GitHub Pages"). Custom domain `robertandnatalie.wedding` already attached to this repository. |
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

## What GitHub Pages changes relative to the PRD

| PRD requirement | Effect of static hosting | Handling |
|---|---|---|
| RSVP-01/02/05, ARCH-01 to ARCH-03, ADMIN-01 to ADMIN-04 (server-side household authorization, atomic saves, coordinator tools) | Cannot run on GitHub Pages. | The guest-facing RSVP flow is built; it calls a separate API defined in `docs/RSVP_API_CONTRACT.md`. Until that service exists, `rsvp.mode` is `coming-soon`. |
| SEC-01 invitation-only visibility | A static site cannot gate pages server-side; client-side gating is explicitly rejected by the PRD. | The site publishes event logistics only (no guest data). `noindex` is set as a supplementary measure. Owner approval of public visibility for the logistics pages is **required** and recorded below when given. |
| ARCH-04 private cache policy | Not applicable to public pages; applies to the future API. | Documented in the API contract. |
| NFR-04 self-hosted fonts | Met. | Fonts in `src/fonts/`, licenses in `docs/licenses/`. |

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

A later change to the foundation, hosting approach, crest, typefaces or approved composition requires an impact note, updated proofs and renewed approval at the affected gate (TPL-12). Routine defect fixes need regression evidence (re-run `npm run proofs`) but not a new selection.
