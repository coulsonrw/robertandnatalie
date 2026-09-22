# Visual proofs

Captured 2026-09-21T23:55:32.947Z with Chromium 141.0.7390.37 on Node v22.22.2 using `npm run proofs` (Playwright, headless).
Synthetic guests only (PRD DATA-03). The RSVP preview uses the in-page mock adapter; nothing is saved.

## Horizontal overflow check (must be none)

| Page | Width | scrollWidth | innerWidth | OK |
|---|---|---|---|---|
| entry-envelope | 320 | 320 | 320 | yes |
| invitation | 320 | 320 | 320 | yes |
| rsvp-coming-soon | 320 | 320 | 320 | yes |
| rsvp-preview-access | 320 | 320 | 320 | yes |
| privacy | 320 | 320 | 320 | yes |
| entry-envelope | 390 | 390 | 390 | yes |
| invitation | 390 | 390 | 390 | yes |
| rsvp-coming-soon | 390 | 390 | 390 | yes |
| rsvp-preview-access | 390 | 390 | 390 | yes |
| privacy | 390 | 390 | 390 | yes |
| entry-envelope | 768 | 768 | 768 | yes |
| invitation | 768 | 768 | 768 | yes |
| rsvp-coming-soon | 768 | 768 | 768 | yes |
| rsvp-preview-access | 768 | 768 | 768 | yes |
| privacy | 768 | 768 | 768 | yes |
| entry-envelope | 1440 | 1440 | 1440 | yes |
| invitation | 1440 | 1440 | 1440 | yes |
| rsvp-coming-soon | 1440 | 1440 | 1440 | yes |
| rsvp-preview-access | 1440 | 1440 | 1440 | yes |
| privacy | 1440 | 1440 | 1440 | yes |
| invitation @ 200% text | 1440 | 1440 | 1440 | yes |

## Keyboard focus order (home, 1440)

1. A — "Skip to content"
2. A — "Robert and Natalie — home"
3. A — "Wedding Day"
4. A — "Travel & Stay"
5. A — "Questions"
6. A — "RSVP"
7. A — "RSVP"
8. A — "View Wedding Day"
9. BUTTON — "View the invitation"

## Entry flow (sealed envelope → invitation → site with keepsake → dialog)

- 390px: after opening, state=open focus=invitation-card; after entering, state=site focus=hero-title entry hidden=true keepsake=33×92 at (6, 722); dialog modal=true focus=dialog-close; after Escape state=site focus=keepsake-btn; deep link /#wedding-day skips the envelope=true scrolled=true; page errors=0.
- 1440px: after opening, state=open focus=invitation-card; after entering, state=site focus=hero-title entry hidden=true keepsake=98×160 at (12, 706); dialog modal=true focus=dialog-close; after Escape state=site focus=keepsake-btn; deep link /#wedding-day skips the envelope=true scrolled=true; page errors=0.

## Reduced motion, keyboard only (390)

- On load the invitation is shown without the sealed envelope: state=open, seal visible=false, running animations=0; Enter on "Continue to the website": state=site, focus=hero-title, running animations=0.

## Decline-all household (AT-08, synthetic code SOLO, 390)

- Details step skipped when everyone declines: true; decline saved with reference PREVIEW-3CC6A3 (2 guest/event rows).

## Private-link access (390)

- Token removed from the address bar before any action: true; "Open my invitation" shown: true; after pressing it the wizard is at step "invitees" and the URL is /rsvp.html?preview=1.

## RSVP preview error state

- 390px: after submitting an incomplete attendance form, focus moved to `c-g_alex_ceremony-attending`.
- 1440px: after submitting an incomplete attendance form, focus moved to `c-g_alex_ceremony-attending`.

## Files

- detail-invitation-390@2x.png
- detail-rsvp-attendance-error-390@2x.png
- entry-dialog-1440.png
- entry-dialog-390.png
- entry-envelope-1440.png
- entry-envelope-320.png
- entry-envelope-390.png
- entry-envelope-768.png
- entry-opened-1440.png
- entry-opened-390.png
- entry-site-keepsake-1440.png
- entry-site-keepsake-390.png
- invitation-1440.png
- invitation-320.png
- invitation-390.png
- invitation-768.png
- invitation-reduced-motion-390.png
- invitation-text-200pct-1440.png
- keyboard-focus-1440.png
- keyboard-skip-link-1440.png
- menu-open-320.png
- menu-open-390.png
- privacy-1440.png
- privacy-320.png
- privacy-390.png
- privacy-768.png
- rsvp-coming-soon-1440.png
- rsvp-coming-soon-320.png
- rsvp-coming-soon-390.png
- rsvp-coming-soon-768.png
- rsvp-decline-all-confirmation-390.png
- rsvp-decline-all-review-390.png
- rsvp-link-token-390.png
- rsvp-preview-access-1440.png
- rsvp-preview-access-320.png
- rsvp-preview-access-390.png
- rsvp-preview-access-768.png
- rsvp-preview-attendance-error-1440.png
- rsvp-preview-attendance-error-390.png
- rsvp-preview-confirmation-1440.png
- rsvp-preview-confirmation-390.png
- rsvp-preview-details-1440.png
- rsvp-preview-details-390.png
- rsvp-preview-invitees-1440.png
- rsvp-preview-invitees-390.png
- rsvp-preview-review-1440.png
- rsvp-preview-review-390.png
