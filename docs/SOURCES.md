# Sources register

PRD v1.1 Section 17 sources, with where each is used in this repository and when it was last rechecked. The PRD's own checks date from 21 September 2026. Rechecks from this build environment were limited: outbound access to some sites (including the hotel's) is blocked by the environment's network policy, so those rows say "not rechecked here".

| ID | Reference | Used for | Used in | Rechecked |
|---|---|---|---|---|
| S1 | Veley/Ross wedding website | Destination content pattern, repeated RSVP access | Travel & Stay structure; RSVP in header, entry bar and hero | Not rechecked here |
| S2 | Sarah & Matt wedding website | Invitation-led opening, editorial sections | Entry flow and section order | Not rechecked here |
| S3 | One Page Love: Sarah & Matt | Interactive invitation hero precedent | Envelope opening (skippable, reduced-motion path) | Not rechecked here |
| S4 | One Page Love: Jess & Russ | Illustrated timeline precedent | Not used (no story section yet) | Not rechecked here |
| S5 | The Grand Hotel: Contact Us | Resort address | `content/site.config.json` → reception venue and hotel card | Blocked by network policy on 21 Sep 2026; coordinator to recheck (telephone still publisher claim) |
| S6 | The Grand Hotel: Getting Here | Travel guidance link | Travel & Stay "Getting Here" link | Blocked by network policy on 21 Sep 2026 |
| S7 | RFC 5545 (iCalendar) | Calendar file format | `scripts/lib/ics.mjs`, unit tests | Implemented per spec; client validation pending (AT-14) |
| S8 | Next.js data security | Server-side authorization guidance | Not applicable (no Next.js); equivalent rules in `backend/` | — |
| S9 | Supabase row-level security | Database isolation if Supabase chosen | Not applicable (Cloudflare D1 chosen for the reference implementation) | — |
| S10 | OWASP Authorization Cheat Sheet | Deny-by-default checks | `backend/src/response.js`, `backend/src/admin/auth.js`, tests | Applied 21 Sep 2026 |
| S11 | WCAG 2.2 Quick Reference | Accessibility criteria | `docs/evidence/ACCESSIBILITY.md`, `scripts/audit.mjs` | Applied 21 Sep 2026 |
| S12 | web.dev Web Vitals | LCP/INP/CLS thresholds | `docs/evidence/PERFORMANCE.md`, `scripts/audit.mjs` | Applied 21 Sep 2026 |
| S13 | Google Fonts: Pinyon Script | Script typeface candidate | `src/fonts/pinyon-script-400.woff2`, `docs/licenses/` | Downloaded 21 Sep 2026 (OFL) |
| S14 | Google Fonts: Cormorant Garamond | Serif typeface candidate | `src/fonts/cormorant-garamond-variable*.woff2`, Cormorant SC, `docs/licenses/` | Downloaded 21 Sep 2026 (OFL) |

Artwork: A1 `assets/coulson-crest-original.jpg` (authoritative crest), A2 `assets/invitation-approved-charcoal.png` (visual direction), A3 not supplied and not needed. See `assets/ASSET_MANIFEST.md`.
