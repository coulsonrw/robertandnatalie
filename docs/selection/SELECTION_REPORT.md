# Selection report — design foundation for the Robert and Natalie wedding website (PRD v1.1 §05)

**Prepared:** 2026-09-21. **Prepared by:** implementation agent. **Role of this document:** the agent's recommendation and evidence summary for the owners' G1 review (TPL-11). **It records no approval.** Robert and Natalie, or their recorded delegate, approve; the decision-record block in §9 is blank until they do.

Companion documents in `docs/selection/`: `CANDIDATE_REGISTER.md` (37 rows, gate matrix, search record), `SCORECARD.md` (weighted evaluation), `KEEP_ADAPT_REPLACE.md` (maps, effort, costs), `proofs/alt-a-editorial-heritage/` and `proofs/alt-b-couple-template/` (concept proofs). The custom benchmark's working proof is `docs/proofs/` with audits in `docs/evidence/`.

---

## 1. Recommendation (TPL-08)

**Recommend the custom component-based composition (C01) as the design foundation.** No template offers a material, explained net advantage after adaptation and risk:

1. **Fit.** The PRD's binding visual requirements (live-text invitation with the original-colour crest, exact §06 wording, gold script names, charcoal informational text, same-size closing line, no crimson, DES-01 tokens) are met by C01 today and are captured at 320/390/768/1440 px. Every external candidate would have its invitation section built new (`KEEP_ADAPT_REPLACE.md` §5), so the one area a template could most plausibly help with is the one area none of them supplies.
2. **Guest system.** The RSVP boundary (TPL-06) means no template contributes household authorisation, atomic saves, idempotency, revision handling, confirmation or coordinator reporting. That work is common to every path (28 / 48 / 84 hours plus owner decisions) and is charged equally; it is never a template saving. C01 already has the front end for it and a tested reference service awaiting deployment.
3. **Evidence.** C01 is the only candidate with all five scorecard criteria evaluated on measured proofs (80 / 100). The two concepts are provisional ranges (alt-b 61–71, alt-a 54–64) and, more importantly, are compositions on the same foundation rather than foundation alternatives. The seven retained external candidates are entirely blank (0–100) because no listing, demo, licence or source could be opened from the research environment.
4. **Effort and cost.** Remaining effort is lowest for C01 (78 / 132 / 224 h) and there is nothing to license. The best-described external candidate (C03 Marriage) would cost more in every scenario (163 / 260 / 418 h plus USD 39, publisher claim) with high uncertainty because its stack and licence are unread.
5. **Risk.** Custom composition keeps the owner-controlled, zero-dependency static build and GitHub Pages deployment already in the repository; a template would introduce a second build system, unread licence obligations and demo-asset removal for no identified gain.

**What the owners are actually being asked to decide at G1 (three questions, not one):**

| G1 question | Options | Agent's note |
|---|---|---|
| A. Foundation | C01 custom; or authorise a named purchase so an external candidate's gates can be run | Recommend C01. Owners may prefer a passing option with a recorded rationale (TPL-08); none currently passes, so a purchase approval would be a step toward evaluation, not a selection. |
| B. Composition (concept) | C01's current composition (`docs/proofs/`); alt-a editorial two-column (`C36`); alt-b full-width hero with timeline strip and phone RSVP bar (`C37`) | Any of the three can be implemented on the C01 foundation. Alt-a and alt-b are untested concept sketches; choosing one adds ≈ 60–64 base hours (`KEEP_ADAPT_REPLACE.md` §3–§4). |
| C. Procurement | not applicable for C01/C36/C37 | Record "not applicable" per TPL-11 unless the owners choose A-purchase. |

The preferred starting hypothesis in the PRD (a bespoke invitation over reusable components) is confirmed by the evidence, but it was not treated as a predetermined winner: the external sweep was run, recorded and screened, and its results are retained including the rejected rows.

---

## 2. Search date and method (TPL-03)

