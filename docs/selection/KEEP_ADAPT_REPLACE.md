# Keep / adapt / replace map and total effort (PRD v1.1 TPL-08)

**Prepared:** 2026-09-21. **Prepared by:** implementation agent (estimates; does not approve). **Candidate IDs:** from `CANDIDATE_REGISTER.md`.

## Scope, rates and rules used for every alternative

- **Finalists mapped here:** C01 (custom benchmark, working proof), C36 (alt-a concept), C37 (alt-b concept). **No external candidate passes the gates** (every gate is pending; no listing, demo, licence or source could be opened on 2026-09-21), so there is no external finalist. Section 5 gives a **provisional, publisher-claim-based** map for the leading external candidate (C03 Marriage) only so the owners can see the shape of a template path; it is not a finalist entry and must not be read as an inspected estimate.
- **Common backend work** (household authorisation, server-side RSVP, mail outbox, coordinator tools, retention, backups) is **identical for every alternative** and is shown in its own block. Per TPL-08 it is **never counted as a template saving**: no candidate above supplies any of it. C01's `backend/` reference implementation exists and has local tests, but it is not deployed, so its deployment and acceptance effort is charged equally to every alternative.
- **Rates:** the PRD requires the same rates for all alternatives. No hourly rates are recorded because none has been supplied by the owners; effort is shown in **hours by role** with **low / base / high** assumptions. Roles: **D** designer, **FE** front-end developer, **BE** backend developer, **QA** QA/accessibility tester, **TL** technical lead, **CO** coordinator/content owner. Hours are estimates by the agent on 2026-09-21; there is no timesheet basis for them.
- **Two views:** View A is *remaining effort from 2026-09-21* (decision-relevant for G1/G2). View B is an *equal-scope front-end build estimate as if starting from zero*, so that C01's already-built state is not silently treated as free. View B is an estimate only.
- **Prices:** dated, sourced prices only; unknowns are recorded as **unknown**, never as zero.
- **Retention period for recurring cost:** SEC-06 proposes deleting live guest data 90 days after the wedding (2026-12-19 + 90 days = 2027-03-19) with provider backups ageing out within a further 30 days (2027-04-18). Recurring costs are therefore counted from launch to **2027-04-18**; the owners have not yet approved this period.

Requirement-ID families used in the maps: invitation HOME-01–04, DES-01–04; navigation IA-01/02; events CONTENT-02/05, DATA-01; travel CONTENT-03/06; FAQs CONTENT-04/06; RSVP interface RSVP-01–07, HOME-04; access layer RSVP-01, SEC-01–03, ARCH-01/02/04, IA-02; coordinator tools ADMIN-01–04, ARCH-03, RSVP-07, SEC-05–07, DATA-02; content editing CONTENT-06, ADMIN-04, DATA-01, OPS-02/03.

---

## 1. Common backend work (charged equally to every alternative)

