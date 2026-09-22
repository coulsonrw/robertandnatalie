# Accessibility evidence (lab, automated)

Generated 2026-09-22T14:37:17.258Z by `node scripts/audit.mjs`. Chromium 141.0.7390.37 (headless) via Playwright 1.56.1, axe-core 4.10.2 (MPL-2.0, vendored at scripts/vendor/axe.min.js), Node v22.22.2.

Build audited: dist/ written 2026-09-22T14:35:49.455Z, repository HEAD 16c8492. File hashes (sha256, first 12): index.html a6df45085d74, celebration.html d9ac62a1cf7e, rsvp.html 7155d880c31a, privacy.html 7e72613919ba, 404.html 1e33d3075e9a, js/site.js 14a56d4baeb3, js/rsvp.js dec35dd9fce9, styles/site.css ba75f60e3549.

**Scope and honesty note.** Lab measurements in headless Chromium only. No Safari, Firefox, Edge, iOS or Android runs; no screen-reader (VoiceOver/NVDA) sessions; no field (RUM) data. Browser contexts use Playwright's bypassCSP so that axe-core and the measurement probes can be injected; whether the pages behave correctly under their own Content-Security-Policy is not verified by this run. These automated checks cover only the part of WCAG 2.2 AA that tools can detect. PRD NFR-01/NFR-03 and AT-15 additionally require manual testing (keyboard-only completion of the RSVP flow, VoiceOver on iOS/macOS, NVDA on Windows, 200 % zoom and 400 % reflow, real reduced-motion devices) and browser coverage that this script does not provide. Those remain open.

## Method

- Pages/states audited at 320, 390, 768, 1440 CSS px wide, each in a fresh browser context: `home-sealed` (Home: sealed envelope (entry stage)); `home-open` (Home: envelope opened, invitation shown); `home-entered` (Home: entered the site, invitation docked bottom-left); `home-dialog` (Home: docked invitation re-opened in the dialog); `celebration` (Guest home /celebration.html (site route)); `rsvp-coming-soon` (RSVP /rsvp.html (coming-soon mode, no form)); `rsvp-access` (RSVP preview: access (code) step); `rsvp-invitees` (RSVP preview: invitees step); `rsvp-attendance-error` (RSVP preview: attendance step with validation errors); `rsvp-details` (RSVP preview: details step); `rsvp-review` (RSVP preview: review step); `rsvp-confirmation` (RSVP preview: confirmation step); `privacy` (Privacy notice); `story-preview` (Our Story: protected layout preview with synthetic fixtures (local/CI builds only)); `not-found` (404 page).
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

