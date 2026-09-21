# Robert and Natalie — wedding website

Saturday, 19 December 2026 · Point Clear, Alabama. Live at **https://robertandnatalie.wedding** (GitHub Pages).

This is a small static site generated from one configuration file. There is no framework, no build dependency and no tracking. The visual system follows the approved ivory, gold and charcoal invitation and the original-color Coulson crest (see `docs/DECISION_RECORD.md` for how this relates to the PRD).

## How it is organized

| Path | Purpose |
|---|---|
| `content/site.config.json` | **The single source of truth.** Names, date, time zone, events, venues, travel, FAQs, contact, RSVP mode and privacy values. Every guest-facing date, time, invitation line and calendar file is derived from it. |
| `scripts/build.mjs` | Validates the configuration, renders `dist/`, writes the two `.ics` files and prints a launch-readiness report. |
| `scripts/templates/` | HTML templates for the invitation page, RSVP, privacy and 404. |
| `src/styles`, `src/js`, `src/img`, `src/fonts` | Stylesheet, progressive-enhancement scripts, crest renditions, self-hosted fonts. |
| `assets/` | Original artwork (A1 crest, A2 invitation) and the asset manifest. Photos of unconfirmed provenance sit in `assets/review/` and are not published. |
| `docs/` | Decision record, RSVP API contract, content approval register, font licenses and visual proofs. |
| `.github/workflows/` | `ci.yml` validates and builds on pull requests; `deploy.yml` builds and publishes `main` to GitHub Pages. |

## Editing content

1. Edit `content/site.config.json`. Every block carries an `approval` object (`state`, `owner`, `source`, `reviewed`, `note`). Use `pending` for anything not yet supplied or approved: pending blocks are never published.
2. Run `npm run check` to validate, or `npm run build` to build. The build refuses inconsistent data (for example an event that is not on the wedding date or whose UTC offset is wrong for `America/Chicago`) and prints what still blocks guest launch.
3. Run `npm run register` to refresh `docs/CONTENT_APPROVAL_REGISTER.md`, then commit both files.

Approved wording that must not drift: the couple's display name, the closing line ("Where the ancient Moeli waters meet the Bahia Del Espiritu Santo"), the venue names and the start times. The build warns if the closing line changes.

## Local preview

```bash
npm run build      # writes dist/
npm run serve      # http://127.0.0.1:8080/
npm run proofs     # Playwright screenshots + checks into docs/proofs/ (needs Playwright installed)
```

Node 20 or newer; no `npm install` is required for the build.

## Deploying to GitHub Pages

`deploy.yml` builds `dist/` and publishes it with the official Pages actions on every push to `main`.

One-time setting: in the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions** (the workflow also tries to enable this automatically). Keep the custom domain `robertandnatalie.wedding` and *Enforce HTTPS* enabled. The `CNAME` file is copied into the artifact for completeness.

## RSVP status

GitHub Pages serves static files only. It cannot authorize a household, keep guest data private or store a response, and the PRD rules out a client-only or email-only RSVP as the final design. So:

- `rsvp.mode` is `coming-soon`: guests see a clear message and no form.
- The full guest-facing RSVP flow is already built (`src/js/rsvp.js`) against the API in `docs/RSVP_API_CONTRACT.md`. Review it with synthetic guests at `/rsvp.html?preview=1` (code `PREVIEW`); a banner states that nothing is saved.
- To go live: deploy a small backend that implements the contract (Cloudflare Workers + D1, or Supabase, are the candidates), set `rsvp.apiBaseUrl` and `rsvp.mode: "live"`, set `rsvp.cutoffAt`, name the provider in `privacy.rsvpProvider`, and rebuild.

## Before guests are invited

`npm run build` lists the blockers. At the time of writing they are: RSVP backend not deployed, RSVP cutoff not set, no private contact route, RSVP provider not named in the privacy notice. Items marked *review* (chapel entrance and parking, transport between venues, dress code, room block, draft wording) need an owner or coordinator decision but do not block a build.
