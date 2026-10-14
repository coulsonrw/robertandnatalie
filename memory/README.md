# Memory

Notes in this folder are for the next person or agent who opens the repository. They are written from this codebase and its history, in our own words.

## At the start of a task

Read `memory/INDEX.md` first, then the notes that touch the work. The index is a one-line map. The notes hold the decisions, gotchas and how-tos.

`AGENT_START_HERE.md` is the longer orientation (specification, stop rules, commands). Memory does not replace it.

## Before opening a pull request

Add a note, or update an existing one, for anything learned that a later agent would otherwise have to rediscover: a decision, a gotcha, or the way a piece of the site actually works.

When you touch a note:

- Set `updated:` to the day you re-checked it (`YYYY-MM-DD`).
- Set `verified_against:` to the commit you compared the note with. Use the full SHA from `git rev-parse HEAD` on the revision you read.
- Keep `related:` pointed at files that still exist. Prefer the files a reader should open next.

Run `node scripts/check-memory.mjs` (also `npm run check:memory`). It fails when front matter is missing, an index link does not resolve, or a related path is gone. A note whose `updated:` date is more than 180 days old is a warning, not a failure: re-read it against the code and bump the date, or say in the note what you could not re-check.

## What never goes in here

No secrets, tokens, guest emails, phone numbers, mailing addresses, or other personal data. Party labels and the guest sheet stay out of this folder. Synthetic preview names in `content/site.config.json` are fixtures; do not copy a real roster in beside them.

## Shape of a note

Each topic file starts with front matter:

```yaml
---
title: Short name
updated: YYYY-MM-DD
verified_against: <full commit sha>
related:
  - path/from/repo/root.ext
---
```

`title`, `updated`, `verified_against` and `related` are all required. `related` is a list of paths from the repository root. `INDEX.md` and this file are not topic notes; they do not use that front matter.
