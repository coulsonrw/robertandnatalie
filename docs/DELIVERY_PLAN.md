# Delivery plan and status

PRD v1.1 Section 15 proposes a 25-working-day baseline from approval of scope and essential inputs, excluding owner and procurement waiting time. This page maps those stages to what exists in the repository as of 21 September 2026. The wedding is 19 December 2026; the guest-launch date must be agreed against invitation distribution and the still-unset RSVP cutoff.

PRD v1.2 (22 September 2026) keeps that baseline and adds three modules outside it: the chapel-to-reception directions (CONTENT-08, P0) belong to the content and integration stage once the coordinator and the hotel confirm the route; the charity note (CONTENT-07, P1) is a small content block once the owners supply it; the gallery and guest uploads (GALLERY-01–05, ARCH-07, P1) are the largest addition and need the RSVP service deployed with object storage before uploads can open. None of the three is started; their inputs are `docs/DECISION_REGISTER.md` rows 25–27.

| Stage (PRD days) | Exit condition (PRD) | Status | Evidence / where |
|---|---|---|---|
| Inputs and preliminary architecture (1–3) | Artwork, budget, accounts, privacy direction, guest model, essential inputs, evaluation authority confirmed | **Partly done.** Artwork A1/A2 in `assets/`; repository and domain exist. Budget, RSVP hosting account, privacy direction, guest roster and evaluation authority are open. | `assets/ASSET_MANIFEST.md`, `docs/DECISION_REGISTER.md` rows 1–3 |
| Discovery and screening (4–5) | Candidate register, source/rights status, preliminary gates, three-option shortlist including custom benchmark | **Done, with a caveat.** 37-row register, gate matrix and three-option shortlist in `docs/selection/`; commercial listings could not be opened from this environment, so their gates are pending and an owner exception may be needed (TPL-03). | `docs/selection/CANDIDATE_REGISTER.md` |
| Comparative branded proofs (6–8) | Common-scope proofs, scorecard, effort comparison, G1 concept decision | **Proofs, scorecard and effort comparison done; G1 open.** Custom proofs in `docs/proofs/`; two labelled concept mockups independently reviewed in `docs/selection/proofs/`; recommendation is the custom composition; no purchase proposed. | `docs/selection/SELECTION_REPORT.md` |
| Selected-source validation and baseline (9–10) | Source acquired where approved; clean build; updated proof, scorecard, architecture, remediation; G2 sign-off | **Technically done, sign-off open.** Zero-dependency build reproduces from `npm run build`; fonts OFL; visual baseline captured; architecture recorded. Owner G2 signature not recorded. | `docs/DECISION_RECORD.md`, `docs/proofs/` |
| Core implementation (11–16) | P0 guest experience, household authorization, database, RSVP, coordinator tools operate with synthetic fixtures | **Guest experience done; service implemented as a reference, not deployed.** Static site complete with entry flow, hero, Wedding Day, Travel & Stay, Questions, RSVP wizard against the API contract, three synthetic households. Backend reference implementation with tests in `backend/`. | `src/`, `docs/RSVP_API_CONTRACT.md`, `backend/README.md` |
| Content and integration (17–19) | Approved content and roster import tested; directions, calendar, email verified; essential links signed off | **Open.** Content is drafted and flagged in the approval register; no roster; calendar files generated but not validated on devices; email provider not chosen. | `docs/CONTENT_APPROVAL_REGISTER.md`, `docs/RUNBOOK.md` §3 |
| QA and pilot (20–23) | Product and selection evidence complete; accessibility/security review, recovery test, six-person usability pilot pass | **Lab evidence done; pilot and manual tests open.** axe clean, budgets met, keyboard and reduced-motion proofs; no VoiceOver/NVDA sessions, no cross-browser device runs, no recovery test, no usability pilot. | `docs/evidence/`, `docs/ACCEPTANCE_TESTS.md` |
| Guest launch and handover (24–25) | G3 approval; production smoke test; monitoring, access and handover package in place | **Open.** `site.launchApproved` is false and the build reports the blockers. Runbook drafted; access register blank. | `docs/RUNBOOK.md`, `npm run build` |

## Milestones and remaining effort

Effort is the implementation team's working time; waiting time is the owners', coordinator's or a provider's and is not counted (PRD §15). Estimates are planning figures, not commitments.

| Milestone | Depends on | Implementation effort (base) | Waiting on |
|---|---|---|---|
| G1 concept decision | Selection package review | 0.5 day to walk the owners through `docs/selection/` | Owners |
| G2 production-build authorisation | Owner visual sign-off, technical-lead validation, gate table | 0.5 day to record and pin the baseline | Owners, technical lead |
| RSVP service deployed and verified | Owners' Cloudflare account, mail provider, cutoff, roster | 2–3 days: deploy, Access policy, mail provider, AT-04 to AT-13, load test, restore drill | Owners (accounts, decisions), coordinator (roster) |
| Content complete | Venue entrances/parking, room block decision, dress code, transport, contact route, retention approval | 1 day to enter, register and re-prove | Coordinator, owners, hotel |
| QA and pilot | Deployed service, complete content | 2 days: usability pilot, VoiceOver/NVDA, cross-browser, security review write-up | Six testers |
| G3 guest release | All of the above | 0.5 day: smoke test, `site.launchApproved`, `rsvp.mode` live, deploy | Owners |

Total remaining implementation effort: about 6.5–7.5 working days, against the PRD's 25-day baseline of which roughly 10 days of equivalent scope are already delivered (design, build, proofs, service implementation, documentation). Calendar time depends on the waiting-on column.

## Critical path from here

1. Owners: decisions 1–7 and 11 in `docs/DECISION_REGISTER.md` (accounts, visibility, roster, cutoff, venue details, room block, dress code and transport, retention).
2. Owners: review the selection package and record G1/G2 in `docs/DECISION_RECORD.md`.
3. Technical: deploy the RSVP service from `backend/` into the owners' Cloudflare account, set `rsvp.apiBaseUrl`, run the acceptance tests AT-04 to AT-13 against it, test a restore.
4. Coordinator: confirm entrances, parking and access notes; validate the calendar files and map links on devices.
5. Six-person usability pilot (PRD §01 outcomes), VoiceOver and NVDA sessions, cross-browser runs.
6. Record G3, set `site.launchApproved`, switch `rsvp.mode` to `live`, disable the synthetic preview, deploy.

## Risks still open (PRD §15 table)

| Risk | Control in place | Still needed |
|---|---|---|
| Crest or lettering drift | Original crest is the only source; proofs at four widths | Owner visual sign-off (G2) |
| Unconfirmed address, room block, transport | Omitted from the page; readiness report flags them; entrances become blockers when RSVP goes live | Coordinator confirmation |
| Forwarded invitation link | Token in the fragment, explicit "Open my invitation", revocation in the service | Deploy the service; explain bearer access in the invitation |
| Email delay or spam filtering | Database-backed on-screen confirmation with reference; explicit email-unavailable state | Choose and verify a sending provider |
| Overbuilt motion | Skippable envelope, reduced-motion path, static fallback, budgets measured | Owner review of the entry experience |
| RSVP change lost or overwritten | requestId idempotency and revision checks in the contract and mock | Backend deployed and AT-09/AT-10 run against it |
| Vendor or developer dependency | Owner-controlled repository, zero-dependency build, runbook | Fill the access register; owner-held Cloudflare account |
| Attractive demo, unsuitable source | No template purchased; custom benchmark built | G1 decision |
| Unlicensed assets | OFL fonts with licence texts; unverified photos excluded | Photo rights if photos are wanted |
