# RSVP private-link launch

How to open household RSVPs without touching Natalie’s original guest list. The form is already wired on the site (`rsvp.mode` = `live`, API `https://api.robertandnatalie.wedding`). Guests still need issued links.

## Cutoff

`2026-11-15T23:59:59-06:00` — Sunday 15 November 2026, 11:59 p.m. Central Time (CST), America/Chicago.

Set in both `content/site.config.json` → `rsvp.cutoffAt` and `backend/wrangler.toml` → `RSVP_CUTOFF_AT`. Redeploy the Worker after changing the toml value, or override it with `PUT /admin/content/rsvp-settings` once Access exists.

## What guests see

- One private link per **named guest** on that invitation row. Plus-ones (named or unnamed) answer through the host’s household page.
- A forwarded link shows only that household.
- The form cannot add more people than the row already allows (named plus-ones become named people on the household; “N unnamed” becomes N plus-one slots).
- Answers: attending/declining per person and event, derived headcount, dietary/access notes, Grand Hotel stay (yes / no / not sure).

## Secrets Rob must set

Nothing in this list is spent money. Generate tokens with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

| Secret / var | Where | Required to |
|---|---|---|
| `OPS_BOOTSTRAP_TOKEN` | `npx wrangler secret put OPS_BOOTSTRAP_TOKEN` (from `backend/`) | Import the roster and issue links without Cloudflare Access |
| `GOOGLE_SHEETS_ID` | `wrangler.toml` `[vars]` or `wrangler secret put` | Read the guest list / write the answers tab |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` | Same. Share the spreadsheet with the service account `client_email` as **Editor** |
| `GOOGLE_SHEETS_SOURCE_TAB` | `[vars]`, optional | Name of Natalie’s original tab if the Worker should pull it. Leave empty and POST the CSV instead |
| `GOOGLE_SHEETS_ANSWERS_TAB` | `[vars]`, default `RSVP Answers` | **Must differ** from the original tab title. The Worker refuses to write the first sheet |
| `CREDENTIAL_PEPPER`, `SESSION_SECRET` | already set (23 Sep 2026) | Sessions |
| `MAIL_WEBHOOK_URL`, `MAIL_WEBHOOK_TOKEN` | only if `MAIL_PROVIDER=webhook` | Actual confirmation email. Safe to leave `stub` |
| Cloudflare Access (`ACCESS_*`, `OWNER_EMAILS`, `COORDINATOR_EMAILS`) | still unset | Admin UI. Not required for guest RSVP or `/ops` bootstrap |

If sheet secrets are missing, RSVPs still save to D1. The answers tab is skipped. If `OPS_BOOTSTRAP_TOKEN` is missing, `/ops/*` returns `503 bootstrap_unavailable`.

Redeploy after secrets: `cd backend && npm run deploy`. Then apply the new migration on the remote D1:

```bash
cd backend
npm run migrate:remote
```

(`0003_hotel_stay.sql` adds `household_response.hotel_stay`.)

## Import the roster and issue links

1. Download the **first tab** of [Natalie’s guest sheet](https://docs.google.com/spreadsheets/d/1MzBwUQpLq78eIH6tmUFSM4PcojktZRJe/edit) as CSV. Do not edit that tab.
2. Preview the mapping (names omitted unless you pass `--print-names`):

```bash
npm run rsvp:roster -- --csv ~/Downloads/guest-list.csv
```

3. Either POST that CSV to the API, or set `GOOGLE_SHEETS_SOURCE_TAB` and let the Worker read the sheet:

```bash
curl -sS -X POST https://api.robertandnatalie.wedding/ops/roster/sync \
  -H "Authorization: Bearer $OPS_BOOTSTRAP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Origin: https://robertandnatalie.wedding" \
  --data-binary @- <<EOF
{"csv": $(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' ~/Downloads/guest-list.csv)}
EOF
```

The response includes `counts`, `flags`, and `links[]` with `link` shown **once** per named guest. Store that list in an owner-controlled place (not this repository). A second run does not reissue existing labels unless `"reissue": true`.

4. Check `GET /ops/status` with the same bearer token: household count, active links, whether Sheets is configured.

## Answers tab

On first successful configure, the Worker creates **RSVP Answers** (or `GOOGLE_SHEETS_ANSWERS_TAB`) with columns: Household ID, Guest Name, Group, RSVP, Headcount, Ceremony attending, Reception attending, Attending names, Declining names, Plus-one names, Dietary, Grand Hotel stay, Contact email, Notes, Reference, Submitted at, Revision.

Each guest save upserts the row keyed by Household ID. Dietary/notes on this owner-only tab are the household notes (the same restricted field the general CSV export omits).

## Preview

```bash
npm run build && npm run serve
# Form: http://127.0.0.1:8080/rsvp.html
# Synthetic household (nothing saved): http://127.0.0.1:8080/rsvp.html?preview=1  codes PREVIEW, SOLO, FAMILY
```

Local API: `cd backend && cp .dev.vars.example .dev.vars` (fill secrets), `npm run migrate:local`, `npm run dev`. Point a **local copy** of `rsvp.apiBaseUrl` at `http://localhost:8787` only for that laptop check.

## Guest-list mapping (kept as written)

The 5 October 2026 sheet has **16 invitation rows**. Named people in the Guest Name cell are split on `&` / `and` / commas. That is about **24 named guests** (the earlier “~22” count). Plus-one cells become either named household members (semicolon-separated names) or unnamed slots (`1 unnamed…`). A bare number that equals the named count (for example a couple with `2`) is treated as party size, **not** two extra guests, and is flagged.

Rob decisions still open on the list itself:

- Incomplete names kept as written: **Mama & Daddy**, **Ken** (in Shelly & Ken). Not expanded.
- **Anna & Logan** plus-one cell is `2` — treated as party size (no extra plus-ones). Confirm if they should have two unnamed slots instead.
- Possible duplicate households: **Winne & Francois** vs **Winnie** + **Francoise**. Kept as two rows.
- Several rows have no email/phone; the RSVP form collects a contact email when anyone attends.
- Site contact email/phone on Details stay TBD and do not block this ship.

Do not invent fuller names. Re-run the roster sync after any sheet edit; ids are derived from the Guest Name cell so the same row updates in place.

## Remaining owner work (does not block this PR)

- Distribute the issued links (text, email, or printed insert).
- Mail provider if confirmation email is wanted.
- Cloudflare Access + MFA for `/admin`.
- Details contact route, dress code, children policy, G3 `site.launchApproved`.
- Token expiry 31 December 2026 (extend before the March 2027 retention run).
