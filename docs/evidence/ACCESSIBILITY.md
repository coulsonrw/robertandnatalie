# Accessibility evidence (lab, automated)

Generated 2026-09-21T23:56:45.648Z by `node scripts/audit.mjs`. Chromium 141.0.7390.37 (headless) via Playwright 1.56.1, axe-core 4.10.2 (MPL-2.0, vendored at scripts/vendor/axe.min.js), Node v22.22.2.

Build audited: dist/ written 2026-09-21T23:51:20.248Z, repository HEAD 1fd1aa3 with 6 uncommitted source file(s) (the build under test is the working tree, not the commit). File hashes (sha256, first 12): index.html b4909cebe7bb, celebration.html abe9d10301b3, rsvp.html 77a078d3f6d3, privacy.html ed14978e3899, 404.html 37e3fb8f4f49, js/site.js 14a56d4baeb3, js/rsvp.js 69f27c2269d4, styles/site.css 6632a89a82fc.

**Scope and honesty note.** Lab measurements in headless Chromium only. No Safari, Firefox, Edge, iOS or Android runs; no screen-reader (VoiceOver/NVDA) sessions; no field (RUM) data. These automated checks cover only the part of WCAG 2.2 AA that tools can detect. PRD NFR-01/NFR-03 and AT-15 additionally require manual testing (keyboard-only completion of the RSVP flow, VoiceOver on iOS/macOS, NVDA on Windows, 200 % zoom and 400 % reflow, real reduced-motion devices) and browser coverage that this script does not provide. Those remain open.

## Method

- Pages/states audited at 390 px and 1440 px, each in a fresh browser context: `home-sealed` (Home: sealed envelope (entry stage)); `home-open` (Home: envelope opened, invitation shown); `home-entered` (Home: entered the site, invitation docked bottom-left); `home-dialog` (Home: docked invitation re-opened in the dialog); `celebration` (Guest home /celebration.html (site route)); `rsvp-coming-soon` (RSVP /rsvp.html (coming-soon mode, no form)); `rsvp-access` (RSVP preview: access (code) step); `rsvp-invitees` (RSVP preview: invitees step); `rsvp-attendance-error` (RSVP preview: attendance step with validation errors); `rsvp-details` (RSVP preview: details step); `rsvp-review` (RSVP preview: review step); `rsvp-confirmation` (RSVP preview: confirmation step); `privacy` (Privacy notice); `not-found` (404 page).
- axe-core `axe.run(document)` with the default rule set (WCAG 2.x A/AA plus best-practice rules); every violation node is listed below with impact, rule id, selector and help URL.
- Structural checks run in the page: exactly one rendered `h1`; heading levels never skip downwards; every `img` has an `alt` attribute; every form control has an accessible name (label, aria-label, aria-labelledby or title); the skip link is the first Tab stop on a fresh load; every keyboard focus stop matches `:focus-visible` and has a computed outline or box-shadow (on the control or, for radios, on its label); links, buttons, choice labels and inputs inside `main` measure at least 44 × 44 CSS px (inline links inside sentences are listed but not failed, per the WCAG 2.5.8 inline exception); no horizontal overflow; accessible names of key controls from the Chromium accessibility tree.
- Reduced motion: `prefers-reduced-motion: reduce` emulated, then the envelope is opened, the site entered and the docked invitation re-opened; at each step `document.getAnimations()` must be empty and every text block of the invitation must be rendered at full opacity.

## Summary

| Impact | axe violation nodes |
|---|---|
| critical | 0 |
| serious | 0 |
| moderate | 0 |
| minor | 0 |

Serious/critical total: **0**.

