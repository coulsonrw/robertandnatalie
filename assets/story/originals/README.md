# Story originals (private)

Put the couple's approved original photographs here. This folder is ignored by git (except this file) and is never copied into the public build. `npm run images` reads the files named in `content/site.config.json` → `story.images[].source`, strips metadata by re-encoding, and writes web derivatives to `../derivatives/`. Only derivatives of images whose approvals are all recorded are published, and only when the story itself is enabled, approved and marked public. See `docs/OUR_STORY_INTAKE.md`.