| State | Viewport | axe violations (impact:rule) | h1 | Heading order | img alt | Labels | Skip link first | Focus indicator | Tap ≥44 (main) | Overflow |
|---|---|---|---|---|---|---|---|---|---|---|
| home-sealed | 320 | none (33 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 320 | none (34 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 320 | none (43 rules passed) | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok (+1 inline text links) | yes |
| home-dialog | 320 | none (25 rules passed) | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok (+1 inline text links) | yes |
| celebration | 320 | none (42 rules passed) | 1 | yes | all 2 | 0/0 | yes | yes (5 stops) | 14 ok (+1 inline text links) | yes |
| rsvp-coming-soon | 320 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| rsvp-access | 320 | none (44 rules passed) | 1 | yes | all 1 | 1/1 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-invitees | 320 | none (42 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-attendance-error | 320 | none (45 rules passed) | 1 | yes | all 1 | 14/14 | n/a | yes (16 stops) | 17 ok | yes |
| rsvp-details | 320 | none (46 rules passed) | 1 | yes | all 1 | 2/2 | n/a | yes (11 stops) | 5 ok | yes |
| rsvp-review | 320 | none (47 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (10 stops) | 4 ok | yes |
| rsvp-confirmation | 320 | none (45 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| privacy | 320 | none (37 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| story-preview | 320 | none (41 rules passed) | 1 | yes | all 6 | 0/0 | yes | yes (6 stops) | 0 ok | yes |
| not-found | 320 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (8 stops) | 2 ok | yes |
| home-sealed | 390 | none (33 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 390 | none (34 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 390 | none (43 rules passed) | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok (+1 inline text links) | yes |
| home-dialog | 390 | none (25 rules passed) | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok (+1 inline text links) | yes |
| celebration | 390 | none (42 rules passed) | 1 | yes | all 2 | 0/0 | yes | yes (5 stops) | 14 ok (+1 inline text links) | yes |
| rsvp-coming-soon | 390 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| rsvp-access | 390 | none (44 rules passed) | 1 | yes | all 1 | 1/1 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-invitees | 390 | none (42 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| rsvp-attendance-error | 390 | none (45 rules passed) | 1 | yes | all 1 | 14/14 | n/a | yes (16 stops) | 17 ok | yes |
| rsvp-details | 390 | none (46 rules passed) | 1 | yes | all 1 | 2/2 | n/a | yes (11 stops) | 5 ok | yes |
| rsvp-review | 390 | none (47 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (10 stops) | 4 ok | yes |
| rsvp-confirmation | 390 | none (45 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (9 stops) | 3 ok | yes |
| privacy | 390 | none (37 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (7 stops) | 1 ok | yes |
| story-preview | 390 | none (41 rules passed) | 1 | yes | all 6 | 0/0 | yes | yes (6 stops) | 0 ok | yes |
| not-found | 390 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (8 stops) | 2 ok | yes |
| home-sealed | 768 | none (33 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 768 | none (34 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 768 | none (43 rules passed) | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok (+1 inline text links) | yes |
| home-dialog | 768 | none (25 rules passed) | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok (+1 inline text links) | yes |
| celebration | 768 | none (42 rules passed) | 1 | yes | all 2 | 0/0 | yes | yes (7 stops) | 14 ok (+1 inline text links) | yes |
| rsvp-coming-soon | 768 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| rsvp-access | 768 | none (46 rules passed) | 1 | yes | all 1 | 1/1 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-invitees | 768 | none (42 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-attendance-error | 768 | none (45 rules passed) | 1 | yes | all 1 | 14/14 | n/a | yes (18 stops) | 17 ok | yes |
| rsvp-details | 768 | none (46 rules passed) | 1 | yes | all 1 | 2/2 | n/a | yes (13 stops) | 5 ok | yes |
| rsvp-review | 768 | none (48 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (12 stops) | 4 ok | yes |
| rsvp-confirmation | 768 | none (46 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| privacy | 768 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| story-preview | 768 | none (40 rules passed) | 1 | yes | all 6 | 0/0 | yes | yes (8 stops) | 0 ok | yes |
| not-found | 768 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (10 stops) | 2 ok | yes |
| home-sealed | 1440 | none (33 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (5 stops) | 3 ok | yes |
| home-open | 1440 | none (34 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (6 stops) | 4 ok | yes |
| home-entered | 1440 | none (43 rules passed) | 1 | yes | all 2 | 0/0 | n/a | yes (8 stops) | 14 ok (+1 inline text links) | yes |
| home-dialog | 1440 | none (25 rules passed) | 1 | yes | all 3 | 0/0 | n/a | yes (3 stops) | 14 ok (+1 inline text links) | yes |
| celebration | 1440 | none (42 rules passed) | 1 | yes | all 2 | 0/0 | yes | yes (7 stops) | 14 ok (+1 inline text links) | yes |
| rsvp-coming-soon | 1440 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| rsvp-access | 1440 | none (46 rules passed) | 1 | yes | all 1 | 1/1 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-invitees | 1440 | none (42 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| rsvp-attendance-error | 1440 | none (45 rules passed) | 1 | yes | all 1 | 14/14 | n/a | yes (18 stops) | 17 ok | yes |
| rsvp-details | 1440 | none (46 rules passed) | 1 | yes | all 1 | 2/2 | n/a | yes (13 stops) | 5 ok | yes |
| rsvp-review | 1440 | none (48 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (12 stops) | 4 ok | yes |
| rsvp-confirmation | 1440 | none (46 rules passed) | 1 | yes | all 1 | 0/0 | n/a | yes (11 stops) | 3 ok | yes |
| privacy | 1440 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (9 stops) | 1 ok | yes |
| story-preview | 1440 | none (40 rules passed) | 1 | yes | all 6 | 0/0 | yes | yes (8 stops) | 0 ok | yes |
| not-found | 1440 | none (35 rules passed) | 1 | yes | all 1 | 0/0 | yes | yes (10 stops) | 2 ok | yes |

## axe-core violations (every node)

None.

## axe-core "needs review" (incomplete) items

These are checks axe could not decide automatically (typically colour contrast behind gradients/images). They need a manual look, not a fix by default.

| Rule | Impact | Nodes | States | Help |
|---|---|---|---|---|
| `color-contrast` | serious | 219 | home-sealed@320, home-open@320, home-entered@320, home-dialog@320, celebration@320, rsvp-details@320, home-sealed@390, home-open@390, home-entered@390, home-dialog@390, celebration@390, rsvp-details@390, home-sealed@768, home-open@768, home-entered@768, home-dialog@768, celebration@768, rsvp-details@768, home-sealed@1440, home-open@1440, home-entered@1440, home-dialog@1440, celebration@1440, rsvp-details@1440 | https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI |
| `skip-link` | moderate | 8 | home-sealed@320, home-open@320, home-sealed@390, home-open@390, home-sealed@768, home-open@768, home-sealed@1440, home-open@1440 | https://dequeuniversity.com/rules/axe/4.10/skip-link?application=axeAPI |

- `color-contrast` — elements: `.entry-skip`, `.entry-bar-actions > .btn-rsvp.btn-primary[href$="rsvp.html"]`, `#invitation-title > .name:nth-child(1)`, `#entry-hint`, `#invitation-title > .conj`, `#invitation-title > .name:nth-child(3)`, `.request`, `.date`, `.venue-1`, `.time-1`, `.venue-2`, `.time-2`, `.closing`, `article[aria-labelledby="ev-ceremony-title"] > .card-links > .dot[aria-hidden="true"]`, `article[aria-labelledby="ev-reception-title"] > .card-links > .dot[aria-hidden="true"]`, `li > .dot[aria-hidden="true"]`, `#notes`, `.entry-glance > span:nth-child(1)`, `.entry-glance > .dot[aria-hidden="true"]`, `.entry-glance > span:nth-child(3)`, `.glance-line > .dot[aria-hidden="true"]`, `.glance-times > .dot[aria-hidden="true"]:nth-child(2)`, `.dot[aria-hidden="true"]:nth-child(4)`, `.keepsake-caption`. axe reason(s): Element's background color could not be determined because it is overlapped by another element / Element's background color could not be determined because element contains an image node / Element's background color could not be determined because it partially overlaps other elements / Element content is too short to determine if it is actual text content / Unable to determine contrast ratio / Element's background color could not be determined because it's partially obscured by another element.
- `skip-link` — elements: `.skip-link`. axe reason(s): Skip link target should become visible on activation.

## Structural check findings

### home-entered @ 320 px — Home: entered the site, invitation docked bottom-left

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-dialog @ 320 px — Home: docked invitation re-opened in the dialog

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### celebration @ 320 px — Guest home /celebration.html (site route)

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-entered @ 390 px — Home: entered the site, invitation docked bottom-left

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-dialog @ 390 px — Home: docked invitation re-opened in the dialog

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### celebration @ 390 px — Guest home /celebration.html (site route)

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-entered @ 768 px — Home: entered the site, invitation docked bottom-left

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-dialog @ 768 px — Home: docked invitation re-opened in the dialog

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### celebration @ 768 px — Guest home /celebration.html (site route)

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-entered @ 1440 px — Home: entered the site, invitation docked bottom-left

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### home-dialog @ 1440 px — Home: docked invitation re-opened in the dialog

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

### celebration @ 1440 px — Guest home /celebration.html (site route)

- 1 inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): "Official site" 85×22

## Accessible names (Chromium accessibility tree)

Names as Chromium computes them for the split-span headings and icon-only controls. Other engines (WebKit/VoiceOver) may join `<span>` fragments differently; not verified here.

| State | Viewport | Element | Role | Name |
|---|---|---|---|---|
| home-sealed | 320 | `#seal` | button | "Open the invitation" |
| home-sealed | 320 | `#invitation-title` | heading | "Robert and Natalie" |
| home-open | 320 | `#invitation-title` | heading | "Robert and Natalie" |
| home-entered | 320 | `#hero-title` | heading | "Robert and Natalie" |
| home-entered | 320 | `.keepsake-btn` | button | "View the invitation" |
| home-entered | 320 | `.nav-toggle` | button | "Menu" |
| home-dialog | 320 | `#invitation-title` | heading | "Robert and Natalie" |
| home-dialog | 320 | `.dialog-close` | button | "Close the invitation" |
| celebration | 320 | `#hero-title` | heading | "Robert and Natalie" |
| celebration | 320 | `.keepsake-btn` | button | "View the invitation" |
| celebration | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-coming-soon | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-access | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-access | 320 | `#rsvp-step-heading` | heading | "Find your invitation" |
| rsvp-access | 320 | `#code` | textbox | "Invitation code" |
| rsvp-invitees | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-invitees | 320 | `#rsvp-step-heading` | heading | "The Example Household" |
| rsvp-attendance-error | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-attendance-error | 320 | `#rsvp-step-heading` | heading | "Will you attend?" |
| rsvp-details | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-details | 320 | `#rsvp-step-heading` | heading | "A few details" |
| rsvp-review | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-review | 320 | `#rsvp-step-heading` | heading | "Review your response" |
| rsvp-confirmation | 320 | `.nav-toggle` | button | "Menu" |
| rsvp-confirmation | 320 | `#rsvp-step-heading` | heading | "Thank you — your response is saved" |
| privacy | 320 | `.nav-toggle` | button | "Menu" |
| story-preview | 320 | `.nav-toggle` | button | "Menu" |
| not-found | 320 | `.nav-toggle` | button | "Menu" |

## Keyboard focus order (first stops, fresh load)

- **home-sealed @ 320**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 320**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 320**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → A "Skip to content"
- **privacy @ 320**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "Privacy" → A "Skip to content"
- **story-preview @ 320**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Privacy" → A "Skip to content"
- **not-found @ 320**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "RSVP" → A "Privacy" → A "Skip to content"
- **home-sealed @ 390**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → A "Skip to content"
- **privacy @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "Privacy" → A "Skip to content"
- **story-preview @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Privacy" → A "Skip to content"
- **not-found @ 390**: A "Skip to content" → A "Robert and Natalie — home" → BUTTON "Menu" → A "RSVP" → A "Back to the invitation" → A "RSVP" → A "Privacy" → A "Skip to content"
- **home-sealed @ 768**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 768**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 768**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → … (9 stops)
- **privacy @ 768**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "Privacy" → … (9 stops)
- **story-preview @ 768**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Privacy" → A "Skip to content"
- **not-found @ 768**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "RSVP" → … (10 stops)
- **home-sealed @ 1440**: A "Skip to content" → A "Skip to the wedding details" → A "RSVP" → BUTTON#seal "Open the invitation" → A "Skip to content"
- **celebration @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "RSVP"
- **rsvp-coming-soon @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the wedding details" → A "Privacy" → … (9 stops)
- **privacy @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "Privacy" → … (9 stops)
- **story-preview @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Privacy" → A "Skip to content"
- **not-found @ 1440**: A "Skip to content" → A "Robert and Natalie — home" → A "Wedding Day" → A "Travel & Stay" → A "Questions" → A "RSVP" → A "Back to the invitation" → A "RSVP" → … (10 stops)

## Reduced motion (emulated)

- **320 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 280×350 at top 89, opacity 1, font 32.48 px; open: state=open, animations=0, readable text blocks 8/8, card 280×350 at top 89, opacity 1, font 32.48 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 34×42 at top 495, opacity 1, font 32.48 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 288×360 at top 116, opacity 1, font 33.408 px.
- **390 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 350×437 at top 89, opacity 1, font 40.6 px; open: state=open, animations=0, readable text blocks 8/8, card 350×437 at top 89, opacity 1, font 40.6 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 34×42 at top 772, opacity 1, font 40.6 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 358×447 at top 216, opacity 1, font 41.528 px.
- **768 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 707×883 at top 124, opacity 1, font 81.9613 px; open: state=open, animations=0, readable text blocks 8/8, card 707×883 at top 124, opacity 1, font 81.9613 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 110×137 at top 852, opacity 1, font 84.448 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 736×920 at top 72, opacity 1, font 85.376 px.
- **1440 px**: pass. Start state `open` (the page skips the sealed envelope under reduced motion and shows the invitation directly). initial: state=open, animations=0, readable text blocks 8/8, card 760×950 at top 117, opacity 1, font 88.16 px; open: state=open, animations=0, readable text blocks 8/8, card 760×950 at top 117, opacity 1, font 88.16 px; site (docked): state=site, animations=0, readable text blocks 8/8, card 110×137 at top 728, opacity 1, font 88.16 px; dialog: state=dialog, animations=0, readable text blocks 8/8, card 643×804 at top 68, opacity 1, font 74.6097 px.

## Still open (not covered by this script)

- Manual keyboard-only and screen-reader completion of access → RSVP → error → correction (AT-15) with VoiceOver (iOS/macOS) and NVDA (Windows).
- Real-device checks on current and previous Safari/iOS, Chrome/Android, Edge and Safari/macOS (NFR-03).
- 200 % text zoom and 400 % reflow are only approximated by the proofs script (docs/proofs); a human review of the script lettering at those sizes is still needed.
- Colour contrast of gold headings and controls is only checked where axe can compute it; items listed under "needs review" require a manual contrast measurement.
