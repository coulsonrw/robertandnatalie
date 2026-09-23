# Change log

## PRD v1.2 (22 September 2026) — from the PRD's own revision record

Owner instruction of 22 September 2026: "add this to the PRD: 1) create a separate gallery for photo uploads and post-wedding pictures. 2) add a charity donation in lieu of gifts 3) add directions from the Chapel to The Grand both for passenger drop-off and parking and to the room." `docs/PRD_v1_2.md` is a complete reissue; `docs/PRD_v1_1.md` is retained for reference. All 63 v1.1 requirement IDs and 22 acceptance cases keep their number and meaning.

| Change in v1.2 | Operational effect |
|---|---|
| Separate gallery for guest photo uploads and post-wedding pictures (GALLERY-01–05, ARCH-07; `/gallery` route in Section 03; "Guest after the wedding" journey) | Gallery and guest uploads move from P2 to P1. Uploads need the authenticated household session, moderation, consent, metadata stripping, owner-controlled private storage and a retention decision; nothing is public until approved. |
| Charity donation in lieu of gifts (CONTENT-07; `#gifts` anchor; "Gifts" FAQ topic) | A short owner-approved note linking to the charity's own donation page, verified (official domain, IRS Tax Exempt Organization Search for a US charity) before publication. The website never takes or records payments. Omitted until approved. |
| Directions from Saint Francis Chapel to The Grand Hotel: passenger drop-off, guest parking and the way to the reception room (CONTENT-08) | Coordinator- and hotel-verified route with three map destinations, shown on the reception card, the "getting between venues" FAQ and the reception calendar description from one content source. Nothing is published until confirmed; no shuttle or timing is inferred. |
| Acceptance cases AT-23–25 and three decision rows in Section 16 | Gallery, gifts and directions are testable and gated like every other content block. |

Nothing in this reissue is implemented yet: see the v1.2 addendum in `docs/TRACEABILITY.md` and `docs/DECISION_REGISTER.md` rows 25–27 for the inputs each module needs.

## PRD v1.1 (21 September 2026) — from the PRD's own revision record

| Change in v1.1 | Operational effect |
|---|---|
| New Section 05: template and design-foundation selection | Research, screen, compare, prototype and obtain approval before committing to the production design. |
| Evidence-based shortlist and weighted evaluation | Six to eight credible candidates; three branded alternatives including a custom component-based benchmark. |
| Separate concept, purchase and build approvals | A public demo does not establish source quality, licence rights or a compliant RSVP system. |
| Expanded acceptance and handover | Selection evidence, source/licence checks, proof screenshots, decision record and change control become required deliverables. |
| Reconciled delivery baseline | 25 working days proposed, excluding owner and procurement waiting time. |

Unchanged in v1.1: wedding date, venues and start times, invitation copy, original-colour crest, ivory/gold/charcoal identity, household RSVP requirements, privacy decision status, P1/P2 scope boundaries.

## Repository changes (23 September 2026)

| Change | Instruction or reason | Affected requirements | Approvals reopened |
|---|---|---|---|
| Tried to deploy the RSVP service into the owners' Cloudflare account (backend README steps 1–9). **Blocked at step 1**: the account API token is active, but its "Not before" date is 31 December 2026 and it expires the same day, so `wrangler whoami` is refused. Nothing was created in the account. `wrangler.toml` and `content/site.config.json` are unchanged. The block and the steps to unblock are recorded under "Deployment status" in `backend/README.md`. | Owner: deploy the RSVP service following backend README steps 1–9. Do not create the Access application, set admin emails, mail provider or cutoff, or import guest data. | ARCH-06 (still partly met) | None. The token's validity window must be corrected by the owners. |

## Repository changes (22 September 2026)