| Item | State on 2026-09-21 | Work | Requirement IDs | Dependencies |
|---|---|---|---|---|
| RSVP service (Worker + D1) | Reference implementation in `backend/` with migrations, session/response/snapshot endpoints, admin routes, mail outbox, retention job; 44 tests pass locally in workerd (publisher claim of `backend/README.md`, not re-run here). **Not deployed.** | Create the owners' Cloudflare account, D1 database, secrets, custom subdomain `api.robertandnatalie.wedding`, cron trigger; seed events from `content/site.config.json`; deploy. | RSVP-01–07, DATA-01/02, ARCH-01–04, SEC-02/03/06/07 | Owner-held Cloudflare account (decision register #1); DNS zone location; RSVP cutoff decision (#4) |
| Owner/coordinator authentication | Cloudflare Access JWT verification written; Access application not created. | Create the Access application on `/admin`, named accounts, MFA policy; copy AUD/team domain into `wrangler.toml`; confirm header/claim names against current Cloudflare documentation (not verified — docs host unreachable from the build environment). | ADMIN-01, SEC-03 | Owner accounts named |
| Mail provider | Provider adapter interface (`stub`, `webhook`); no provider chosen; no sending identity. | Choose provider; verify sending domain; connect adapter; test RSVP-07 states. | RSVP-07, ARCH-03, SEC-04 | Owner decision on provider and sending address (decision register #11) |
| Roster import, reports, exports, corrections | Endpoints and tests exist in `backend/src/admin/*`. | Run with the real roster format; verify formula neutralisation, restricted-notes separation, audit fields. | ADMIN-02/03, SEC-05, DATA-02 | Guest roster (decision register #3) |
| Backups and recovery | Runbook procedures drafted; no restore test performed. | Confirm D1 backup/restore capability in the owners' account; perform a restore test; record RPO/RTO evidence. | SEC-07, AT-16 | Deployed service |
| Acceptance runs AT-04–AT-13 | Front end ready; service tests local only. | Execute against the deployed service with synthetic fixtures; fault injection for AT-09/AT-10. | §14 | Deployed service |

**Common backend effort (View A, hours):** BE 24 / 40 / 72; TL 4 / 8 / 12 → **28 / 48 / 84** (low / base / high). This block appears unchanged inside every alternative below.

---

## 2. C01 — Custom component-based composition (benchmark; working proof)

### 2.1 Keep / adapt / replace map

| Area | Class | Why | Requirement IDs | Dependencies | Demo-asset / unwanted-item removal |
|---|---|---|---|---|---|
| Invitation | **keep** | Live-text invitation from `content/site.config.json`, original crest renditions, DES-01 tokens, stacked names, same-size closing line; captured at four widths and 200 % text; sealed-envelope → invitation → keepsake → dialog flow implemented and audited (`scripts/templates/index.mjs`, `src/js/site.js`). Remaining: owner G2 visual sign-off; DES-02 typeface approval; capitalisation confirmation. | HOME-01–04, DES-01–04, DATA-01 | Owner review; typeface proof | None. Unverified photos already quarantined in `assets/review/` (unpublished). |
| Navigation | **keep** | Persistent header with Wedding Day, Travel & Stay, Questions, RSVP; mobile menu; skip links; entry bar with RSVP before the envelope; anchor offset for header; deep links bypass the envelope. Remaining: keepsake-overlap decision on phones. | IA-01/02, HOME-02 | — | None |
| Event cards | **keep** | Two cards from config with `datetime` attributes, Central Time label, directions links, calendar downloads (`dist/calendar/*.ics`, no DTEND), venue-change note; AT-02 variant run recorded. Remaining: entrances, parking, access notes (coordinator). | CONTENT-02/05, DATA-01 | Decision register #5 | None |
| Travel & Stay | **keep** | General hotel information only; room block null and omitted; getting-there text carried forward and flagged for verification. Remaining: coordinator confirmations. | CONTENT-03/06 | Decision register #5, #6, #7 | None |
| FAQs | **keep** | Four draft-approved FAQs published; three pending topics withheld by approval state; contact block rendered once supplied. | CONTENT-04/06 | Decision register #4, #7 | None |
| RSVP interface | **keep** | Five-step wizard (`src/js/rsvp.js`, 36.5 KB) against `docs/RSVP_API_CONTRACT.md`: invitees → attendance per guest/event → details (skipped on decline-all) → review → confirmation with reference; requestId idempotency, revision-conflict state, network/email-unavailable states; in-page mock adapter for preview. Switch `rsvp.mode` to `live` when the service exists. | RSVP-01–07, HOME-04, NFR-01 | Common backend | Disable `rsvp.allowPreview` and the synthetic PREVIEW/SOLO/FAMILY households before guest launch (RELEASE-01). |
| Access layer | **keep (front end) + common backend (build new, reference exists)** | Token carried in the URL fragment, removed on load, sent only on "Open my invitation"; neutral invalid-code messages; session cookie design in the contract. Server side is the common block. | RSVP-01, SEC-01/02/03, ARCH-01/02/04, IA-02 | Common backend; visibility decision (#2) | None |
| Coordinator tools | **common backend (build new, reference exists)** | `backend/src/admin/*` reference: import preview/commit, reports, exports, credentials, corrections, content versions; Access-gated. No UI beyond API; owner may want a thin admin page (not estimated; P0 is met by API + exports per ADMIN-01–03 only if the owners accept API-driven operation — flag for G2). | ADMIN-01–04, ARCH-03, RSVP-07, SEC-05–07, DATA-02 | Common backend | None |
| Content editing | **keep** | One config file with per-block approval state; `npm run check`/`build` refuse inconsistent or unapproved-but-active content; `npm run register` regenerates the approval register; banner and post-event phase switches; version history and rollback through git. ADMIN-04 asks for edits "without changing code" — config edits plus a rebuild through the deploy workflow satisfy this only if the owners accept a git-based workflow; otherwise the backend's content-versions endpoint is the adaptation path. | CONTENT-06, ADMIN-04, DATA-01, OPS-02/03 | Owner acceptance of git-based editing | None |

### 2.2 Effort — View A (remaining from 2026-09-21), hours by role

| Stage | D | FE | BE | QA | TL | CO | Stage total (low / base / high) |
|---|---|---|---|---|---|---|---|
| Acquisition / licensing | — | — | — | — | — | — | **not applicable** (no purchase; OFL fonts already recorded) |
| Design adaptation (G2 review cycle, typeface proof, keepsake-overlap decision, capitalisation) | 4 / 8 / 16 | 4 / 8 / 16 | — | — | — | — | 8 / 16 / 32 |
| Component integration (switch to live mode, API base URL, disable preview, deploy) | — | 4 / 6 / 10 | — | — | — | — | 4 / 6 / 10 |
| Guest-system work — **common backend** | — | — | 20 / 32 / 56 | — | 4 / 8 / 12 | — | 24 / 40 / 68 |
| Testing / remediation (VoiceOver, NVDA, devices, 400 % reflow, calendar clients, usability pilot, AT-04–13 against the service, fixes) | — | 8 / 14 / 24 | 4 / 8 / 16 | 20 / 32 / 48 | — | — | 32 / 54 / 88 |
| Handover (access register, runbook rehearsal, restore test record, content decisions entered) | — | — | — | — | 4 / 6 / 10 | 6 / 10 / 16 | 10 / 16 / 26 |
| **Role totals** | **4 / 8 / 16** | **16 / 28 / 50** | **24 / 40 / 72** | **20 / 32 / 48** | **8 / 14 / 22** | **6 / 10 / 16** | **78 / 132 / 224** |

Of which common backend (BE 24/40/72 + TL 4/8/12): **28 / 48 / 84**. Alternative-specific remainder: **50 / 84 / 140**.

Assumptions: low = owners approve on first review and no manual-test defects; base = one revision round and a handful of small fixes; high = two revision rounds, a keepsake redesign on phones and screen-reader findings requiring markup changes.

### 2.3 Effort — View B (equal-scope front-end build estimate from zero; C01's is already spent)

| Alternative | D | FE | QA | TL | Total | Note |
|---|---|---|---|---|---|---|
| C01 front-end slice as built (invitation + entry flow, hero, cards, travel, FAQs, RSVP wizard front end, privacy, build/proof/audit scripts) | 16 / 24 / 40 | 80 / 120 / 180 | 16 / 24 / 40 | 4 / 8 / 12 | **116 / 176 / 272** | Estimate of equivalent human effort; the work exists in the repository, so these hours are sunk and are **not** in View A. |

---

## 3. C36 — alt-a-editorial-heritage (concept mockup; if chosen as the composition)

If the owners prefer this composition at G1, it would be implemented on C01's build pipeline, scripts, RSVP front end and common backend. The map therefore inherits C01 for everything the concept does not change.

### 3.1 Keep / adapt / replace map

| Area | Class | Why | Requirement IDs | Dependencies | Demo-asset / unwanted-item removal |
|---|---|---|---|---|---|
| Invitation | **adapt** | Port the tall stationery panel with the thin double gold rule, and the two-column desktop opening (invitation left, editorial column right) into `scripts/templates/index.mjs` and `src/styles/site.css`; keep C01's live text, crest and tokens. Resolve the DES-04 name-spacing observation at 1440 and decide whether the docked invitation may leave the document flow. Measure gold contrast. | HOME-01–04, DES-01–04 | Design decision on docked behaviour | Remove the "Original concept mockup" banner and `?entry=none`/`?state=` concept switches. |
| Navigation | **adapt** | Small-caps top navigation (Invitation, Wedding Day, Travel & Stay, RSVP outlined) replaces C01's header variant; keep skip links, mobile menu logic, anchor offsets, deep links. The concept has no Questions link (see FAQs). | IA-01/02 | — | None |
| Event cards | **adapt** | Restyle C01's config-driven cards to the concept's thin-rule dividers; keep `datetime`, calendar and directions logic. | CONTENT-02/05, DATA-01 | — | None |
| Travel & Stay | **adapt** | Restyle; content identical (config). | CONTENT-03/06 | — | None |
| FAQs | **keep from C01 (build into the concept)** | The concept has no Questions block; C01's FAQ section and approval gating would be carried over and styled to match. | CONTENT-04/06 | — | None |
| RSVP interface | **keep (C01 wizard) + adapt first screen** | The concept's first RSVP screen (per-guest per-event choices with an error state) matches C01's attendance step; C01's wizard, states and mock/live adapter stay. Restyle only. | RSVP-01–07, HOME-04 | Common backend | Remove the "Concept mockup — no working backend" label. |
| Access layer | **keep from C01 + common backend** | Unchanged. | RSVP-01, SEC-01–03, ARCH-01/02/04, IA-02 | Common backend | None |
| Coordinator tools | **common backend** | Unchanged. | ADMIN-01–04, ARCH-03, RSVP-07, SEC-05–07, DATA-02 | Common backend | None |
| Content editing | **keep from C01** | Unchanged (config + approval states). | CONTENT-06, ADMIN-04, DATA-01, OPS-02/03 | — | None |

### 3.2 Effort — View A (remaining), hours by role

| Stage | D | FE | BE | QA | TL | CO | Stage total |
|---|---|---|---|---|---|---|---|
| Acquisition / licensing | — | — | — | — | — | — | **not applicable** |
| Design adaptation (C01 review cycle **plus** the concept: resolve name spacing, two-column breakpoints 768–900 px, docked-flow decision, contrast measurement) | 12 / 20 / 36 | 4 / 8 / 16 | — | — | — | — | 16 / 28 / 52 |
| Component integration (C01 switch-over **plus** port of composition, navigation variant and section styling into templates/CSS; re-run `npm run proofs` and `npm run audit`) | — | 28 / 42 / 66 | — | — | — | — | 28 / 42 / 66 |
| Guest-system work — **common backend** | — | — | 20 / 32 / 56 | — | 4 / 8 / 12 | — | 24 / 40 / 68 |
| Testing / remediation (C01 set **plus** re-audit of the ported composition) | — | 8 / 14 / 24 | 4 / 8 / 16 | 28 / 44 / 64 | — | — | 40 / 66 / 104 |
| Handover | — | — | — | — | 4 / 6 / 10 | 6 / 10 / 16 | 10 / 16 / 26 |
| **Role totals** | **12 / 20 / 36** | **40 / 64 / 106** | **24 / 40 / 72** | **28 / 44 / 64** | **8 / 14 / 22** | **6 / 10 / 16** | **118 / 192 / 316** |

Increment over C01: D +8/+12/+20, FE +24/+36/+56, QA +8/+12/+16 = **+40 / +60 / +92**. Common backend unchanged at 28 / 48 / 84.

### 3.3 View B (equal-scope from zero)

C01's from-zero estimate (116 / 176 / 272) plus the composition increment (+40 / +60 / +92) → **156 / 236 / 364**. Estimate only.

---

## 4. C37 — alt-b-couple-template (concept mockup; if chosen as the composition)

### 4.1 Keep / adapt / replace map

| Area | Class | Why | Requirement IDs | Dependencies | Demo-asset / unwanted-item removal |
|---|---|---|---|---|---|
| Invitation | **adapt** | Port the full-width stationery hero with hairline frame, corner marks and SVG paper texture into C01's template/CSS; keep live text, crest and tokens. Decide whether the five decorative ivory tints become tokens (README open item). Measure contrast on the textured surface. | HOME-01–04, DES-01–04 | Token decision | Remove the concept banner, `?entry=none`/`?state=docked` switches and the "Concept mockup" label. |
| Navigation | **adapt** | Sticky top bar (Wedding Day, Travel & Stay, Questions, RSVP from 768 px) **plus** the phone-only bottom-sticky RSVP bar; fix the two-row wrap at 390; decide whether the keepsake collapses into the bar (README open item). Keep skip links, anchor offsets, deep links. | IA-01/02, HOME-02 | Keepsake/bar decision | None |
| Event cards | **adapt** | Horizontal timeline strip (vertical on phones) with two cards; keep C01's config-driven data, `datetime`, calendar and directions links. | CONTENT-02/05, DATA-01 | — | Calendar/privacy links currently point into `dist/`; retarget through the build. |
| Travel & Stay | **adapt** | Card blocks (hotel card, getting-there card); content identical (config). | CONTENT-03/06 | — | None |
| FAQs | **adapt** | `details`/`summary` FAQ cards; keep C01's approval gating. Check keyboard/screen-reader behaviour of the cards. | CONTENT-04/06 | — | Remove the dashed "Review annotation — not guest-facing" blocks from any publishable template (they belong in the approval register). |
| RSVP interface | **keep (C01 wizard) + design decision** | The concept shows a single scrolling form with a step indicator; C01 implements a five-step wizard per RSVP-01's form sequence. Either restyle the wizard's steps to the concept's look (recommended: keeps tested states) or rebuild as one scrolling form with the same states (higher effort, not estimated). | RSVP-01–07, HOME-04 | Owner preference | Remove the concept label. |
| Access layer | **keep from C01 + common backend** | Unchanged. | RSVP-01, SEC-01–03, ARCH-01/02/04, IA-02 | Common backend | None |
| Coordinator tools | **common backend** | Unchanged. | ADMIN-01–04, ARCH-03, RSVP-07, SEC-05–07, DATA-02 | Common backend | None |
| Content editing | **keep from C01** | Unchanged. | CONTENT-06, ADMIN-04, DATA-01, OPS-02/03 | — | None |

### 4.2 Effort — View A (remaining), hours by role

| Stage | D | FE | BE | QA | TL | CO | Stage total |
|---|---|---|---|---|---|---|---|
| Acquisition / licensing | — | — | — | — | — | — | **not applicable** |
| Design adaptation (C01 review cycle **plus** the concept: keepsake/bar decision, nav wrap at 390, tint tokens, contrast on texture) | 12 / 20 / 36 | 4 / 8 / 16 | — | — | — | — | 16 / 28 / 52 |
| Component integration (C01 switch-over **plus** port of hero, timeline strip, travel cards, FAQ cards, sticky RSVP bar; retarget links; re-run proofs/audits) | — | 32 / 46 / 74 | — | — | — | — | 32 / 46 / 74 |
| Guest-system work — **common backend** | — | — | 20 / 32 / 56 | — | 4 / 8 / 12 | — | 24 / 40 / 68 |
| Testing / remediation (C01 set **plus** re-audit; FAQ card and sticky-bar keyboard/screen-reader checks) | — | 8 / 14 / 24 | 4 / 8 / 16 | 28 / 44 / 64 | — | — | 40 / 66 / 104 |
| Handover | — | — | — | — | 4 / 6 / 10 | 6 / 10 / 16 | 10 / 16 / 26 |
| **Role totals** | **12 / 20 / 36** | **44 / 68 / 114** | **24 / 40 / 72** | **28 / 44 / 64** | **8 / 14 / 22** | **6 / 10 / 16** | **122 / 196 / 324** |

Increment over C01: D +8/+12/+20, FE +28/+40/+64, QA +8/+12/+16 = **+44 / +64 / +100**. Common backend unchanged at 28 / 48 / 84.

### 4.3 View B (equal-scope from zero)

116 / 176 / 272 plus the increment (+44 / +64 / +100) → **160 / 240 / 372**. Estimate only.

---

## 5. Provisional only — C03 Marriage (leading external candidate; NOT a finalist; publisher claims only)

Included so the owners can see what a template path would involve. Every classification below rests on the search-snippet description of an unopened product; the estimate would have to be redone after a named G1 purchase approval and an isolated install (TPL-06).

### 5.1 Keep / adapt / replace map (provisional)

| Area | Class | Why (publisher claim basis) | Requirement IDs | Dependencies | Demo-asset / unwanted-item removal |
|---|---|---|---|---|---|
| Invitation | **build new** | No stationery-style opening claimed; a live-text invitation with crest, gold script names and same-size closing line would be written from scratch inside the template's page. | HOME-01–04, DES-01–04 | Purchase; source inspection | Remove botanical illustrations and demo photography (rights unknown). |
| Navigation | **adapt** | One-page anchor navigation claimed; must be checked for header offset, mobile RSVP visibility and keyboard behaviour. | IA-01/02 | Source inspection | — |
| Event cards | **adapt** | "Wedding details" and "event schedule" claimed; retheme and drive from `content/site.config.json` (requires writing an Astro content adapter or abandoning the template's data model). | CONTENT-02/05, DATA-01 | Adapter | Remove love-story timeline, bridal party, gallery/lightbox. |
| Travel & Stay | **build new** | No travel/hotel section named. | CONTENT-03/06 | — | — |
| FAQs | **adapt** | FAQ accordion claimed (Alpine.js); keyboard check required. | CONTENT-04/06 | — | — |
| RSVP interface | **replace** | Client form "with conditional logic"; fails the RSVP boundary. Replace with C01's `rsvp.js` wizard (restyled) or rebuild against the contract. | RSVP-01–07, HOME-04 | Common backend | Remove the shipped form handler. |
| Access layer | **build new + common backend** | None shipped. | RSVP-01, SEC-01–03, ARCH-01/02/04, IA-02 | Common backend | — |
| Coordinator tools | **common backend** | None shipped. | ADMIN-01–04, ARCH-03, RSVP-07, SEC-05–07, DATA-02 | Common backend | — |
| Content editing | **adapt** | Astro content/Tailwind tokens (publisher claim) versus the project's approval-gated config; an adapter or a migration of the approval-state model is required. | CONTENT-06, ADMIN-04, DATA-01, OPS-02/03 | — | Remove any analytics or third-party embeds found in source (unknown). |

### 5.2 Effort — View A (provisional), hours by role

| Stage | D | FE | BE | QA | TL | CO | Stage total |
|---|---|---|---|---|---|---|---|
| Acquisition / licensing (named G1 approval, purchase in an owner account, licence read, isolated install, dependency and lockfile review, clean build) | — | — | — | — | 3 / 6 / 10 | — | 3 / 6 / 10 **+ USD 39** (publisher claim via search snippet, 2026-09-21; listing not opened) |
| Design adaptation (retheme tokens; build the invitation section; remove demo sections/assets) | 12 / 20 / 32 | 40 / 64 / 100 | — | — | — | — | 52 / 84 / 132 |
| Component integration (Astro build into the deploy workflow; config adapter; calendar generation; RSVP front end port) | — | 24 / 36 / 60 | — | — | — | — | 24 / 36 / 60 |
| Guest-system work — **common backend** | — | — | 20 / 32 / 56 | — | 4 / 8 / 12 | — | 24 / 40 / 68 |
| Testing / remediation (full audit from zero evidence; Alpine/accordion keyboard work; AT runs) | — | 16 / 24 / 40 | 4 / 8 / 16 | 28 / 44 / 64 | — | — | 48 / 76 / 120 |
| Handover | — | — | — | — | 6 / 8 / 12 | 6 / 10 / 16 | 12 / 18 / 28 |
| **Role totals** | **12 / 20 / 32** | **80 / 124 / 200** | **24 / 40 / 72** | **28 / 44 / 64** | **13 / 22 / 34** | **6 / 10 / 16** | **163 / 260 / 418** |

Common backend unchanged at 28 / 48 / 84 — the template supplies none of it. Uncertainty is high: the stack versions, licence terms and asset rights are unread, so the range could widen in either direction after inspection.

---

## 6. Licensing and recurring costs (dated sources or "unknown")

| Item | Applies to | One-time cost | Recurring cost to 2027-04-18 | Source and date | Status |
|---|---|---|---|---|---|
| Pinyon Script, Cormorant Garamond, Cormorant SC (SIL OFL 1.1) | C01, C36, C37 | none (licence permits web embedding and self-hosting) | none | `docs/licenses/*.txt` (files present, read 2026-09-21) | verified |
| Crest renditions from owner artwork A1 | C01, C36, C37 | not applicable | not applicable | `assets/ASSET_MANIFEST.md` | verified (manifest) |
| axe-core 4.10.2 (MPL-2.0), Playwright, Chromium | dev tooling only, not shipped | none | none | `scripts/vendor/axe-core-LICENSE.txt` | verified (file present) |
| GitHub Pages hosting for the static site | all | — | **unknown** — no GitHub pricing page was opened on 2026-09-21; the repository is private (`package.json`), and Pages availability on private repositories depends on plan | not verified | unknown |
| Domain `robertandnatalie.wedding` renewal | all | — | **unknown** — registrar and renewal date not recorded in the repository | not verified | unknown |
| Cloudflare Workers + D1 + Access (RSVP service) | all (common backend) | — | **unknown** — no Cloudflare pricing page opened; free-tier limits and Access seat pricing not verified | not verified | unknown |
| Transactional mail provider | all (common backend) | — | **unknown** — provider not chosen (decision register #11) | not verified | unknown |
| Supabase (alternative managed backend named in PRD §11) | all, only if chosen instead of Workers | — | **unknown** | not verified | unknown |
| C03 Marriage licence | C03 only | USD 39 (publisher claim via search snippet, 2026-09-21) | none claimed; licence text unread, so transfer/renewal terms unknown | madethemes.gumroad.com/l/marriage (blocked) | publisher claim |
| C04 Northbound licence | C04 only | USD 99 bundle (publisher claim; per-theme price unknown) | "ongoing updates" claimed; obligations unknown | lexingtonthemes.com (blocked) | publisher claim |
| C05 Forever paid theme | C05 only | **unknown** (sibling themes GBP 20 per snippet) | unknown | mikesmithdesign.gumroad.com (blocked) | not verified |
| C06 Dahlia | C06 only | USD 24 (publisher claim via snippet) | none claimed | themeforest.net item 45729422 (blocked) | publisher claim |

No recurring cost is recorded as zero. The owners are asked to supply hosting, domain and mail figures (or authorise the agent to open the vendor pages from an unblocked network) before G2 so that the total cost line can be completed.

---

## 7. Comparison summary (View A, hours low / base / high)

| Alternative | Alternative-specific | Common backend | Total | One-time licence | Status of estimate |
|---|---|---|---|---|---|
| C01 custom benchmark | 50 / 84 / 140 | 28 / 48 / 84 | **78 / 132 / 224** | not applicable | Based on the working proof and evidence |
| C36 alt-a concept | 90 / 144 / 232 | 28 / 48 / 84 | **118 / 192 / 316** | not applicable | Concept; port estimate |
| C37 alt-b concept | 94 / 148 / 240 | 28 / 48 / 84 | **122 / 196 / 324** | not applicable | Concept; port estimate |
| C03 Marriage (provisional, not a finalist) | 135 / 212 / 334 | 28 / 48 / 84 | **163 / 260 / 418** | USD 39 (publisher claim) | Publisher claims only; redo after inspection |

The common backend column is identical by construction. No alternative reduces it, and the agent has not credited any template with backend reuse (TPL-08).
