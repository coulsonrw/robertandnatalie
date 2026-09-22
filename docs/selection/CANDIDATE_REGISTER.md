# Candidate register — design-foundation selection (PRD v1.1 §05, TPL-03/TPL-04)

**Prepared:** 2026-09-21. **Prepared by:** implementation agent (recommends; does not approve). **Governing spec:** `docs/PRD_v1_1.md` §05 (TPL-01–TPL-12) and AT-17–AT-22. **Status:** first submission for G1 review; no candidate is selected, purchased or approved by this document.

## How to read this register

- **Stable IDs** `C01`–`C37` are assigned here and are the IDs used in `SCORECARD.md`, `KEEP_ADAPT_REPLACE.md` and `SELECTION_REPORT.md`. The research sweeps used their own working IDs (`TPL-C-01…06` for the commercial sweep, `C-01…C-13` for the open-source sweep); those are shown in brackets for traceability.
- **Evidence labels** follow TPL-04: **verified** = the reviewer opened the source and saw it; **publisher claim** = stated by the vendor, repository README or a search-result snippet relaying the vendor's text; **not verified** = could not be opened or checked; **not applicable** = the field has no meaning for this row. Each label carries its reason.
- **Gate results** follow TPL-05: **pass**, **pending** (pending verification), or **fail**. "Fail as shipped, remediable" means the shipped feature fails the gate but the PRD's approved remediation path (replace it with the project's own server-side RSVP; see the RSVP boundary in TPL-06) is feasible, so the row is not excluded on that gate alone. A weighted score cannot compensate for an unresolved gate.
- **Environment limitation (material):** during the 2026-09-21 research session every commercial listing, demo, license page and marketplace domain was blocked by the session's egress proxy (`EGRESS_BLOCKED` / `CONNECT tunnel failed, response 403`). Only `raw.githubusercontent.com` and the GitHub API/commits pages used by the open-source sweep succeeded. Consequently **no commercial listing, demo, license text or paid source was opened**; every price, update date and stack statement for a commercial item is a **publisher claim relayed through a search snippet** or **not verified**. Nothing below should be read as a review of a working demo.
- **Research record truncation:** the open-source sweep's record was truncated in transit after candidate `C-13` (jcarter1028/wedding-website) mid-sentence. Any candidate that sweep screened after `C-13` is not in this register; `C35` is recorded from the partial text only.

## Six gates (TPL-05) used in the matrix

| Key | Gate |
|---|---|
| G-A | Editable source and ownership |
| G-B | Template, font and media rights |
| G-C | Technical viability (inspected source, clean build reproduced) |
| G-D | Visual adaptability (crest, live text, hierarchy, charcoal copy, closing line, responsive) |
| G-E | Guest-system integration (authenticated household context; trusted server-side RSVP) |
| G-F | Accessible and performant path |

---

## 1. Summary table — every screened candidate (one row each)

"Retained" means the candidate is carried into the scorecard as a credible option (TPL-03 asks for six to eight credible candidates including the custom benchmark). Credible candidates that are not retained are kept in the register with the reason; nothing is deleted.

