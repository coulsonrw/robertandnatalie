# RSVP guest launch

How to open household RSVPs without touching Natalie’s original guest list. The form is already wired on the site (`rsvp.mode` = `live`, API `https://api.robertandnatalie.wedding`). Guests do **not** need private links.

**Default path (Rob, 7 October 2026):** `OPS_BOOTSTRAP_TOKEN` + CSV roster sync + D1. Guests click RSVP, choose their name from the roster, and answer for their household. Google Sheets is optional later and is not required to collect answers.

## Cutoff

`2026-11-15T23:59:59-06:00` — Sunday 15 November 2026, 11:59 p.m. Central Time (CST), America/Chicago.

Set in both `content/site.config.json` → `rsvp.cutoffAt` and `backend/wrangler.toml` → `RSVP_CUTOFF_AT`. Redeploy the Worker after changing the toml value, or override it with `PUT /admin/content/rsvp-settings` once Access exists.

## What guests see

1. They click **RSVP** on the site (`/rsvp.html`).
2. The page loads a dropdown of guest names from the Worker (`GET /guests`). Names are sorted A to Z; a search box narrows the list.
3. Choosing a name opens that guest’s **party** page — one form per invitation row (household) in the roster.
4. They answer attending / declining for each person and event, plus the existing details (contact email when anyone attends, Grand Hotel stay, optional notes) and submit.

A forwarded or bookmarked party URL (`/rsvp.html?party=<id>`) opens the same household form. Plus-ones (named or unnamed) answer on the host household’s page. The form cannot add more people than the row already allows.

If that household has already RSVPed, the page shows the saved answers and they can update them until the cutoff. Two devices editing at once use the existing revision check (409 + latest snapshot) so a second save does not silently overwrite the first; after reviewing the latest answers, the next save wins.

If the roster is empty or the API is unreachable, the page says so and points guests to the couple.

The public name list returns **only** display names and party ids. No emails, phones, addresses, notes or answers.

## Secrets Rob must set

Nothing in this list is spent money. Generate tokens with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

| Secret / var | Where | Required to |
|---|---|---|
| `OPS_BOOTSTRAP_TOKEN` | `npx wrangler secret put OPS_BOOTSTRAP_TOKEN` (from `backend/`) | Import the CSV roster without Cloudflare Access |
| `CREDENTIAL_PEPPER`, `SESSION_SECRET` | already set (23 Sep 2026) | Sessions |
| `MAIL_WEBHOOK_URL`, `MAIL_WEBHOOK_TOKEN` | only if `MAIL_PROVIDER=webhook` | Actual confirmation email. Safe to leave `stub` |
| Cloudflare Access (`ACCESS_*`, `OWNER_EMAILS`, `COORDINATOR_EMAILS`) | still unset | Admin UI. Not required for guest RSVP or `/ops` bootstrap |

