# RSVP API contract

The static site's RSVP page (`src/js/rsvp.js`) talks to a small server-side service. This document is the contract that service must implement so the front end works unchanged. It maps to PRD Sections 08–12. Nothing in the static site stores guest data.

## Deployment shape

- Host the API on a subdomain of the site's registrable domain, for example `https://api.robertandnatalie.wedding`, so the session cookie is same-site.
- Set `rsvp.apiBaseUrl` in `content/site.config.json` to that origin and `rsvp.mode` to `live`.
- Candidates: Cloudflare Workers + D1 (or Postgres via Hyperdrive), or Supabase Edge Functions + Postgres with row-level security. The PRD's requirements for backups, retention and multi-factor admin access apply to whichever is chosen.

## Session and security (RSVP-01, SEC-02, SEC-03)

- Guests open a household by choosing their invitation. `GET /guests` is a public, rate-limited directory of one `{ name, partyId }` per party (`name` is the household label) — no emails, phones, addresses, notes, answers or individual guest names. `POST /session` with `{ "partyId" }` establishes a session and sets an `HttpOnly; Secure; SameSite=Lax` cookie.
- Admin-issued link tokens and fallback codes still work as `{ "code": "<token or short code>" }` for support and tests. Only digests are stored; they are optional and are not issued by roster sync unless `"issueLinks": true`.
- A link-preview `GET` must never open a session or change data. The guest page may keep `?party=<id>` in the query after the guest chooses a name; that id is not a secret.
- Every request re-checks that the session's household owns every guest and event ID in the payload (deny by default). Guest session responses carry `Cache-Control: private, no-store`. The public name list may be cached briefly (`public, max-age=60`).
- CORS: allow the site origin only, with `Access-Control-Allow-Credentials: true`.
- Rate-limit `GET /guests` per IP and `POST /session` per IP (and per code / party). Unknown or revoked party ids look the same as an unknown code (`403 invalid_code`).

## Endpoints

All bodies are JSON. Errors use `{ "error": { "code": string, "message": string } }`.

| Method and path | Purpose | Success | Errors |
|---|---|---|---|
| `GET /guests` | Public party-label list for the RSVP dropdown | `200` `{ "guests": [ { "name", "partyId" } ] }` one row per household | `429 rate_limited` |
| `POST /session` `{ partyId }` or `{ code }` | Open a household session | `200` **Session snapshot** | `403 invalid_code`, `429 rate_limited` |
| `GET /session` | Resume an existing session | `200` snapshot | `401 invalid_session` |
| `PUT /response` **Response payload** | Save the household's response atomically | `200` snapshot (with `reference`, new `revision`, `emailQueued`) | `400 validation`, `401 invalid_session`, `409 conflict` (body includes `latest` snapshot), `423 closed` |
| `DELETE /session` | End the session (shared devices) | `204` | — |

The front end maps HTTP status to these codes when `error.code` is absent: 400 validation, 401 invalid_session, 403/404 invalid_code, 409 conflict, 423 closed, 429 rate_limited, otherwise server_error. Network failures are shown as retryable with input kept in page memory (RSVP-06).

A `400 validation` body may also carry `error.fields`, an array of `{ "path", "message" }` naming every guest-fixable problem at once (added 22 September 2026, audit QA-15; additive, older clients ignore it). Paths: `contactEmail`, `emailConfirmation`, `contactPhone`, `mailingAddress`, `notes`, `hotelStay`, `guestNames.<guestId>`, `guestDietary.<guestId>`, `addedGuests`, `removedGuestIds`, `requestId`, `revision`, `responses` (structural, no id echoed), `responses.<guestId>.<eventId>.status`, `responses.<guestId>.<eventId>.meal`, `plusOneNames` (no id echoed), `plusOneNames.<guestId>`. Authorization and structural problems fail first and never echo a foreign identifier. The front end maps these paths to its inline field errors and announces `error.message`.

`rsvp.cutoffAt` (in configuration and in the owner-editable `rsvp-settings`) must carry an explicit UTC offset or `Z`. The shipped value is `2026-11-15T23:59:59-06:00` (end of Sunday 15 November 2026, America/Chicago / CST). The service refuses a cutoff without an offset, and a configured cutoff it cannot parse closes the window rather than leaving it open (`GET /admin/status` then reports `rsvp.cutoffInvalid: true`).

## Session snapshot

```json
{
  "household": {
    "id": "hh_01H...",
    "label": "The Example Household",
    "contactEmail": "",
    "contactPhone": "",
    "mailingAddress": "",
    "guests": [
      { "id": "g_01", "kind": "named", "name": "Alex Example", "added": false, "dietary": "" },
      { "id": "g_02", "kind": "plus-one", "hostGuestId": "g_01", "name": null, "added": false, "dietary": "" }
    ]
  },
  "entitlements": [ { "guestId": "g_01", "eventId": "ceremony" }, { "guestId": "g_01", "eventId": "reception" } ],
  "responses":    [ { "guestId": "g_01", "eventId": "ceremony", "status": "pending" } ],
  "notes": "",
  "hotelStay": null,
  "extraGuestCap": 2,
  "extraGuestsRemaining": 1,
  "emailConfirmation": false,
  "revision": 0,
  "reference": null,
  "submittedAt": null,
  "emailQueued": false,
  "rsvp": { "open": true, "cutoffAt": "2026-11-20T23:59:59-06:00" }
}
```