| ID | Candidate (working ID) | Category (TPL-03) | Publisher | Review date | Credible? | Retained? | Gate summary (A/B/C/D/E/F) | Exclusion / non-retention reason |
|---|---|---|---|---|---|---|---|---|
| C01 | **Custom component-based composition — the live site in `src/`, `scripts/`, `content/`, with proofs in `docs/proofs/`** | Custom benchmark | This repository (owner-controlled) | 2026-09-21 | yes | **yes (mandatory benchmark)** | pass / pass / pass / pass / pass-architecture, pending-deployment / pass-lab, pending-manual | — |
| C02 | Mawhub – Wedding Invitation Next JS Template (TPL-C-01) | Individual-couple template | wpoceans via ThemeForest / Envato Elements | 2026-09-21 | yes | no | pending / pending / pending / pending / fail as shipped, remediable / pending | Credible but low fit (shop/cart/checkout, dual Bootstrap 5 + Material UI, photo-hero); role duplicated by C03/C04 with better tonal fit. Kept for reference. |
| C03 | Marriage – Onepage Wedding Website Template for Astro (TPL-C-02) | Individual-couple template | MadeThemes via Gumroad; listed on astro.build | 2026-09-21 | yes | **yes** | pending / pending / pending / pending / fail as shipped, remediable / pending | — (strongest tonal fit found in the commercial sweep) |
| C04 | Northbound – wedding theme for Astro & Tailwind CSS (TPL-C-03) | Editorial / heritage-hospitality template | Lexington Themes | 2026-09-21 | yes | **yes** | pending / pending / pending / pending / fail as shipped, remediable / pending | — (only editorial-category commercial item with a typography style guide claim) |
| C05 | Forever – Astro wedding theme (paid) with Forever Lite (free HTML) (TPL-C-04) | Individual-couple template | Mike Smith Design via Gumroad; Lite on GitHub | 2026-09-21 | yes | **yes** | pass (Lite) / pending (paid) ; pass (Lite) / pending (paid) ; pending ; pending ; fail as shipped, remediable ; pending | — (only marketplace item whose entry screen is explicitly styled as the invitation) |
| C06 | Dahlia – Responsive Wedding Invitation (TPL-C-05) | Individual-couple template | lucky_roo via ThemeForest | 2026-09-21 | yes | **yes** | pending / pending / pending-weak / pending / fail as shipped, remediable / pending | — (card-led invitation hero; low-cost comparator; last update 2023 is a viability concern) |
| C07 | Modern Wedding Website Kit – Next.js 14 (TPL-C-06) | Individual-couple template | jaackevans via Gumroad | 2026-09-21 | yes | no | pending / pending / pending / pending-weak / fail as shipped, remediable / pending | Credible but polaroid/modern aesthetic opposite to formal stationery; Next.js 14 superseded; retained only as a travel/calendar-pattern reference. |
| C08 | Mylove – Wedding Next JS Template | Individual-couple template | wpoceans via ThemeForest | 2026-09-21 | no | no | not screened | Near-duplicate of C02 from the same author, older (05 Apr 2023); TPL-03 forbids padding with near-duplicates. |
| C09 | Wedding Event – Wedding Invitation and Celebration HTML Template | Individual-couple template | webstrot via ThemeForest | 2026-09-21 | no | no | not screened | Sprawling multipurpose bundle (13 index pages); conflicting maintenance evidence (2018 vs 2025); no advantage over C06. |
| C10 | Ever After – Responsive Wedding Invite Template | Individual-couple template | falz04 via ThemeForest | 2026-09-21 | no | no | — / — / **fail** / — / — / — | Obsolete stack (Bootstrap 3, 2014); fails G-C without a full rebuild. |
| C11 | Lavelo – React Wedding Template | Individual-couple template | Unknown Envato author | 2026-09-21 | no | no | not screened | Official listing not located; surfaced only via unauthorized redistribution sites; 2020-era React; not credible without a primary source. |
| C12 | Lovebird – One-Page Wedding HTML/CSS | Individual-couple template | Noon CX via Creative Market | 2026-09-21 | no | no | not screened | Listing inaccessible; no price/update/stack-version evidence; likely 2015-era; name collides with a vendor platform. |
| C13 | Elegance – Wedding Website Template (Tailwind CSS HTML) | Individual-couple template | Unknown via TemplateMonster (ID 534005) | 2026-09-21 | no | no | not screened | Feature set duplicates C06/C02 with no invitation-led opening or travel section; listing unreachable. |
| C14 | Afair – Elegant Wedding HTML Template with Tailwind CSS | Individual-couple template | MyCreativeTemplates | 2026-09-21 | no | no | not screened | Animation-heavy (petals, orbs, glassmorphism), unknown price/license; contrary to the restraint brief (TPL-10 gives no credit for such animation). |
| C15 | Loveshare / Ywedding – TailTemplate premium wedding templates | Individual-couple template | TailTemplate (StaticMaker) | 2026-09-21 | no | no | not screened | Insufficient evidence of sections, RSVP or maintenance; bundle-only pricing; listing unreachable. |
| C16 | Wrapmarket wedding-invitation templates (TwoHearts; Annie/Anjali/Aiko) | Individual-couple template | TemplateLayer and other Wrapmarket authors | 2026-09-21 | no | no | not screened | Near-duplicates of the C06 Bootstrap-invitation pattern or generic React countdown pages; no individual listing could be opened. |
| C17 | Framer wedding templates (Engaged, WeddingDay, Wedded, Wedframe, Rocio, Vows&Blooms) and Webflow "Wedding invitation + RSVP" | Individual-couple template | Various via Framer Marketplace / Webflow | 2026-09-21 | no | no | **fail** / — / — / — / **fail** / — | Builder-locked source and proprietary hosting; fails G-A; cannot host the PRD's server-side RSVP. |
| C18 | Cosmic JS "Wedding Website" / "Wedding Site" templates | Open-source starter | Cosmic (cosmicjs.com) | 2026-09-21 | no | no | not screened | Depends on proprietary Cosmic CMS hosting; donation/crypto features irrelevant to the brief. |
| C19 | Weddings – Onepage Wedding Website Theme (astro.build listing) | Individual-couple template | Unknown (likely same family as C03) | 2026-09-21 | no | no | not screened | Publisher and price unidentified; description near-verbatim duplicate of C03. |
| C20 | Forever & Always – Colorlib wedding template (Astro 6 / Tailwind 4) | Open-source starter | Colorlib | 2026-09-21 | no | no | not screened | Outside the commercial angle, unverifiable here; flagged for the open-source sweep, which did not record it (see truncation note). Attribution-licence terms unread. |
| C21 | Kiaweds (Next.js), EverAfter/Wadeng (Wrapmarket), Feelings/Weddingo/Loveme (ThemeForest) | Wedding-planner / vendor sales templates | WebbyTemplate; Wrapmarket authors; wpoceans and others | 2026-09-21 | no | no | not screened | Wedding-planner/vendor sales sites; TPL-03 rejects these absent a demonstrable structural advantage, and none was evident. |
| C22 | Platforms and builders (Lovebird.com, Joy/withjoy, The Knot, RSVPify, Wix, Nicepage, Mobirise, Astra WordPress) and unauthorized redistribution sites (aedevstudio, gift4designer, shopee, downloadnewthemes, themesalmond, prowebthemes) | Discovery channels, not candidates | Various | 2026-09-21 | no | no | not applicable | Platforms are discovery channels, not candidates (TPL-03); nulled/redistribution sites must never be used as a source (TPL-06). Recorded so the register shows they were seen and set aside. |
| C23 | rmalik95/wedding-web ("Rishabh & Glyra" editorial invitation) (C-01) | Individual-couple site (open repo) | rmalik95 (individual) | 2026-09-21 | no | no | **fail** (no licence) / pass (fonts OFL) / pending / pattern-compatible / none (build new) / publisher claim | No licence file (verified): all rights reserved by default; source may not be copied. Retained as a design-pattern reference only (accessible "paper-theatre" opening → invitation → site). |
| C24 | Matthew14/Wedding (Rebecca & Matthew, Next.js + AWS) (C-02) | Individual-couple site (open repo, MIT) | Matthew14 (individual) | 2026-09-21 | yes | **yes** | pass / pass (MIT; fonts replaced anyway) / pending / pending-weak / partial (server-side, code-gated RSVP exists; household/entitlement model not verified) / pending | — (only candidate with server-side RSVP and an admin dashboard; heavy AWS surface conflicts with the static target) |
| C25 | patcors/wedding (Astro 7 + Tailwind 4 single page) (C-03) | Individual-couple site (open repo) | patcors (individual) | 2026-09-21 | no | no | **fail** (no licence) / pass (fonts) / pending / pending / **fail** (client-only no-cors POST to Apps Script) / pending | No licence grant (verified) and client-only RSVP; typography/theme-token approach noted as reference only. |
| C26 | MattiasHenders/wedding-template (C-04) | Individual-couple template (open repo) | Mattias Henders (individual) | 2026-09-21 | no | no | pass (MIT, publisher claim) / pending / **fail-leaning** (Next 12, React 18, last commit 2024-08-24) / fail-leaning (MUI) / **fail** (Fillout/Airtable third-party form; cookie gate) / pending | Stale stack and third-party-form RSVP; no offsetting design advantage. |
| C27 | Glitch3dPenguin/weddingwebsite (Next.js 16 + PostgreSQL, admin panel) (C-05) | Individual-couple site (open repo) | Glitch3dPenguin / Austin Stanfield | 2026-09-21 | no | no | **fail** (no licence; `"private": true`) / — / pending / fail-leaning (photo slideshow hero) / has server RSVP + JWT admin (not inspected) / pending | No licence grant (verified); scope bloat (seating charts, budgets, honeymoon portal) irrelevant to the PRD. |
| C28 | rampatra/wedding-website (C-06) | Individual-couple site (open repo, GPL-3.0) | Ram Patra (individual) | 2026-09-21 | yes | no | pass (GPL-3.0; copyleft recorded) / pending (demo photos must go; fonts not verified) / pending-weak (Gulp/Bootstrap/jQuery) / 2 – substantial adaptation / **fail as shipped** (client-posted Google Sheets script) / pending | Credible (most-forked open wedding site) but dated pipeline, no component model and photo-driven hero; role (open one-page couple site) is better served by C31. |
| C29 | dewanakl/undangan (Ulems digital invitation) (C-07) | Individual-couple site (open repo, MIT) | dewanakl (individual) | 2026-09-21 | yes | no | pass (MIT) / pending (Google Fonts; demo imagery to remove) / pending-weak (no build, Bootstrap global CSS) / 2 (confetti, floral, music contrary to restraint) / **fail as shipped** (public guestbook API) / pending (music autoplay must go) | Credible envelope-then-site precedent, but the whole UI is Indonesian, ornamentation conflicts with TPL-10, and the envelope pattern is already implemented in C01. |
| C30 | sakeenah-wedding/template (C-08) | Individual-couple template (open repo, Apache-2.0) | sakeenah-wedding organisation / mrofisr | 2026-09-21 | yes | **yes** | pass (Apache-2.0, NOTICE obligations) / pending / pending (Bun + Hono + Cloudflare Workers, multi-tenant) / 2 (envelope pattern useful; cultural content and Motion animation to strip) / partial (personalised links + server API; authorisation model not inspected) / pending | — (envelope opening + personalised per-guest links + server API; closest open-source structural analogue to the owner's requested flow) |
| C31 | UrielOrtizv1000/wedding-invitation (React + TS + Vite starter) (C-09) | Open-source starter | Uriel Ortiz (individual) | 2026-09-21 | yes | **yes** | pass (MIT) / pending (fonts not stated) / pending (small, current; clean build not reproduced) / 3 (token-driven; no invitation opening) / none (simulated submission with an explicit swap point; build new) / publisher claim (skip links, focus traps, reduced motion, contrast-rated tokens) | — (cleanest starter found; explicit accessibility tokens) |
| C32 | AdrianBailador/Wedding-BP (Astro SSR + Supabase + Netlify) (C-10) | Individual-couple site (open repo, MIT) | Adrián Bailador Panero | 2026-09-21 | no | no | pass (MIT) / pending / pending (SSR on Netlify conflicts with static target) / fail-leaning (photo-led) / partial (open form, password-only admin) / pending | Duplicates the server-RSVP role of C24 with a weaker authorisation model and an SSR hosting model that does not fit the static target. |
| C33 | ZEDLABS-TEKNOLOGI-INDONESIA/wedding-invitation (Astro + React + SQLite) (C-11) | Individual-couple site (open repo) | ZEDLABS Teknologi Indonesia (company) | 2026-09-21 | no | no | pending (MIT shown on repo page; LICENSE file not read) / pending / pending (needs a Node server + SQLite; not static) / 2 (ornamented; localisation rewrite) / partial (not inspected) / pending | Near-duplicate of C30 with a smaller community, unread licence file and a full-language rewrite. |
| C34 | tinaota/rsvp-wedding-website (Next 16 four-step RSVP) (C-12) | Individual-couple site (open repo) | tinaota (individual) | 2026-09-21 | no | no | pending (no licence visible) / pending (Great Vibes script conflicts with approved stationery) / pending / pending / partial (open form with RLS; no household auth) / publisher claim (ARIA validation, focus management, reduced motion) | Licence not visible and demo unreachable; retained as an RSVP-flow pattern reference only (stepped review-before-send is the most PRD-like RSVP UX seen). |
| C35 | jcarter1028/wedding-website (Next 15 + Framer Motion) (C-13) | Individual-couple site (open repo) | jcarter1028 (individual) | 2026-09-21 | undetermined | no | pending (README usage statement without a LICENSE file; raw LICENSE 404 verified) / pending / pending / pending / none (mock submission; build new) / pending | **Research record truncated** mid-entry; credibility could not be determined from the partial text. Section coverage (travel, FAQ accordion, schedule) maps well to PRD content areas; parallax/fade animation throughout. |
| C36 | **alt-a-editorial-heritage — original concept composition (branded proof)** | Editorial / heritage-hospitality composition | This repository (original work; no template source) | 2026-09-21 | yes | **yes (branded alternative)** | pass / pass / pending (concept, not a production build) / pass-pending / inherits C01 path (pending) / pending (untested beyond smoke run) | — |
| C37 | **alt-b-couple-template — original concept composition (branded proof)** | Individual-couple-template composition | This repository (original work; no template source) | 2026-09-21 | yes | **yes (branded alternative)** | pass / pass / pending (concept, not a production build) / pass-pending / inherits C01 path (pending) / pending (untested beyond smoke run) | — |

### 1.1 Listing links for non-retained rows (added at independent review, 2026-09-21)

TPL-04 asks for exact listing and demo links on every row. The summary table above carries links only through the §3 detail records, which exist for retained rows. The following links for non-retained rows were recovered from web-search results on 2026-09-21; **none of these pages was opened** (commercial hosts are egress-blocked), so each is the URL as the search engine returned it, not a reviewed page.

| ID | Listing / repository link (from search result, not opened) | Demo link (from search result, not opened) |
|---|---|---|
| C02 | https://themeforest.net/item/mawhub-wedding-invitation-next-js-template/52724672 ; also https://elements.envato.com/mawhub-wedding-invitation-next-js-template-A2J7SRH | https://mawhub-next.vercel.app/ |
| C07 | https://jaackevans.gumroad.com/l/iyqek — price USD 16.99, Next.js 14 / TypeScript / Tailwind / Radix UI / Nodemailer (publisher claim via search snippet, 2026-09-21) | not found |
| C08 | https://themeforest.net/item/mylove-wedding-next-js-template/43553078 | not found |
| C18 | https://www.cosmicjs.com/templates/wedding-website | not found |
| C21 (Kiaweds) | https://www.webbytemplate.com/product/kiaweds-wedding-planner-website-template-next-js/ | not found |
| C23, C25–C29, C32–C35 | `https://github.com/<owner>/<repository>` exactly as named in each row (e.g. https://github.com/jcarter1028/wedding-website for C35); raw LICENSE/README/package.json reads for these rows were made against `raw.githubusercontent.com` as recorded per row | not recorded |
| C09–C17, C19, C20, C22 | **not recorded** — these rows were rejected at screening from search-result snippets and the research log did not preserve a listing URL. Open item: recover or re-run before G2 if the owners want the rejected set auditable to TPL-04. | not recorded |

### Credible-candidate count against TPL-03

- Credible external candidates found: **eleven** (C02–C07 commercial; C24, C28, C29, C30, C31 open source), plus the custom benchmark C01.
- Retained credible set for the scorecard: **eight** — C01 (benchmark), C03, C04, C05, C06, C24, C30, C31. This is inside the six-to-eight target, so **no owner exception under TPL-03 is required for the shortlist count**.
- Three distinct branded alternatives (TPL-03/TPL-09): C01 (custom, working proof), C36 (alt-a, concept mockup), C37 (alt-b, concept mockup). C36 and C37 are original compositions built in this repository to represent the "editorial/heritage" and "individual-couple template" categories; they are not inspected implementations of any external template (TPL-06 forbids representing a concept as one).
- **Caveat that the owners should weigh:** because no external listing, demo or source could be opened, every external "credible" judgement rests on publisher claims. None of the eleven external candidates has a single gate at **pass** on verified evidence except the licence checks performed on open repositories (C24 MIT, C28 GPL-3.0, C29 MIT, C30 Apache-2.0, C31 MIT — verified from raw LICENSE files or the GitHub API) and the Forever Lite README (C05, verified). If the owners consider that an unopened demo cannot count as "screened", the credible count falls to the five open-source items plus the benchmark, and an owner exception (TPL-03) would then be needed to proceed with a shortlist of that size. The agent recommends recording that judgement at G1 rather than the agent deciding it.

---

## 2. Gate matrix (TPL-05) — retained and benchmark rows

| ID | G-A Editable source / ownership | G-B Rights | G-C Technical viability | G-D Visual adaptability | G-E Guest-system integration | G-F Accessible / performant |
|---|---|---|---|---|---|---|
| C01 | **pass** — source in the owner's GitHub repository; deploy is GitHub Pages via `.github/workflows/deploy.yml`; no builder, no proprietary hosting for the front end (verified: repository contents, 2026-09-21). RSVP service is a separate Worker the owners must host in their own Cloudflare account (`backend/README.md`; account not yet created — pending). | **pass** — Pinyon Script, Cormorant Garamond, Cormorant SC under SIL OFL 1.1, licence texts present in `docs/licenses/` (verified: files listed 2026-09-21); crest renditions derived from the owner's `assets/coulson-crest-original.jpg` (`assets/ASSET_MANIFEST.md`); unverified photos quarantined in `assets/review/` and unpublished; axe-core vendored under MPL-2.0 for audits only (`scripts/vendor/axe-core-LICENSE.txt`). | **pass** — `npm run build` reproduced on 2026-09-21 at HEAD `7f8d326` with Node v22.22.2, no `npm install` required, output `dist/` with two `.ics` files and a readiness report (verified by running it). Backend: 44 Vitest tests pass in workerd (publisher claim of `backend/README.md`; not re-run here). | **pass** — live-text invitation, original-colour crest at 120/160 px, stacked names on phones, closing line at informational size; captures at 320/390/768/1440 and 200 % text (verified: `docs/proofs/README.md` and images viewed 2026-09-21). Owner visual sign-off (G2) pending. | **pass (architecture) / pending (deployment)** — front end implements the household flow against `docs/RSVP_API_CONTRACT.md` (token in fragment, explicit "Open my invitation", requestId idempotency, revision conflicts); reference Worker + D1 exists with tests but is **not deployed**, so no live server-side behaviour has been exercised. | **pass (lab) / pending (manual)** — axe-core 0 violations across 14 states × 2 viewports; LCP/CLS/INP-proxy/transfer budgets met on 5 cold runs; reduced motion and keyboard order recorded (verified: `docs/evidence/ACCESSIBILITY.md`, `PERFORMANCE.md`). No VoiceOver/NVDA, no real devices, no 400 % reflow, no field data. |
| C03 Marriage | pending — static Astro source deployable anywhere (publisher claim); Gumroad account must be owner-controlled. | pending — licence text unread (Gumroad blocked); botanical illustrations/photos likely excluded or restricted (not verified). | pending — Astro + Tailwind + Alpine (publisher claim); versions unknown; not installed. | pending — plausible 3/5 on publisher description (ivory/sage one-page, serif pairing); invitation opening with crest would be new work. | fail as shipped, remediable — client form only; RSVP screen reusable for styling only. | pending — Alpine accordion/FAQ needs keyboard check. |
| C04 Northbound | pending — source zip; Sanity variant optional (publisher claim). | publisher claim — licence snippet: non-exclusive, unlimited end products, no attribution; **anti-redistribution clause naming "repositories … CI systems" must be read against an owner Git repository** (private likely acceptable, public not). Demo photography excluded. | pending — Astro + Tailwind v4, content collections, style guide (publisher claim); not installed. | pending — plausible 3/5; image-led hero must be replaced by live-text invitation. | fail as shipped, remediable — RSVP page handler not described. | pending — Astro output generally light (publisher claim). |
| C05 Forever / Forever Lite | **pass (Lite)** — open single-file HTML (verified README); pending (paid Astro theme; Gumroad blocked). | **pass (Lite)** — "Free for personal and commercial use. Attribution appreciated but not required" (verified README text); pending (paid theme; demo images unknown). | pending — Lite is a single file with Lenis smooth-scroll (limited component reuse); paid theme JSON-driven Astro (publisher claim). | pending — plausible 3/5; restrained editorial one-pager; the paid theme's "password gate styled as your invitation" is the only marketplace entry conceptually close to the requested envelope/invitation flow (publisher claim). | fail as shipped, remediable — client-side password gate and email-to-inbox RSVP both replaced under the PRD. | pending — Lenis and scroll-triggered animation need reduced-motion/keyboard checks. |
| C06 Dahlia | pending — plain HTML zip (publisher claim). | pending — Envato Regular License unread; card artwork rights unknown. | pending-weak — Bootstrap 5 + jQuery-era plugins + PHP mailer; last update 23 May 2023 (search snippet). | pending — 2–3/5; card-led hero conceptually aligned; ornament replaced wholesale. | fail as shipped, remediable — PHP mail. | pending — carousel/gallery plugins need checks. |
| C24 Matthew14/Wedding | **pass** — MIT, Copyright (c) 2024 Matthew (verified). | pass — MIT; Geist fonts (would be replaced). | pending — Next.js 15.5.18 / React 19 / Mantine 7.15 / AWS SDK, Amplify, Cognito, DynamoDB, LocalStack (verified package.json); clean install not reproduced; heavy AWS-specific surface would need re-platforming to fit the static + Worker architecture. | pending-weak — Mantine component look far from stationery; invitation opening built new; demo not viewed (egress blocked). | partial — server-side, invitation-code-gated RSVP with DynamoDB and Cognito admin (README, publisher claim); household/entitlement, idempotency and revision handling not verified. | pending — not measured; PostHog tracker to remove. |
| C30 sakeenah-wedding/template | **pass** — Apache-2.0 (verified raw LICENSE). | pending — NOTICE obligations; demo imagery/audio to remove. | pending — Bun + Hono + Cloudflare Workers + PostgreSQL + Tailwind 4 + Motion (publisher claim); different runtime from the repository's Node build; multi-tenancy unnecessary. | 2 — envelope pattern useful; Islamic-wedding-specific content and Motion animation to strip. | partial — personalised links + server API; authorisation model not inspected. | pending — not measured. |
| C31 UrielOrtizv1000/wedding-invitation | **pass** — MIT, 2026, Uriel Ortiz (verified raw LICENSE). | pending — fonts not stated. | pending — React + TS + Vite, single data file (publisher claim; package.json not fetched); clean build not reproduced. | 3 — token-driven; no invitation opening; envelope/invitation section would be built. | none — explicit swap point for a real backend; all RSVP-/SEC- work new. | publisher claim — skip links, focus traps, reduced motion, tokens with measured contrast; not measured. |
| C36 alt-a concept | **pass** — original code in `docs/selection/proofs/alt-a-editorial-heritage/index.html` (verified). | **pass** — same OFL fonts and derived crest as C01, referenced by relative path (verified README and file). | pending — a single self-contained HTML file with inline CSS; not a production build; would be implemented on C01's build pipeline if chosen. | pass-pending — exact wording, crest 120/160 px, tokens; one visual concern recorded below (name spacing at 1440). | inherits C01 (pending) — no RSVP, access or admin code of its own; the first RSVP screen is a labelled concept with no backend. | pending — smoke run only (skip link first Tab, reduced-motion layer hidden <100 ms, dialog restore); no dialog focus-trap check, no zoom/reflow, no performance run. |
| C37 alt-b concept | **pass** — original code in `docs/selection/proofs/alt-b-couple-template/index.html` (verified). | **pass** — same fonts and crest as C01 (verified README and file). | pending — single self-contained HTML file; not a production build; would be implemented on C01's pipeline if chosen. | pass-pending — exact wording; script-verified closing line identical to informational lines (18 px / 500 / rgb(41,42,40)); crest 160/120 px. | inherits C01 (pending) — labelled "Concept mockup — no working backend". | pending — smoke run only (fonts loaded, entry flow, sticky bar, control audit ≥16 px / ≥44 px, reduced motion, no-JS fallback); no screen reader, no devices, no zoom/reflow, no performance run. |

---

## 3. Detail records — retained candidates, benchmark and branded alternatives

Field order per TPL-04: publisher/repository; listing and demo links; review date; source access; release/commit; stack and dependencies; licence and asset-rights status; costs and currency; gate result; evidence files; exclusion reason. Evidence labels in brackets.

### C01 — Custom component-based composition (benchmark)

- **Publisher/repository:** this repository, `robertandnatalie`, owner-controlled GitHub account; custom domain `robertandnatalie.wedding` attached (README; `CNAME` present — verified file, DNS not checked).
- **Listing / demo:** not applicable (not a marketplace item). Working proof: `docs/proofs/` (47 PNGs + README at `7f8d326`; independently recounted 2026-09-21 — the earlier figure of 48 was wrong. See §6 for working-tree drift since then). Live URL per README: https://robertandnatalie.wedding (not opened in this session — **not verified** as currently deployed).
- **Review date:** 2026-09-21.
- **Source access:** full source in the working tree (verified).
- **Release/commit evaluated:** HEAD `7f8d326186ec5ab18f7c7fa2a7fca05e15658859` (verified). Proof captures and audits were generated from the working tree at `c5ba819` + 7 uncommitted files, 2026-09-21T23:11–23:16Z (verified from `docs/proofs/README.md` and `docs/evidence/results.json`).
- **Stack and dependencies:** static HTML rendered by `scripts/build.mjs` from `content/site.config.json`; `src/js/site.js` (12.3 KB) and `src/js/rsvp.js` (36.5 KB) progressive enhancement; `src/styles/site.css` (29.8 KB); self-hosted woff2 fonts; **no runtime or build dependencies** (`package.json` has none — verified). Dev tooling for proofs/audits: Playwright 1.56.1, Chromium 141.0.7390.37, axe-core 4.10.2 (vendored). Backend reference: Cloudflare Workers + D1, dev-only deps wrangler 4.124.0, vitest 4.1.11, `@cloudflare/vitest-pool-workers` 0.22.0 (publisher claim of `backend/README.md`).
- **Licence and asset rights:** fonts SIL OFL 1.1 (verified texts in `docs/licenses/`); crest derived from owner artwork A1 (asset manifest); repository itself `"license": "UNLICENSED"` / private (verified `package.json`). Photos of unknown provenance are quarantined and unpublished.
- **Costs:** acquisition **not applicable** (no purchase). Recurring: GitHub Pages, domain renewal, Cloudflare Workers/D1, mail provider — **unknown** (no pricing page opened on 2026-09-21; see `KEEP_ADAPT_REPLACE.md`).
- **Gate result:** see matrix; the only pending items are backend deployment (G-E) and manual accessibility/device testing (G-F).
- **Evidence files:** `docs/proofs/README.md` and PNGs; `docs/evidence/ACCESSIBILITY.md`, `PERFORMANCE.md`, `results.json`; `docs/ACCEPTANCE_TESTS.md` (AT-02 variant run); build output recorded in `SELECTION_REPORT.md` §3.
- **Exclusion reason:** none.

### C03 — Marriage – Onepage Wedding Website Template for Astro (TPL-C-02)

- **Publisher:** MadeThemes (independent studio) via Gumroad; also listed on astro.build/themes.
- **Listing:** https://madethemes.gumroad.com/l/marriage — **not opened (EGRESS_BLOCKED)**. **Demo:** https://marriage.madethemes.com/ — **not opened**.
- **Review date:** 2026-09-21. **Source access:** paid Gumroad zip (publisher claim). **Release/commit:** not visible; **not verified**.
- **Stack:** Astro, Tailwind CSS, Alpine.js, component-based (publisher claim via search snippet); versions not stated.
- **Licence / asset rights:** **not verified** — Gumroad page blocked; single-site vs unlimited and image rights unknown.
- **Price:** USD 39 (publisher claim via snippets from madethemes.gumroad.com and astro.build).
- **Gate result:** all pending except G-E fail-as-shipped (client form).
- **Evidence:** search snippets only; no files. **Exclusion reason:** none (retained).

### C04 — Northbound – wedding theme for Astro & Tailwind CSS (TPL-C-03)

- **Publisher:** Lexington Themes (Michael Andreuzza); listed on astro.build and sanity.io/templates.
- **Listing:** https://lexingtonthemes.com/templates/northbound — **not opened**. **Demo:** not captured (link lives on the blocked listing).
- **Review date:** 2026-09-21. **Source access:** paid via Lexington "Full Access" bundle; optional Sanity Studio variant (publisher claim). **Release/commit:** not visible; publisher claims ongoing updates and Tailwind v4 — **not verified**.
- **Stack:** Astro + Tailwind CSS v4; content collections; pages RSVP, Info, Gallery, Wedding Party, Events, Wishlist; style guide (publisher claim).
- **Licence:** https://lexingtonthemes.com/legal/license (blocked). Snippet quotes: "non-exclusive, worldwide, revocable license", "unlimited End Products", no attribution, prohibits redistributing the Resources "including through repositories … CI systems" (publisher claim). The repository clause needs reading before any purchase.
- **Price:** USD 99 one-time "Lifetime Full Access" bundle (publisher claim; snippets conflict on bundle vs per-theme; promo code seen). Individual Northbound price **not verified**.
- **Gate result:** pending across the board; G-E fail as shipped. **Evidence:** snippets only. **Exclusion reason:** none (retained).

### C05 — Forever (paid Astro theme) with Forever Lite (free HTML) (TPL-C-04)

- **Publisher:** Mike Smith Design via Gumroad; Lite on GitHub `mikesmithdesign/forever-lite`.
- **Listing:** https://mikesmithdesign.gumroad.com/l/forever-astro-theme — **not opened**. **Demo:** https://forever-lite.vercel.app (Lite) — **not opened**; paid demo not captured.
- **Review date:** 2026-09-21. **Source access:** Lite README read in full at https://raw.githubusercontent.com/mikesmithdesign/forever-lite/main/README.md (**verified**); Lite is a single `index.html` with a config block and `img/`; paid theme is Astro with five JSON content files (publisher claim in README). **Release/commit:** not captured (GitHub HTML/API blocked) — **not verified**.
- **Stack:** Lite — HTML, CSS animations, Lenis smooth-scroll (verified README). Paid — Astro, JSON content, "password gate styled as your invitation", RSVP with per-guest menu choices posted to inbox, scroll-driven crossfade (publisher claim).
- **Licence:** Lite — "Free for personal and commercial use. Attribution appreciated but not required"; redistribution as a template prohibited (**verified** README text). Paid — **not verified**.
- **Price:** Lite free (verified). Paid — **not verified** (sibling themes listed at GBP 20 per snippet; Forever unconfirmed).
- **Gate result:** Lite passes G-A/G-B; the rest pending; G-E fail as shipped. **Evidence:** README text (verified). **Exclusion reason:** none (retained).

### C06 — Dahlia – Responsive Wedding Invitation (TPL-C-05)

- **Publisher:** lucky_roo via ThemeForest. **Listing:** https://themeforest.net/item/dahlia-responsive-wedding-invitation/45729422 — **not opened**. **Demo:** not captured.
- **Review date:** 2026-09-21. **Source access:** paid Envato zip; HTML/CSS/JS + PHP mailer (publisher claim). **Release/last update:** 23 May 2023 (search snippet; **not verified**). Newer sibling "Loise" (item 52993030) not inspected.
- **Stack:** Bootstrap 5 HTML; Ajax + PHP RSVP; carousel; gallery (publisher claim).
- **Licence:** Envato Regular License (not read) — **not verified**. **Price:** USD 24, "45 sales" (publisher claim via snippet).
- **Gate result:** pending; G-C pending-weak; G-E fail as shipped. **Exclusion reason:** none (retained as low-cost card-led comparator).

### C24 — Matthew14/Wedding (Next.js + AWS) (C-02)

- **Repository:** https://github.com/Matthew14/Wedding. **Demo:** https://oneill.wedding — **not opened (egress blocked)**.
- **Review date:** 2026-09-21. **Source access:** open, MIT (**verified**). **Commit:** latest 2026-07-25 "chore: localstack community image (pinned to 4.x) (#207)" (**verified** on commits page).
- **Stack:** Next.js 15.5.18 (App Router), React 19.0, TypeScript, Mantine 7.15.2, Tabler icons, AWS SDK (DynamoDB, Cognito, S3, Lambda, CloudWatch), Amplify, sharp, react-photo-album, yet-another-react-lightbox, PostHog, Vitest (**verified** package.json). Fonts Geist Sans/Mono (README).
- **Licence:** MIT, Copyright (c) 2024 Matthew (**verified**). **Price:** free; recurring AWS costs **unknown**.
- **Gate result:** G-A/G-B pass; G-C/G-D/G-F pending; G-E partial (server-side RSVP exists; PRD-specific invariants not verified). **Exclusion reason:** none (retained as the server-RSVP comparator).

### C30 — sakeenah-wedding/template (C-08)

- **Repository:** https://github.com/sakeenah-wedding/template (GitHub template repo). **Demo:** https://invitation.sakeenah.site/ — **not opened**.
- **Review date:** 2026-09-21. **Source access:** open, Apache-2.0, Copyright 2024-present mrofisr (**verified** raw LICENSE). **Commit:** pushed_at 2026-07-29 (GitHub API, **verified**); 205 stars, 57 forks.
- **Stack:** Bun, React 19 + Vite, Hono edge API, PostgreSQL, Tailwind 4, Motion, Lucide; Cloudflare Workers or Docker (README, publisher claim).
- **Licence:** Apache-2.0 (verified). **Price:** free; Cloudflare/Postgres hosting **unknown**.
- **Gate result:** G-A pass; others pending; G-E partial. **Exclusion reason:** none (retained; envelope + personalised links precedent).

### C31 — UrielOrtizv1000/wedding-invitation (C-09)

- **Repository:** https://github.com/UrielOrtizv1000/wedding-invitation. **Demo:** none in README (**verified**).
- **Review date:** 2026-09-21. **Source access:** open, MIT, 2026, Uriel Ortiz (**verified** raw LICENSE). **Commit:** latest 2026-09-17 "docs: add the security policy and a pull request template (#2)" (**verified**); 0 stars.
- **Stack:** React, TypeScript, Vite; content in `src/data/wedding.ts` and `images.ts`; DESIGN.md with contrast-rated tokens (README, publisher claim; package.json not fetched).
- **Licence:** MIT (verified). **Price:** free.
- **Independent review (opened https://github.com/UrielOrtizv1000/wedding-invitation on 2026-09-21, verified):** MIT licence, 0 stars, 6 commits confirmed. The README also states that the interface is **Spanish-language only with no internationalisation**, that the RSVP form is a placeholder submission, that all content is invented placeholder data, and that there is **no test suite**. A full UI-string rewrite would therefore be required; this was not in the original screening note and should be weighed against the "cleanest starter" retention reason.
- **Gate result:** G-A pass; G-B/G-C/G-D/G-F pending; G-E none (build new). **Exclusion reason:** none (retained as the cleanest starter).

### C36 — alt-a-editorial-heritage (original concept composition)

- **Repository:** `docs/selection/proofs/alt-a-editorial-heritage/` (index.html 33.5 KB, capture.mjs, capture-results.json, README.md, 18 PNGs) — **verified** (recounted 2026-09-21; the earlier figure of 20 was wrong).
- **Review date:** 2026-09-21; captured 2026-09-21T23:25:44Z with Chromium 141.0.7390.37 (capture-results.json).
- **Source access:** original work in this repository; no template source, theme or third-party asset copied (README statement; the hex-colour audit and relative font/crest references were **verified** by reading the README and file listing).
- **Stack:** single HTML file with inline CSS and a small script; fonts and crest referenced from `src/` by relative path.
- **Rights:** same OFL fonts and derived crest as C01 — pass.
- **Costs:** not applicable (no acquisition). If chosen, effort is in `KEEP_ADAPT_REPLACE.md`.
- **Gate result:** see matrix. **Visual observations (viewed 2026-09-21):** at 1440 the invitation panel sits left of an editorial column, so the names share the opening with the date/destination block rather than dominating it; in `entry-opened-1440.png` "Robert and Natalie" is set on one line and the word spacing around "and" reads tight (DES-04 asks that lettering never be compressed — needs a design check before any production use). At 390 in the docked state the keepsake tile overlaps the "Wedding Day" heading text. The concept banner adds height above the navigation.
- **Exclusion reason:** none (branded alternative).

### C37 — alt-b-couple-template (original concept composition)

- **Repository:** `docs/selection/proofs/alt-b-couple-template/` (index.html 53.0 KB, capture.mjs, capture-results.json, README.md, 23 PNGs) — **verified** (recounted 2026-09-21; the earlier figure of 25 was wrong). Untracked in git at the time of writing (`git status`); committed at `7f8d326`.
- **Review date:** 2026-09-21; captured 2026-09-21T23:35:20Z with Chromium 141.0.7390.37, Node v22.22.2.
- **Source access:** original work in this repository (README statement; file listing verified).
- **Stack:** single HTML file with inline CSS/SVG paper texture and a script; fonts and crest from `src/`; calendar/privacy links point into the gitignored `dist/` and resolve only after `npm run build`.
- **Rights:** same as C01 — pass.
- **Gate result:** see matrix. **Visual observations (viewed 2026-09-21):** `entry-invitation-390.png` shows a clean centred invitation with "Continue to the website" pinned in view; in `keepsake-docked-390.png` the keepsake tile overlaps the hero's "wedding of Robert and Natalie" line and the date, the three-item navigation wraps to two rows at 390 and the concept banner occupies three lines, pushing the hero down. The README itself records the phone keepsake/RSVP-bar overlap as an open design decision.
- **Exclusion reason:** none (branded alternative).

---

## 4. Search record (TPL-03: date, method, exact links)

- **Search date:** 2026-09-21 (both sweeps).
- **Method:** web search queries listed in the two research logs (commercial sweep: 40 queries across ThemeForest, Envato Elements, Gumroad, Creative Market, TemplateMonster, astro.build, Lexington Themes, TailTemplate, Wrapmarket, Framer, Webflow, Cosmic, Colorlib; open-source sweep: GitHub repositories with README/package.json/LICENSE reads via raw.githubusercontent.com and the GitHub API where reachable). Example PRD terms used: "couple wedding invitation React source", "Astro wedding website template premium buy invitation RSVP", "accessible" starters.
- **Fetch attempts:** every commercial host listed in the summary above returned `EGRESS_BLOCKED`; the one successful commercial-side fetch was the Forever Lite raw README. Open-source fetches that succeeded: raw LICENSE/README/package.json and commits pages for C23–C35 as noted per row.
- **Purchases:** none made, none recommended by the agent (TPL-06/TPL-11: G1 authorises any specific purchase).

## 5. Open items carried to `SELECTION_REPORT.md`

1. All external retained candidates need their listing, demo, licence text and — after a named G1 purchase approval — source opened from a network without the egress block before any gate can move from pending.
2. C04 pricing (per-theme vs USD 99 bundle) and its "repositories" redistribution clause need reading.
3. C05 paid-theme price and licence unread; C03 licence unread.
4. The open-source sweep record is truncated after C35; the sweep should be re-run or its full log attached.
5. C01's live deployment status was not checked from this session; the register records the repository state only.
6. Listing/demo links are missing for rejected rows C09–C17, C19, C20 and C22 (see §1.1); TPL-04 asks for them on every row.
7. C31's Spanish-only UI and absent test suite (verified 2026-09-21) were not in the original screening note.

## 6. Independent review record (2026-09-21)

Performed by a second agent against PRD TPL-01–TPL-12 and AT-17–AT-22 after the package was written. Factual only; it records no approval.

- **External sources re-opened:** `madethemes.gumroad.com/l/marriage`, `lexingtonthemes.com/templates/northbound` and `themeforest.net/item/…/45729422` each returned `EGRESS_BLOCKED` again, so the "not opened" labels on C03, C04 and C06 are accurate. `github.com/Matthew14/Wedding` (MIT; README lists Next.js 15 App Router, Mantine 7.15.2, Amplify, Cognito, DynamoDB, Geist fonts; invitation-code RSVP and Cognito-protected dashboard described), `github.com/sakeenah-wedding/template` (Apache-2.0; 205 stars, 57 forks; Bun/React 19 + Vite/Hono/PostgreSQL/Tailwind v4/Motion/Cloudflare Workers; demo https://invitation.sakeenah.site/), `github.com/UrielOrtizv1000/wedding-invitation` (MIT; 0 stars; React/TypeScript/Vite; `src/data/wedding.ts`, `images.ts`, `DESIGN.md`; accessibility claims as recorded; no demo) and the Forever Lite raw README (licence sentence quoted verbatim in the C05 record; Lenis; paid-theme features as recorded; demo https://forever-lite.vercel.app) were opened and **match the register**. C24 shows 1 star (not previously recorded).
- **Local facts re-checked:** `package.json` at `7f8d326` has no dependency blocks (as recorded); `src/js/site.js` 12,310 B, `src/styles/site.css` 29,808 B, `src/js/rsvp.js` 36,455 B at that revision (as recorded); alt-a `index.html` 33,539 B, alt-b `index.html` 52,955 B; capture timestamps and Chromium 141.0.7390.37 in both `capture-results.json` files; `docs/evidence/results.json` `generatedAt` 2026-09-21T23:16:30Z, `commit` `c5ba819`; axe-core 4.10.2, LCP medians 1484/1204 ms, 267.0 kB transfer in the evidence files; 21 rows in the proofs overflow table; keepsake 39×108 px at 390 and 98×160 px at 1440 in `docs/proofs/README.md`; `docs/licenses/` and `scripts/vendor/axe-core-LICENSE.txt` present; PRD is 604 lines; PRD §06 gives "With joy and gratitude" in lower case while `content/site.config.json` notes the artwork capitalisation, as the scorecard says.
- **Corrections made in place:** capture counts (47, not 48, in `docs/proofs/` at `7f8d326`; 18, not 20, in alt-a; 23, not 25, in alt-b); §1.1 links added; C31 observation added.
- **Working-tree drift since the package was written (not a defect of the package, but owners should know):** HEAD is now `1fd1aa3` (adds `docs/PRD_GAP_ANALYSIS.md` only). Uncommitted in the working tree: `package.json` now declares `devDependencies: { playwright: ^1.56.1 }` (the "no dependencies" statement holds for `7f8d326` only); `src/js/site.js`, `src/styles/site.css`, `scripts/build.mjs`, `scripts/templates/*.mjs` and the workflows are modified; `docs/proofs/` has been re-captured (28 PNGs modified, `invitation-text-200pct-1440.png` deleted, `CHECKLIST.md` added). The captures the scorecard scored are the committed versions at `7f8d326`/`1fd1aa3` (`git show 7f8d326:docs/proofs/<file>`), not the current working-tree files. The re-capture has not been evaluated by this package or this review; the 200 % text-zoom evidence cited by SCORECARD criterion 5 must be re-generated or restored before G2.