If `OPS_BOOTSTRAP_TOKEN` is missing, `/ops/*` returns `503 bootstrap_unavailable`. RSVPs always save to D1 once a household exists. Google Sheet secrets are not part of this path; see [Optional later: Google Sheets](#optional-later-google-sheets).

No new Worker secrets are required for the name-picker flow.

## Ops steps (do these in order)

Do **not** skip the remote migration after a Worker deploy that includes new SQL. This name-picker change does **not** add a migration; D1 schema is unchanged. The steps below are the same launch path as before, minus issuing links.

1. Set `OPS_BOOTSTRAP_TOKEN` if it is not already set (`npx wrangler secret put OPS_BOOTSTRAP_TOKEN` from `backend/`).
2. Deploy the Worker: `cd backend && npm run deploy`.
3. Apply remote migrations (safe if already applied):

```bash
cd backend
npm run migrate:remote
```

4. Import the roster CSV (below). After that, `GET https://api.robertandnatalie.wedding/guests` should list names and party ids only.

(`0003_hotel_stay.sql` adds `household_response.hotel_stay` if that migration has not already been applied.)

## Import the roster

1. Download the **first tab** of [Natalie’s guest sheet](https://docs.google.com/spreadsheets/d/1MzBwUQpLq78eIH6tmUFSM4PcojktZRJe/edit) as CSV. Do not edit that tab. The Worker never reads or writes the live sheet on this path.
2. Preview the mapping (names omitted unless you pass `--print-names`):

```bash
npm run rsvp:roster -- --csv ~/Downloads/guest-list.csv
```

3. POST that CSV to the API:

```bash
curl -sS -X POST https://api.robertandnatalie.wedding/ops/roster/sync \
  -H "Authorization: Bearer $OPS_BOOTSTRAP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Origin: https://robertandnatalie.wedding" \
  --data-binary @- <<EOF
{"csv": $(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' ~/Downloads/guest-list.csv)}
EOF
```

The response includes `counts` and `flags`. It does **not** issue private links. A second run updates the same household ids in place. To issue old-style personal links as well (not needed for guests), send `"issueLinks": true`.

4. Check `GET /ops/status` with the same bearer token: household count and named guests. Confirm `GET /guests` from a browser on the wedding site returns the name list. D1 is the source of truth for answers.

## Preview

```bash
npm run build && npm run serve
# Form: http://127.0.0.1:8080/rsvp.html
# Synthetic households (nothing saved): http://127.0.0.1:8080/rsvp.html?preview=1
```

The preview dropdown lists the sample names (Alex Example, Taylor Example, Morgan Example, …). Local API: `cd backend && cp .dev.vars.example .dev.vars` (fill `OPS_BOOTSTRAP_TOKEN` and the already-documented session secrets), `npm run migrate:local`, `npm run dev`. Point a **local copy** of `rsvp.apiBaseUrl` at `http://localhost:8787` only for that laptop check.

## Guest-list mapping (kept as written)

The 5 October 2026 sheet has **16 invitation rows**. Named people in the Guest Name cell are split on `&` / `and` / commas. That is about **24 named guests** (the earlier “~22” count). Plus-one cells become either named household members (semicolon-separated names) or unnamed slots (`1 unnamed…`). A bare number that equals the named count (for example a couple with `2`) is treated as party size, **not** two extra guests, and is flagged.

Rob decisions still open on the list itself:

- Incomplete names kept as written: **Mama & Daddy**, **Ken** (in Shelly & Ken). Not expanded.
- **Anna & Logan** plus-one cell is `2` — treated as party size (no extra plus-ones). Confirm if they should have two unnamed slots instead.
- Possible duplicate households: **Winne & Francois** vs **Winnie** + **Francoise**. Kept as two rows.
- Several rows have no email/phone; the RSVP form collects a contact email when anyone attends.
- Site contact email/phone on Details stay TBD and do not block this ship.

Do not invent fuller names. Re-run the CSV roster sync after any sheet edit; ids are derived from the Guest Name cell so the same row updates in place.

## Remaining owner work

- Set `OPS_BOOTSTRAP_TOKEN` if needed, deploy the Worker, `migrate:remote`, POST the CSV. Guests then use the site RSVP button — no links to store or send.
- Mail provider if confirmation email is wanted.
- Cloudflare Access + MFA for `/admin`.
- Details contact route, dress code, children policy, G3 `site.launchApproved`.
- Token expiry 31 December 2026 (extend before the March 2027 retention run). This is the Cloudflare API token, not a guest RSVP link.
- Optional later: Google Sheets answers tab (below).

## Optional later: Google Sheets

Leave these unset for the D1-only launch. When Rob wants a spreadsheet mirror of answers, set them and redeploy. Natalie’s original guest-list tab is still never written (the Worker refuses to write the first sheet).

| Secret / var | Where | Required to |
|---|---|---|
| `GOOGLE_SHEETS_ID` | `wrangler.toml` `[vars]` or `wrangler secret put` | Read the guest list from the live sheet / write the answers tab |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` | Same. Share the spreadsheet with the service account `client_email` as **Editor** |
| `GOOGLE_SHEETS_SOURCE_TAB` | `[vars]`, optional | Name of Natalie’s original tab if the Worker should pull it instead of a CSV POST |
| `GOOGLE_SHEETS_ANSWERS_TAB` | `[vars]`, default `RSVP Answers` | **Must differ** from the original tab title |

If these secrets are missing, RSVPs still save to D1 and the answers tab is skipped. `GET /ops/status` reports whether Sheets is configured.

On first successful configure, the Worker creates **RSVP Answers** (or `GOOGLE_SHEETS_ANSWERS_TAB`) with columns: Household ID, Guest Name, Group, RSVP, Headcount, Ceremony attending, Reception attending, Attending names, Declining names, Plus-one names, Dietary, Grand Hotel stay, Contact email, Notes, Reference, Submitted at, Revision.

Each guest save then upserts the row keyed by Household ID. Dietary/notes on this owner-only tab are the household notes (the same restricted field the general CSV export omits).
