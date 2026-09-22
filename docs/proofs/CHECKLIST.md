# Proof checklist (PRD TPL-10)

Design checks named in the PRD for every branded proof, with the evidence file for the custom composition (the live site). Alternative mockups have the same checks in their own READMEs under `docs/selection/proofs/`.

| Check | Result | Evidence |
|---|---|---|
| Original crest proportions, ribbon and heraldic detail preserved (no redraw, no monochrome) | pass — derived renditions are proportional crops of A1 with a transparent exterior | `entry-opened-1440.png`, `detail-invitation-390@2x.png`, `assets/ASSET_MANIFEST.md` |
| Script letter spacing and wrapping; no horizontal compression | pass — names stack on narrow screens; `letter-spacing: 0` | `entry-opened-390.png`, `docs/proofs/README.md` overflow table |
| Absence of crimson | pass — palette tokens only; no red text | `src/styles/site.css` `:root` |
| Legible gold headings | pass — text gold #856119 measures 5.1:1 on ivory; deep gold #6E4F12 6.8:1 for controls | `docs/evidence/ACCESSIBILITY.md` (axe contrast), `docs/DECISION_RECORD.md` |
| Closing sentence at the same informational size, weight and colour, wrapping into centred lines | pass — same `.formal` class as the other informational lines | `entry-opened-390.png`, `entry-opened-1440.png` |
| Direct access to Wedding Day and RSVP | pass — entry bar (Skip to the wedding details, RSVP), hero actions, sticky header | `entry-envelope-390.png`, `entry-site-keepsake-390.png` |
| Portrait invitation not shrunk to fit one phone screen | pass — card scrolls at natural size | `entry-opened-390.png` |
| No credit for animation that impedes tasks | pass — envelope is skippable, reduced motion skips it entirely | `invitation-reduced-motion-390.png`, README "Reduced motion" line |
| 320, 390, 768, 1440 captures, full page and detail views | pass | file list in `docs/proofs/README.md` |
| Keyboard focus, text zoom/reflow, reduced motion, responsive navigation, basic load behaviour | pass (lab) — 200% text has no overflow; 400% zoom of a 1280 px desktop is the 320 px layout captured here | README keyboard order and overflow table, `docs/evidence/PERFORMANCE.md` |
| Synthetic guests only; concept vs runtime status explicit | pass — preview households from `content/site.config.json`; the custom proof is a working build, not a mockup | README header |

Manual visual judgement against `assets/invitation-approved-charcoal.png` (A2) and owner sign-off remain required before AT-01 is marked passed.
