# Live-site audit (22 September 2026): response and current-state map

Response by the implementation team to the *Live Website Audit and Claude Code Implementation Brief v1.0* (handoff of 22 September 2026). The handoff's own files are tracked here with honest statuses: `implementation-backlog.json` (24 tasks), `acceptance-tests.json` (32 scenarios), `approval-register.json` (16 owner decisions) and `BACKEND_QA_MATRIX.md` (service scenarios QA-10 to QA-22). The audit's read-only capture tool is in the repository as `scripts/capture-public-site.mjs`.

## 1. Baseline (IMP-01)

| Item | Value |
|---|---|
| Repository | `coulsonrw/robertandnatalie`, default branch `main` |
| Deployed revision at the time of this response | `617b182` (merge of PR #2, deployed 14:05 UTC on 22 September 2026 by `.github/workflows/deploy.yml`) |
| Hosting | GitHub Pages, source *GitHub Actions*, custom domain `robertandnatalie.wedding` (apex A records and `www` CNAME verified); HTTPS certificate approved, *Enforce HTTPS* not yet ticked |
| Build | Zero-dependency Node build: `content/site.config.json` → `scripts/build.mjs` → `dist/`; `npm run check`, `npm test`, `npm run build`, `npm run register`; CI validates every pull request and runs the backend suite |
| Public routes | `/`, `/celebration.html`, `/rsvp.html`, `/privacy.html`, `/404.html`, `/calendar/ceremony.ics`, `/calendar/reception.ics`; anchors `#wedding-day`, `#travel-stay`, `#questions`, `#invitation` |
| RSVP state when inspected | `rsvp.mode` = `coming-soon`; no form; the backend reference implementation (`backend/`, Cloudflare Workers + D1) exists with a passing test suite and is not deployed |
| Assets | Crest A1 and invitation A2 in `assets/`; the handoff's copies of both are byte-identical to the repository's |
| Fresh read-only baseline | `scripts/capture-public-site.mjs` run against the local build of this revision at 320/390/768/1440 (`docs/evidence/public-capture/local-build-capture-summary.json`): 16 captures, HTTP 200 everywhere, no console errors, no failed requests, no horizontal overflow, every image loaded, both calendar files served as `text/calendar` with `TZID=America/Chicago` starts. The tool could not be pointed at the live domain from this environment (egress policy); run `npm run capture:public` from any network-capable machine. On `/` the sealed-envelope state shows no visible `<h1>` element by design (the names heading on the card carries `role="heading" aria-level="1"`); the evidence file already records this best-practice deviation. |

Rendered states at the four widths, keyboard, reduced motion and 200% text: `docs/proofs/`. axe-core and lab performance: `docs/evidence/`.

## 2. Findings revalidated against the source

| Finding | Audit position | Current state after this response |
|---|---|---|
| F01 `/rsvp.html` pre-opening, not a form | Observed | True and intended. States are configured, not ad hoc: `coming-soon` (now labelled "Not yet open"), `live`, `closed`, and the post-event phase; the client renders an explicit unavailable state on service errors with nothing lost. The welcome area says "Responses are not open yet". An approved opening date can be announced through `rsvp.opensAt` and appears in both places only when set (IMP-02). |
| F02 deadline without a date | Observed | Fixed at the wording level: the FAQ no longer defers to the paper invitation; it says the deadline will be published here and on the RSVP page, and it switches to the dated wording (`answerWithCutoff`, with time zone) the moment `rsvp.cutoffAt` is set. The value is an owner input and is still null (IMP-07, register row 4). |
| F03 no actionable contact | Observed | Structure exists (`contact.email`/`contact.phone` flow to the FAQ, the RSVP states, the client's help lines and the privacy notice); the values are owner inputs and are still null. The build reports this as a launch blocker; nothing is invented (register rows 4, 11, 20). |
| F04 no Our Story | Observed | Module built and switched off: section, conditional navigation, responsive order, captions without hover, no carousel or lightbox, lazy loading of non-lead pictures, build gating on approvals and rights, and a synthetic-fixture layout preview at `/story-preview.html` in local/CI builds only. Publishing needs the owners' copy and photographs (`docs/OUR_STORY_INTAKE.md`, register row 22). |
| F05 narrow travel guidance | Observed | "Nearest named airport" wording removed. Airports now carry their own approvals with official sites; Pensacola and Gulf Shores are prefilled from the audit's source register and unpublished until the coordinator verifies December 2026 service (register row 23). Venue entrances, arrival, parking, transfer and attire stay unpublished pending the coordinator and owners (rows 5 and 7). |
| F06 unnamed RSVP service | Site-stated | Still truthful: the notice says the service will be named before responses open. Provider, retention and the keepsake exception are owner decisions (rows 11 and 24). Architecture proposal: §3. |
| F07 opening instructions | Observed / verify | Preserved. The seal is a `<button>` with an accessible name; the entry bar always offers "Skip to the wedding details" and RSVP; deep links, `/celebration.html` and same-session returns bypass the envelope; reduced motion shows the invitation immediately; no audio. Evidence: entry, keyboard and reduced-motion proofs. |
| F08 repeated names in extracted text | Verify | Explained: the card's names heading is `aria-level` 1 while the entry stage is showing and 2 once the site's `<h1>` is visible; only the active state is exposed. Recorded in `docs/evidence/ACCESSIBILITY.md`. |
| F09 event cards, calendars, maps | Preserve | Preserved. Calendar files validated at file level (`npm test`, QA-23): CRLF, folding, VTIMEZONE, starts at 20:00Z and 22:00Z, stable UIDs, no invented end. Client imports and confirmed entrances remain open. |
| F10 unmeasured rendering, focus, performance, backend | Verify | Measured in the lab: proofs at four widths, axe-core with zero violations in every state, five lab runs per route within the PRD budgets. Backend scenarios: `BACKEND_QA_MATRIX.md`. Screen-reader sessions, physical devices, calendar clients and the pilot remain not run. |

## 3. Architecture and privacy decision proposal (IMP-03)

Recommended model: **public information site + private household RSVP service.** The static site stays on GitHub Pages (no guest data, `noindex` until the owners choose otherwise). The RSVP service is the existing `backend/` reference implementation on Cloudflare Workers with D1, deployed to a first-party subdomain (for example `rsvp.robertandnatalie.wedding`) under the owners' account, with admin routes behind Cloudflare Access (named staff accounts, MFA by policy) and a transactional mail provider named in the privacy notice. Credentials are random, household-scoped, digest-stored and revocable; the session is an HttpOnly, Secure, host-scoped cookie; link tokens are read from the URL fragment and exchanged only on an explicit action. `/rsvp.html` remains the entry route and needs no HTTP redirect.

This records a deviation from the PRD's proposed private logistics pages. The alternative (invitation-only site) would require authentication in front of every page, calendar and image, which GitHub Pages cannot provide; it would mean moving the whole site behind the Worker. Nothing in this proposal is decided: register rows 2 (visibility) and 14 (public review builds), 11 (providers and retention) and 24 (keepsake exception) are the owners'.

## 4. Changed-file map for this response

| Area | Files |
|---|---|
| Content model | `content/site.config.json` (`rsvp.opensAt`, `faqs[rsvp-when].answerWithCutoff`, `travel.gettingThere.airports[]` with approvals and `airportsNote`, `story` block) |
| Build | `scripts/build.mjs` (validation, view, emission and readiness for the above), `scripts/fixtures/story-preview.mjs`, `scripts/images.mjs`, `scripts/capture-public-site.mjs` |
| Templates and styles | `scripts/templates/index.mjs` (airports, hero note, story section, preview page), `layout.mjs` (navigation, canonical), `rsvp.mjs` (states), `privacy.mjs` (canonical), `src/styles/site.css` |
| Tests and evidence | `scripts/test.mjs` (seven new tests), `scripts/proofs.mjs` and `scripts/audit.mjs` (story preview state), `docs/proofs/`, `docs/evidence/` |
| Records | `docs/audit/*`, `docs/OUR_STORY_INTAKE.md`, `docs/DECISION_REGISTER.md` rows 21–24, `docs/CHANGELOG.md`, `docs/RUNBOOK.md` §13–15, `README.md`, `assets/ASSET_MANIFEST.md`, `assets/story/*/README.md`, `.gitignore` |
| Backend | See `BACKEND_QA_MATRIX.md` for the files reviewed or changed |

## 5. Task status and sequence

Package A (baseline and decisions): baseline done; decisions proposed, none recorded. Package B (immediate guest clarity): done at the implementation level; the deadline, contact and logistics values are owner and coordinator inputs. Package C (RSVP and coordination): implemented and tested in the repository, not deployed; needs the owners' hosting and mail accounts. Package D (story and travel): module and pipeline built; content withheld until approved. Package E (verification and release): lab evidence refreshed; the pilot, screen-reader sessions, calendar-client imports, backup drill and release authorization remain open.

Per-task statuses and evidence: `implementation-backlog.json`. Per-scenario results: `acceptance-tests.json` (statuses `passed_lab`, `partially_passed_lab`, `passed_lab_synthetic`, `see_backend_matrix`, `not_run`).

## 6. What only the owners or the coordinator can supply

Visibility policy; RSVP opening date and cutoff; support contact; household roster, entitlements, children and plus-one policy; ceremony space and entrance; reception room and entrance; arrival and parking; transfer between venues; room block or general reservations; attire; meal questions; the story copy and photographs with rights; providers and retention (and the keepsake exception); release authorization. Each is a row of `docs/DECISION_REGISTER.md` and an entry of `approval-register.json`, and each has a configuration field waiting for it. No value has been fabricated to fill a gap.
