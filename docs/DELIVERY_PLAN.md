# Delivery plan and status

PRD v1.1 Section 15 proposes a 25-working-day baseline from approval of scope and essential inputs, excluding owner and procurement waiting time. This page maps those stages to what exists in the repository as of 24 September 2026 and carries the checklist to complete the full site. The wedding is 19 December 2026; the guest-launch date must be agreed against invitation distribution and the still-unset RSVP cutoff.

Since the previous revision (21 September 2026): the RSVP service in `backend/` was deployed into the owners' Cloudflare account on 23 September 2026 at `https://api.robertandnatalie.wedding` (`backend/README.md`, "Deployment status"; `docs/CHANGELOG.md`); the DNS zone moved to Cloudflare nameservers the same day with the apex still served by GitHub Pages; *Enforce HTTPS* has been on since 22 September. Every item below was re-verified on 24 September 2026 against the repository (HEAD `b3fd8ad`), the live site, and read-only queries of the owners' Cloudflare account.

PRD v1.2 (22 September 2026) keeps that baseline and adds three modules outside it: the chapel-to-reception directions (CONTENT-08, P0) belong to the content and integration stage once the coordinator and the hotel confirm the route; the charity note (CONTENT-07, P1) is a small content block once the owners supply it; the gallery and guest uploads (GALLERY-01–05, ARCH-07, P1) are the largest addition. The RSVP service they build on is deployed, but object storage is not: R2 is not enabled on the owners' Cloudflare account and the Worker has no R2 binding, and Cloudflare Access (needed for moderation) is not enabled either. None of the three modules is started; their inputs are `docs/DECISION_REGISTER.md` rows 25–27.

## Checklist to complete the full site (24 September 2026)

`[x]` done and verified on 24 September 2026 · `[~]` partly done · `[ ]` open. **Launch** marks a condition of the release gate (PRD RELEASE-01) or an `npm run build` blocker: the site cannot open to guests without it. Evidence names the file, command, workflow run or probe.

### A. Done and verified

| | Item | Evidence |
|---|---|---|
| [x] | Static site live on GitHub Pages at `https://robertandnatalie.wedding`; `www` and `http://` redirect to the apex over HTTPS (*Enforce HTTPS* on since 22 September); `noindex, nofollow` on every page; canonical links; custom 404 page served with a 404 status; no `robots.txt` or sitemap by design | Probes 24 Sep: `/` 200 `server: GitHub.com`; `http://` and `www` → 301; unknown path → 404; deploy run 9 job summary `https_enforced=true` |
| [x] | Live build is `main` (`b3fd8ad`) built with `SITE_PREVIEW=0`: synthetic preview disabled, `/story-preview.html` absent | Byte-identical to a local `SITE_PREVIEW=0 npm run build`; live `last-modified` 23 Sep 20:13 UTC |
| [x] | DNS zone on Cloudflare nameservers (moved 23 September, 18:05 UTC); apex A records and `www` CNAME left unproxied; "Check the custom domain" workflow passed after the move | Cloudflare zone `active`; workflow runs 5 and 6 on 23 September (success); PR #6 |
| [x] | RSVP service deployed: D1 `rsvp` (migrations 0001–0002, two events seeded, no guest data), `CREDENTIAL_PEPPER` and `SESSION_SECRET` set, Worker `robertandnatalie-rsvp-api` on `api.robertandnatalie.wedding`, cron `*/5 * * * *` (confirmed through the API on 24 September), `workers.dev` off, observability on | `GET /health` → `200 {"ok":true,"environment":"production"}`; `backend/README.md` "Deployment status" |
| [x] | Service fails closed and answers the site: `/admin/status` → 401 from the Worker; `GET /session` → 401 `invalid_session`; CORS preflight from `https://robertandnatalie.wedding` → 204 with credentials allowed; every guest and admin response `Cache-Control: private, no-store` | Probes 24 Sep |
| [x] | Automated tests and lab evidence current with the last UI change (`16c8492`, 22 September): site `npm test` 12/12, backend 71/71, axe 0 violations at four widths, performance budgets met, proofs at 320/390/768/1440 | `docs/TEST_RESULTS.md`, `docs/evidence/`, `docs/proofs/README.md` |
| [x] | CI validates every pull request (site build and backend suite); `deploy.yml` publishes `main`; `domain-check.yml` runs on demand | `.github/workflows/`; CI run 55 (23 September) success |
| [x] | Calendar files served as `text/calendar` with `TZID=America/Chicago` starts at 14:00 and 16:00 and no invented end; external links from the built pages respond (checked from the GitHub runner on 23 September; those hosts are blocked from the build environment) | `/calendar/*.ics` probes; `scripts/linkcheck.mjs` |

