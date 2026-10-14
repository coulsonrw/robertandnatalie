---
title: Workflow
updated: 2026-10-14
verified_against: bbfaca928e1b2357507c3d2231deb07c0a8cad6d
related:
  - .github/workflows/ci.yml
  - .github/workflows/deploy.yml
  - .github/CODEOWNERS
  - AGENT_START_HERE.md
  - docs/DELIVERY_PLAN.md
  - memory/README.md
---

Rob reviews pull requests on this repository and is the person who merges them. Recent `main` history is a sequence of those merges (his GitHub login is `coulsonrw`). A change waits for his approval. Merging, and anything that lands on `main` without that review, is his call.

`.github/workflows/deploy.yml` publishes `main` to GitHub Pages on every push, including a no-op commit. That is the live site at `robertandnatalie.wedding`. Work goes up on a branch and through a pull request so it can be reviewed before that publish.

`.github/CODEOWNERS` asks for an owner review on `content/`, `docs/CONTENT_APPROVAL_REGISTER.md`, and `docs/DECISION_RECORD.md`. `docs/DELIVERY_PLAN.md` still lists branch protection as an open launch item; the review rule above is how changes have been landing, and it is the rule for agents either way.

## Visual changes

A pull request that changes what a guest sees includes screenshots. The Our Story and RSVP reviews did this at a phone width and a desktop width (about 390px and 1280px or 1440px), with a before and an after when the change is a fix. Capture the state that proves the behaviour, not only the final paint: for a sketch, a mid-scroll frame where the lines are visible and a frame where the chapter title meets the nav and the photo is fully in colour.

## Before the pull request

Update `memory/` for anything learned (see `memory/README.md`) and run `node scripts/check-memory.mjs`. Pull-request CI (`.github/workflows/ci.yml`) runs that check, then `npm run check`, `npm test`, and `npm run build`, plus the Worker tests in `backend/`.

`AGENT_START_HERE.md` has the stop rules: do not record an owner approval, do not invent venue facts, and do not commit a real roster or a secret.
