# Performance evidence (lab, NFR-02)

Build audited: dist/ written 2026-09-21T23:51:20.248Z, repository HEAD dc25b7f; hashes in results.json.

Generated 2026-09-22T00:07:33.879Z by `node scripts/audit.mjs`. Chromium 141.0.7390.37 (headless) via Playwright 1.56.1, Node v22.22.2. Host: Intel(R) Xeon(R) Processor @ 2.80GHz (4 cores), linux 6.18.44-fc-v37. CPU throttling is relative to this host, so absolute timings are not comparable with a phone; they are comparable run to run.

**Scope and honesty note.** Lab measurements in headless Chromium only. No Safari, Firefox, Edge, iOS or Android runs; no screen-reader (VoiceOver/NVDA) sessions; no field (RUM) data. Browser contexts use Playwright's bypassCSP so that axe-core and the measurement probes can be injected; whether the pages behave correctly under their own Content-Security-Policy is not verified by this run. PRD NFR-01 sets LCP/INP/CLS at the 75th percentile of field data; there is no field data yet, so per NFR-02 this file records lab runs only and lab interaction tests stand in for INP. The site is not on a production host during this run: assets are served uncompressed by scripts/serve.mjs, so transfer bytes are an upper bound and compressed sizes are computed locally with node:zlib. Whether the production host (GitHub Pages) compresses these files was not verified here.

## Profile

- Viewport 390×844 CSS px, device scale factor 3, mobile UA/touch enabled.
- CDP `Emulation.setCPUThrottlingRate` 4×; `Network.emulateNetworkConditions` latency 150 ms, download 1600 kbps, upload 750 kbps (approx. slow 4G); browser cache disabled.
- 5 cold-cache loads per page, each in a fresh browser context; metrics read after `load`, network idle, `document.fonts.ready` and a 2.5 s settle, before any input.
- LCP and CLS from `PerformanceObserver` (buffered `largest-contentful-paint` and `layout-shift`; CLS uses the standard 5 s / 1 s session-window maximum). TTFB, DOMContentLoaded and load from the Navigation Timing entry. Bytes from CDP `Network.loadingFinished.encodedDataLength`.
- Note on TTFB: in these runs `responseStart` is not delayed by the network emulation while `responseEnd` is (medians: landing 2 ms → 249 ms; celebration 3 ms → 250 ms; rsvp-preview 2 ms → 197 ms), so the TTFB column reflects the local server, not the emulated latency. A production TTFB depends on the host and was not measured.
- Interaction latency from the Event Timing API (`event` entries, `durationThreshold` 16 ms) for real Playwright taps; the reported value is the longest event duration of the interaction, which is how INP scores a single interaction. Durations under 16 ms are not reported by the API; when no event reaches that floor the value shown is the click-to-paint approximation capped at 16 ms (never an Event Timing duration).

## Budgets (PRD §13)

LCP ≤ 2500 ms · CLS ≤ 0.1 · INP ≤ 200 ms · initial transfer ≤ 1.50 MB · compressed JavaScript ≤ 200.0 kB. Pass/fail below uses the median of the 5 runs; the worst run is shown beside it.

## Landing page (/), sealed envelope then entry to the site

| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |
|---|---|---|---|---|---|---|
| LCP | 1484 ms | 1488 ms | 1476 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 80 ms | 96 ms | 72 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 2 ms | 3 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 249 ms | 251 ms | 243 ms | — | — | — |
| FCP | 1440 ms | 1484 ms | 1416 ms | — | — | — |
| DOMContentLoaded | 1383 ms | 1416 ms | 1360 ms | — | — | — |
| load | 1642 ms | 1645 ms | 1628 ms | — | — | — |
| Transfer (uncompressed, local server) | 268.9 kB | 268.9 kB | 268.9 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 222.8 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 3.6 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1476 ms | `img` | 0.000 | 0 | 80 ms | 3 ms | 1440 ms | 1378 ms | 1628 ms | 268.9 kB | 9 | 0 |
| 2 | 1484 ms | `img` | 0.000 | 0 | 80 ms | 2 ms | 1484 ms | 1416 ms | 1645 ms | 268.9 kB | 9 | 0 |
| 3 | 1488 ms | `img` | 0.000 | 0 | 96 ms | 3 ms | 1416 ms | 1360 ms | 1636 ms | 268.9 kB | 9 | 0 |
| 4 | 1476 ms | `img` | 0.000 | 0 | 72 ms | 2 ms | 1448 ms | 1393 ms | 1644 ms | 268.9 kB | 9 | 0 |
| 5 | 1488 ms | `img` | 0.000 | 0 | 72 ms | 2 ms | 1440 ms | 1383 ms | 1642 ms | 268.9 kB | 9 | 0 |

### Interactions (per run, longest event duration)

