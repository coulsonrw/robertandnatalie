# Our Story: intake, approval and publishing

The Our Story section (audit IMP-12/13, PRD CONTENT-01) is built and switched off. It appears on the public site only when the owners have supplied the copy and photographs, approved them, and recorded image rights. Until then the deployed build contains no story text, no story images and no navigation link; local and CI builds render a labelled synthetic layout preview at `/story-preview.html` so the layout can be judged without any real content (QA-06).

## What the owners supply

| Item | Where it goes | Rules |
|---|---|---|
| Narrative, 150–250 words in up to three short paragraphs | `content/site.config.json` → `story.narrative.paragraphs` | Written or approved by Robert and Natalie in their own voice. Nothing is inferred from private conversations, messages or social accounts. `story.narrative.voice` records the chosen voice (for example "first-person plural"). |
| Preferred voice and facts that must stay private | `story.narrative.voice`; the private list stays with the owners | The build never sees the private list; it is the owners' checklist while approving copy. |
| Optional milestones (three to five) | `story.milestones[]`: `{ id, title, description, when, place, imageId }` | `when` and `place` are optional strings and appear only when supplied; no dates are invented for balance. `imageId` may point at one of the images below. |
| One lead photograph and up to four supporting photographs (six at most including a milestone picture) | Originals in `assets/story/originals/` (git-ignored); entries in `story.images[]` | Originals are never copied to the site. Only the couple's own or licensed photographs; no stock or generated stand-ins. |
| Per-image record | `story.images[]`: `{ id, role, source, alt, caption, photographer, rightsConfirmed, subjectsApproved, publicationApproved, visibility, focalPoint }` | `role` is `lead`, `supporting` or `milestone`. `alt` describes the picture without inventing names, places or feelings. `caption` and `photographer` are optional. All three approval flags must be `true` and `visibility` must be `"public"` before the build will publish. `focalPoint` (0–1 on each axis) sets the crop centre where the layout crops. |
| Visibility decision | `story.visibility` | Only `"public"` is supported on this host. A private story would need server-side access control; hiding a link on a public static site is not privacy (audit §05). |
| Approval | `story.approval` | `state: "approved"`, the approver in `owner`, the date in `reviewed`, and a note of where the approval is recorded. |

## Producing the pictures

1. Copy the approved originals into `assets/story/originals/` (any of JPEG, PNG, WebP, SVG).
2. Add one entry per picture to `story.images[]` with `source: "assets/story/originals/<file>"`.
3. Run `npm run images`. Chromium re-encodes each picture (which drops EXIF and GPS metadata) and writes WebP and JPEG derivatives at 480, 800, 1200 and 1600 px wide (never wider than the original) to `assets/story/derivatives/`, plus `manifest.json`. The command prints each derivative's size and flags any that exceed the provisional budgets (about 250 KB for the lead picture, 150 KB for the others, at 1200 px); supply a tighter crop rather than lowering quality below what the picture deserves.
4. Commit the derivatives and the manifest. Do not commit the originals.

## Publishing

1. Set `story.enabled` to `true`, `story.visibility` to `"public"` and `story.approval.state` to `"approved"`.
2. Run `npm run check`. The build refuses to publish while any of these is missing: at least one non-empty paragraph, one lead image, alt text on every image, all three approval flags on every image, `visibility: "public"` on every image, and derivatives for every image (QA-07, QA-08). It warns when the narrative falls outside 150–250 words or exceeds three paragraphs.
3. Run `npm run build` and review `dist/index.html` locally (`npm run serve`) at phone and desktop widths: natural crops, readable captions, correct reading order (lead picture, narrative, supporting grid, milestones).
4. Merge to `main`. The deploy adds the section between the welcome area and Wedding Day, and adds "Our Story" as the first navigation item. RSVP and Wedding Day remain one action away.

## Unpublishing

Set `story.enabled` to `false`. The next build removes the section, the navigation link and every story image from the deployed site; derivatives stay in the repository for later use.

## What the section deliberately does not do

No carousel, no autoplay, no lightbox, no hover-only captions, no lazy-loading of the lead picture, and no story content in the deployed build without the approvals above. Layout at 320, 390, 768 and 1440 px is covered by the proof captures of `/story-preview.html`.
