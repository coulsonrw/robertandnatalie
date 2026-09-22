# Decision register

Owner and coordinator decisions the PRD (v1.1, Section 16) says are still required, with their current status in this repository. Approver and date are recorded only when a decision is actually made; the implementation team does not fill them in.

| # | Decision | Owner (PRD) | Required by (PRD) | Status on 21 Sep 2026 | Where it lands in the build | Approver / date |
|---|---|---|---|---|---|---|
| 1 | Domain, budget, operator and account ownership | Robert / Natalie | Kickoff | Domain `robertandnatalie.wedding` and the GitHub repository exist in the owner's account. Budget, operator and the account that will host the RSVP service are **open**. | `CNAME`, GitHub Pages settings; RSVP service account per `backend/README.md` | |
| 2 | Invitation-only visibility and credential delivery method | Robert / Natalie | Architecture approval | **Open.** Static hosting publishes logistics pages publicly (no guest data); RSVP is private by household link/code. Needs explicit approval of public logistics pages and the choice of link vs printed code. | `docs/DECISION_RECORD.md`; `content/site.config.json` → `site.noindex` | |
| 3 | Guest roster, household groupings, event entitlements, children/plus-one policy | Couple / coordinator | RSVP implementation and import | **Open.** Only the synthetic preview household exists. | Backend CSV import (`backend/`); FAQ wording `who-is-invited` | |
| 4 | RSVP cutoff and post-cutoff contact route | Couple / coordinator | Guest launch | **Open.** `rsvp.cutoffAt` is null; the cutoff FAQ avoids naming a date. | `content/site.config.json` → `rsvp.cutoffAt`, `contact` | |
| 5 | Exact chapel address/entrance; reception room/entrance; arrival, access, parking instructions | Coordinator / venues | Directions and guest launch | **Open.** Chapel address carried forward from the previous site; entrances, arrival, parking and accessibility notes are null and omitted. | `events[].venue.*` | |
| 6 | Confirmed room block or approval to show general hotel information only | Couple / hotel | Travel publication | **Open.** General hotel information only; `travel.hotel.roomBlock` is null. | `travel.hotel.roomBlock` | |
| 7 | Dress code, inter-venue transport, meal questions, any extra events | Couple / coordinator | Relevant content publication | **Open.** Attire and parking FAQs pending and unpublished; `travel.betweenVenues` pending; no meal choices configured. | `faqs[]`, `travel.betweenVenues`, backend meal configuration | |
| 8 | Three-option concept choice and any paid acquisition | Couple / recorded delegate | G1; before purchase | **Open.** Selection package in `docs/selection/` (custom benchmark plus two labelled concept mockups); no purchase proposed. | `docs/selection/SELECTION_REPORT.md` | |
| 9 | Selected foundation, source/licence checks, architecture, effort and working visual baseline | Couple / technical lead | G2; before production commitment | **Open.** Custom composition built at the owner's direction; fonts are OFL; visual baseline captured in `docs/proofs/`. Formal G2 sign-off not recorded. | `docs/DECISION_RECORD.md` | |
| 10 | Typeface proof, usable artwork, photography permissions, optional story | Couple / designer | G2 or optional-module approval | **Open.** Pinyon Script, Cormorant Garamond and Cormorant SC in use as the proof; no photography rights recorded; Our Story not supplied (omitted). | `assets/ASSET_MANIFEST.md`, `assets/review/photos-unverified/` | |
| 11 | Data recipients, retention, support ownership and post-event plan | Couple / operator | Guest launch | **Open.** Privacy notice proposes 90 days after the wedding; RSVP provider unnamed; support owner unnamed. Post-event phase switch exists (`site.phase`). | `privacy.*`, `site.phase`, `postEvent` | |

## Further decisions surfaced by the gap audit (21 September 2026)

| # | Decision | Owner | Required by | Status | Where it lands |
|---|---|---|---|---|---|
| 12 | Approve the sealed-envelope landing, docked keepsake and dialog as the HOME-03 composition and the two-action path to the full page (HOME-02/AT-03 deviation) | Robert / Natalie | G2 | Open (owner-directed on 21 Sep 2026; signature pending) | `docs/DECISION_RECORD.md` recorded deviations |
| 13 | Confirm the title-case invitation lines from the approved artwork versus the PRD's lower-case text | Robert / Natalie | G2 | Open | `content/site.config.json` → `invitation.approval` |
| 14 | Public review builds on the live domain until G3, or manual-only deployment | Robert / Natalie | Now | Open (currently public, noindex, preview off) | `.github/workflows/deploy.yml` |
| 15 | Expected guest count (planning envelope 1,000 guests / 50 sessions) | Robert / Natalie | Kickoff | Open | `docs/DELIVERY_PLAN.md` |
| 16 | Guest-launch date and invitation-distribution date, agreed with the RSVP cutoff | Robert / Natalie / coordinator | Before launch | Open | `docs/DELIVERY_PLAN.md` |
| 17 | Approve the draft content blocks (venue-change note, FAQs, hotel, getting there, privacy) | Robert / Natalie | Content publication | Open (published as drafts, flagged in the register) | `docs/CONTENT_APPROVAL_REGISTER.md` |
| 18 | Verify the hotel telephone and travel guidance against the hotel's pages (network policy blocked this here) | Coordinator | Travel publication | Open | `content/site.config.json` → `travel.hotel`, `travel.gettingThere` |
| 19 | Supply PRD v1.0 and the Word PRD for the archive, or record that they are held elsewhere | Robert / Natalie | Handover | Open | `AGENT_START_HERE.md` |
| 20 | Name the day-to-day operator, support owner and incident contact | Robert / Natalie | Guest launch | Open | `docs/RUNBOOK.md` §11 and §12 |

Waiting since 21 September 2026 for every open row.

Established and not reopened: the names, date, venue names, stated start times, closing phrase, original-color crest, and the charcoal/gold/ivory direction.
