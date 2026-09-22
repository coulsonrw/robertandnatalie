# Test results log

One row per run of a test or evidence suite (PRD §14 pass-evidence rules: candidate/build identifier, revision, environment, tester, date, result, evidence). Append; do not rewrite history. Manual sessions (usability pilot, VoiceOver, NVDA, device checks, restore drill) are recorded here too when they happen.

| Date (UTC) | Suite | Revision | Environment | Run by | Result | Evidence |
|---|---|---|---|---|---|---|
| 2026-09-21 | `npm run proofs` (visual, entry flow, keyboard, reduced motion, 200% text, RSVP preview paths, decline-all, private link) | branch `claude/zen-gates-fhulbh` | Chromium 141 headless, Playwright 1.56.1, Node 22.22.2, Linux | implementation agent | pass, no horizontal overflow at 320/390/768/1440 | `docs/proofs/README.md`, PNGs in `docs/proofs/` |
| 2026-09-21 | `npm run audit` (axe-core 4.10.2 on 14 states × 2 widths; 5 cold-cache throttled mobile runs × 2 pages) | same | same | implementation agent | pass: 0 violations; LCP median 1476 ms, CLS 0, interaction 64 ms, JS 3.5 kB gzip | `docs/evidence/` |
| 2026-09-21 | `npm test` (format/ics unit tests, automated AT-02, wording guards) | same | Node 22.22.2 | implementation agent | 5/5 pass | `scripts/test.mjs` |
| 2026-09-21 | `backend` `npm test` (vitest in workerd with local D1) | same | vitest 4.1.11, wrangler 4.124.0, workerd 2026-08-15 | implementation agent | 48/48 pass | `backend/test/` |
| 2026-09-21 | AT-02 manual variant run (ceremony start moved to 15:30) | same | Node 22.22.2 | implementation agent | pass | `docs/ACCEPTANCE_TESTS.md` |
| — | Six-person usability pilot (AT-03, §01 outcomes) | | | | not run | |
| — | VoiceOver (iOS/macOS) and NVDA sessions (AT-15) | | | | not run | |
| — | Calendar imports in Apple, Google, Outlook; map links on iOS/Android (AT-14) | | | | not run | |
| — | Restore, revoke, rollback, fallback drill (AT-16) | | | | not run | |
| — | AT-04 to AT-13 against the deployed service | | | | blocked: service not deployed | |