- **Date:** 2026-09-21 (both research sweeps; register, scorecard and this report written the same day).
- **Sweep 1 — commercial marketplaces and studios:** 40 web-search queries covering ThemeForest, Envato Elements, Gumroad, Creative Market, TemplateMonster, astro.build, Lexington Themes, TailTemplate, Wrapmarket, Framer, Webflow, Cosmic, Colorlib, plus product-specific queries (Mawhub, Marriage, Northbound, Forever, Dahlia, Modern Wedding Website Kit, Mylove, Wedding Event, Ever After, Afair, Loveshare, Elegance, TwoHearts). Fetch attempts on every listing, demo and licence page. **Result:** all commercial hosts returned `EGRESS_BLOCKED`; only the Forever Lite raw README on `raw.githubusercontent.com` was opened.
- **Sweep 2 — open-source repositories:** GitHub searches for couple wedding sites, invitation templates and starters in React/Next.js/Astro/Vite; raw `LICENSE`, `README` and `package.json` reads and commits pages where reachable; GitHub API for `pushed_at`, stars and licence SPDX ids. Thirteen repositories recorded (`C23`–`C35`); the sweep's record was **truncated mid-entry at C-13**, so any later repositories it screened are missing.
- **Example PRD search terms used:** "couple wedding invitation React source", "Astro wedding website template premium buy invitation RSVP", "accessible" starters with design tokens; "editorial heritage event template" returned no distinct editorial-hospitality product beyond C04, which is why the editorial category is represented by the alt-a concept.
- **Exact links:** recorded per row in `CANDIDATE_REGISTER.md` §1 and §3.
- **Purchases:** none made; none recommended.

---

## 3. Source, licence and build validation performed on the custom benchmark (TPL-06, AT-18)

| Check | Command / action | Result | Label |
|---|---|---|---|
| Source revision | `git rev-parse HEAD` | `7f8d326186ec5ab18f7c7fa2a7fca05e15658859` | verified |
| Runtime | `node --version` | v22.22.2 | verified |
| Clean build | `npm run build` from the repository root, no `npm install` | "Built dist/ — 2 events, 4 published FAQs, rsvp mode "coming-soon"." Output: `404.html`, `CNAME`, `calendar/ceremony.ics`, `calendar/reception.ics`, `celebration.html`, `fonts/`, `img/`, `index.html`, `js/`, `privacy.html`, `rsvp.html`, `styles/`. Readiness report: **5 blockers, 22 review items, 2 info** (listed in §7). | verified (run 2026-09-21) |
| Dependencies | `package.json` | no `dependencies` or `devDependencies`; `"license": "UNLICENSED"`, `"private": true` | verified |
| Font licences | `ls docs/licenses/` | `OFL-Cormorant-Garamond.txt`, `OFL-Cormorant-SC.txt`, `OFL-Pinyon-Script.txt` | verified (present; SIL OFL 1.1 per manifest) |
| Crest provenance | `assets/ASSET_MANIFEST.md` | renditions derived from A1 by edge flood-fill and proportional resize; A2 used as visual reference only | verified (manifest read) |
| Visual proof | `docs/proofs/README.md` + images | 47 captures at `7f8d326` (recounted at review; 48 was wrong), 2026-09-21T23:11Z, Chromium 141.0.7390.37; no horizontal overflow at 21 page/width pairs including 200 % text; entry flow, keyboard order, reduced motion, decline-all and private-link checks recorded | verified (README read; six images viewed) |
| Accessibility audit | `docs/evidence/ACCESSIBILITY.md` | axe-core 4.10.2: 0 violations, 14 states × 2 viewports; structural checks clean; 113 "needs review" contrast nodes on gradient/texture backgrounds | verified (file read; not re-run) |
| Performance audit | `docs/evidence/PERFORMANCE.md` | 5 cold throttled runs: LCP 1484 ms / 1204 ms medians, CLS 0.000, interaction ≤ 72 ms, JS 13.2 kB gzip — within §13 budgets | verified (file read; not re-run) |
| Backend reference | `backend/README.md` | 44 Vitest tests pass in workerd (wrangler 4.124.0, vitest 4.1.11) — **not deployed** | publisher claim (not re-run here) |
| Live deployment | https://robertandnatalie.wedding | not opened from this session | not verified |

