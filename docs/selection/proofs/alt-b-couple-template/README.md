# Concept proof alt-b-couple-template

**Status: original concept mockup for comparison. Untested interactions. Not a template implementation.**

This directory holds one of the three comparable branded proofs required by PRD v1.1 Section 05 (TPL-09/TPL-10). It is a comparison alternative for the G1 concept decision, not a production page, and it does not represent any real template's source or assets. No template was inspected, purchased or copied to make it; the composition, CSS and script are original to this repository.

## What the concept is

An "individual-couple wedding template" composition (PRD TPL-03, first candidate category), expressed as a single self-contained page:

| Part | Composition |
|---|---|
| Landing | An envelope fills the screen (JavaScript only). Selecting it opens the flap, the invitation rises and is shown centred with one action, **Continue to the website**. Continue reveals the main site; the invitation tucks into a keepsake tile in the **lower-left corner**. Selecting the tile brings the invitation back **centred and enlarged** in a modal dialog; Close or Escape returns it to the tile. |
| Invitation opening | Full-width stationery hero on an ivory paper texture: original-colour crest (120 px on phones, 160 px on desktop), "Robert and Natalie" in gold Pinyon Script, the exact approved wording, a restrained frame (single hairline, inset hairline, small corner marks), and the closing line at the same size, weight and colour as the informational lines. Names, date, destination, **RSVP** and **View Wedding Day** actions sit directly under the invitation (HOME-02). |
| Wedding Day | A horizontal timeline strip (vertical on phones) with two event cards: Saint Francis Chapel 2:00 p.m. and The Grand Hotel 4:00 p.m., Saturday 19 December 2026, Central Time; addresses from `content/site.config.json`; Directions (ordinary map link), Add to calendar (`dist/calendar/*.ics` from `npm run build`) and venue website; the venue-change note from the config. |
| Travel & Stay | Card blocks: hotel card ("View hotel / general reservations" only), Getting there card (config paragraphs, Mobile Regional Airport named without travel times, the hotel's Getting Here and Contact pages). No room block, no transport plan, no airport times. |
| Questions | FAQ cards (`details`/`summary`) for the four config FAQs that have draft answers. The three topics without an approved answer (attire, parking, contact) are omitted. |
| RSVP first screen | Labelled "Concept mockup — no working backend". A single scrolling form with guest rows for the synthetic preview household (Alex, Sam, Alex's plus-one slot, Jordan who is invited to the reception only), per-guest per-event Attending/Declining, a step indicator, an error summary and one visible error state (Sam Example — Ceremony unanswered), contact email and the optional notes field with the config's purpose wording. Nothing submits. |
| Navigation | Sticky top bar with Wedding Day, Travel & Stay, Questions and (from 768 px) RSVP; a **bottom-sticky RSVP bar on phones** (below 768 px). Skip link, semantic headings, visible focus. |

Unresolved essential logistics (entrance, parking, arrival, reception room, inter-venue interval and transport, room block, attire, contact route, RSVP cutoff) appear only inside dashed "Review annotation — not guest-facing" blocks, never as guest copy (TPL-09).

## Original versus derived

| Item | Origin |
|---|---|
| Page composition, CSS, envelope, keepsake dock, timeline, cards, form layout, script | Original work in this repository for this proof. |
| Crest | `../../../../src/img/crest-360.png` and `crest-120.webp`, derived from the owner's `assets/coulson-crest-original.jpg` (see `assets/ASSET_MANIFEST.md`). Not redrawn; displayed proportionally. |
| Fonts | Repository copies in `src/fonts/` (Pinyon Script, Cormorant Garamond, Cormorant SC; SIL OFL 1.1, `docs/licenses/`). Candidates only until the DES-02 typeface proof is approved. |
| Wording | Exactly the approved invitation, closing line, event values, venue addresses, hotel information, FAQ answers and notes purpose from `content/site.config.json`. |
| Guests | The synthetic `PREVIEW` household from `content/site.config.json` only. |
| Colours | Tokens exactly as PRD DES-01: paper `#F7F3EA`, ink `#292A28`, decorative gold `#B38A39`, text gold `#856119`, heraldic navy `#152B45`. Additional ivory tints (`#FBF8F1` card surface; `#F2ECDF`, `#EFE8D8`, `#ECE4D2`, `#E6DDC8` envelope shading) are decorative surfaces only. No crimson. |
| Paper texture | Inline SVG turbulence noise written for this page. |

## Proof scope

Only the four TPL-09 proof elements plus the Questions block and navigation are built. There is no access layer, no backend, no coordinator view, no calendar/email/maps verification and no privacy notice of its own (the footer link points at the built `dist/privacy.html`). Calendar and privacy links resolve only after `npm run build` because `dist/` is ignored by git.

## Capture record

- Captured: 2026-09-22T00:07:08.680Z (UTC); re-captured after the independent review fixes below (first capture 2026-09-21T23:35:20Z)
- Browser: Chromium 141.0.7390.37 (Playwright, headless), Node v22.22.2, Linux
- Script: `capture.mjs` (serves the repository root on localhost so the relative font, crest and `dist/` paths resolve; run `node docs/selection/proofs/alt-b-couple-template/capture.mjs` from the repository)
- Machine-readable results: `capture-results.json`

| Viewport | File | Opened state | Docked state | Horizontal overflow |
|---|---|---|---|---|
| 320 CSS px | `proof-320.png` (320×9814), `docked-320.png` | scrollWidth 320 / innerWidth 320 | 320 / 320 | none |
| 390 CSS px | `proof-390.png` (390×9016), `docked-390.png` | 390 / 390 | 390 / 390 | none |
| 768 CSS px | `proof-768.png` (768×6065), `docked-768.png` | 768 / 768 | 768 / 768 | none |
| 1440 CSS px | `proof-1440.png` (1440×5729), `docked-1440.png` | 1440 / 1440 | 1440 / 1440 | none |

`proof-*.png` are full-page captures of the static/opened state (`?entry=none`); `docked-*.png` show the state after Continue (`?state=docked`).

Additional captures: `entry-envelope-{1440,390}.png`, `entry-opening-{1440,390}.png` (flap mid-animation), `entry-invitation-{1440,390}.png` (invitation centred with Continue visible), `keepsake-docked-{1440,390}.png`, `keepsake-dialog-{1440,390}.png` (invitation brought back centred and enlarged), `detail-invitation-390@2x.png`, `detail-rsvp-error-390@2x.png`, `sticky-rsvp-bar-390.png`, `keyboard-skip-link-1440.png`, `keyboard-focus-1440.png`.

### Automated smoke checks recorded in `capture-results.json` (Chromium only)

- Fonts loaded at every viewport (Pinyon Script, Cormorant Garamond, Cormorant SC): true.
- Entry flow at 1440 and 390: envelope focused on load; invitation moved into the centred stage after opening; Continue visible and focused without scrolling; page docked and keepsake shown after Continue; dialog opens from the keepsake with the invitation inside; Escape closes it, returns the invitation and focuses the keepsake: all true.
- Phone RSVP bar visible in-viewport at 390 and hidden at 768: true.
- First Tab reaches the skip link; third Tab reaches "Wedding Day": true.
- Control audit at 1440: no control below 16 px font; no link/button/summary/choice below 44 px tall; body 18 px; closing line computed font family, size (18px), weight (500) and colour (rgb(41,42,40)) identical to the informational lines; crest 160 px at 1440 and 120 px at 390.
- Reduced motion (`prefers-reduced-motion: reduce`): invitation stage and docked state appear within 100 ms with no animation delay: true.
- JavaScript disabled: the entry layer stays hidden and the full invitation renders inline (equivalent static rendering, HOME-03): true.
- No console errors or failed requests during capture.

## Independent review (2026-09-22)

Reviewed against PRD TPL-09/TPL-10 and DES-01–04 in headless Chromium 141.0.7390.37 (Playwright 1.56.1, Node v22.22.2) at 320, 390, 768 and 1440 CSS px, in the opened, docked, envelope, invitation-stage and keepsake-dialog states. Checks that passed: exact approved wording present (compared programmatically with `content/site.config.json` and PRD §06); crest rendered at its natural proportions everywhere it appears (invitation 360×556 file, brand and seal 120×185 file, keepsake, dialog); no reddish computed colour on any element; closing line identical to the informational lines in family, size (18 px), weight (500), colour (`rgb(41,42,40)`), style, letter-spacing and line-height, wrapping to two lines (three at 320); both events with `datetime` 2026-12-19T14:00−06:00 / T16:00−06:00 and 2:00 p.m. / 4:00 p.m.; only the synthetic PREVIEW household's names on the page; concept-mockup banner and RSVP mock label visible; "room block" and transport appear only inside the dashed review annotations; `scrollWidth === innerWidth` at every width and state (the only element boxes past the viewport at 768 are the visually hidden `.cell-label` texts, clipped to 1 px, which do not scroll); after the envelope opens the invitation is centred with Continue visible and focused at all four widths; stored `proof-*.png` files identical (0 differing pixels) to an independent re-capture. Gold text `#856119` on paper `#F7F3EA` computes to 5.10:1 (token arithmetic, not a screenshot sample).

Small defects fixed in place during the review:

1. `.inv-sc` carried `text-transform: lowercase`, so the two date lines rendered as uniform small caps and their DOM text read "on saturday, the nineteenth of december"; the approved artwork sets them with capital initials. The transform was removed; the SC face now renders "On Saturday, The Nineteenth of December / Two Thousand Twenty-Six" exactly as approved.
2. The two crest `<img>` elements declared `height="360"` for a 360×556 file. Rendering was already proportional (`height: auto`), but the aspect-ratio hint was wrong; corrected to `height="556"`.
3. `Robert<span>and</span>Natalie` had no spaces, so the accessible name of the heading was "RobertandNatalie" and the words touched on wide screens. Spaces added (heading and the docked-state copy); the stacked phone layout is unchanged.
4. The Travel & Stay label "Nearest named airport" asserted "nearest", which nothing in the config or PRD establishes; changed to "Airport".
5. `detail-invitation-390@2x.png` and `detail-rsvp-error-390@2x.png` were captured with the sticky top bar and the fixed phone RSVP bar overlaying the element. `capture.mjs` now takes the bars out of the flow for those two element captures only.

Observation for the owners (not changed): on phones the docked keepsake tile overlaps the lower-left of whatever content is on screen (see `keepsake-docked-390.png`, where it covers part of the page title); the RSVP bar itself is not obscured.

### What was not tested

These are visual checks in one headless browser on a static concept. Not tested: real devices, Safari/iOS, Chrome/Android, Edge, screen readers (VoiceOver/NVDA), 200% text zoom and 400% reflow, load/performance budgets, calendar files in calendar clients, map links, any RSVP behaviour (there is no backend), or access control. Manual accessibility review and visual judgment by the owners remain required (TPL-10). This proof must not be described as having passed interactive or performance tests.

## Observations for the comparison

- On phones the docked keepsake tile (76 px wide) sits above the bottom RSVP bar and overlaps the lower-left of whatever content is on screen; a production version would need a decision on whether the tile collapses into the bar.
- The invitation is taller than a phone viewport by design (HOME-02 forbids shrinking it to fit); in the opened stage it scrolls inside the stage while Continue stays visible.
- The hotel telephone number is a carried-forward publisher value in the config (state `publisher-claim`); it was not verified against the hotel's Contact page during the review (site unreachable from the review environment). Verify before any guest-facing use.
- The envelope, keepsake and dialog interactions are a sketch. They have had only the smoke run above; they are not accessibility-tested and are P1 optional motion under HOME-03, with the static page as the equivalent rendering.
