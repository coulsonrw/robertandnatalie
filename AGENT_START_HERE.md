# Start here

Orientation for anyone (person or agent) picking up this repository. Read in this order.

1. `docs/PRD_v1_2.md` — the governing specification (reissued 22 September 2026; it adds the gallery and guest uploads, the charity note in lieu of gifts, and the chapel-to-reception directions). Sections 01–05 and 16 first, then the rest. Its identifiers (IA-01, DES-02, RSVP-05, AT-09, GALLERY-01 …) are used everywhere below. `docs/PRD_v1_1.md` is retained for reference only; every v1.1 identifier keeps its number and meaning in v1.2.
2. `docs/DECISION_RECORD.md` — what was decided, by whom, and the gate status (G1, G2, G3). As of 21 September 2026 no gate is signed; the owner's instruction on that date was to start building the website on GitHub Pages, and that instruction is recorded as the authority for the work so far.
3. `docs/PRD_GAP_ANALYSIS.md` and `docs/TRACEABILITY.md` — every requirement with its verified status and remaining action.
4. `docs/DECISION_REGISTER.md` — the decisions still owed by the owners and coordinator.
5. `README.md` — how the site is built, edited and deployed; `docs/RUNBOOK.md` — how it is operated.

## What exists

- Static site (`content/`, `scripts/`, `src/`) built by `npm run build` with no runtime dependencies, deployed to GitHub Pages by `.github/workflows/deploy.yml`.
- RSVP service reference implementation in `backend/` (Cloudflare Workers + D1), tested locally, not deployed.
- Evidence: `docs/proofs/` (visual and interaction proofs), `docs/evidence/` (axe and performance), `docs/ACCEPTANCE_TESTS.md`, `docs/TEST_RESULTS.md`.
- Selection package: `docs/selection/` (candidate register, scorecard, keep/adapt/replace, report, two alternative concept mockups) — see its own README for status.

## Commands

```bash
npm run check      # validate content/site.config.json
npm test           # unit tests + automated AT-02
npm run build      # build dist/ and print the launch-readiness report
npm run register   # regenerate docs/CONTENT_APPROVAL_REGISTER.md
npm run serve      # preview dist/ locally
npm run proofs     # Playwright proofs (needs a Chromium install: npx playwright install chromium)
npm run audit      # axe + performance lab runs
npm run linkcheck  # external links in dist/
cd backend && npm ci && npm test   # RSVP service tests
```

## Stop rules (PRD TPL-01, TPL-11)

- Do not record an approval on behalf of the owners; approver and date fields stay blank until they sign.
- Do not set `site.launchApproved` to true, switch `rsvp.mode` to `live`, or import a real roster without the owners' recorded decision.
- Do not invent venue details, room-block terms, transport, dress code, contact details or a cutoff; leave the block `pending` and let the readiness report flag it.
- Do not buy or adopt a template, add tracking, or publish photographs without recorded rights.

## What was not supplied

PRD v1.0, the Word version of the PRD, `CHANGELOG_v1_1.md` and the blank selection starters from the PRD's handoff package were not provided to this repository; `docs/CHANGELOG.md` reconstructs the v1.1 change table from the PRD text and `content/site.config.json` stands in for `content-config.example.json` (same schema 1.0 / document 1.1 metadata, synthetic data only).
