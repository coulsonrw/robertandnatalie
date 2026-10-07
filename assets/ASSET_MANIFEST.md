# Asset manifest

| ID | File | Authority | Provenance | Use |
|---|---|---|---|---|
| A1 | `assets/coulson-crest-original.jpg` (1500×2230) | Heraldic detail, colors, monogram, proportions, ribbon | Owner-supplied original crest (previously `img/crest.jpg`; original upload `heZe4.jpg`) | Source for every crest rendition below. Never redrawn. |
| A2 | `assets/invitation-approved-charcoal.png` (1122×1402) | Overall visual direction; frame, flourishes, paper and crest of the invitation card | Owner-supplied approved invitation with charcoal text, re-supplied on 21 September 2026; supplied again on 22 September 2026 with the instruction to change the invitation to it (pixel comparison: same artwork, JPEG re-encoding only) | Source of the invitation-card face (renditions below). The wording is rendered as live text over it (HOME-01). |
| — | `src/img/crest-720.webp`, `crest-360.webp`, `crest-360.png`, `crest-120.webp`, `crest-64.png` | Derived from A1 | Exterior white background made transparent by edge flood-fill; interior, dolphins, ribbon and motto untouched; trimmed and resized proportionally | Header, envelope seal, favicon |
| — | `src/img/invitation-frame-1122.webp`, `-800.webp`, `-560.webp`, `invitation-frame-800.jpg` | Derived from A2 | The wording (names, request, date, venues, times, closing line) was removed and the area repainted with parchment sampled from the same artwork; frame, flourishes, paper and crest are untouched pixels of A2; resized proportionally | Face of the invitation card; the live text sits over it at the artwork's positions |
| F1 | `src/fonts/pinyon-script-400.woff2` | Script for names and venue names (DES-02 candidate) | Google Fonts, Pinyon Script v24, latin subset | Licence: `docs/licenses/OFL-Pinyon-Script.txt` |
| F2 | `src/fonts/cormorant-garamond-variable.woff2`, `-italic.woff2` | Body and headings | Google Fonts, Cormorant Garamond v21 (variable weight 300–700), latin subset | Licence: `docs/licenses/OFL-Cormorant-Garamond.txt` |
| F3 | `src/fonts/cormorant-sc-500.woff2`, `cormorant-sc-600.woff2` | Small-caps invitation copy and labels | Google Fonts, Cormorant SC v19, latin subset | Licence: `docs/licenses/OFL-Cormorant-SC.txt` |
| R1–R4 | `assets/review/photos-unverified/*.jpg` | None | Present in the previous version of the site; rights and origin unknown | **Not published.** See the README in that folder. |

## Rights and obligations (TPL-05 rights gate)

| Asset | Licence | Licence holder / owner | Permitted use and transfer | Attribution | Recurring obligations |
|---|---|---|---|---|---|
| A1 crest, A2 invitation | Owner-supplied artwork | Robert and Natalie | Use on this website and derived renditions; transfer stays with the owners | None required | None |
| Crest and invitation-frame renditions in `src/img/` | Derived from A1 and A2 | Robert and Natalie | As A1 and A2 | None | None |
| Pinyon Script, Cormorant Garamond, Cormorant SC | SIL Open Font License 1.1 | Font authors (see licence texts) | Embedding, self-hosting, bundling and transfer permitted; may not be sold by itself | Copyright notice retained in `docs/licenses/` | None |
| Inline SVG icons, ornament rule, envelope and seal drawing (`scripts/templates/layout.mjs`, `src/styles/site.css`) | Original work created for this site | Robert and Natalie (delivered with the repository) | Unrestricted within the site | None | None |
| Paper-texture SVG noise (data URI in `src/styles/site.css`) | Original | Robert and Natalie | Unrestricted | None | None |
| axe-core (`scripts/vendor/axe.min.js`) | MPL-2.0 | Deque Systems | Development tooling only; never served to guests | Notice retained in `scripts/vendor/` | None |
| Playwright (root dev dependency), wrangler, vitest, @cloudflare/vitest-pool-workers (backend dev dependencies) | Apache-2.0 / MIT (per package) | Respective authors | Development tooling only | Package licences in `node_modules` on install | None |
| Photographs in `assets/review/photos-unverified/` | Unknown | Unknown | **Not permitted to publish** | — | — |
| Story photographs and monograms (`assets/story/originals/`, git-ignored; derivatives in `assets/story/derivatives/`) | Owner-supplied; per-image `rightsConfirmed`, `subjectsApproved`, `publicationApproved` in `content/site.config.json` → `story.images[]`. Published 5 October 2026: `ch1-harvard-law`, `ch2-cairo`, `ch3-boat`, `ch4-engagement`, `ch5-awards`, `ch6-rooftop` (photographer Robert & Natalie); `monogram-rn` (chapter 10 photo stand-in) and `placeholder-monogram` (unpublished draft chapters 7–9 only) are original RN marks, not photographs of people. | Robert and Natalie | Derivatives of published chapter images are copied to the public Our Story timeline; originals and unused draft art never published | `photographer` recorded on the image entry; rendered in a caption only when `caption` is supplied | Remove derivatives if a permission is withdrawn |
| Story sketch overlays (`assets/story/sketches/ch1-sketch.svg`–`ch6-sketch.svg`) | OpenCV/Potrace edge traces of the published chapter photo derivatives (not AI; photographs themselves unchanged). Owner approved for chapters 1–6, 5 October 2026 (chapter 1 added the same day via Babbage follow-up). | Robert and Natalie | Line overlay on the public Our Story timeline; fades out to the colour still | None | Remove with the matching photograph if a permission is withdrawn |

Typeface approval (DES-02) is an owner decision recorded in `docs/DECISION_RECORD.md`. All three fonts are under the SIL Open Font License 1.1, which permits web embedding and self-hosting; the licence texts are retained beside the site. No paid template, plugin, stock media or subscription is used, so there are no recurring licence costs.