### B. Owner decisions (Robert / Natalie)

Each row names the decision-register row and the field that receives the value. Nothing is entered until the owners decide (stop rules in `AGENT_START_HERE.md`).

| | Decision | Register | Lands in | Launch |
|---|---|---|---|---|
| [ ] | RSVP cutoff (ISO 8601 with the event-local offset, e.g. `2026-11-20T23:59:59-06:00`) and the private contact route for exceptions | 4, 20 | `rsvp.cutoffAt` **and** `RSVP_CUTOFF_AT` on the deployed Worker (DATA-01 pair); `contact.email` / `contact.phone` | Launch (two build blockers) |
| [ ] | Name Cloudflare (Workers and D1, in the owners' account) as the RSVP provider; approve the 90-day retention; decide the attendance keepsake exception and its fields | 11, 24 | `privacy.rsvpProvider`, `privacy.approval`; `scripts/templates/privacy.mjs` wording | Launch (build blocker) |
| [ ] | Visibility of the logistics pages (currently public with `noindex`) and credential delivery: personal link or printed code, and the channel it travels by | 2, 14 | `docs/DECISION_RECORD.md` visibility row; `site.noindex`; `deploy.yml` (keep public review builds or switch to manual deploys) | Launch (RELEASE-01) |
| [ ] | Invitation-posting date, RSVP opening date and cutoff, agreed together with the coordinator | 16, 21 | `rsvp.opensAt`; this page | Launch |
| [ ] | Day-to-day operator, support owner, incident contact and second person; the owner and coordinator email identities that will log in to `/admin` | 20 | `docs/RUNBOOK.md` §11–12; `OWNER_EMAILS`, `COORDINATOR_EMAILS`, `COORDINATOR_EMAIL` | Launch |
| [ ] | Transactional mail provider and sending identity (RSVP-07); the coordinator alert address. The deployed Worker runs the `stub` provider: confirmations and coordinator alerts are marked sent and never delivered | 11 | `MAIL_PROVIDER`, `MAIL_FROM`, `COORDINATOR_EMAIL`; `MAIL_WEBHOOK_*` secrets | Launch (RELEASE-01 "email works") |
| [ ] | Children and plus-one policy; meal questions (none configured; the service supports them since migration 0002) | 3, 7 | roster entitlements; `faqs[who-is-invited]`; `rsvp.mealChoices` | Launch (policy) |
| [ ] | Dress code; transport between venues; room block or general hotel information only | 6, 7 | `faqs[attire]`, `travel.betweenVenues`, `travel.hotel.roomBlock` | Review items |
| [ ] | Approve the draft content blocks (venue-change note, FAQs, hotel, getting there, privacy) and confirm the title-case invitation lines | 13, 17 | `approval` objects in `content/site.config.json`; `npm run register` | Launch (no draft labels, RELEASE-01) |
| [ ] | G1 concept and G2 production-build sign-off, including the envelope composition and the typeface proof; record the commit hash at G2 | 8, 9, 10, 12 | `docs/DECISION_RECORD.md` approvals table | Launch (RELEASE-01) |
| [ ] | Expected guest count (sets the load-test target); budget and operator; where PRD v1.0 and the Word PRD are held | 1, 15, 19 | this page; `AGENT_START_HERE.md` | — |
| [ ] | Charity in lieu of gifts: publish or not, charity, official link, wording, verification date (CONTENT-07, P1) | 26 | new `gifts` block | — |
| [ ] | Gallery and guest uploads: visibility, storage (enable R2 or name a provider), upload window, limits, moderator, keepsake retention, photographer licence (GALLERY-01–05, P1) | 25 | new `gallery` block; `backend/` | — |
| [ ] | Our Story: publish or not, copy, photographs with rights (optional P1) | 22 | `story.*`; `docs/OUR_STORY_INTAKE.md` | — |

### C. Owner account actions (Cloudflare, GitHub, registrar)

| | Action | Why | Launch |
|---|---|---|---|
| [ ] | Turn on two-factor authentication on the Cloudflare account and add a second administrator | The account's only member is a Super Administrator without 2FA (members API, 24 September); it holds the DNS zone, the Worker, the guest database and the API token (ADMIN-01; `docs/RUNBOOK.md` §12) | Launch |
| [ ] | Enable Zero Trust (Access) on the account and choose the team domain; then create the self-hosted Access application for `api.robertandnatalie.wedding/admin*` with an Allow policy for the named owner and coordinator accounts and an MFA rule; hand over the AUD tag and team domain | Access is not enabled (`access.api.error.not_enabled`, 24 September), so `backend/README.md` step 6 cannot start; the deployment token has no Access write scope, so this is a dashboard task. Every `/admin` route, including the roster import, is refused until then | Launch |
| [ ] | Extend the deployment API token beyond 31 December 2026 and narrow its permissions to D1, Workers Scripts, and zone Workers Routes and DNS | The retention job first applies on 20 March 2027 (`backend/src/retention.js`: wedding date + 90 + 1 days); exports, redeploys and the post-event close need the token after 31 December. It currently holds broad account permissions | Before 31 December |
| [ ] | Confirm the domain registration's expiry and auto-renew past March 2027 and record the registrar in `docs/RUNBOOK.md` §12 | The registrar is not Cloudflare (the zone was delegated from iwantmyname nameservers; Cloudflare Registrar lists no domains); a lapse would stop the site, the API and mail at once | Launch |
| [ ] | GitHub: MFA on the owner account; decide who may push to `main`; consider branch protection that requires the CI checks | Every push to `main` deploys to the public domain, and CI runs only on pull requests | Launch |
| [ ] | Mail identity for `rsvp@robertandnatalie.wedding`: SPF, DKIM and DMARC records, a reply route (Email Routing or a mailbox), and the provider named in the privacy notice | `MAIL_FROM` is preset to that address; the zone has no MX or TXT records, so mail from any provider would fail authentication and replies would bounce | Launch (with the mail decision) |
| [ ] | Enable R2 on the account only if gallery uploads are wanted before the wedding | R2 is not enabled (API code 10042); the gallery can otherwise wait for the post-event phase | — |

### D. Coordinator inputs

| | Input | Register | Launch |
|---|---|---|---|
| [ ] | Household roster CSV in the documented columns (`backend/README.md`, runbook table): households, named guests, plus-one slots, children as named invitees, event entitlements | 3 | Launch (RELEASE-01 "guest list reconciled") |
| [ ] | Chapel and hotel: exact address, entrance, arrival, parking, accessibility notes | 5 | Launch (becomes a build blocker once `rsvp.mode` is `live`) |
| [ ] | Chapel-to-reception route with The Grand Hotel: drop-off point (valet or attended), guest parking (location, charge, accessible spaces), walking route and reception room with accessible route, map destination for each, whether a shuttle runs (CONTENT-08, P0) | 27 | Launch (P0; see the site task in F) |
| [ ] | Verify the hotel telephone and travel guidance against the hotel's pages, and December 2026 air service for MOB, PNS and JKA | 18, 23 | Review items |
| [ ] | Import both calendar files in Apple Calendar, Google Calendar and Outlook; open the map links on iOS and Android; record in `docs/TEST_RESULTS.md` (AT-14) | — | Launch (RELEASE-01 "maps and calendars work") |
| [ ] | Open every external link (hotel, Getting Here, chapel, both map links) from an unrestricted network before invitations go out (runbook §3) | 18 | Launch (runbook §3) |

### E. Service configuration and tests (implementation team; after C and D)

| | Task | Depends on | Launch |
|---|---|---|---|
| [ ] | Set `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `OWNER_EMAILS`, `COORDINATOR_EMAILS`, `RSVP_CUTOFF_AT`, `COORDINATOR_EMAIL`, the mail variables and secrets; redeploy; prove that Access blocks `/admin/status` before the Worker and that one owner login passes the JWT check (confirm header, claims and certificate URL against current Cloudflare documentation) | C (Access); B (cutoff, emails, mail) | Launch |
| [ ] | Staging Worker with its own D1 (`ENVIRONMENT=development`, `ACCESS_DEV_BYPASS=true`, synthetic households only): the environment for every test below | — | Launch |
| [ ] | AT-04 to AT-10, AT-12 and AT-13 (synthetic CSV) on staging; AT-11 once the mail provider exists; each recorded with date and operator in `docs/TEST_RESULTS.md` | staging; B (mail) | Launch (P0 tests) |
| [ ] | Browser end-to-end run of the real front end (`src/js/rsvp.js` with `rsvp.mode: live`) against staging: session cookie on the `api.` host, CORS with credentials, CSP `connect-src`, link-token exchange, `409 conflict` and `423 closed` states. Never exercised; CORS is verified by curl only | staging | Launch (RELEASE-01 smoke test) |
| [ ] | Load test: p95 ≤ 1.5 s at 50 concurrent sessions (NFR; target from the guest count) and the cross-household cache test (ARCH-04) | staging; B (guest count) | Launch |
| [ ] | Restore drill: export → second database → staging Worker, same revision and reference; revoke and reissue one credential; roll back one content change; enter one coordinator-phone response (AT-16) | staging; C (Access) for revoke and fallback | Launch (RELEASE-01 "recovery tested") |
| [ ] | Daily `wrangler d1 export` scheduled from an owner-controlled place, stored encrypted, deleted after 30 days (SEC-06) | B (operator) | Launch |
| [ ] | Monitoring: external uptime check on `https://robertandnatalie.wedding/` and `GET https://api.robertandnatalie.wedding/health` (HEAD returns 404) alerting the incident contact; a Cloudflare notification policy for Worker errors (an email destination is already eligible; no policy exists) | B (incident contact) | Launch (runbook §11) |
| [ ] | Confirm the Workers log retention against SEC-06 and whether the privacy notice should mention platform logs (invocation logs persist at 100% sampling; the Worker's own log line drops query strings and masks tokens) | — | Review |
| [ ] | Add a readiness item for the chapel-to-reception directions: review while `rsvp.mode` is `coming-soon`, blocker when `live` (CONTENT-08 is P0 but `npm run build` does not check it, so G3 could be recorded without it) | — | Launch |
| [ ] | Re-run `scripts/events-sync.mjs` on the service whenever the events change in `content/site.config.json` (DATA-01) | — | — |

### F. Content, front end and release (G3)

| | Task | Depends on | Launch |
|---|---|---|---|
| [ ] | Enter the coordinator's venue details and approvals; `npm run register`; re-run proofs after content changes | D | Launch |
| [ ] | Build the directions module (CONTENT-08): per-destination fields on the reception event, rendered on the card, the "getting between venues" FAQ and `calendar/reception.ics` from one source; AT-25 test; 320 px and print proof (medium) | D (row 27) | Launch |
| [ ] | Invitation insert wording: the site address, that the personal link or code is private and must not be forwarded, how to enter a code, when responses open and close, the contact route | B | Launch |
| [ ] | Import the roster on production (preview, then commit; AT-13 recorded); issue one link (shown once) or code per household; merge into the printed invitations; custody of the one-time list and reissue handling | C (Access), D (roster) | Launch |
| [ ] | Six-person usability pilot (5 of 6 find the ceremony in ≤ 15 s and finish a response in ≤ 3 min), VoiceOver and NVDA sessions, cross-browser and device matrix, print check of the guest pages — on a review build pointed at staging (the CI `site-review-build` artifact from 23 September expires 7 October) | E | Launch (RELEASE-01) |
| [ ] | Switch `content/site.config.json`: `rsvp.mode: live`, `rsvp.apiBaseUrl: https://api.robertandnatalie.wedding`, `rsvp.cutoffAt` (= `RSVP_CUTOFF_AT`), `rsvp.opensAt`, `privacy.rsvpProvider`, `contact.*`, `rsvp.allowPreview: false`; approve the blocks; `npm run register` | B, E | Launch |
| [ ] | Handover package (OPS-01): incident contact and access register in `docs/RUNBOOK.md` §11–12 (GitHub, registrar, Cloudflare account, API token, mail provider), the approved secure channel for secrets, a dated `docs/TEST_RESULTS.md`, and a decision on the identifiers printed in the public repository | B, C | Launch |
| [ ] | Owners sign G3; set `site.launchApproved: true` (the deploy then runs `npm run build -- --strict` and refuses while any blocker remains); merge and deploy; run "Check the custom domain" and record the date and operator; smoke-test one synthetic household on production and revoke it | all of the above | Launch |

### G. After launch and after the wedding

| | Task | When |
|---|---|---|
| [ ] | Runbook §3 recheck; confirm the Let's Encrypt certificate for the apex (expires 21 December 2026) has renewed; rehearse the urgent-logistics banner | Week before 19 December |
| [ ] | Close responses: `rsvp.mode: closed`; `PUT /admin/content/rsvp-settings {"open": false}`; `site.phase: post-event` with approved thank-you text (rehearse the post-event build on staging first) | 20 December |
| [ ] | Retention run (20 March 2027; needs a valid API token); delete backups on the 30-day schedule; archive the keepsake export | March 2027 |
| [ ] | Gallery (GALLERY-01–05, ARCH-07; large) and post-wedding pictures through the story pipeline; charity note (CONTENT-07; small) | After decisions 25 and 26 |

## Critical path and dates

Fixed points: wedding Saturday 19 December 2026; today 24 September 2026 (12 weeks and 2 days). The dates below work backwards from the README's example cutoff of 20 November 2026 and are planning assumptions until the owners set the real dates (rows 4, 16, 21): guests need about four weeks to respond, so invitations should be posted by about 16–19 October; printing and merging per-household credentials takes at least a week, so credentials must be issued by about 9 October; issuing needs the roster imported through a working Access application, so Access and the roster are due by about 5 October; the owner decisions that feed them are therefore due by about 2 October. Any slip moves the cutoff or shortens the guests' response window; the PRD does not allow recovering time by dropping the recovery, privacy or device tests.

1. **Owners, by 2 October (blocks everything below):** the section B decisions and the section C account actions (2FA and a second administrator, Access enablement, token, registrar, GitHub, mail identity); sign G1/G2.
2. **Owners, one dashboard session (blocks all `/admin` work):** enable Zero Trust, choose the team domain and identity provider, create the Access application with the MFA policy, hand over the AUD tag.
3. **Implementation, 1–2 days after step 2:** Worker configuration and redeploy; Access proven; staging Worker.
4. **Owners, then implementation, in parallel with 3:** mail provider and sending identity; AT-11.
5. **Implementation, 3–4 days after 3 (partly after 4):** acceptance tests on staging, browser end-to-end run, load test, restore drill, monitoring.
6. **Coordinator, now to 5 October (independent of the service):** roster, venue details, chapel-to-reception route, hotel and airport verification, calendar and map device checks.
7. **Coordinator with owners, about 5–9 October:** production roster import, credentials issued and merged into the invitations, print.
8. **Implementation and owners, about 9–16 October:** directions module, configuration switch, pilot and manual test sessions, handover package.
9. **Owners, the day the invitations are posted (about 16–19 October):** G3, `site.launchApproved`, deploy, domain check, production smoke test.
10. **Operate:** responses open on `rsvp.opensAt`; corrections after the cutoff through the Access-protected admin route; week-before recheck; post-event close on 20 December; retention on 20 March 2027.

Longest chain: owner decisions → Access → Worker configuration and staging → acceptance, load, restore and browser runs, in parallel with roster and route confirmation → credentials issued and printed → configuration switch, pilot and monitoring → G3 and deploy. Owners block steps 1, 2, 4 and 9; the coordinator blocks 6 and 7; the technical steps 3, 5 and 8 take roughly six to eight working days once unblocked.

## Stage table (PRD §15)

| Stage (PRD days) | Exit condition (PRD) | Status | Evidence / where |
|---|---|---|---|
| Inputs and preliminary architecture (1–3) | Artwork, budget, accounts, privacy direction, guest model, essential inputs, evaluation authority confirmed | **Partly done.** Artwork A1/A2 in `assets/`; repository, domain and the owners' Cloudflare account exist, and the account hosts the DNS zone and the RSVP service (23 September 2026). Budget, privacy direction, guest roster and evaluation authority are open. | `assets/ASSET_MANIFEST.md`, `docs/DECISION_REGISTER.md` rows 1–3, `backend/README.md` |
| Discovery and screening (4–5) | Candidate register, source/rights status, preliminary gates, three-option shortlist including custom benchmark | **Done, with a caveat.** 37-row register, gate matrix and three-option shortlist in `docs/selection/`; commercial listings could not be opened from this environment, so their gates are pending and an owner exception may be needed (TPL-03). | `docs/selection/CANDIDATE_REGISTER.md` |
| Comparative branded proofs (6–8) | Common-scope proofs, scorecard, effort comparison, G1 concept decision | **Proofs, scorecard and effort comparison done; G1 open.** Custom proofs in `docs/proofs/`; two labelled concept mockups independently reviewed in `docs/selection/proofs/`; recommendation is the custom composition; no purchase proposed. | `docs/selection/SELECTION_REPORT.md` |
| Selected-source validation and baseline (9–10) | Source acquired where approved; clean build; updated proof, scorecard, architecture, remediation; G2 sign-off | **Technically done, sign-off open.** Zero-dependency build reproduces from `npm run build`; fonts OFL; visual baseline captured; architecture recorded. Owner G2 signature not recorded. | `docs/DECISION_RECORD.md`, `docs/proofs/` |
| Core implementation (11–16) | P0 guest experience, household authorization, database, RSVP, coordinator tools operate with synthetic fixtures | **Guest experience done; service deployed, not yet verified end-to-end.** Static site complete with entry flow, hero, Wedding Day, Travel & Stay, Questions, RSVP wizard against the API contract, three synthetic households. The service in `backend/` (71 tests) is deployed at `https://api.robertandnatalie.wedding` with no guest data; the Access application, admin accounts, mail provider, cutoff and the acceptance runs AT-04 to AT-13 remain (sections C and E). | `src/`, `docs/RSVP_API_CONTRACT.md`, `backend/README.md` "Deployment status" |
| Content and integration (17–19) | Approved content and roster import tested; directions, calendar, email verified; essential links signed off | **Open.** Content is drafted and flagged in the approval register; no roster; calendar files generated and validated at file level but not on devices; mail provider not chosen; chapel-to-reception directions (CONTENT-08) not supplied. | `docs/CONTENT_APPROVAL_REGISTER.md`, `docs/RUNBOOK.md` §3 |
| QA and pilot (20–23) | Product and selection evidence complete; accessibility/security review, recovery test, six-person usability pilot pass | **Lab evidence done; pilot and manual tests open.** axe clean, budgets met, keyboard and reduced-motion proofs; no VoiceOver/NVDA sessions, no cross-browser device runs, no recovery test, no load test, no browser run against the deployed service, no usability pilot. | `docs/evidence/`, `docs/ACCEPTANCE_TESTS.md`, `docs/TEST_RESULTS.md` |
| Guest launch and handover (24–25) | G3 approval; production smoke test; monitoring, access and handover package in place | **Open.** `site.launchApproved` is false and the build reports five blockers. Runbook drafted; access register and incident contact blank; no uptime monitor or notification policy. | `docs/RUNBOOK.md`, `npm run build` |

## Milestones and remaining effort

Effort is the implementation team's working time; waiting time is the owners', coordinator's or a provider's and is not counted (PRD §15). Estimates are planning figures, not commitments.

| Milestone | Depends on | Implementation effort (base) | Waiting on |
|---|---|---|---|
| G1 concept decision | Selection package review | 0.5 day to walk the owners through `docs/selection/` | Owners |
| G2 production-build authorisation | Owner visual sign-off, technical-lead validation, gate table | 0.5 day to record and pin the baseline | Owners, technical lead |
| RSVP service verified (deployed 23 September 2026) | Zero Trust enabled and the Access application, mail provider, cutoff, roster | 1.5–2.5 days: Worker configuration, staging Worker, AT-04 to AT-13, browser end-to-end run, load test, restore drill, monitoring | Owners (Access, decisions), coordinator (roster) |
| Content complete | Venue entrances/parking, chapel-to-reception route, room block decision, dress code, transport, contact route, retention approval | 1.5 days to enter, register and re-prove, including the directions module (CONTENT-08) and its test | Coordinator, owners, hotel |
| QA and pilot | Access application (for the roster on the deployed service), complete content | 2 days: usability pilot, VoiceOver/NVDA, cross-browser, print check, security review write-up | Six testers |
| G3 guest release | All of the above | 0.5 day: smoke test, `site.launchApproved`, `rsvp.mode` live, deploy | Owners |

Total remaining implementation effort: about 6–7 working days (the previous 6.5–7.5 less the completed deployment step, plus the directions module), against the PRD's 25-day baseline of which roughly 10 days of equivalent scope are already delivered (design, build, proofs, service implementation and deployment, documentation). Calendar time depends on the waiting-on column.

## Risks still open (PRD §15 table)

| Risk | Control in place | Still needed |
|---|---|---|
| Crest or lettering drift | Original crest is the only source; proofs at four widths | Owner visual sign-off (G2) |
| Unconfirmed address, room block, transport, chapel-to-reception route | Omitted from the page; readiness report flags them; entrances become blockers when RSVP goes live | Coordinator confirmation; a readiness item for the route (section E) |
| Forwarded invitation link | Token in the fragment, explicit "Open my invitation", revocation in the deployed service | Explain bearer access in the invitation insert; exercise revocation (AT-16) |
| Email delay or spam filtering | Database-backed on-screen confirmation with reference; explicit email-unavailable state; outbox with retries and coordinator alert | Choose and verify a sending provider; SPF, DKIM and DMARC for the sending address (the deployed `stub` provider delivers nothing) |
| Overbuilt motion | Skippable envelope, reduced-motion path, static fallback, budgets measured | Owner review of the entry experience |
| RSVP change lost or overwritten | requestId idempotency and revision checks in the contract, mock and deployed service (unit-tested in workerd) | AT-09/AT-10 against staging; production D1 batch atomicity observed |
| Vendor or developer dependency | Owner-controlled repository, zero-dependency build, runbook, owner-held Cloudflare account (verified 23 September 2026) | Fill the access register (Cloudflare account, DNS zone, API token expiring 31 December 2026, registrar) |
| Account compromise or lock-out | Deny-by-default admin routes; secrets only in the Worker; token expiry | 2FA and a second administrator on the Cloudflare account; GitHub MFA and push rules; token narrowed and renewed |
| Domain lapse | — | Registrar renewal confirmed past March 2027; registrar recorded in the access register |
| Attractive demo, unsuitable source | No template purchased; custom benchmark built | G1 decision |
| Unlicensed assets | OFL fonts with licence texts; unverified photos excluded | Photo rights if photos are wanted |