- Guest and household IDs are immutable and opaque. Event IDs match `events[].id` in `content/site.config.json`.
- `kind: "plus-one"` is a pre-authorized slot (RSVP-02); its `name` is set only when used.
- `status` is `pending`, `attending` or `declining`. There is no "maybe" (RSVP-04).
- `meal` (optional, per response) holds a configured meal choice for the event named in `rsvp.mealChoices.eventId`; it is only accepted for `attending` responses and only from the configured option list (RSVP-03, DATA-02). When no meal choices are configured the field is absent.
- `emailQueued` is `true` only when a confirmation email was enqueued in the same transaction (the party opted in and supplied an email). The on-page confirmation is always shown; the “email not available” note appears only if they opted in but the outbox row was not created.
- `emailConfirmation` on the snapshot is the stored opt-in. Confirmation mail is queued only when `emailConfirmation` is true and `contactEmail` is present — first save and later edits.
- `revision` increments on every committed save and is used for optimistic concurrency (RSVP-05).
- `hotelStay` (optional, household-level) is `yes`, `no` or `undecided` when anyone is attending, and `null` when the household declines. It is required on a guest save if anyone attends. Headcount is derived from attending guests and is not a separate payload field.
- `contactEmail` is optional unless the party opts in to a confirmation email. `contactPhone` and `mailingAddress` are household-level, optional, and appear only on the session snapshot — never on `GET /guests`. Contact details and the opt-in flag never appear on public endpoints.
- `extraGuestCap` (default **2**, `EXTRA_GUEST_CAP` / `rsvp.extraGuestCap`) is how many plus-one / guest-added people a party may have. `addedGuests` creates `origin=guest` plus-one rows; `removedGuestIds` may revoke only those. Roster plus-one slots cannot be removed. The page hides **Add a guest** when remaining is 0; the Worker also rejects over-cap saves.

## Response payload

```json
{
  "requestId": "0f4b9c8e-…",
  "revision": 0,
  "responses": [ { "guestId": "g_01", "eventId": "ceremony", "status": "attending" } ],
  "plusOneNames": { "g_02": "Casey Example" },
  "guestNames": { "g_01": "Alex Example" },
  "guestDietary": { "g_01": "Vegetarian" },
  "addedGuests": [ { "name": "Pat Example", "dietary": "", "responses": [ { "eventId": "ceremony", "status": "attending" }, { "eventId": "reception", "status": "attending" } ] } ],
  "removedGuestIds": [],
  "contactEmail": "alex@example.com",
  "emailConfirmation": true,
  "contactPhone": "251-555-0100",
  "mailingAddress": "",
  "notes": "Looking forward to celebrating.",
  "hotelStay": "yes"
}
```

Server rules:

1. If `requestId` was already committed for this household, return the stored result without writing again (idempotent retries; RSVP-05). This check comes first because a retry of a committed save carries the revision that save consumed. The stored replay body never contains the restricted note; the household's current note is re-attached on replay (SEC-05).
2. Reject any `(guestId, eventId)` not in the household's entitlements and any missing pair (an unanswered choice is never a decline; RSVP-01/04).
3. If `revision` does not equal the stored revision, return `409` with `latest`.
4. In one transaction: update responses (with meal values where configured), plus-one names, contact email, notes and hotel stay; increment `revision`; set `reference` on first save; append a mail-outbox row **only if** `emailConfirmation` is true and a valid email was given; write the audit event (ARCH-03). Only then return `200`. After a successful guest save the Worker best-effort upserts that household on the Google Sheet **RSVP Answers** tab when sheet secrets are present; a sheet failure never rolls back the RSVP. Natalie’s original guest-list tab is never written.

The reference implementation in `backend/` also exposes `GET /health`, a public `GET /content/urgent-banner` (owner-editable, cached 60 s) and the `/admin` API described in `backend/README.md`; `rsvp.open` and `cutoffAt` in the snapshot come from the owner-editable `rsvp-settings` content when present, otherwise from configuration.
5. After `rsvp.cutoffAt`, return `423 closed` to guests; owner corrections happen through the admin tools with an audit trail (RSVP-04).
6. Never include the household “message to the couple” (`notes`) in confirmation emails or general exports (SEC-05). Per-guest dietary notes **are** included in the confirmation when the party opted in (Rob, 7 October 2026). The email covers this household only.

## Synthetic fixtures

`content/site.config.json` → `rsvp.preview.households` holds the PRD §14 fixtures used by the in-page mock and reusable by backend tests: `PREVIEW` (a couple, an authorised plus-one slot and a guest invited to the reception only), `SOLO` (an individual) and `FAMILY` (a named family with children as named invitees).

## Administration (ADMIN-01 to ADMIN-04, out of scope for the static site)

Separate, MFA-protected owner and coordinator roles; CSV import with preview and immutable IDs; reporting by event and person; restricted export for notes; content editing for the urgent-logistics banner. These live with the API service, not in this repository's pages.