| State | Viewport | axe (impact:rule) | h1 | Heading order | img alt | Labels | Skip link first | Focus indicator | Tap ≥44 (main) | Overflow |
|---|---|---|---|---|---|---|---|---|---|---|
| home-sealed | 390 | none | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 390 | none | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 390 | none | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok | yes |
| home-dialog | 390 | none | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok | yes |
| celebration | 390 | none | 1 | yes | all 2 | 0/0 | yes | yes (5 stops) | 14 ok | yes |
| rsvp-coming-soon | 390 | none | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| rsvp-access | 390 | none | 1 | yes | all 1 | 1/1 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-invitees | 390 | none | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-attendance-error | 390 | none | 1 | yes | all 1 | 14/14 | n/a | yes (16 stops) | 17 ok | yes |
| rsvp-details | 390 | none | 1 | yes | all 1 | 2/2 | n/a | yes (11 stops) | 5 ok | yes |
| rsvp-review | 390 | none | 1 | yes | all 1 | 0/0 | n/a | yes (10 stops) | 4 ok | yes |
| rsvp-confirmation | 390 | none | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| privacy | 390 | none | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| not-found | 390 | none | 1 | yes | all 1 | 0/0 | yes | yes (8 stops) | 2 ok | yes |
| home-sealed | 1440 | none | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 1440 | none | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 1440 | none | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok | yes |
| home-dialog | 1440 | none | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok | yes |
| celebration | 1440 | none | 1 | yes | all 2 | 0/0 | yes | yes (7 stops) | 14 ok | yes |
| rsvp-coming-soon | 1440 | none | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| rsvp-access | 1440 | none | 1 | yes | all 1 | 1/1 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-invitees | 1440 | none | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-attendance-error | 1440 | none | 1 | yes | all 1 | 14/14 | n/a | yes (18 stops) | 17 ok | yes |
| rsvp-details | 1440 | none | 1 | yes | all 1 | 2/2 | n/a | yes (13 stops) | 5 ok | yes |
| rsvp-review | 1440 | none | 1 | yes | all 1 | 0/0 | n/a | yes (12 stops) | 4 ok | yes |
| rsvp-confirmation | 1440 | none | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| privacy | 1440 | none | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| not-found | 1440 | none | 1 | yes | all 1 | 0/0 | yes | yes (10 stops) | 2 ok | yes |

## axe-core violations (every node)

None.

## axe-core "needs review" (incomplete) items

These are checks axe could not decide automatically (typically colour contrast behind gradients/images). They need a manual look, not a fix by default.

| Rule | Impact | Nodes | States | Help |
|---|---|---|---|---|
| `color-contrast` | serious | 104 | home-sealed@390, home-open@390, home-entered@390, home-dialog@390, celebration@390, rsvp-details@390, home-sealed@1440, home-open@1440, home-entered@1440, home-dialog@1440, celebration@1440, rsvp-attendance-error@1440, rsvp-details@1440 | https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI |
| `skip-link` | moderate | 4 | home-sealed@390, home-open@390, home-sealed@1440, home-open@1440 | https://dequeuniversity.com/rules/axe/4.10/skip-link?application=axeAPI |

- `color-contrast` — elements: `#entry-hint`, `.entry-glance > span:nth-child(1)`, `#invitation-title > .name:nth-child(1)`, `#invitation-title > .conj`, `#invitation-title > .name:nth-child(3)`, `.request`, `.date`, `.venue-script:nth-child(5)`, `.formal:nth-child(6)`, `.venue-script:nth-child(7)`, `.formal:nth-child(8)`, `.closing`, `article[aria-labelledby="ev-ceremony-title"] > .card-links > .dot[aria-hidden="true"]`, `article[aria-labelledby="ev-reception-title"] > .card-links > .dot[aria-hidden="true"]`, `#notes`, `.entry-glance > .dot[aria-hidden="true"]`, `.entry-glance > span:nth-child(3)`, `.glance-line > .dot[aria-hidden="true"]`, `.glance-times > .dot[aria-hidden="true"]:nth-child(2)`, `.dot[aria-hidden="true"]:nth-child(4)`, `li:nth-child(1) > a[href$="/#wedding-day"]`, `a[href$="/#travel-stay"]`. axe reason(s): Element's background color could not be determined because it is overlapped by another element / Element's background color could not be determined due to a background image / Element content is too short to determine if it is actual text content / Element's background color could not be determined because it's partially obscured by another element.
- `skip-link` — elements: `.skip-link`. axe reason(s): Skip link target should become visible on activation.

