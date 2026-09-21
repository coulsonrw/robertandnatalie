# Branded proof — alt-a-editorial-heritage (original concept mockup)

**Status: original concept mockup for comparison. Untested interactions. Not a template implementation and not a production page.**

This directory holds one of the comparison alternatives required by PRD v1.1 §05.4 (TPL-09/TPL-10). It exists so the owners can compare a different composition against the custom build in `src/`. Nothing here is wired to a backend, a guest list, or the build pipeline.

## The concept

Editorial, heritage-hospitality composition:

- **Opening (desktop, ≥900 px):** two columns. Left, the invitation as a tall stationery panel (thin double gold rule instead of an ornate frame). Right, a calm editorial column: small-caps kicker, date, destination, ceremony and reception times, then the RSVP and View Wedding Day actions.
- **Opening (phones and tablets, <900 px):** a single column with the invitation panel first, the editorial column beneath it.
- **Navigation:** small-caps links across the top (Invitation, Wedding Day, Travel & Stay, RSVP), with RSVP outlined; a skip link precedes it.
- **Below the fold:** thin gold rules divide Wedding Day, Travel & Stay and RSVP; generous whitespace; reading columns capped at ~62 characters; content max-width 1160 px; 24 px gutters.
- **Envelope entry (per the owner's 2026-09-21 request):** when JavaScript runs, the landing view is a closed envelope with an "RN" seal. Selecting it opens the flap and reveals the invitation opening. A "Continue to the site" action then folds the invitation into a small keepsake at the lower-left corner; selecting the keepsake brings the invitation back centred and enlarged in a modal, and Close returns it. A "Skip the envelope" link, deep links (`#wedding-day` etc.) and `?entry=none` bypass the envelope; without JavaScript the full static page is shown (HOME-03 equivalent rendering). Reduced-motion removes the transitions.

## Original vs derived

| Item | Origin |
|---|---|
| Page composition, CSS, envelope/keepsake sketch, capture script | Original work for this proof. No template source, theme or third-party asset was copied. |
| Crest | Derived: `src/img/crest-360.png`, the repository's derivative of the couple's approved artwork `assets/coulson-crest-original.jpg`, shown in original colour, 120 px on phones and 160 px on desktop (DES-01 range). Referenced by relative path; not copied into this directory. |
| Invitation wording, dates, venues, addresses, hotel details, synthetic household | Taken verbatim from `content/site.config.json` (which follows the PRD §06 content master). Capitalisation of the request lines follows the config note (approved artwork). |
| Fonts | Repository copies of Pinyon Script, Cormorant Garamond (variable) and Cormorant SC (`src/fonts/*.woff2`, SIL OFL; see `docs/licenses/`). Referenced by relative path. |
| Palette | Exactly the PRD DES-01 tokens: paper `#F7F3EA`, ink `#292A28`, decorative gold `#B38A39`, text gold `#856119`, heraldic navy `#152B45`. The only other colours are five near-paper tints used for the envelope and stationery surfaces (`#fbf8f1`, `#f6f0e3`, `#f2ecdf`, `#efe8d9`, `#ede5d4`) and white for control faces. No crimson. |

## Proof scope (PRD TPL-09 table)

1. **Invitation opening** — exact wording; original-colour crest; "Robert and Natalie" dominant in Pinyon Script, text gold; restrained frame; closing line ("Where the ancient Moeli waters meet / the Bahia Del Espiritu Santo") set in the same family, 18 px, weight 500 and charcoal as the informational lines; navigation and RSVP visible above the invitation.
2. **Wedding Day transition** — two cards: Saint Francis Chapel, 2:00 p.m., and The Grand Hotel, 4:00 p.m., Saturday 19 December 2026, Central Time; addresses and websites from the config only; venue-change note from the config (draft wording, owner approval pending).
3. **Travel & Stay** — The Grand Hotel general information only (intro, address, telephone, website, Getting Here and Contact links from the config). No room block, no transport, no airport or travel-time claims. Telephone is a publisher/carried-forward value in the config and is not verified here.
4. **First RSVP screen** — the synthetic PREVIEW household ("The Example Household": Alex Example, Sam Example, Alex's plus-one slot, Jordan Example — reception only), per-guest per-event Attending/Declining choices, one visible error state (Sam Example — Ceremony, text plus icon, not colour alone), and the visible label "Concept mockup — no working backend". The button does not submit.

Sizes: body copy 18 px; controls 16 px minimum; 44 px minimum tap targets on all links in the navigation, choices, buttons and the keepsake; semantic headings (h1 in the editorial column, h2 per section, h3 per card); skip link; 3 px navy `:focus-visible` outline.

## Capture record

- Capture date: 2026-09-21 (23:25 UTC).
- Browser: Chromium 141.0.7390.37 via the globally installed Playwright package (`npm root -g`), headless, device scale factor 1 (detail views at 2).
- Served from the repository root by the tiny node HTTP server inside `capture.mjs`, so `../../../../src/fonts` and `../../../../src/img` resolve. Re-run with `node docs/selection/proofs/alt-a-editorial-heritage/capture.mjs` from the repository.
- `document.fonts.ready` was awaited before every capture.

| File | Width (CSS px) | State |
|---|---|---|
| `proof-320.png`, `proof-390.png`, `proof-768.png`, `proof-1440.png` | 320 / 390 / 768 / 1440 | Full page, envelope skipped (`?entry=none`) — the static/opened rendering |
| `entry-envelope-1440.png`, `entry-envelope-390.png` | 1440 / 390 | Closed envelope landing view |
| `entry-opening-*.png` | 1440 / 390 | Mid-transition, 400 ms after the click |
| `entry-opened-*.png` | 1440 / 390 | Invitation opening after the envelope closes |
| `keepsake-docked-*.png` | 1440 / 390 | After "Continue to the site": invitation folded to the lower-left |
| `keepsake-dialog-*.png` | 1440 / 390 | Keepsake selected: invitation centred and enlarged |
| `detail-invitation-390@2x.png` | 390 @2x | Invitation panel element |
| `detail-rsvp-error-390@2x.png` | 390 @2x | RSVP error state element |
| `keyboard-skip-link-1440.png`, `keyboard-focus-1440.png` | 1440 | First Tab (skip link) and third Tab (first nav link) |
| `capture-results.json` | — | Machine output of the run below |

### Horizontal overflow

Measured `document.documentElement.scrollWidth` against `window.innerWidth` in both the opened and docked states, and separately (scratch check, not stored) with `body { overflow-x }` forced to `visible` and every element's bounding box compared against the viewport, in the opened, docked and envelope states.

| Width | scrollWidth (opened / docked) | Elements past the viewport | Result |
|---|---|---|---|
| 320 | 320 / 320 | none | no horizontal overflow |
| 390 | 390 / 390 | none | no horizontal overflow |
| 768 | 768 / 768 | none | no horizontal overflow |
| 1440 | 1440 / 1440 | none | no horizontal overflow |

### Smoke results from the same run (not a test pass)

- Envelope → open → continue → keepsake → dialog → close: dialog opened with the invitation panel inside it and the panel was restored to the opening grid on Close, at 1440 and 390.
- Reduced motion (`prefers-reduced-motion: reduce`): the envelope layer was hidden within 100 ms of the click.
- Keyboard: first Tab lands on the skip link; third Tab lands on "Invitation" in the navigation.

## What was not done / open items

- **Interactions are untested** beyond the smoke run above. No keyboard trap check inside the dialog, no screen-reader pass, no text-zoom/reflow capture, no touch-device check, no performance measurement. Per TPL-10 this static concept must not be described as having passed interactive, accessibility or performance tests.
- The envelope, keepsake and dialog are a sketch of the owner-requested flow; the docked invitation is removed from the document flow while docked (it lives only in the keepsake dialog until Close), which needs a design decision before any production use.
- Gold heading contrast (`#856119` on `#F7F3EA`) has not been measured here; DES-01 asks for in-browser validation.
- Hotel telephone number is a carried-forward publisher value; verify against the hotel's Contact page before any guest-facing use.
- Two draft wordings from the config appear (Wedding Day intro and venue-change note); owner approval is pending per the config.
- This page is not part of `npm run build` and is not access-controlled by anything in this directory; keep review previews access-controlled per TPL-09.