Timing note: the `npm run build` above ran at 2026-09-21T23:40:51Z on the working tree at HEAD `7f8d326` (only `docs/selection/proofs/alt-b-couple-template/` untracked at that moment). At 23:50:21Z other agents in the same workflow modified `package.json`, `scripts/build.mjs`, `scripts/templates/*.mjs`, `src/js/site.js`, `src/styles/site.css` and the workflows, and added `docs/TRACEABILITY.md`, `scripts/linkcheck.mjs`, `scripts/test.mjs` and `.github/CODEOWNERS` (103 insertions, 22 deletions per `git diff --stat`). This package did not evaluate those changes. The clean-build record must be re-run on a committed revision before G2 (TPL-06), and `docs/proofs/` should be re-captured if the templates or stylesheet changed.

Independent-review addendum (2026-09-21, second agent): HEAD is now `1fd1aa3` (docs-only commit adding `docs/PRD_GAP_ANALYSIS.md`); the uncommitted changes above are still uncommitted; `package.json` in the working tree now declares `devDependencies: { playwright: ^1.56.1 }`, so the "no `dependencies` or `devDependencies`" row above is true of `7f8d326` only; and `docs/proofs/` has been re-captured in the working tree (28 PNGs modified, `invitation-text-200pct-1440.png` deleted, `CHECKLIST.md` added) by a run this package did not evaluate. The scored captures are the committed files at `7f8d326`. Full record: `CANDIDATE_REGISTER.md` §6.

---

## 4. The owner's request of 2026-09-21 — status

### 4.1 "The landing page should be the envelope that opens to show the invite; the next click takes the user to the main site and the invitation moves to the lower-left corner and can be brought back centred and zoomed with a click."

| Proof | Implemented? | Evidence | Open points |
|---|---|---|---|
| C01 custom (working) | **Yes, tested in lab.** Sealed envelope at `/` → seal opens → invitation centred → "Continue to the website" or tapping the card → site with the invitation docked lower-left (39×108 px at 390, 98×160 px at 1440) → tapping the keepsake (or "View the invitation") returns it centred and enlarged in a native modal dialog; Escape/close/backdrop sends it back. Skip links and RSVP are visible before the animation; deep links and `/celebration.html` bypass the envelope; reduced motion shows the invitation statically; no-JS renders the invitation inline. | `docs/proofs/entry-envelope-*.png`, `entry-opened-*.png`, `entry-site-keepsake-*.png`, `entry-dialog-*.png`, `README.md` entry-flow log; `docs/evidence/ACCESSIBILITY.md` states `home-sealed/open/entered/dialog` all axe-clean with focus management recorded | Owner review of the entry experience; keepsake overlaps page content in the lower-left corner on phones (a consequence of the requested placement) — accept or refine at G2 |
| C36 alt-a (concept) | Yes, as an untested sketch layered over the two-column editorial concept. | `entry-envelope-*.png`, `entry-opened-*.png`, `keepsake-docked-*.png`, `keepsake-dialog-*.png` | Docked invitation leaves the document flow; keepsake overlaps the Wedding Day heading at 390; no focus-trap test |
| C37 alt-b (concept) | Yes, as an untested sketch; adds a phone bottom RSVP bar. | `entry-envelope-*.png`, `entry-invitation-*.png`, `keepsake-docked-*.png`, `keepsake-dialog-*.png`, `capture-results.json` (entry-flow booleans all true) | Keepsake overlaps the hero at 390 and sits above the RSVP bar; whether it collapses into the bar is undecided |

All three proofs therefore present the requested flow; C01 is the only one where it has been exercised and audited. PRD HOME-03 classes opening motion as P1 and optional; the requirement that it be skippable, keyboard-operable, static under reduced motion and free of autoplay audio, confetti or forced scrolling is met in C01 (verified) and designed for in C36/C37 (not tested).

### 4.2 "Check the PRD. I think you are missing a lot."

The agent read the full PRD (604 lines) for this package. Two different things could be "missing": (a) Section 05 deliverables that had not yet been produced, and (b) product requirements outside Section 05 that are not yet satisfied. Both are tabulated below.

**(a) Section 05 required first submission (TPL-12) — coverage after this package**

