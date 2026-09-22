# RSVP API — reference implementation (Cloudflare Workers + D1)

This directory is a reference backend for the RSVP contract in `../docs/RSVP_API_CONTRACT.md`, written against PRD v1.1 Sections 08–12. The static site on GitHub Pages calls it from `src/js/rsvp.js`; nothing in the static site stores guest data.

**Status (21 September 2026):** built and tested locally in the Workers runtime with a local D1 database (52 tests, see "Tests"). It has **not** been deployed to any Cloudflare account, no domain has been attached, no Access application exists, and no mail provider is connected. Everything about Cloudflare's hosted behaviour below is labelled *publisher claim* or *not verified* unless it was observed here.

## Layout

| Path | Purpose |
|---|---|
| `wrangler.toml` | Worker configuration: D1 binding `DB`, cron trigger, custom domain route, plain variables. No secrets. Every binding is commented. |
| `migrations/0001_init.sql` | Schema for every PRD §10 entity with the invariants as constraints. Applied with `wrangler d1 migrations apply`. |
| `src/index.js` | Entry point: `fetch` (routing, CORS, security headers, redacted request log) and `scheduled` (mail outbox + retention). |
| `src/session.js`, `src/response.js`, `src/snapshot.js` | Guest endpoints `POST/GET/DELETE /session`, `PUT /response`, the session snapshot. |
| `src/admin/*` | `/admin` routes: Access JWT check, CSV import (preview/commit), reports, exports, credentials, corrections, content versions. |
| `src/mail/*` | Outbox worker, provider adapter interface (`stub`, `webhook`), plain-text templates. |
| `src/retention.js` | Retention rule (SEC-06), idempotent, re-runnable after a restore. |
| `src/events.js`, `scripts/events-sync.mjs` | Event rows derived from `../content/site.config.json` (DATA-01). |
| `test/*.test.js` | Vitest suites running inside workerd via `@cloudflare/vitest-pool-workers`. |
| `.dev.vars.example` | Credential-free template for local secrets. |

Dependencies: `wrangler`, `vitest`, `@cloudflare/vitest-pool-workers` (dev only). No runtime dependencies, no ORM.

## Meal choices (RSVP-03)

Meals are collected only when `content/site.config.json` → `rsvp.mealChoices` names an event and at least two options; `scripts/events-sync.mjs` (or `PUT /admin/events`) stores the list on that event row (`event.meal_options_json`, migration `0002`). The server then requires a choice from the list for every guest attending that event, ignores meals for other events or for declining guests, returns the value as `meal` in the snapshot, exports it with attendance, and keeps it out of audit details (`test/meals.test.js`).

## Local development and tests

```bash
cd backend
npm install            # .npmrc sets legacy-peer-deps=true: npm 10.9.7 fails to resolve vitest 4.1's peer set otherwise (observed here)
npm test               # vitest inside workerd with a local D1; migrations applied from ./migrations
```

Observed test run (Node 22.22.2, npm 10.9.7, vitest 4.1.11, @cloudflare/vitest-pool-workers 0.22.0, wrangler 4.124.0, miniflare 5.20260815.0-alpha, workerd 2026-08-15):

```
 Test Files  5 passed (5)
      Tests  52 passed (52)
```

To run the Worker locally against a local D1 file:

```bash
cp .dev.vars.example .dev.vars           # then put real random values in CREDENTIAL_PEPPER and SESSION_SECRET
npm run migrate:local
node scripts/events-sync.mjs > /tmp/events.sql && npx wrangler d1 execute rsvp --local --file /tmp/events.sql
npm run dev                              # http://localhost:8787
```

With `ENVIRONMENT=development` and `ACCESS_DEV_BYPASS=true` (as in `.dev.vars.example`) admin requests identify themselves with the header `x-dev-access-email: owner@example.invalid`. Production ignores this header entirely (`ENVIRONMENT = "production"` in `wrangler.toml`); the bypass exists only so the admin routes can be exercised in tests and on a laptop.