## Structural check findings

None.

## Accessible names (Chromium accessibility tree)

Names as Chromium computes them for the split-span headings and icon-only controls. Other engines (WebKit/VoiceOver) may join `<span>` fragments differently; not verified here.

| State | Viewport | Element | Role | Name |
|---|---|---|---|---|
| home-sealed | 390 | `#seal` | button | "Open the invitation" |
| home-sealed | 390 | `#invitation-title` | heading | "Robert and Natalie" |
| home-open | 390 | `#invitation-title` | heading | "Robert and Natalie" |
| home-entered | 390 | `#hero-title` | heading | "Robert and Natalie" |
| home-entered | 390 | `.keepsake-btn` | button | "View the invitation" |
| home-entered | 390 | `.nav-toggle` | button | "Menu" |
| home-dialog | 390 | `#invitation-title` | heading | "Robert and Natalie" |
| home-dialog | 390 | `.dialog-close` | button | "Close the invitation" |
| celebration | 390 | `#hero-title` | heading | "Robert and Natalie" |
| celebration | 390 | `.keepsake-btn` | button | "View the invitation" |
| celebration | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-coming-soon | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-access | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-access | 390 | `#rsvp-step-heading` | heading | "Find your invitation" |
| rsvp-access | 390 | `#code` | textbox | "Invitation code" |
| rsvp-invitees | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-invitees | 390 | `#rsvp-step-heading` | heading | "The Example Household" |
| rsvp-attendance-error | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-attendance-error | 390 | `#rsvp-step-heading` | heading | "Will you attend?" |
| rsvp-details | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-details | 390 | `#rsvp-step-heading` | heading | "A few details" |
| rsvp-review | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-review | 390 | `#rsvp-step-heading` | heading | "Review your response" |
| rsvp-confirmation | 390 | `.nav-toggle` | button | "Menu" |
| rsvp-confirmation | 390 | `#rsvp-step-heading` | heading | "Thank you — your response is saved" |
| privacy | 390 | `.nav-toggle` | button | "Menu" |
| not-found | 390 | `.nav-toggle` | button | "Menu" |

## Keyboard focus order (first stops, fresh load)

- **home-sealed @ 390**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → A "Skip to content"
- **privacy @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "Privacy" → A "Skip to content"
- **not-found @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "RSVP" → A "Privacy" → A "Skip to content"
- **home-sealed @ 1440**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → … (9 stops)
- **privacy @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "Privacy" → … (9 stops)
- **not-found @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "RSVP" → … (10 stops)

## Reduced motion (emulated)

- **390 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 350×965 at top 89, opacity 1, font 49.6 px; open: state=open, animations=0, readable text blocks 8/8, card 350×965 at top 89, opacity 1, font 49.6 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 33×92 at top 722, opacity 1, font 49.6 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 358×937 at top 59, opacity 1, font 49.6 px.
- **1440 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 760×1244 at top 117, opacity 1, font 86.4 px; open: state=open, animations=0, readable text blocks 8/8, card 760×1244 at top 117, opacity 1, font 86.4 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 98×160 at top 706, opacity 1, font 86.4 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 760×1244 at top 63, opacity 1, font 86.4 px.

## Still open (not covered by this script)

- Manual keyboard-only and screen-reader completion of access → RSVP → error → correction (AT-15) with VoiceOver (iOS/macOS) and NVDA (Windows).
- Real-device checks on current and previous Safari/iOS, Chrome/Android, Edge and Safari/macOS (NFR-03).
- 200 % text zoom and 400 % reflow are only approximated by the proofs script (docs/proofs); a human review of the script lettering at those sizes is still needed.
- Colour contrast of gold headings and controls is only checked where axe can compute it; items listed under "needs review" require a manual contrast measurement.
