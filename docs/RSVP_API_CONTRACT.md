# RSVP API contract

The static site's RSVP page (`src/js/rsvp.js`) talks to a small server-side service. This document is the contract that service must implement so the front end works unchanged. It maps to PRD Sections 08–12. Nothing in the static site stores guest data.

## Deployment shape

- Host the API on a subdomain of the site's registrable domain, for example `https://api.robertandnatalie.wedding`, so the session cookie is same-site.
- Set `rsvp.apiBaseUrl` in `content/site.config.json` to that origin and `rsvp.mode` to `live`.
- Candidates: Cloudflare Workers + D1 (or Postgres via Hyperdrive), or Supabase Edge Functions + Postgres with row-level security. The PRD's requirements for backups, retention and multi-factor admin access apply to whichever is chosen.

## Session and security (RSVP-01, SEC-02, SEC-03)

- Household credentials are random (≥128 bits for links; fallback codes with adequate entropy and rate limiting). Only digests are stored; credentials are scoped to one household and revocable.
- `POST /session` establishes a session and sets an `HttpOnly; Secure; SameSite=Lax` cookie. A link-preview `GET` must never consume a credential or change data. Personal links carry the token in the URL fragment (`/rsvp.html#t=<token>`); the page removes it from the address bar on load and only sends it when the guest presses "Open my invitation". The request body is the same `{ "code": "<token or short code>" }` for both.
- Every request re-checks that the session's household owns every guest and event ID in the payload (deny by default). Responses carry `Cache-Control: private, no-store`.
- CORS: allow the site origin only, with `Access-Control-Allow-Credentials: true`.
- Rate-limit `POST /session` per IP and per code. Never confirm whether a name is on the list.

## Endpoints

All bodies are JSON. Errors use `{ "error": { "code": string, "message": string } }`.

| Method and path | Purpose | Success | Errors |
|---|---|---|---|
| `POST /session` `{ code }` | Exchange an invitation code (or link token) for a session | `200` **Session snapshot** | `403 invalid_code`, `429 rate_limited` |
| `GET /session` | Resume an existing session | `200` snapshot | `401 invalid_session` |
| `PUT /response` **Response payload** | Save the household's response atomically | `200` snapshot (with `reference`, new `revision`, `emailQueued`) | `400 validation`, `401 invalid_session`, `409 conflict` (body includes `latest` snapshot), `423 closed` |
| `DELETE /session` | End the session (shared devices) | `204` | — |

The front end maps HTTP status to these codes when `error.code` is absent: 400 validation, 401 invalid_session, 403/404 invalid_code, 409 conflict, 423 closed, 429 rate_limited, otherwise server_error. Network failures are shown as retryable with input kept in page memory (RSVP-06).

## Session snapshot

```json
{
  "household": {
    "id": "hh_01H...",
    "label": "The Example Household",
    "contactEmail": "",
    "guests": [
      { "id": "g_01", "kind": "named", "name": "Alex Example" },
      { "id": "g_02", "kind": "plus-one", "hostGuestId": "g_01", "name": null }
    ]
  },
  "entitlements": [ { "guestId": "g_01", "eventId": "ceremony" }, { "guestId": "g_01", "eventId": "reception" } ],
  "responses":    [ { "guestId": "g_01", "eventId": "ceremony", "status": "pending" } ],
  "notes": "",
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
- `emailQueued` is `true` only when a confirmation email was enqueued in the same transaction; the page shows an explicit "email not available" note otherwise (RSVP-06/07).
- `revision` increments on every committed save and is used for optimistic concurrency (RSVP-05).

## Response payload

```json
{
  "requestId": "0f4b9c8e-…",
  "revision": 0,
  "responses": [ { "guestId": "g_01", "eventId": "ceremony", "status": "attending" } ],
  "plusOneNames": { "g_02": "Casey Example" },
  "contactEmail": "alex@example.com",
  "notes": "Vegetarian, please."
}
```

Server rules:

1. Reject any `(guestId, eventId)` not in the household's entitlements and any missing pair (an unanswered choice is never a decline; RSVP-01/04).
2. If `revision` does not equal the stored revision, return `409` with `latest`.
3. If `requestId` was already committed for this household, return the stored result without writing again (idempotent retries; RSVP-05).
4. In one transaction: update responses, plus-one names, contact email and notes; increment `revision`; set `reference` on first save; append a mail-outbox row and audit event (ARCH-03). Only then return `200`.
5. After `rsvp.cutoffAt`, return `423 closed` to guests; owner corrections happen through the admin tools with an audit trail (RSVP-04).
6. Never include `notes` in confirmation emails or general exports (SEC-05).

## Synthetic fixtures

`content/site.config.json` → `rsvp.preview.households` holds the PRD §14 fixtures used by the in-page mock and reusable by backend tests: `PREVIEW` (a couple, an authorised plus-one slot and a guest invited to the reception only), `SOLO` (an individual) and `FAMILY` (a named family with children as named invitees).

## Administration (ADMIN-01 to ADMIN-04, out of scope for the static site)

Separate, MFA-protected owner and coordinator roles; CSV import with preview and immutable IDs; reporting by event and person; restricted export for notes; content editing for the urgent-logistics banner. These live with the API service, not in this repository's pages.