| Change | Instruction or reason | Affected requirements | Approvals reopened |
|---|---|---|---|
| Invitation card face is now the approved artwork itself (A2) with its wording removed; names, request, date, venues, times and closing line are live text positioned at the artwork's coordinates; SVG corner flourishes retired | Owner: "Change the invitation with the attached file" (the file matched A2 pixel for pixel apart from JPEG re-encoding) | HOME-01, DES-01, DES-03, AT-01, NFR-02 (LCP element is now the frame image, 28–68 KB by width) | Owner approval of the composition to be recorded |
| Deploy workflow reads the Pages settings each run, switches the source to GitHub Actions when the token is allowed to, and reports the state in the job summary | Custom domain served a 404 after the first merge: the Pages source was still the branch build, which overwrote the workflow deployment | RELEASE-01, OPS-01 | — |
| "Check the custom domain" workflow (`domain-check.yml`, manual): reads the Pages settings, then queries three public resolvers (NS, A, AAAA, CNAME, CAA, MX, TXT) and probes HTTP, HTTPS, the server header and the certificate from the runner, writing everything to the job summary; warns on propagation disagreements, a missing www CNAME or a missing HTTPS redirect; fails when the apex does not resolve to the four GitHub Pages addresses, does not answer 200 over HTTPS, or is served through a proxy. GitHub's own Pages health endpoint was tried first and refused (it needs repository-administrator rights the workflow token cannot hold). Runbook §3 and README updated. | Owner: "confirm the site's DNS" ahead of moving the domain's nameservers to Cloudflare for the RSVP service (23 September 2026); the Pages API is not reachable from the build environment | RELEASE-01, OPS-01, OPS-02 | — |
| PRD reissued as v1.2 (`docs/PRD_v1_2.md`) adding CONTENT-07, CONTENT-08, GALLERY-01–05, ARCH-07 and AT-23–25; pointers updated in `AGENT_START_HERE.md`, `README.md`, `docs/DECISION_RECORD.md`, `docs/ACCEPTANCE_TESTS.md`, `docs/DELIVERY_PLAN.md`; decision rows 25–27 and a traceability addendum added. No site, configuration or backend change. | Owner: "add this to the PRD: 1) … gallery … 2) … charity donation in lieu of gifts 3) … directions from the Chapel to The Grand …" (22 September 2026) | CONTENT-07, CONTENT-08, GALLERY-01–05, ARCH-07, AT-23–25 (all not started) | None; three new decisions opened |
| Live-site audit follow-ups: truthful RSVP states with an optional approved opening date (`rsvp.opensAt`), deadline FAQ that never defers to the paper invitation and names the cutoff once set, per-airport approvals with official sites and no proximity ranking, canonical links, Our Story module (built, switched off, synthetic-fixture preview at `/story-preview.html`), story image pipeline (`npm run images`), the handoff's read-only capture tool (`npm run capture:public`), build-level acceptance tests (calendars, routes, story gating, opening date and deadline propagation, airports, image pipeline), backend review against the audit's service scenarios | Owner: "Implement these improvements" with the live-site audit handoff of 22 September 2026 (`docs/audit/`) | HOME-02/03, CONTENT-01–05, RSVP-01–07, SEC-01–04, NFR-01–04, DATA-01 | Owner decisions listed in `docs/audit/approval-register.json`; no content fabricated |

## Repository changes (all 21 September 2026)

| Change | Instruction or reason | Affected requirements | Approvals reopened |
|---|---|---|---|
| Replaced the previous envelope demo with a configuration-driven static build; live-text invitation; Wedding Day, Travel & Stay, Questions, privacy, calendar files | Owner: "Review this PRD and start building the website that will be hosted on GitHub Pages." | DATA-01, HOME-01/02/04, DES-01–04, CONTENT-02–06, SEC-01, NFR-01/04 | G1/G2 not yet given |
| RSVP wizard front end against a documented API contract; synthetic households; coming-soon mode | Static hosting cannot run the service; PRD rejects client-only RSVP | RSVP-01–06, IA-02, ARCH-01 (boundary) | — |
| Envelope landing, docked lower-left keepsake, re-centred dialog, hero, `/celebration.html` | Owner (same day): landing page should be the envelope that opens to the invitation; next click enters the site; the invitation moves to the lower-left corner and returns centred on click | HOME-02 (two-action path), HOME-03, IA-01/02, NFR-01 motion, proofs | Owner approval of the composition to be recorded |
| Urgent-logistics banner, post-event phase, private-link tokens, meal choices, launch gating, strict build, CI readiness summary | Gap audit against the PRD | ADMIN-04, OPS-02/03, SEC-02, RSVP-03, CONTENT-06, RELEASE-01 | — |
| Accessibility and performance fixes and evidence tooling; proofs extended | Evidence audit (axe, budgets) | NFR-01–03, AT-15, TPL-10 | — |
| Backend reference implementation (Cloudflare Workers + D1) with tests, including meal choices | PRD §08–§12 | RSVP-01–07, ADMIN-01–04, DATA-02/03, ARCH-02–06, SEC-02–07 | Technical-lead validation pending; not deployed |
| Selection package: candidate research, scorecard, keep/adapt/replace, two alternative concept mockups | PRD §05 produced after the build at owner direction | TPL-01–12, AT-17–22 | G1 |
| Crest on the wax seal instead of typeset letters; control sizes; CSP and referrer policy; unit tests and automated AT-02; link check; CODEOWNERS | Gap audit follow-up | DES-01, DES-03, SEC-02/03, AT-02, CONTENT-06 | — |

Material changes to the foundation, hosting, crest, typefaces or approved composition require an impact note here and renewed approval at the affected gate (PRD TPL-12).