| Run | tap the seal (opens the envelope, reveals the invitation) | tap "Continue to the website" (enters the site, docks the invitation bottom-left) |
|---|---|---|
| 1 | 40 ms (click→paint approx 17 ms) | 80 ms (click→paint approx 71 ms) |
| 2 | 32 ms (click→paint approx 18 ms) | 80 ms (click→paint approx 73 ms) |
| 3 | 40 ms (click→paint approx 22 ms) | 96 ms (click→paint approx 85 ms) |
| 4 | 40 ms (click→paint approx 17 ms) | 72 ms (click→paint approx 69 ms) |
| 5 | 32 ms (click→paint approx 18 ms) | 72 ms (click→paint approx 67 ms) |

### Bytes by resource type (median-transfer run, uncompressed)

| Type | Bytes |
|---|---|
| Font | 137.7 kB |
| Image | 68.6 kB |
| Stylesheet | 31.0 kB |
| Document | 19.0 kB |
| Script | 12.7 kB |

<details><summary>Resources (median run)</summary>

| Resource | Type | Bytes | Status |
|---|---|---|---|
| / | Document | 19.0 kB | 200 |
| /fonts/pinyon-script-400.woff2 | Font | 39.2 kB | 200 |
| /fonts/cormorant-sc-600.woff2 | Font | 21.1 kB | 200 |
| /fonts/cormorant-garamond-variable.woff2 | Font | 37.8 kB | 200 |
| /styles/site.css | Stylesheet | 31.0 kB | 200 |
| /img/crest-120.webp | Image | 10.9 kB | 200 |
| /img/crest-360.webp | Image | 57.7 kB | 200 |
| /js/site.js | Script | 12.7 kB | 200 |
| /fonts/cormorant-garamond-variable-italic.woff2 | Font | 39.5 kB | 200 |

</details>

## Guest home (/celebration.html)

| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |
|---|---|---|---|---|---|---|
| LCP | 1492 ms | 1496 ms | 1468 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 64 ms | 64 ms | 56 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 3 ms | 3 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 250 ms | 251 ms | 243 ms | — | — | — |
| FCP | 1464 ms | 1488 ms | 1440 ms | — | — | — |
| DOMContentLoaded | 1383 ms | 1395 ms | 1354 ms | — | — | — |
| load | 1643 ms | 1650 ms | 1630 ms | — | — | — |
| Transfer (uncompressed, local server) | 268.9 kB | 268.9 kB | 268.9 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 222.8 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 3.6 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1492 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1448 ms | 1367 ms | 1642 ms | 268.9 kB | 9 | 0 |
| 2 | 1492 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1464 ms | 1383 ms | 1650 ms | 268.9 kB | 9 | 0 |
| 3 | 1496 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1488 ms | 1395 ms | 1645 ms | 268.9 kB | 9 | 0 |
| 4 | 1468 ms | `img` | 0.000 | 0 | 64 ms | 2 ms | 1440 ms | 1354 ms | 1630 ms | 268.9 kB | 9 | 0 |
| 5 | 1496 ms | `img` | 0.000 | 0 | 56 ms | 2 ms | 1484 ms | 1394 ms | 1643 ms | 268.9 kB | 9 | 0 |

### Interactions (per run, longest event duration)

| Run | tap "Menu" (opens the mobile navigation) | tap "View the invitation" (opens the invitation dialog) |
|---|---|---|
| 1 | 24 ms (click→paint approx 17 ms) | 64 ms (click→paint approx 51 ms) |
| 2 | 24 ms (click→paint approx 17 ms) | 64 ms (click→paint approx 51 ms) |
| 3 | 24 ms (click→paint approx 21 ms) | 64 ms (click→paint approx 49 ms) |
| 4 | 24 ms (click→paint approx 18 ms) | 64 ms (click→paint approx 48 ms) |
| 5 | 16 ms (click→paint approx 15 ms) | 56 ms (click→paint approx 44 ms) |

### Bytes by resource type (median-transfer run, uncompressed)

| Type | Bytes |
|---|---|
| Font | 137.7 kB |
| Image | 68.6 kB |
| Stylesheet | 31.0 kB |
| Document | 19.0 kB |
| Script | 12.7 kB |

<details><summary>Resources (median run)</summary>

| Resource | Type | Bytes | Status |
|---|---|---|---|
| /celebration.html | Document | 19.0 kB | 200 |
| /fonts/pinyon-script-400.woff2 | Font | 39.2 kB | 200 |
| /fonts/cormorant-sc-600.woff2 | Font | 21.1 kB | 200 |
| /fonts/cormorant-garamond-variable.woff2 | Font | 37.8 kB | 200 |
| /styles/site.css | Stylesheet | 31.0 kB | 200 |
| /img/crest-120.webp | Image | 10.9 kB | 200 |
| /img/crest-360.webp | Image | 57.7 kB | 200 |
| /js/site.js | Script | 12.7 kB | 200 |
| /fonts/cormorant-garamond-variable-italic.woff2 | Font | 39.5 kB | 200 |

</details>

## RSVP with synthetic guests (/rsvp.html?preview=1)

| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |
|---|---|---|---|---|---|---|
| LCP | 1252 ms | 1268 ms | 1240 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 48 ms | 56 ms | 48 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 2 ms | 2 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 197 ms | 198 ms | 196 ms | — | — | — |
| FCP | 1252 ms | 1268 ms | 1240 ms | — | — | — |
| DOMContentLoaded | 1343 ms | 1350 ms | 1333 ms | — | — | — |
| load | 1346 ms | 1352 ms | 1336 ms | — | — | — |
| Transfer (uncompressed, local server) | 197.8 kB | 197.8 kB | 197.8 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 133.4 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 13.3 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1240 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1240 ms | 1333 ms | 1336 ms | 197.8 kB | 8 | 0 |
| 2 | 1268 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1268 ms | 1343 ms | 1346 ms | 197.8 kB | 8 | 0 |
| 3 | 1252 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1252 ms | 1343 ms | 1346 ms | 197.8 kB | 8 | 0 |
| 4 | 1244 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1244 ms | 1343 ms | 1345 ms | 197.8 kB | 8 | 0 |
| 5 | 1260 ms | `p.lede` | 0.000 | 0 | 56 ms | 2 ms | 1260 ms | 1350 ms | 1352 ms | 197.8 kB | 8 | 0 |

### Interactions (per run, longest event duration)

| Run | tap the invitation-code field (focus) | tap "Find my invitation" (submits the code; re-renders the busy state) | tap "These are correct — continue" (renders the attendance step) |
|---|---|---|---|
| 1 | 16 ms (click→paint approx 11 ms) | 24 ms (click→paint approx 21 ms) | 48 ms (click→paint approx 44 ms) |
| 2 | 16 ms (click→paint approx 11 ms) | 24 ms (click→paint approx 18 ms) | 48 ms (click→paint approx 45 ms) |
| 3 | 24 ms (click→paint approx 15 ms) | 24 ms (click→paint approx 23 ms) | 48 ms (click→paint approx 48 ms) |
| 4 | 16 ms (click→paint approx 11 ms) | 24 ms (click→paint approx 23 ms) | 48 ms (click→paint approx 41 ms) |
| 5 | 16 ms (click→paint approx 11 ms) | 24 ms (click→paint approx 22 ms) | 56 ms (click→paint approx 49 ms) |

### Bytes by resource type (median-transfer run, uncompressed)

| Type | Bytes |
|---|---|
| Font | 98.2 kB |
| Script | 49.3 kB |
| Stylesheet | 31.0 kB |
| Image | 10.9 kB |
| Document | 8.4 kB |

<details><summary>Resources (median run)</summary>

| Resource | Type | Bytes | Status |
|---|---|---|---|
| /rsvp.html?preview=1 | Document | 8.4 kB | 200 |
| /fonts/pinyon-script-400.woff2 | Font | 39.2 kB | 200 |
| /fonts/cormorant-sc-600.woff2 | Font | 21.1 kB | 200 |
| /fonts/cormorant-garamond-variable.woff2 | Font | 37.8 kB | 200 |
| /styles/site.css | Stylesheet | 31.0 kB | 200 |
| /img/crest-120.webp | Image | 10.9 kB | 200 |
| /js/site.js | Script | 12.7 kB | 200 |
| /js/rsvp.js | Script | 36.7 kB | 200 |

</details>

## Compressed sizes (node:zlib, computed locally)

node:zlib gzipSync level 6 (also level 9 and brotli default for reference). The local server sends no Content-Encoding, so transfer bytes below are uncompressed.

| File | Raw | gzip -6 | gzip -9 | brotli |
|---|---|---|---|---|
| dist/js/rsvp.js | 36.5 kB | 9.7 kB | 9.7 kB | 8.5 kB |
| dist/js/site.js | 12.5 kB | 3.6 kB | 3.6 kB | 3.1 kB |
| dist/styles/site.css | 30.8 kB | 7.3 kB | 7.3 kB | 6.3 kB |
| dist/404.html | 5.4 kB | 2.1 kB | 2.1 kB | 1.6 kB |
| dist/celebration.html | 18.8 kB | 5.1 kB | 5.1 kB | 4.2 kB |
| dist/index.html | 18.8 kB | 5.1 kB | 5.1 kB | 4.2 kB |
| dist/privacy.html | 7.8 kB | 3.1 kB | 3.1 kB | 2.4 kB |
| dist/rsvp.html | 8.1 kB | 2.9 kB | 2.9 kB | 2.3 kB |

All JavaScript in dist/js, gzip -6: **13.3 kB** (budget 200.0 kB). Per page: celebration.html 3.6 kB, index.html 3.6 kB, rsvp.html 13.3 kB, privacy.html 3.6 kB, 404.html 3.6 kB.

## Result

All budgets met on the median run.

## Still open

- Field data (real guests, real devices) does not exist yet; NFR-01 75th-percentile targets cannot be confirmed from lab runs.
- Runs on Safari/iOS and Chrome/Android hardware (NFR-03), and against the production host with its real compression and CDN behaviour.
- NFR-02 names "the authenticated guest route". The static build has no such route (rsvp.mode is coming-soon and no private household page is served); the guest home /celebration.html and the RSVP preview with the synthetic household stand in until the RSVP service is live, when the real route must be added to PERF_PAGES and measured.
- The RSVP service budget (95th-percentile save ≤ 1.5 s at 50 concurrent sessions) needs a backend; the preview uses an in-page mock and was not load-tested.