Point the static site at it for a local end-to-end check: set `rsvp.mode` to `live` and `rsvp.apiBaseUrl` to `http://localhost:8787` in a **local copy** of `content/site.config.json`, and `SITE_ORIGIN=http://127.0.0.1:8080` in `.dev.vars`. Note that the `Secure` cookie attribute means the browser only stores the session cookie on `https://` or `localhost`; use `http://localhost:8080` for the site rather than `127.0.0.1` when testing the cookie flow.

## Deployment into the owners' Cloudflare account (ARCH-06)

Prerequisites: a Cloudflare account owned by Robert / Natalie (not a developer's personal account), with the `robertandnatalie.wedding` zone on Cloudflare DNS if the custom domain in `wrangler.toml` is to be used (custom domains for Workers require the zone to be on Cloudflare — *not verified here*; if DNS stays elsewhere, use a `workers.dev` hostname and note that the session cookie then becomes cross-site, which `SameSite=Lax` does not send: the custom subdomain is the supported shape).

1. `npx wrangler login` as the owner account.
2. `npx wrangler d1 create rsvp` and paste the returned `database_id` into `wrangler.toml` (`[[d1_databases]]`).
3. `npm run migrate:remote` (applies `migrations/0001_init.sql`).
4. Seed events from the site's single source of truth: `node scripts/events-sync.mjs > /tmp/events.sql && npx wrangler d1 execute rsvp --remote --file /tmp/events.sql`. Re-run whenever `content/site.config.json` events change (or `PUT /admin/events` with the same JSON as an owner).
5. Secrets (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`):
   - `npx wrangler secret put CREDENTIAL_PEPPER`
   - `npx wrangler secret put SESSION_SECRET`
   - only if `MAIL_PROVIDER = "webhook"`: `MAIL_WEBHOOK_URL`, `MAIL_WEBHOOK_TOKEN`
   Transfer any value that has to be shared through the owners' approved secure channel (OPS-01), never in chat, email or the repository.
6. Cloudflare Access (ADMIN-01): in Zero Trust, create a self-hosted application for `api.robertandnatalie.wedding` with path `/admin` (covering `/admin/*`), an Allow policy listing the named owner and coordinator accounts, and a rule requiring multi-factor authentication for that policy. Copy the application's **Audience (AUD) tag** and the team domain (`<team>.cloudflareaccess.com`) into `wrangler.toml`: `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `OWNER_EMAILS`, `COORDINATOR_EMAILS`. The Worker verifies the `Cf-Access-Jwt-Assertion` header on every `/admin` request (`src/admin/auth.js`); an email that is authenticated by Access but not in either list is refused. Confirm the header name, certificate URL (`https://<team>/cdn-cgi/access/certs`) and claim names against current Cloudflare documentation before go-live (*not verified*: the documentation host was unreachable from the build environment). A mismatch fails closed.
7. Set the remaining `[vars]` in `wrangler.toml`: `RSVP_CUTOFF_AT` (once approved), `COORDINATOR_EMAIL`, `MAIL_PROVIDER`, `MAIL_FROM` (an address the owners control; RSVP-07).
8. `npm run deploy`. Check `https://api.robertandnatalie.wedding/health` returns `{"ok":true,"environment":"production"}` and that `/admin/status` without an Access login is blocked by Access (before it even reaches the Worker).
9. Cron: `[triggers] crons = ["*/5 * * * *"]` in `wrangler.toml` registers the outbox/retention job at deploy time; confirm it in the dashboard's Worker → Triggers page.
10. Front end: in `content/site.config.json` set `rsvp.mode` to `live`, `rsvp.apiBaseUrl` to `https://api.robertandnatalie.wedding`, `rsvp.cutoffAt` to the same value as `RSVP_CUTOFF_AT`, and `privacy.rsvpProvider` to name Cloudflare; rebuild and deploy the site.

### Values that must stay identical in both places (DATA-01)

| `content/site.config.json` | `wrangler.toml` / API |
|---|---|
| `couple.displayName` | `COUPLE_DISPLAY_NAME` |
| `wedding.date`, `wedding.timezone`, `wedding.destination` | `WEDDING_DATE`, `EVENT_TIMEZONE`, `WEDDING_DESTINATION` |
| `events[]` | `event` table via `scripts/events-sync.mjs` |
| `rsvp.cutoffAt` | `RSVP_CUTOFF_AT` (or the owner-set `rsvp-settings` content) |
| `privacy.retentionDaysAfterWedding` | `RETENTION_DAYS_AFTER_WEDDING` |
| `banner` | `urgent-banner` content served at `GET /content/urgent-banner` |

## Operating runbook (OPS-01)

All admin calls need an Access login (or the local bypass) and, for anything other than GET, the header `X-Requested-With: rsvp-admin` and `Content-Type: application/json` (CSV import uses `text/csv`). Roles: **owner** (everything), **coordinator** (reports, outstanding list, general export, phone/email responses, outbox and alerts, content read).

| Task | How |
|---|---|
| Import or re-import the roster | `POST /admin/import/preview` with the CSV body → review `errors`, `warnings`, counts → `POST /admin/import/commit {"batchId"}`. Columns: `household_id, household_label, household_contact_email, guest_id, guest_kind (named\|plus-one), guest_name, host_guest_id, events (ids separated by \|)`. IDs are immutable; a guest id cannot move household; re-import never resets responses; an entitlement missing from the file is revoked (response retained, hidden from the guest); a guest missing from the file is left unchanged and listed in `warnings`; a revoked household or guest that reappears in the file is reinstated on commit and listed in `warnings` first. |
| Issue access | `POST /admin/households/{id}/credentials {"kind":"link"}` returns the personal link (`…/rsvp.html#t=<token>`, 256-bit token) **once**; `{"kind":"code"}` returns a 12-symbol fallback code (about 59 bits, rate-limited on entry). Only digests are stored. |
| Revoke / reissue | `POST /admin/credentials/{id}/revoke` (also ends its sessions), then issue a new one. `POST /admin/households/{id}/revoke` blocks the whole household; `/reinstate` reverses it. |
| Outstanding responses | `GET /admin/report/households?status=no_response,incomplete` (ADMIN-04 follow-up list). |
| Counts by event and person | `GET /admin/report/events`, `GET /admin/report/people`. |
| Safe export | `GET /admin/export/general.csv` — attendance, plus-one names, meal values, contact email; no notes; formula cells neutralised; timestamped and audited with the exporter. |
| Restricted notes | `GET /admin/export/restricted.csv` — owner only, audited (SEC-05). Release only to the named recipients recorded in `allowed_recipients`. |
| Record a phone/email response | `PUT /admin/households/{id}/response {"origin":"coordinator-phone","reason":"…","responses":[…],"contactEmail":"…"}`. Partial answers allowed: pairs, `contactEmail` and meal choices that are omitted keep their stored values; send `"contactEmail":""` to clear the address. |
| Correct after the cutoff | Same endpoint with `"origin":"owner-correction"` (owner). Each change is written to `response_history` and the audit trail with before/after statuses; the household revision increments so a guest with an open page sees a conflict instead of overwriting. |
| Urgent logistics banner | `PUT /admin/content/urgent-banner {"body":{"active":true,"message":"…","linkUrl":"https://…","linkLabel":"…"},"note":"…"}`; every save is a new version. `GET /admin/content/urgent-banner` shows history; `POST /admin/content/urgent-banner/rollback {"version":n}`. Public read: `GET /content/urgent-banner` (cacheable 60 s). |
| Change the cutoff / close editing | `PUT /admin/content/rsvp-settings {"body":{"cutoffAt":"2026-11-20T23:59:59-06:00","open":true}}`; after the wedding set `"open":false` (OPS-03). Mirror the cutoff in `content/site.config.json`. |
| Mail problems | `GET /admin/outbox?state=queued|abandoned`, `GET /admin/alerts`, `POST /admin/alerts/{id}/ack`; `POST /admin/mail/process` runs the sender by hand. Abandoned mail never undoes a saved RSVP. |
| Audit | `GET /admin/audit?householdId=…` (owner). Entries carry actor, action, changed field names and statuses; never notes, emails or credentials. |
| Take the API offline | Set `rsvp.mode` to `closed` in the site config (guests see the closed text) and either `PUT /admin/content/rsvp-settings {"body":{"open":false}}` or `npx wrangler delete`. A deleted Worker keeps its D1 database. |

### Manual RSVP fallback (RSVP-06, SEC-07)

If the service is unavailable or a guest cannot use the form: the coordinator takes the household's answers by telephone or email (guest name, each event, attending/declining, plus-one name if used, contact email), records them on paper or in a private owner-controlled sheet with the time and origin, and enters them with `PUT /admin/households/{id}/response` (`origin: coordinator-phone` or `coordinator-email`) as soon as the service is back. The audit trail records the origin. Do not collect dietary/access notes by email; ask the guest to share them with the coordinator directly.

## Backup and restore (SEC-06, SEC-07)

Two mechanisms, both operated from the owners' account:

1. **D1 Time Travel** (built in; *publisher claim*, observed only through `wrangler d1 time-travel --help` here): `npx wrangler d1 time-travel info rsvp --timestamp <RFC3339>` retrieves a bookmark; `npx wrangler d1 time-travel restore rsvp --timestamp <RFC3339>` (or `--bookmark`) restores the database to that point. The CLI help states timestamps must be "within the last 30 days", which matches the SEC-06 requirement that provider backups age out within a further 30 days. These commands act on the remote database only.
2. **Daily SQL export**: `npx wrangler d1 export rsvp --remote --output backups/rsvp-$(date -u +%F).sql` (flags observed in `wrangler d1 export --help`). Run it daily from an owner-controlled machine or a scheduled job in the owners' account, store the files encrypted, and **delete them on the same 30-day schedule** — an export is personal data and is not exempt from the retention rule. Restore with `npx wrangler d1 execute rsvp --remote --file backups/rsvp-YYYY-MM-DD.sql` into a fresh database created with `wrangler d1 create`, then point `wrangler.toml` at it and redeploy.

After **any** restore: run `POST /admin/retention/run {"force":false}` (owner) so the deletion rule is re-applied if the retention date has passed, and revoke/reissue credentials if the restore predates a revocation. Encryption at rest of D1 and its backups is a Cloudflare platform property (*not verified here*); record the owners' confirmation in the decision record before launch.

**Restore test before launch (AT-16):** deploy to a staging Worker with synthetic guests, save a response, export, create a second database, import the export, point the staging Worker at it, and confirm `GET /session` shows the same revision and reference. Record date, operator and outcome. Recovery objectives in the PRD (≤ 24 h of lost updates, ≤ 4 h to restore) are targets to validate in that test, not properties this code guarantees.

## Mail (RSVP-07, ARCH-03)

Confirmation mail is enqueued in the same D1 batch as the response and sent by the cron job through `src/mail/provider.js`. The provider interface is one method, `send({from,to,subject,text}) -> {messageId}`. Included: `stub` (accepts and discards; tests and local use) and `webhook` (POSTs a JSON envelope to `MAIL_WEBHOOK_URL` with a bearer token, for a small relay in front of the owners' chosen transactional provider). A direct adapter for a specific provider must be written against that provider's current documentation and the sending identity must be owned by Robert / Natalie. Retries back off from 5 minutes to 6 hours; after `MAIL_MAX_ATTEMPTS` (8) or `MAIL_MAX_AGE_HOURS` (48) a row is abandoned and a coordinator alert is raised (and emailed when `COORDINATOR_EMAIL` is set). Bodies contain the date, per-event attendance and the correction route; never the notes.

## How the PRD requirement IDs are met

Legend: **met** (implemented and covered by a test here), **partly** (implemented, but something outside this directory or a deployment step remains), **open**.

| ID | Status | How / what remains |
|---|---|---|
| RSVP-01 | met | Per-household link tokens and fallback codes, digests only, revocable; `POST /session` neutral errors; snapshot exposes one household. Credential delivery method remains an owner decision (PRD §16). |
| RSVP-02 | met | Server-side entitlement check per guest and event; plus-one is a slot whose name is required only when attending; children only as named invitees from the import. |
| RSVP-03 | met | Declining households need no email; notes cleared when nobody attends; no meal questions (none configured). |
| RSVP-04 | met | Every entitled pair must be answered; no "maybe"; `423 closed` after the cutoff or when `rsvp-settings.open` is false; audited owner correction with `response_history`. |
| RSVP-05 | met | One D1 batch per save; `idempotency_record` returns the stored result on retry; `household_revision` guard turns a race into `409 conflict` with `latest`. |
| RSVP-06 | partly | Explicit error codes for the front end; coordinator fallback documented above. Page-memory retention on failure is the front end's job (implemented in `src/js/rsvp.js`). |
| RSVP-07 | met | Outbox row committed with the response; background sender with retries, max age and coordinator alert; notes excluded. Sending identity: owner decision. |
| ADMIN-01 | partly | Owner and coordinator roles enforced per route; Access JWT verification implemented. The Access application with MFA must be created in the owners' account (deployment step 6) and the JWT details confirmed against current documentation. |
| ADMIN-02 | met | CSV preview with validation (duplicate ids, missing invitees, unknown events, conflicting updates), immutable ids, commit by batch id, re-import preserves responses, phone/email responses recorded with origin. |
| ADMIN-03 | met | Household status (no response / incomplete / complete), people counted per event, general export without notes, separate audited restricted export, formula neutralisation, timestamp and exporter recorded. Meal values are exported when configured; no meal configuration exists yet. |
| ADMIN-04 | partly | Versioned urgent banner with rollback and `rsvp-settings`. FAQs, venue notes and hotel links are edited in `content/site.config.json` with its approval register and a rebuild (the static site's mechanism), not through this API. |
| DATA-01 | met | Events derived from `content/site.config.json`; counts derived from entitlements and responses. The duplicated scalar values are listed above. |
| DATA-02 | met | Foreign keys, CHECK constraints on statuses/kinds/states, unique entitlement pair, one response per entitlement, UTC timestamps with `event.timezone` separate; audit records actor and field names only. |
| DATA-03 | met | Tests use synthetic guests from the same fixture family as the site preview; no production data in the repository; `.dev.vars` is git-ignored. |
| ARCH-01 | met | Browser → Worker → D1/outbox; secrets and data access only in the Worker. |
| ARCH-02 | met | Deny by default: every guest write is checked against the session's household; admin routes check role per route; no service credentials reach a browser. |
| ARCH-03 | met | Attendance, revision, outbox row and audit event commit in one batch; sender retries with deduplication key, max age and alerting. Atomicity of a D1 batch in production is a *publisher claim*; the local emulator was verified to run a batch in one SQLite transaction. |
| ARCH-04 | partly | `Cache-Control: private, no-store` on every guest/admin response (tested); the public banner is the only cacheable endpoint. The cross-household cache test in an integrated deployment remains to be run. |
| ARCH-05 | met (n/a) | The API links to nothing external; no third party receives RSVP data. |
| ARCH-06 | partly | Source, migrations, deployment steps, `.dev.vars.example`, lockfile (`package-lock.json`) delivered. Account ownership, domain and mail identity are owner actions. |
| SEC-01 | open (site) | Visibility of the logistics pages is a static-site decision recorded in `docs/DECISION_RECORD.md`; this API only ever returns one household's data after access. |
| SEC-02 | met | 256-bit link tokens, 59-bit rate-limited codes, HMAC digests with a secret pepper, expiry and revocation, `GET` never consumes a credential, tokens carried in the URL fragment by the site, request logs drop query strings and mask tokens/emails, `Referrer-Policy: no-referrer`. |
| SEC-03 | met | HTTPS (Cloudflare), `HttpOnly; Secure; SameSite=Lax` cookie, Origin check on state-changing requests, JSON content type forcing preflight, `X-Requested-With` on admin mutations, rate limits, validated inputs, restrictive headers, per-request authorisation. |
| SEC-04 | met | No tracking; diagnostics omit names, emails, credentials and free text (tested). |
| SEC-05 | met | Notes stored only in `restricted_guest_needs`, absent from snapshots to admins, general export, mail and audit; restricted export is owner-only and audited. |
| SEC-06 | partly | Retention job deletes response/contact data, notes and stored import plans (which hold the CSV's names and emails) after `RETENTION_DAYS_AFTER_WEDDING` (90) days, is idempotent for re-application after restores, and raises an alert. Owner approval of the period and the backup ageing arrangement are still required. |
| SEC-07 | partly | Backup/restore procedure above; restore test and encryption confirmation to be performed by the owners before launch. |

Other PRD items touched: OPS-02 (banner), OPS-03 (`rsvp-settings.open=false`), NFR "RSVP service p95 ≤ 1.5 s at 50 concurrent sessions" — **not measured**; run a load test against the deployed Worker before launch.

## Additions to the contract (not edited; recorded here for the front-end owner)

`docs/RSVP_API_CONTRACT.md` is implemented unchanged. This service adds, outside the contract:

- `GET /content/urgent-banner` → `{ key, version, body: { active, message, linkUrl, linkLabel } | null, updatedAt }`, `Cache-Control: public, max-age=60`. The site's `banner` block in `content/site.config.json` is the build-time equivalent; if the site should show owner-published banners without a rebuild, `src/js/site.js` would fetch this endpoint.
- `GET /health`.
- The `/admin` API described in the runbook.
- `rsvp.cutoffAt` in the snapshot comes from `rsvp-settings` content when set, otherwise `RSVP_CUTOFF_AT`; `rsvp.open` is false after the cutoff or when editing is closed by the owners.

## Verification labels

- **Verified here:** the test results above; `npx wrangler deploy --dry-run` bundles the Worker and lists the D1 binding, cron trigger and variables; `scripts/events-sync.mjs` generates SQL from the site config; miniflare's local D1 executes `batch()` inside `transactionSync` (`node_modules/miniflare/dist/src/workers/d1/database.worker.js`); wrangler 4.124.0 `d1 time-travel restore --help` states the 30-day window; `d1 export --help` shows `--remote`/`--output`.
- **Publisher claim (from installed package README/help text):** `@cloudflare/vitest-pool-workers` runs tests in the Workers runtime with per-test isolated storage; D1 Time Travel restores to a point in time.
- **Not verified (docs host blocked from the build environment on 2026-09-21):** production D1 batch atomicity, Cloudflare Access JWT header/claim/certificate details, custom-domain prerequisites, D1 encryption at rest, cron trigger scheduling behaviour.

## Open items before guest launch

1. Owner decisions: credential delivery method, RSVP cutoff, retention period approval, data recipients for the restricted export, mail sending identity, coordinator alert address.
2. Create the Cloudflare account resources (steps 1–9) and confirm the Access JWT details against current documentation.
3. Choose and wire a mail provider (adapter or relay), verify sending domain, and test AT-11 with delivery disabled.
4. Load test (NFR) and cross-household cache test (ARCH-04) on the deployed service.
5. Restore test and encryption confirmation (SEC-07); record in the decision record.
6. Roster import with the coordinator's confirmed household groupings (PRD §16); meal configuration if meals are ever finalised (schema has `response.meal_value`; no validation list exists yet).
