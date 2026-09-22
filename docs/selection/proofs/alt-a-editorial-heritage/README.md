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

- Capture date: 2026-09-22 00:06 UTC (re-captured after the independent review fixes below; first capture 2026-09-21 23:25 UTC).
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

## Independent review (2026-09-22)

Reviewed against PRD TPL-09/TPL-10 and DES-01–04 in headless Chromium 141.0.7390.37 (Playwright 1.56.1, Node v22.22.2) at 320, 390, 768 and 1440 CSS px, in the opened, docked, envelope and keepsake-dialog states. Checks that passed: exact approved wording present (compared programmatically with `content/site.config.json` and PRD §06); crest rendered at its natural 360×556 proportions everywhere it appears (invitation, envelope card, keepsake, dialog); no reddish computed colour on any element; closing line identical to the informational lines in family, size (18 px), weight (500), colour (`rgb(41,42,40)`), style, letter-spacing and line-height, wrapping to two lines (three at 320); both events with `datetime` 2026-12-19T14:00−06:00 / T16:00−06:00 and 2:00 p.m. / 4:00 p.m.; only the synthetic PREVIEW household's names on the page; concept-mockup banner and RSVP mock label visible; `scrollWidth === innerWidth` and no element box past the viewport at every width and state; stored `proof-*.png` files identical (0 differing pixels) to an independent re-capture. Gold text `#856119` on paper `#F7F3EA` computes to 5.10:1 (token arithmetic, not a screenshot sample).

Small defects fixed in place during the review:

1. `.inv-sc` carried `text-transform: lowercase`, so the two date lines rendered as uniform small caps and their DOM text read "on saturday, the nineteenth of december"; the approved artwork sets them with capital initials. The transform was removed; the SC face now renders "On Saturday, The Nineteenth of December / Two Thousand Twenty-Six" exactly as approved.
2. The crest `<img>` declared `height="360"` for a 360×556 file. Rendering was already proportional (`height: auto`), but the aspect-ratio hint was wrong; corrected to `height="556"`.
3. `Robert<span>and</span>Natalie` had no spaces, so the accessible name of the heading was "RobertandNatalie" and the words touched on wide screens. Spaces added; the stacked phone layout is unchanged. With the spaces the one-line desktop arrangement no longer fit at 66 px (it wrapped to "Robert and / Natalie", which is neither approved arrangement), so the desktop names size is 62 px, the largest whole size that fits the panel on one line; letterforms are not compressed.
4. After the envelope opened, focus was not moved (the script tried to focus an `h1` without `tabindex`). The invitation panel now has `tabindex="-1"` and receives focus, so the opened invitation is what the guest sees and hears first.

Not fixed (design-level, recorded for the owners): on phones and tablets the "Continue to the site" action sits in the editorial column below the tall invitation, so after the envelope opens it is not visible without scrolling (at 1440 it is visible beside the invitation). The owner-requested flow (envelope → invitation shown → next click → site with the invitation docked) therefore needs a scroll on narrow screens in this concept; alt-b shows one way to avoid that (a centred invitation stage with Continue pinned below it). The hotel telephone number could not be verified during the review (the hotel's website was not reachable from the review environment); it remains a carried-forward publisher value.

## What was not done / open items

- **Interactions are untested** beyond the smoke run above. No keyboard trap check inside the dialog, no screen-reader pass, no text-zoom/reflow capture, no touch-device check, no performance measurement. Per TPL-10 this static concept must not be described as having passed interactive, accessibility or performance tests.
- The envelope, keepsake and dialog are a sketch of the owner-requested flow; the docked invitation is removed from the document flow while docked (it lives only in the keepsake dialog until Close), which needs a design decision before any production use.
- Gold heading contrast (`#856119` on `#F7F3EA`) has not been measured here; DES-01 asks for in-browser validation.
- Hotel telephone number is a carried-forward publisher value; verify against the hotel's Contact page before any guest-facing use.
- Two draft wordings from the config appear (Wedding Day intro and venue-change note); owner approval is pending per the config.
- This page is not part of `npm run build` and is not access-controlled by anything in this directory; keep review previews access-controlled per TPL-09.
