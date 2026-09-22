# Performance evidence (lab, NFR-02)

Build audited: dist/ written 2026-09-21T23:51:20.248Z, repository HEAD 1fd1aa3 with 6 uncommitted source file(s); hashes in results.json.

Generated 2026-09-21T23:56:45.648Z by `node scripts/audit.mjs`. Chromium 141.0.7390.37 (headless) via Playwright 1.56.1, Node v22.22.2. Host: Intel(R) Xeon(R) Processor @ 2.80GHz (4 cores), linux 6.18.44-fc-v37. CPU throttling is relative to this host, so absolute timings are not comparable with a phone; they are comparable run to run.

**Scope and honesty note.** Lab measurements in headless Chromium only. No Safari, Firefox, Edge, iOS or Android runs; no screen-reader (VoiceOver/NVDA) sessions; no field (RUM) data. PRD NFR-01 sets LCP/INP/CLS at the 75th percentile of field data; there is no field data yet, so per NFR-02 this file records lab runs only and lab interaction tests stand in for INP. The site is not on a production host during this run: assets are served uncompressed by scripts/serve.mjs, so transfer bytes are an upper bound and compressed sizes are computed locally with node:zlib. Whether the production host (GitHub Pages) compresses these files was not verified here.

## Profile

- Viewport 390×844 CSS px, device scale factor 3, mobile UA/touch enabled.
- CDP `Emulation.setCPUThrottlingRate` 4×; `Network.emulateNetworkConditions` latency 150 ms, download 1600 kbps, upload 750 kbps (approx. slow 4G); browser cache disabled.
- 5 cold-cache loads per page, each in a fresh browser context; metrics read after `load`, network idle, `document.fonts.ready` and a 2.5 s settle, before any input.
- LCP and CLS from `PerformanceObserver` (buffered `largest-contentful-paint` and `layout-shift`; CLS uses the standard 5 s / 1 s session-window maximum). TTFB, DOMContentLoaded and load from the Navigation Timing entry. Bytes from CDP `Network.loadingFinished.encodedDataLength`.
- Note on TTFB: Chromium DevTools throttling delays body delivery rather than the response headers, so `responseStart` still shows the local server's real ~2 ms; the emulated 150 ms latency and throughput appear from `responseEnd` onwards (verified with Resource Timing during this run's setup). A production TTFB depends on the host and was not measured.
- Interaction latency from the Event Timing API (`event` entries, `durationThreshold` 16 ms) for real Playwright taps; the reported value is the longest event duration of the interaction, which is how INP scores a single interaction. Durations under 16 ms are not reported by the API and are recorded as ≤16 ms.

## Budgets (PRD §13)

LCP ≤ 2500 ms · CLS ≤ 0.1 · INP ≤ 200 ms · initial transfer ≤ 1.50 MB · compressed JavaScript ≤ 200.0 kB. Pass/fail below uses the median of the 5 runs; the worst run is shown beside it.

## Guest home (/celebration.html)

| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |
|---|---|---|---|---|---|---|
| LCP | 1496 ms | 1548 ms | 1476 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 64 ms | 88 ms | 56 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 3 ms | 4 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 251 ms | 251 ms | 250 ms | — | — | — |
| FCP | 1452 ms | 1532 ms | 1436 ms | — | — | — |
| DOMContentLoaded | 1373 ms | 1404 ms | 1360 ms | — | — | — |
| load | 1638 ms | 1643 ms | 1636 ms | — | — | — |
| Transfer (uncompressed, local server) | 268.9 kB | 268.9 kB | 268.9 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 222.8 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 3.6 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1496 ms | `img` | 0.000 | 0 | 56 ms | 4 ms | 1436 ms | 1362 ms | 1637 ms | 268.9 kB | 9 | 0 |
| 2 | 1476 ms | `img` | 0.000 | 0 | 72 ms | 2 ms | 1452 ms | 1373 ms | 1638 ms | 268.9 kB | 9 | 0 |
| 3 | 1548 ms | `img` | 0.000 | 0 | 64 ms | 2 ms | 1532 ms | 1404 ms | 1636 ms | 268.9 kB | 9 | 0 |
| 4 | 1500 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1440 ms | 1360 ms | 1642 ms | 268.9 kB | 9 | 0 |
| 5 | 1492 ms | `img` | 0.000 | 0 | 88 ms | 3 ms | 1484 ms | 1399 ms | 1643 ms | 268.9 kB | 9 | 0 |

### Interactions (per run, longest event duration)

| Run | tap "Menu" (opens the mobile navigation) | tap "View the invitation" (opens the invitation dialog) |
|---|---|---|
| 1 | 24 ms (click→paint approx 20 ms) | 56 ms (click→paint approx 56 ms) |
| 2 | 24 ms (click→paint approx 17 ms) | 72 ms (click→paint approx 50 ms) |
| 3 | 24 ms (click→paint approx 21 ms) | 64 ms (click→paint approx 51 ms) |
| 4 | 24 ms (click→paint approx 18 ms) | 64 ms (click→paint approx 49 ms) |
| 5 | 24 ms (click→paint approx 17 ms) | 88 ms (click→paint approx 85 ms) |

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
| LCP | 1244 ms | 1260 ms | 1228 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 48 ms | 48 ms | 40 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 2 ms | 3 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 191 ms | 198 ms | 190 ms | — | — | — |
| FCP | 1244 ms | 1260 ms | 1228 ms | — | — | — |
| DOMContentLoaded | 1330 ms | 1343 ms | 1328 ms | — | — | — |
| load | 1333 ms | 1347 ms | 1331 ms | — | — | — |
| Transfer (uncompressed, local server) | 197.8 kB | 197.8 kB | 197.8 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 133.4 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 13.3 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1232 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1232 ms | 1328 ms | 1331 ms | 197.8 kB | 8 | 0 |
| 2 | 1244 ms | `p.lede` | 0.000 | 0 | 40 ms | 3 ms | 1244 ms | 1343 ms | 1346 ms | 197.8 kB | 8 | 0 |
| 3 | 1228 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1228 ms | 1328 ms | 1332 ms | 197.8 kB | 8 | 0 |
| 4 | 1256 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1256 ms | 1343 ms | 1347 ms | 197.8 kB | 8 | 0 |
| 5 | 1260 ms | `p.lede` | 0.000 | 0 | 40 ms | 2 ms | 1260 ms | 1330 ms | 1333 ms | 197.8 kB | 8 | 0 |

### Interactions (per run, longest event duration)

| Run | tap the invitation-code field (focus) | tap "Find my invitation" (submits the code; re-renders the busy state) | tap "These are correct — continue" (renders the attendance step) |
|---|---|---|---|
| 1 | 16 ms (click→paint approx 15 ms) | 24 ms (click→paint approx 19 ms) | 48 ms (click→paint approx 45 ms) |
| 2 | 16 ms (click→paint approx 12 ms) | 24 ms (click→paint approx 20 ms) | 40 ms (click→paint approx 41 ms) |
| 3 | 16 ms (click→paint approx 12 ms) | 24 ms (click→paint approx 17 ms) | 48 ms (click→paint approx 48 ms) |
| 4 | 16 ms (click→paint approx 12 ms) | 24 ms (click→paint approx 23 ms) | 48 ms (click→paint approx 43 ms) |
| 5 | 16 ms (click→paint approx 14 ms) | 24 ms (click→paint approx 21 ms) | 40 ms (click→paint approx 39 ms) |

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
- The RSVP service budget (95th-percentile save ≤ 1.5 s at 50 concurrent sessions) needs a backend; the preview uses an in-page mock and was not load-tested.