| PRD item | Required | Where it now is | Gap remaining |
|---|---|---|---|
| TPL-01 pre-build stage | research → screen → score → proofs → approval → validation → build approval | This package; `docs/DECISION_RECORD.md` | Owner approvals at G1/G2 not recorded (correctly blank) |
| TPL-02 authority | crest, invitation, PRD precedence; no copying | Register §3 provenance rows; proof READMEs | — |
| TPL-03 search and shortlist | 6–8 credible incl. benchmark; 3 branded alternatives; dated links | Register §1 (eight retained incl. benchmark; eleven credible found), §4 | Credibility of unopened commercial items is a publisher-claim judgement; owners to confirm they accept it (§7 item 1) |
| TPL-04 evidence register | stable IDs, links, dates, access, revision, stack, licence, price, gates, evidence labels, exclusions | `CANDIDATE_REGISTER.md` | Open-source sweep truncated after C35 |
| TPL-05 gates | pass/pending/fail per gate | Register §2 | External rows all pending |
| TPL-06 safe licensed evaluation | inspected manifests, clean build, versions, revision recorded | §3 above for C01 | Not possible for external items until purchase approval and an unblocked network |
| TPL-07 scorecard | weights 35/20/20/15/10, anchors, rationale, evidence, blanks with ranges | `SCORECARD.md` | — |
| TPL-08 keep/adapt/replace and effort | nine areas, IDs, dependencies, removal; hours by role low/base/high; recurring cost; common backend separate | `KEEP_ADAPT_REPLACE.md` | Rates and recurring prices unknown (recorded as unknown) |
| TPL-09 three comparable proofs | same crest, wording, values, household; four proof elements; desktop + mobile; concept labels | `docs/proofs/` (C01), `docs/selection/proofs/alt-a…`, `…alt-b…` | Alt-a has no Questions block (its scope was the four TPL-09 elements); owners may want it added for like-for-like comparison |
| TPL-10 captures and tests | 320/390/768/1440, details, versions, keyboard, zoom, reduced motion, load | C01: all recorded; C36/C37: captures at four widths, keyboard and reduced-motion smoke only | C36/C37 have no zoom/reflow or load evidence and must not be described as tested |
| TPL-11 separate approvals | G1/G2/G3 distinct; no self-approval | §9 block; `docs/DECISION_RECORD.md` approvals table blank | — |
| TPL-12 decision package | register with rejections, scores, proofs, findings, maps, costs, decision record | This package | Owners to complete the record |
| AT-17–AT-22 | selection acceptance | `docs/ACCEPTANCE_TESTS.md` rows updated by reference to these files | AT-17/19/20 need the owners' review to move from "in progress" |

**(b) Product requirements outside Section 05 — what the build's own readiness report says is missing**

`npm run build` on 2026-09-21 listed five blockers and twenty-two review items. They are owner/coordinator inputs the PRD assigns in §16, not template choices, and no foundation decision changes them:

- **Blockers (5):** G3 not recorded (`site.launchApproved` false); RSVP not live (`rsvp.mode` coming-soon; no backend URL); RSVP cutoff not set; no private contact route (`contact.email`/`phone` null); RSVP provider not named in the privacy notice.
- **Review (22):** chapel and hotel entrance and parking unconfirmed (×4); synthetic RSVP preview still enabled; ceremony address carried forward; Wedding Day wording draft; banner and post-event content pending; hotel information publisher-claim only (no room block); getting-there text carried forward; between-venues transport pending; FAQ drafts (RSVP timing, who is invited, between venues, access needs) and unpublished FAQs (attire, parking, contact); contact block pending; RSVP configuration pending; privacy notice draft (retention period, provider).
- **Also open from the PRD, not surfaced by the build:** manual accessibility (VoiceOver, NVDA, 400 % reflow) and device/browser coverage (NFR-01/03, AT-15); field performance data (NFR-02); calendar files and map links on real clients (CONTENT-05, AT-14); restore and fallback tests (SEC-07, AT-16); six-person usability pilot (§01 outcomes); owner decisions 1–11 in `docs/DECISION_REGISTER.md`; typeface proof approval (DES-02); visibility decision for public logistics pages under static hosting (SEC-01 — see `docs/DECISION_RECORD.md`); a decision on whether ADMIN-04's "edit without changing code" is satisfied by config-plus-rebuild.

If the owner's remark referred to specific PRD items beyond these, the agent asks that they be named so they can be added to the register or the decision record.

---

## 5. What the three branded alternatives show (TPL-09 elements)

