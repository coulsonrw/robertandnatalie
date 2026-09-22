# Operating runbook

How to run the website and the RSVP service after handover (PRD OPS-01, OPS-02, OPS-03, SEC-06, SEC-07). Everything here assumes the owner-controlled accounts: the GitHub repository (website), the domain registrar for `robertandnatalie.wedding`, and the Cloudflare account that will host the RSVP service described in `backend/README.md`. Secrets are never stored in this repository.

## 1. Publish a content change

1. Edit `content/site.config.json`. Set the block's `approval.state` to `approved` (or `pending` to keep it unpublished) and update `reviewed`.
2. Run `npm run check` (validation) and `npm run register`; commit both the configuration and `docs/CONTENT_APPROVAL_REGISTER.md`.
3. Open a pull request. CI validates the configuration, builds the site and posts the launch-readiness report in the job summary.
4. Merge to `main`. The deploy workflow publishes to GitHub Pages within a few minutes. Check the live page.

Anything touching event times, venues, room-block terms or attendance policy needs owner or coordinator approval before step 1 (CONTENT-06).

## 2. Urgent logistics banner (wedding day)

1. In `content/site.config.json` set `banner.active` to `true`, write the `message` (one or two sentences), optionally `linkUrl` and `linkLabel`, set `updatedAt`, and set `banner.approval.state` to `approved` with the approver in `owner`.
2. Commit and merge as in section 1. The banner appears in navy above every page.
3. To take it down, set `banner.active` to `false` and merge.

The build refuses an active banner whose approval is still pending.

## 3. Pre-distribution and pre-wedding rechecks (OPS-02)

Run this checklist once before invitations go out and again in the week before the wedding. Record the date and who ran it in the pull request that follows.

- [ ] `npm run build` shows no unexpected blockers; the register is current.
- [ ] Ceremony and reception times, addresses and the change-of-venue note are correct on the live site.
- [ ] Every external link opens: hotel website, Getting Here, contact page, chapel website, both Directions and Apple Maps links.
- [ ] Both calendar downloads import in Apple Calendar, Google Calendar and Outlook with the correct local start time and no end time (CONTENT-05, AT-14).
- [ ] The RSVP page shows the intended state (coming soon, live, or closed) and the contact route is correct.
- [ ] The privacy notice names the RSVP provider and the retention period actually in force.
- [ ] The synthetic preview (`rsvp.allowPreview`) is `false` on the live build once guests have their codes.

## 4. Correct a guest's RSVP

Guests correct their own response through their link or code until `rsvp.cutoffAt`. After the cutoff, or on a guest's behalf at any time (phone or email response), use the admin correction endpoint of the RSVP service described in `backend/README.md`; it records the origin of the change and the staff account that made it (RSVP-04, ADMIN-02). Never edit the database by hand.

## 5. Issue, replace or revoke an invitation link

Personal links carry a random token in the URL fragment (`/rsvp.html#t=…`). Use the admin credential endpoints in `backend/README.md` to issue a link or a short fallback code for a household, to revoke one that was forwarded, and to issue a replacement. Revocation takes effect on the next request; the guest sees the neutral "no longer valid" message and the contact route (RSVP-01, SEC-02).

## 6. Export attendance safely

- General export (attendance by guest and event, plus-one names, configured meal choices) is the admin export in `backend/README.md`. It excludes dietary and access notes and neutralises spreadsheet formulas (ADMIN-03).
- Dietary and access notes are a separate restricted export that is logged with the requesting account. Share only the rows a caterer or venue needs, and delete the file afterwards (SEC-05).
- Reports show no response, incomplete household, complete household, attending and declining, and count people per event.

## 7. Restore from backup

The RSVP service's backup and restore procedure (D1 time travel plus the scheduled export) is in `backend/README.md`. Test a restore once before guest launch and record the date here. After any restore, re-run the retention job so deleted data does not reappear (SEC-06, SEC-07). The website itself needs no backup: `main` is the source and any commit can be redeployed.

## 8. Manual RSVP fallback

If the RSVP service is unavailable, guests see the network-error state with their input kept on the page, and the contact route. Take responses by phone or email, then enter them through the admin correction endpoint with origin "phone" or "email" once the service is back (RSVP-06, ADMIN-02).

## 9. Take the site offline or roll back

- Roll back content: revert the commit on `main` (or `git revert`) and merge; the deploy workflow republishes the previous version.
- Take the site offline: in the repository, Settings → Pages → unpublish. The RSVP service stays private behind its own origin; disable it separately in Cloudflare if needed.
- Close online responses without taking the site down: set `rsvp.mode` to `closed` and merge.

## 10. After the wedding (OPS-03)

1. Set `rsvp.mode` to `closed`.
2. Write the approved thank-you wording into `postEvent`, set its approval to `approved`, and set `site.phase` to `post-event`. Every RSVP call to action becomes a "Thank you" link and the RSVP page shows the thank-you text.
3. Photographs remain out of scope (P2) until rights and a visibility decision exist.
4. Retention: the RSVP service deletes responses, contact details and notes `privacy.retentionDaysAfterWedding` days after the wedding (proposed 90; owner approval recorded in the decision register). Confirm the provider's backups age out within the further 30 days, or revise the notice first (SEC-06).
5. Keepsake export: `npm run build` with `site.phase` set to `post-event` produces a static, guest-data-free copy of the site in `dist/`; archive that folder.

## 11. Monitoring and incident contact (NFR-01 reliability row)

- Website: GitHub Pages status at githubstatus.com; there is no SLA. Configure an external uptime check (any free monitor) on `https://robertandnatalie.wedding/` and, once deployed, on the RSVP service health endpoint described in `backend/README.md`, alerting the incident contact below.
- RSVP service: Cloudflare Workers analytics and the `coordinator_alert` table (mail failures) are the first places to look; the runbook sections 4–8 cover corrections and the manual fallback.
- Incident contact (fill in at handover): name, telephone, email, and the second person who can act if the first is unavailable.

## 12. Access register (fill in at handover)

| System | Account owner | Second person with access | MFA |
|---|---|---|---|
| GitHub repository and Pages | | | |
| Domain registrar (robertandnatalie.wedding) | | | |
| Cloudflare (RSVP service, D1, Access) | | | |
| Email sending provider | | | |
