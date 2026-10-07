# Our Story: intake, approval and publishing

The Our Story section (audit IMP-12/13, PRD CONTENT-01) is the public chapter timeline. It appears on the home page between The Details and Wedding Day, and "Our Story" is the first navigation item, only when the owners have supplied the copy and photographs, approved them, and recorded image rights.

Two layouts are supported:

| `story.layout` | What guests see |
|---|---|
| `"timeline"` (published form) | Eames / Figma chapter timeline: Roman-numeral rail, per-chapter title, optional when/place, photograph or monogram, and the approved paragraphs. |
| `"narrative"` (or omitted) | The original short module: lead photograph, up to three narrative paragraphs, supporting grid, optional milestones. Kept so the synthetic QA path and an unpublished preview still work. |

Local and CI builds render a labelled synthetic timeline preview at `/story-preview.html` when the story is **not** published, so the layout can be judged without any real content (QA-06). The deployed build (`SITE_PREVIEW=0`) never includes that page.

## What the owners supply

| Item | Where it goes | Rules |
|---|---|---|
| Chapter timeline (published) | `story.layout: "timeline"`; `story.title`, `story.subtitle`, `story.byline`; `story.chapters[]` | Owner-written or owner-approved copy. Each chapter is `{ id, number, title, when, place, paragraphs, imageId, textApproved, comingSoon, published }`. `when` and `place` are optional and appear only when supplied. Guests only see `published: true` chapters. Drafts stay in the file with `published: false` (and `comingSoon: true` until the prose is ready). Coming-soon drafts keep their title, use the body `"Coming soon…"`, and must not invent prose. Visitor-facing Chapter I, II… labels are sequential among published chapters; stored `number` is the owner-document id. |
| Short narrative (optional / unpublished path) | `story.narrative.paragraphs` | Used only when `layout` is `"narrative"`. Up to three short paragraphs; the build warns outside 150–250 words. |
| Optional milestones | `story.milestones[]`: `{ id, title, description, when, place, imageId }` | Narrative layout only. `when` and `place` appear only when supplied. |
| Photographs and monograms | Originals in `assets/story/originals/` (git-ignored); entries in `story.images[]` | Originals are never copied to the site. Only the couple's own or licensed photographs; no stock, no generated stand-ins, no AI of people photographs. Timeline chapters use `role: "chapter"` and `kind: "photo"`, `"monogram"` or `"placeholder"`. Narrative layout still uses `lead` / `supporting` / `milestone` and at most six pictures. |
| Sketch overlays (chapters 1–6) | Optional `sketch` on a `kind: "photo"` image, file under `assets/story/sketches/` | Owner-approved OpenCV/Potrace line-art traced from the published photo derivatives. Overlays only — the photograph is unchanged (no cream, greyscale or sepia). Unpublished drafts and chapter 10 have no sketch. |
| Per-image record | `story.images[]`: `{ id, role, kind, source, sketch, alt, caption, photographer, rightsConfirmed, subjectsApproved, publicationApproved, visibility, focalPoint }` | `alt` describes the picture without inventing names, places or feelings. For monogram placeholders say that a photo is forthcoming or that the chapter is coming soon. `caption` and `photographer` are optional (`"Robert & Natalie"` is acceptable when the couple took the picture). All three approval flags must be `true` and `visibility` must be `"public"` before the build will publish. `sketch` is optional and must be an `.svg` under `assets/story/sketches/`. |
| Visibility decision | `story.visibility` | Only `"public"` is supported on this host. |
| Approval | `story.approval` | `state: "approved"`, the approver in `owner`, the date in `reviewed`, and a note of where the approval is recorded. |

## Producing the pictures

1. Copy the approved originals into `assets/story/originals/` (any of JPEG, PNG, WebP, SVG).
2. Add one entry per picture to `story.images[]` with `source: "assets/story/originals/<file>"`.
3. Run `npm run images`. Chromium re-encodes each picture (which drops EXIF and GPS metadata) and writes WebP and JPEG derivatives at 480, 800, 1200 and 1600 px wide (never wider than the original) to `assets/story/derivatives/`, plus `manifest.json`. The command prints each derivative's size and flags any that exceed the provisional budgets (about 250 KB for a narrative lead, 150 KB for the others, at 1200 px).
4. Commit the derivatives and the manifest. Do not commit the originals.

Real photographs render as-is (no sepia, no cream or greyscale wash). Chapters 1–6 add a separate scroll-drawn line overlay that fades out to the published colour still. Chapter 10 may use the RN monogram until a photograph is chosen. Chapters without copy yet stay in the configuration as unpublished drafts and do not appear on the site; the timeline ends with a photo-less “To be continued” beat while any draft remains. Without JavaScript or with `prefers-reduced-motion`, guests see the colour stills — never a half-drawn sketch.

## Publishing

1. Set `story.enabled` to `true`, `story.visibility` to `"public"` and `story.approval.state` to `"approved"`.
2. Run `npm run check`. For the timeline the build refuses to publish while any of these is missing: at least one **published** chapter, `textApproved: true` on every published chapter, alt text on every image, all three approval flags on every image, `visibility: "public"` on every image, and derivatives for every image (QA-07, QA-08). A chapter cannot be `published: true` and `comingSoon: true` at once. Unpublished drafts must use the body `"Coming soon…"` while `comingSoon` is true.
3. Run `npm run build` and review `dist/index.html` locally (`npm run serve`) at phone and desktop widths: alternating chapter columns on wide screens, a left-hand rail on phones, readable captions, real photos on the approved chapters and the monogram on chapter 10 until a photograph is chosen. Draft chapters must not appear; the rail should end on “To be continued” while drafts remain.
4. Merge to `main`. The deploy adds the section between The Details and Wedding Day, and adds "Our Story" as the first navigation item. RSVP and Wedding Day remain one action away.

## Publishing a draft chapter later

Draft chapters stay in `content/site.config.json` with `published: false`. Guests never see them. To add one to the site:

1. Replace the `"Coming soon…"` paragraph with the approved copy (more than one paragraph is fine).
2. Set `comingSoon` to `false`, `published` to `true`, and `textApproved` to `true`.
3. Point `imageId` at an approved `story.images[]` entry (photograph with a sketch overlay, or the RN monogram until a photo exists) and run `npm run images` if you added a new original.
4. Run `npm run check`, then `npm run build` and review the chapter on phone and desktop. Visitor-facing Roman numerals are sequential among published chapters, so a newly published chapter takes the next number and later published chapters shift forward.

The short note on `story.chaptersNote` in the config repeats this.

## Unpublishing

Set `story.enabled` to `false`. The next build removes the section, the navigation link and every story image from the deployed site; derivatives stay in the repository for later use.

## What the section deliberately does not do

No carousel, no autoplay, no lightbox, no hover-only captions, no AI of people photographs, and no story content in the deployed build without the approvals above. Owner-approved OpenCV/Potrace line overlays on chapters 1–6 are separate SVG assets; they do not replace or recolour the photographs.