| Element | C01 custom (working) | C36 alt-a (concept) | C37 alt-b (concept) |
|---|---|---|---|
| Invitation opening | Sealed envelope → centred live-text invitation; crest 120/160 px; stacked gold names; RSVP and skip link in the entry bar | Two-column desktop opening (invitation panel + editorial column); single column on phones; small-caps top navigation | Full-width stationery hero with paper texture; names, date, destination, RSVP and View Wedding Day directly beneath |
| Wedding Day | Two config-driven cards, times with `datetime`, calendar and directions | Two cards under thin gold rules | Horizontal timeline strip (vertical on phones) with two cards, directions, calendar, website |
| Travel & Stay | General hotel information only; room block omitted | Same content, editorial layout | Hotel card + getting-there card |
| First RSVP screen | Working five-step wizard with the synthetic PREVIEW household (mock adapter, labelled) | Per-guest per-event choices with one error state; "Concept mockup — no working backend" | Single scrolling form with guest rows, step indicator, error summary; same label |
| Extra | Questions section, privacy page, 404, urgent banner, post-event phase | none beyond the four elements | Questions cards; phone-only sticky RSVP bar; review annotations (non-publishable) |
| Test status | Lab-tested (proofs, axe, performance) | Smoke run only; untested interactions | Smoke run with control audit; untested interactions |

Visual observations from the captures viewed on 2026-09-21 are recorded per row in `CANDIDATE_REGISTER.md` §3 (C36: name spacing at 1440 and keepsake overlap at 390; C37: two-row navigation at 390 and keepsake overlap of the hero).

---

## 6. Evidence limitations the owners should know before deciding

1. **No external product was opened.** Every commercial listing, demo and licence page was blocked by the research environment's egress proxy. External findings are search-snippet relays of publisher text. This is why the external scorecard rows are blank rather than low.
2. **Open-source sweep truncated** after C35; a re-run or the full log should be attached before G2 if the owners want the open-source category treated as exhaustively searched.
3. **Concept proofs are sketches.** Alt-a and alt-b were built in one day as original compositions to make the comparison concrete; they are not template implementations and have had no accessibility, device or performance testing.
4. **C01's evidence is lab-only.** Headless Chromium, no screen readers, no real devices, no field data; the RSVP service is not deployed, so no server-side behaviour has been exercised end-to-end.
5. **Hours are agent estimates** without rates or timesheet basis; recurring prices are unknown because no vendor pricing page was opened.
6. **Hotel telephone and getting-there text** in the config are carried-forward publisher values and are flagged for coordinator verification; they appear identically in all three proofs.

---

## 7. Unresolved findings (carried into the decision record as remediation items)

| # | Finding | Owner | Needed by |
|---|---|---|---|
| 1 | Whether unopened commercial candidates count as "screened" for TPL-03; if not, record an owner exception for a shortlist of the five verified-licence open-source items plus the benchmark | Owners | G1 |
| 2 | G1 concept choice among C01 composition / alt-a / alt-b; keepsake behaviour on phones | Owners | G1 |
| 3 | Any named purchase (item, licence, price/currency, account owner, recurring obligations) if an external evaluation is wanted; otherwise "not applicable" | Owners | G1 |
| 4 | Re-run the open-source sweep to recover the truncated record | Agent (needs unblocked network) | before G2 |
| 5 | Typeface proof approval (Pinyon Script, Cormorant Garamond, Cormorant SC) | Owners / designer | G2 |
| 6 | Owner visual sign-off of `docs/proofs/` as the baseline; capitalisation of the request lines | Owners | G2 |
| 7 | Visibility decision for public logistics pages under static hosting (SEC-01) and credential delivery method | Owners | G2 / architecture |
| 8 | Deploy the RSVP service into an owner-held Cloudflare account; choose mail provider; run AT-04–13; restore test | Technical lead | G2→G3 |
| 9 | Manual accessibility (VoiceOver, NVDA, 400 % reflow), device/browser matrix, usability pilot | QA | G3 |
| 10 | Coordinator confirmations: entrances, parking, access notes, transport, room block, contact route, cutoff | Coordinator / owners | content publication / G3 |
| 11 | Recurring costs (Pages, domain, Workers/D1/Access, mail) — supply figures or authorise vendor-page reads | Owners | G2 |
| 12 | 113 axe "needs review" contrast nodes on gradient/texture backgrounds; gold-heading contrast re-measurement | Designer / QA | G2 |
| 13 | Decide whether ADMIN-04 is satisfied by config-plus-rebuild or needs the content-versions endpoint UI | Owners / technical lead | G2 |

