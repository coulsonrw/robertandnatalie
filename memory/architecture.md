---
title: Architecture
updated: 2026-11-07
verified_against: c2360625236038111c380a6e1f27c580cbf37714
related:
  - .github/workflows/deploy.yml
  - backend/wrangler.toml
  - backend/src/index.js
  - backend/src/mail/provider.js
  - backend/migrations/0001_init.sql
  - content/site.config.json
  - scripts/lib/format.mjs
  - src/img/invitation-frame-800.jpg
  - assets/invitation-approved-charcoal.png
  - src/js/rsvp.js
  - CNAME
---

The public site and the RSVP service are two deploys that share one content file.

## The site

`content/site.config.json` is the source for guest-facing copy, events, and the RSVP switch. `npm run build` (`scripts/build.mjs`) writes a static `dist/` with no runtime dependencies. GitHub Actions publishes that directory to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`, `SITE_PREVIEW=0`). The custom domain is `robertandnatalie.wedding` (`CNAME`). The Pages source is the Actions workflow, so a push to `main` is a production deploy.

Ceremony and reception start times come only from `events[].startsAt`, in `America/Chicago`. On 19 December 2026 that offset is `-06:00`. `formalTimeLine` in `scripts/lib/format.mjs` writes the invitation. At 12:00 exactly the line is “Ceremony at Twelve Noon” and does not append `formalDayPart`. Other hours stay “at … O’Clock in the {formalDayPart}”. Clock labels everywhere else stay in the “12:00 p.m.” / “1:00 p.m.” style. `endsAt` stays null, and the calendar files have `DTSTART` and no `DTEND`. The Details phrase “about N hour(s) apart” is the gap between the two start times, not a ceremony duration or a reception end.

Rob set the ceremony to `2026-12-19T12:00:00-06:00` and the reception to `2026-12-19T13:00:00-06:00` (`formalDayPart` Afternoon) on 7 November 2026. Publication of that change waits for his review. The guest-facing frames in `src/img/invitation-frame-*` have the artwork wording removed; the live text is painted over them. `assets/invitation-approved-charcoal.png` still shows the earlier “Two O’Clock” / “Four O’Clock” wording and is not copied into `dist/`.

## The RSVP service

The API is a Cloudflare Worker, `robertandnatalie-rsvp-api`, on `https://api.robertandnatalie.wedding` (`backend/wrangler.toml` route). It stores RSVPs in D1: binding `DB`, database name `rsvp`. The browser talks to it from `src/js/rsvp.js`. In the site config, `rsvp.mode` is `live` and `rsvp.apiBaseUrl` is that same host. The cutoff mirrored in both places is `2026-11-15T23:59:59-06:00` (America/Chicago).

A cron trigger (`*/5 * * * *`) sends queued mail and applies retention. Admin routes expect Cloudflare Access; guest RSVP and the roster bootstrap do not.

## Confirmation email

Mail goes out through Cloudflare Email Sending, not a third-party relay. `MAIL_PROVIDER` is `cloudflare`. `MAIL_FROM` is `Robert and Natalie <rsvp@robertandnatalie.wedding>`. The Worker calls `env.EMAIL.send()` (`backend/src/mail/provider.js`). The binding is:

```toml
[[send_email]]
name = "EMAIL"
allowed_sender_addresses = ["rsvp@robertandnatalie.wedding"]
```

That `[[send_email]]` table has to sit after the `[vars]` table. Placing it in the middle makes later keys parse as fields of the binding. Wrangler only warns, and values such as `COORDINATOR_EMAIL` disappear from the Worker. Pull request #23 turned the provider on once Workers Paid was active, with the binding kept after `[vars]`.

A confirmation is queued in the same D1 batch as the save only when the party opted in and supplied an address. The cron job sends it. `stub` and `webhook` remain in the adapter for tests and local runs. See [RSVP](rsvp.md) for the form and the schema.
