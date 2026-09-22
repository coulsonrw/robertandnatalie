# Change log

## PRD v1.1 (21 September 2026) — from the PRD's own revision record

| Change in v1.1 | Operational effect |
|---|---|
| New Section 05: template and design-foundation selection | Research, screen, compare, prototype and obtain approval before committing to the production design. |
| Evidence-based shortlist and weighted evaluation | Six to eight credible candidates; three branded alternatives including a custom component-based benchmark. |
| Separate concept, purchase and build approvals | A public demo does not establish source quality, licence rights or a compliant RSVP system. |
| Expanded acceptance and handover | Selection evidence, source/licence checks, proof screenshots, decision record and change control become required deliverables. |
| Reconciled delivery baseline | 25 working days proposed, excluding owner and procurement waiting time. |

Unchanged in v1.1: wedding date, venues and start times, invitation copy, original-colour crest, ivory/gold/charcoal identity, household RSVP requirements, privacy decision status, P1/P2 scope boundaries.

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