---

## 8. Requested next steps

1. Owners read this report, the register, the scorecard and the effort map; open the three proofs (`docs/proofs/`, `docs/selection/proofs/alt-a-editorial-heritage/`, `…/alt-b-couple-template/`) at desktop and phone widths.
2. Owners answer the three G1 questions in §1 and record them in §9 (or in `docs/DECISION_RECORD.md`), with names and dates.
3. If C01 is confirmed: technical lead schedules the G2 items (5–8, 11–13 above); no production commitment before G2 is recorded (TPL-11, AT-21).
4. If an external candidate is to be evaluated: owners approve the named purchase; the agent installs it in isolation, reruns the gates, scorecard and a branded proof, and returns to G1 with the result (TPL-06).

---

## 9. Proposed decision record (TPL-12) — blank until the owners complete it

Nothing in this block has been approved. The agent may not fill in approver names or dates (TPL-11: no self-approval).

```
DECISION RECORD — design foundation (PRD v1.1 §05)

Chosen candidate (ID and name):        ______________________________________
  Agent recommendation for reference:  C01 — custom component-based composition
Chosen composition (C01 / C36 / C37):  ______________________________________
Source revision of chosen candidate:   ______________________________________
  Benchmark revision evaluated:        7f8d326186ec5ab18f7c7fa2a7fca05e15658859
Approved visual proof (path):          ______________________________________
  Working proof available:             docs/proofs/ (captured 2026-09-21T23:11Z, Chromium 141.0.7390.37)
Reason for selection over the custom benchmark, or vice versa:
  __________________________________________________________________________
  __________________________________________________________________________

G1 — concept and procurement
  Preferred concept recorded:          ______________________________________
  Procurement:                         [ ] not applicable   [ ] named purchase approved:
      item ____________ licence ____________ price/currency ____________
      account owner ____________ recurring obligations ____________
  Approver (owner or recorded delegate): ____________________  Date: __________
  Approver (second owner, if both sign): ____________________  Date: __________
  G1 status:                           [ ] pending   [ ] approved   [ ] approved with conditions: ____________

G2 — production-build authorization
  Selected source validated (clean build, licences, gates all pass): [ ] yes  [ ] no
  All five scorecard criteria evaluated on the working proof:        [ ] yes  [ ] no
  Typefaces approved:                  ______________________________________
  Architecture approved:               ______________________________________
  Costed remediation and schedule approved: ______________________________________
  Owner visual sign-off:               ____________________  Date: __________
  Technical-lead validation:           ____________________  Date: __________
  G2 status:                           [ ] pending   [ ] approved

Remaining remediation items and owners: see SELECTION_REPORT.md §7 (items 4–13)
  Additional items recorded at approval: ____________________________________

Change control: a later change to foundation, material dependency/hosting,
paid licence, crest, typefaces or approved composition requires an impact
note, updated evidence/costs and renewed approval at the affected gate (TPL-12).
```

---

## Revalidation at the pull-request head (2026-09-22, implementation agent)

After the independent reviews, the repository was revalidated on the final branch head of pull request #1 (the exact hash is the merge commit's parent; see `git log`): `npm run check`, `npm test` (5 unit tests including the automated AT-02), `npm run build` (no runtime dependencies; `playwright` is a pinned development dependency, superseding the "no devDependencies" row in §3), `npm run proofs` (47 captures, no horizontal overflow) and `npm run audit` (0 axe violations at 320/390/768/1440, budgets met) all pass; `backend` `npm test` passes 53 tests in workerd. The corrections the reviewers made to this package, the mockups and the evidence tooling are recorded in `CANDIDATE_REGISTER.md` §6, the mockup READMEs and `docs/TEST_RESULTS.md`. No approval is recorded; §9 remains blank.

## Addendum (24 September 2026)

The RSVP service that this package describes as "not deployed" was deployed to the owners' Cloudflare account on 23 September 2026 (`backend/README.md`, "Deployment status"); the backend suite is now 71 tests. The package's findings, scores and recommendation are otherwise unchanged and are kept as the dated evidence for the G1 review.
