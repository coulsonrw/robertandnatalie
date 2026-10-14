---
title: Our Story
updated: 2026-10-14
verified_against: bbfaca928e1b2357507c3d2231deb07c0a8cad6d
related:
  - content/site.config.json
  - src/js/story.js
  - src/styles/story.css
  - scripts/templates/storyTimeline.mjs
  - scripts/build.mjs
  - assets/story/sketches/README.md
  - assets/story/sketches/ch2-sketch.svg
  - docs/OUR_STORY_INTAKE.md
---

Our Story is the chapter timeline on the home page (`story.layout` is `timeline`, title “Somewhere Between Africa & America”). Guests only see chapters with `published: true`. The build renumbers those chapters in order, so the Roman numeral on the page is the position among published chapters, not the stored `number`.

## What is on the page

Published, in stored order, shown as Chapters I–VII:

| Stored id | Title | Picture |
|---|---|---|
| ch1 | Two Worlds | Two portraits, Robert left of the rail and Natalie right (`imageIds`: `ch1-robert`, `ch1-natalie`). On a phone they sit side by side; below 340px Robert stacks above Natalie. |
| ch2 | With love, from Cairo | `ch2-cairo` |
| ch3 | Cape Town | `ch3-boat` |
| ch4 | An African Safari like no other… She said YES! | `ch4-engagement` |
| ch5 | Closing the Distance | `ch5-awards` |
| ch6 | Around the globe in 40 Hours | `ch6-rooftop`. The last paragraph of this chapter is the story line “TO BE CONTINUED …”. |
| ch10 | Sweet Home Alabama, Becoming Mr. & Mrs RW Coulson | RN monogram (`monogram-rn`), a stand-in until a photograph is chosen. Shown as Chapter VII. |

Hidden, left in `content/site.config.json` for later (`published: false`, `comingSoon: true`, body “Coming soon…”):

- ch7 — The Land of the Sand: Welcome to Dubai, Habibi
- ch8 — From Jozi Girl to ‘Jersey Girl’
- ch9 — Back to Harvard & Road Tripping

Those three never reach the template, and their placeholder art is not copied into `dist/`. Pull request #20 hid them and added the close.

## The “To be continued” ending

While any chapter is still unpublished, the timeline ends with a photo-less beat after the gold rail: `story.close.title` is “To be continued…”, then the verse and the citation Colossians 3:14 (`scripts/templates/storyTimeline.mjs`, `scripts/build.mjs`). The rail stops at a final dot; it does not run through that text. Pull request #21 took the “Colossians 3:14” line out of the Alabama chapter body and left it on this close. Publishing ch7–ch9 (clear the coming-soon body, set `comingSoon: false`, `published: true`, `textApproved: true`) removes the beat, because `continued` is true only while a draft remains.

## Sketch, then colour

Chapters 1–6 draw a line overlay on scroll, then finish on the published colour photograph. The photograph is not recoloured, greyscaled, or replaced. Chapter 10 has no sketch. With no JavaScript, or with `prefers-reduced-motion`, the frame stays on the colour still (`src/styles/story.css` sets `.sketch-svg { opacity: 0 }` and `.sketch-photo { opacity: 1 }` as the resting state).

`story.js` fetches each `data-sketch` SVG into the card. Five groups, classes `l1` through `l5`, draw in order: `l1` is the largest lines and starts first, `l5` is the smallest detail and starts last (`animation-range` from cover 10–32% for `l1` through cover 28–46% for `l5`). Ink is `#2c2414`, stroke width 1.85, opacity 0.62. Every path uses `pathLength="1"` so the dash animation can run from 1.02 to 0.

### Colour finishes when the title meets the nav

Pull request #25. The colour photo, and the lines leaving it, must be finished when the top of the chapter title meets the bottom of the sticky header. `tuneColour` in `src/js/story.js` measures the header height (it is not a fixed pixel offset) and uses layout tops rather than `getBoundingClientRect`, because the chapter text is still sliding in with a transform earlier in the scroll. It stops one pixel early so rounding cannot leave a sliver of sketch on that frame. The fade keeps a fixed length of the sketch’s cover travel: the photo over the last 12% (`PHOTO_SPAN = 0.12`), the lines over the last 8% (`INK_SPAN = 0.08`), both ending together. Before that measurement runs, the CSS fallback is cover 46–58% for the photo and cover 50–58% for the ink.

## How a line-sketch file is made

The overlay is an edge trace, not a drawing and not a generated photograph. The recipe used to replace the Chapter 1 portraits (pull request #27) is the one to repeat. Chapters 2–6 were traced the same way earlier and committed as SVG; the generator script is not in the repository. Their path counts follow the same five-way split, largest lines in `l1` and the smallest half in `l5`.

1. **Frame the photo the way the page crops it.** Portrait frames are 3:4. The trace is built at 1200×1600. Cover-crop the source to that aspect, biased to the same anchor as `.sketch.is-portrait .sketch-photo img` (`object-position: center 15%`): if the photo is taller than 3:4, the window starts 15% of the way down the leftover height. Owner originals live in `assets/story/originals/` and are gitignored; the committed derivatives are what the site serves. Trace the picture guests actually see.

2. **OpenCV edges.** Greyscale, Gaussian blur with a 3×3 kernel, then two Canny passes combined with a bitwise or: a firm pass at thresholds 48 and 120, and a lighter pass at 16 and 48. Dilate with a 2×2 ellipse. Invert the bitmap so the edges are black on white (Potrace traces the dark shapes).

3. **Potrace.** Write that bitmap as a 1-bit PBM and run `potrace -s -t 2 -a 1.15 -O 0.2` (SVG output, turd size 2, alphamax 1.15, opttolerance 0.2). Collect every path `d`.

4. **Five layers.** Rank paths by the area of their bounding box, largest first. Give `l1` the largest 5%, `l2` the next 7.5%, `l3` the next 12.5%, `l4` the next 25%, and `l5` the rest (the smallest half). Each path is `<path pathLength="1" d="…"/>`.

5. **Put Potrace’s coordinates back on the photo.** Potrace’s SVG is in a 10× space with y flipped. Each group needs `transform="translate(0,1600) scale(0.1,-0.1)"` on a `viewBox="0 0 1200 1600"`. The site CSS strokes the paths (`fill: none`); the SVG does not set the ink colour.

Point `story.images[].sketch` at `assets/story/sketches/<name>.svg`. The build copies it to `/img/story/` and refuses to build if that file is missing. It does not inspect the path coordinates.

## Gotcha: a new photo with a bad sketch only fades

Pull requests #26 and #27. Replacing a photograph does not create a sketch. The Chapter 1 portraits shipped in #26 with overlay files that look valid to the build (five `l1`–`l5` groups, `pathLength="1"`) but do not draw on the picture. On `main` at the commit above, `ch1-robert-sketch.svg` and `ch1-natalie-sketch.svg` use `viewBox="0 0 900 1200"` and a handful of paths whose coordinates sit around 4000–8000, outside that box. Potrace’s 10× y-flipped space was written through without the group transform, so the lines never appear and the guest only sees the colour fade. The scroll code in `story.js` was already fine.

#27 (open at the time of this note) replaces those two files with real edge traces from the steps above. Until that is merged, chapter 1 on `main` still has the off-canvas overlays. Any new photo needs a sketch generated the same way, then checked mid-scroll: lines visible on the face, and full colour once the chapter title meets the nav. A file that merely exists is not enough.
