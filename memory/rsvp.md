---
title: RSVP
updated: 2026-10-14
verified_against: ef840946df09e33288e8f4649ba28c132de00493
related:
  - src/js/rsvp.js
  - backend/src/directory.js
  - backend/src/response.js
  - backend/src/snapshot.js
  - backend/src/mail/provider.js
  - backend/migrations/0001_init.sql
  - backend/migrations/0002_meal_options.sql
  - backend/migrations/0003_hotel_stay.sql
  - backend/migrations/0004_party_details.sql
  - backend/migrations/0005_email_confirmation.sql
  - backend/wrangler.toml
  - content/site.config.json
  - docs/RSVP_GUEST_LAUNCH.md
---

Guests RSVP on `/rsvp.html`. The page loads the party list from `GET /guests`, opens one household with `POST /session` `{ partyId }`, and saves with `PUT /response`. Answers live in D1. This note describes the flow and the tables. It does not list guests.

## Name dropdown

Rob replaced private per-party links with a name picker (pull request #19). The first screen is a collapsed native `<select id="guest-name">` labelled “Your invitation”. The first option is “- Select -”. Continue stays disabled until a party is chosen. There is no search box and no “N invitations shown” line: Rob asked for a normal dropdown, so the full list of party labels is what the control shows when it opens.

`GET /guests` (`backend/src/directory.js`) returns one row per active household, `{ name, partyId }` only, sorted A to Z by label. It does not return email, phone, address, notes, answers, or each person’s name. The household label is the dropdown text. A `?party=` URL opens that same household. The preview mode (`?preview=1`) uses the synthetic households in `content/site.config.json`; those fixtures are not the roster.

The party form then collects attendance per person and event, editable names, per-guest dietary notes, optional phone, optional mailing address, Grand Hotel stay, a message to the couple, and extra guests. The cap is `rsvp.extraGuestCap` / `EXTRA_GUEST_CAP`, set to 2 (Rob, 7 October 2026). The form hides “Add a guest” at the cap; the Worker rejects another.

How the roster is imported is in `docs/RSVP_GUEST_LAUNCH.md`. The CSV stays out of git. Do not copy labels or addresses into this folder.

## Confirmation email is opt-in

Pull request #22, turned on for sending in #23. Contact email is optional. A checkbox, “Email me a confirmation of our RSVP”, defaults off. Unticked: no email field, and no outbox row. Ticked: the email field is shown and required, and a confirmation is queued on the first save and on later edits when `emailConfirmation` is true and the address is valid.

The message lists that household’s attendance, extra guests and per-guest dietary notes, plus the link to edit until the cutoff. It leaves out the message to the couple. Sending uses the Cloudflare `EMAIL` binding from `rsvp@robertandnatalie.wedding`; see [Architecture](architecture.md). The on-page confirmation still shows for everyone. If they opted in but nothing was queued, the page says a confirmation email is not available.

`household.email_confirmation_opt_in` stores the choice (0 or 1, default 0). The public directory never includes it.

## Database

D1 (SQLite). Migrations are applied in order; later files only add columns. Timestamps are UTC ISO strings. Guest and household ids are opaque text, not names.

`0001_init.sql` creates the core tables:

- `household` — invitation label, optional contact email, `active` or `revoked`.
- `guest` — `named` (display name required) or `plus-one` (host required, name filled when used).
- `event` — ceremony and reception, fed from `content/site.config.json`.
- `invitation_entitlement` — one row per guest and event.
- `household_response` — revision, reference, submission times. One writer per revision; a clash is a 409.
- `household_revision` — the revision numbers already committed.
- `response` — `pending`, `attending`, or `declining` for one entitlement. There is no “maybe”.
- `response_history` — prior statuses for an owner correction.
- `restricted_guest_needs` — dietary and access notes. Kept out of the general export, the audit payload, and the public snapshot.
- `access_credential`, `session` — link and code digests, and the session cookie digest. The name-picker flow does not need a mailed link.
- `rate_limit`, `content_version`, `idempotency_record`.
- `mail_outbox` — `confirmation` or `coordinator-alert`; states `queued`, `sent`, `abandoned`.
- `coordinator_alert`, `import_batch`, `audit_event`.

Later migrations:

- `0002_meal_options.sql` — `event.meal_options_json`. Meals are collected only when the site config names an event and at least two options.
- `0003_hotel_stay.sql` — `household_response.hotel_stay`: `yes`, `no`, `undecided`, or null.
- `0004_party_details.sql` — `household.contact_phone`, `household.mailing_address`, and `guest.origin` (`roster` by default, `guest` when the household added the person).
- `0005_email_confirmation.sql` — `household.email_confirmation_opt_in` and optional `mail_outbox.body_html`.

Retention clears contact fields and the opt-in flag with the rest of the response data after the configured number of days past the wedding (`RETENTION_DAYS_AFTER_WEDDING` is 90).
