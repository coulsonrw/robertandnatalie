# Performance evidence (lab, NFR-02)

Build audited: dist/ written 2026-09-21T23:16:19.398Z, repository HEAD c5ba819 with 7 uncommitted source file(s); hashes in results.json.

Generated 2026-09-21T23:16:30.182Z by `node scripts/audit.mjs`. Chromium 141.0.7390.37 (headless) via Playwright 1.56.1, Node v22.22.2. Host: Intel(R) Xeon(R) Processor @ 2.80GHz (4 cores), linux 6.18.44-fc-v37. CPU throttling is relative to this host, so absolute timings are not comparable with a phone; they are comparable run to run.

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
| LCP | 1484 ms | 1508 ms | 1476 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 64 ms | 72 ms | 56 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 3 ms | 3 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 250 ms | 250 ms | 243 ms | — | — | — |
| FCP | 1424 ms | 1508 ms | 1420 ms | — | — | — |
| DOMContentLoaded | 1346 ms | 1421 ms | 1338 ms | — | — | — |
| load | 1628 ms | 1643 ms | 1622 ms | — | — | — |
| Transfer (uncompressed, local server) | 267.0 kB | 267.0 kB | 267.0 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 222.3 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 3.5 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1504 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1492 ms | 1395 ms | 1629 ms | 267.0 kB | 9 | 0 |
| 2 | 1480 ms | `img` | 0.000 | 0 | 72 ms | 3 ms | 1424 ms | 1344 ms | 1628 ms | 267.0 kB | 9 | 0 |
| 3 | 1508 ms | `img` | 0.000 | 0 | 56 ms | 3 ms | 1508 ms | 1421 ms | 1643 ms | 267.0 kB | 9 | 0 |
| 4 | 1484 ms | `img` | 0.000 | 0 | 64 ms | 2 ms | 1424 ms | 1346 ms | 1622 ms | 267.0 kB | 9 | 0 |
| 5 | 1476 ms | `img` | 0.000 | 0 | 64 ms | 3 ms | 1420 ms | 1338 ms | 1627 ms | 267.0 kB | 9 | 0 |

### Interactions (per run, longest event duration)

| Run | tap "Menu" (opens the mobile navigation) | tap "View the invitation" (opens the invitation dialog) |
|---|---|---|
| 1 | 24 ms (click→paint approx 17 ms) | 64 ms (click→paint approx 48 ms) |
| 2 | 40 ms (click→paint approx 33 ms) | 72 ms (click→paint approx 50 ms) |
| 3 | 16 ms (click→paint approx 4 ms) | 56 ms (click→paint approx 42 ms) |
| 4 | 24 ms (click→paint approx 16 ms) | 64 ms (click→paint approx 46 ms) |
| 5 | 24 ms (click→paint approx 14 ms) | 64 ms (click→paint approx 46 ms) |

### Bytes by resource type (median-transfer run, uncompressed)

| Type | Bytes |
|---|---|
| Font | 137.7 kB |
| Image | 68.6 kB |
| Stylesheet | 29.8 kB |
| Document | 18.5 kB |
| Script | 12.5 kB |

<details><summary>Resources (median run)</summary>

| Resource | Type | Bytes | Status |
|---|---|---|---|
| /celebration.html | Document | 18.5 kB | 200 |
| /fonts/pinyon-script-400.woff2 | Font | 39.2 kB | 200 |
| /fonts/cormorant-sc-600.woff2 | Font | 21.1 kB | 200 |
| /fonts/cormorant-garamond-variable.woff2 | Font | 37.8 kB | 200 |
| /styles/site.css | Stylesheet | 29.8 kB | 200 |
| /img/crest-120.webp | Image | 10.9 kB | 200 |
| /img/crest-360.webp | Image | 57.7 kB | 200 |
| /js/site.js | Script | 12.5 kB | 200 |
| /fonts/cormorant-garamond-variable-italic.woff2 | Font | 39.5 kB | 200 |

</details>

## RSVP with synthetic guests (/rsvp.html?preview=1)

| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |
|---|---|---|---|---|---|---|
| LCP | 1204 ms | 1212 ms | 1192 ms | 2500 ms | yes | yes |
| CLS | 0.000 | 0.000 | 0.000 | 0.100 | yes | yes |
| Interaction latency (lab INP proxy) | 48 ms | 56 ms | 40 ms | 200 ms | yes | yes |
| TTFB (responseStart; local server, see note) | 2 ms | 2 ms | 2 ms | — | — | — |
| HTML document fully received (responseEnd) | 198 ms | 199 ms | 190 ms | — | — | — |
| FCP | 1204 ms | 1212 ms | 1192 ms | — | — | — |
| DOMContentLoaded | 1327 ms | 1330 ms | 1320 ms | — | — | — |
| load | 1330 ms | 1332 ms | 1324 ms | — | — | — |
| Transfer (uncompressed, local server) | 196.1 kB | 196.1 kB | 196.1 kB | 1.50 MB | yes | yes |
| Transfer, estimated with gzip for HTML/CSS/JS | 133.0 kB | | | 1.50 MB | yes | |
| JavaScript loaded by this page, gzip | 13.2 kB | | | 200.0 kB | yes | |

### Runs

| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1204 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1204 ms | 1320 ms | 1324 ms | 196.1 kB | 8 | 0 |
| 2 | 1212 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1212 ms | 1329 ms | 1332 ms | 196.1 kB | 8 | 0 |
| 3 | 1204 ms | `p.lede` | 0.000 | 0 | 56 ms | 2 ms | 1204 ms | 1323 ms | 1324 ms | 196.1 kB | 8 | 0 |
| 4 | 1196 ms | `p.lede` | 0.000 | 0 | 48 ms | 2 ms | 1196 ms | 1330 ms | 1332 ms | 196.1 kB | 8 | 0 |
| 5 | 1192 ms | `p.lede` | 0.000 | 0 | 40 ms | 2 ms | 1192 ms | 1327 ms | 1330 ms | 196.1 kB | 8 | 0 |

### Interactions (per run, longest event duration)

| Run | tap the invitation-code field (focus) | tap "Find my invitation" (submits the code; re-renders the busy state) | tap "These are correct — continue" (renders the attendance step) |
|---|---|---|---|
| 1 | 16 ms (click→paint approx 13 ms) | 32 ms (click→paint approx 20 ms) | 48 ms (click→paint approx 44 ms) |
| 2 | 16 ms (click→paint approx 12 ms) | 24 ms (click→paint approx 19 ms) | 48 ms (click→paint approx 40 ms) |
| 3 | 16 ms (click→paint approx 12 ms) | 24 ms (click→paint approx 21 ms) | 56 ms (click→paint approx 49 ms) |
| 4 | 16 ms (click→paint approx 11 ms) | 24 ms (click→paint approx 20 ms) | 48 ms (click→paint approx 41 ms) |
| 5 | 16 ms (click→paint approx 13 ms) | 24 ms (click→paint approx 20 ms) | 40 ms (click→paint approx 38 ms) |

### Bytes by resource type (median-transfer run, uncompressed)

| Type | Bytes |
|---|---|
| Font | 98.2 kB |
| Script | 49.2 kB |
| Stylesheet | 29.8 kB |
| Image | 10.9 kB |
| Document | 8.0 kB |

<details><summary>Resources (median run)</summary>

| Resource | Type | Bytes | Status |
|---|---|---|---|
| /rsvp.html?preview=1 | Document | 8.0 kB | 200 |
| /fonts/pinyon-script-400.woff2 | Font | 39.2 kB | 200 |
| /fonts/cormorant-sc-600.woff2 | Font | 21.1 kB | 200 |
| /fonts/cormorant-garamond-variable.woff2 | Font | 37.8 kB | 200 |
| /styles/site.css | Stylesheet | 29.8 kB | 200 |
| /img/crest-120.webp | Image | 10.9 kB | 200 |
| /js/site.js | Script | 12.5 kB | 200 |
| /js/rsvp.js | Script | 36.7 kB | 200 |

</details>

## Compressed sizes (node:zlib, computed locally)

node:zlib gzipSync level 6 (also level 9 and brotli default for reference). The local server sends no Content-Encoding, so transfer bytes below are uncompressed.

| File | Raw | gzip -6 | gzip -9 | brotli |
|---|---|---|---|---|
| dist/js/rsvp.js | 36.5 kB | 9.7 kB | 9.7 kB | 8.5 kB |
| dist/js/site.js | 12.3 kB | 3.5 kB | 3.5 kB | 3.0 kB |
| dist/styles/site.css | 29.6 kB | 7.1 kB | 7.1 kB | 6.1 kB |
| dist/404.html | 5.1 kB | 1.9 kB | 1.9 kB | 1.5 kB |
| dist/celebration.html | 18.2 kB | 4.9 kB | 4.9 kB | 4.0 kB |
| dist/index.html | 18.3 kB | 4.9 kB | 4.9 kB | 4.0 kB |
| dist/privacy.html | 7.5 kB | 2.9 kB | 2.9 kB | 2.3 kB |
| dist/rsvp.html | 7.8 kB | 2.7 kB | 2.7 kB | 2.2 kB |

All JavaScript in dist/js, gzip -6: **13.2 kB** (budget 200.0 kB). Per page: celebration.html 3.5 kB, index.html 3.5 kB, rsvp.html 13.2 kB, privacy.html 3.5 kB, 404.html 3.5 kB.

## Result

All budgets met on the median run.

## Still open

- Field data (real guests, real devices) does not exist yet; NFR-01 75th-percentile targets cannot be confirmed from lab runs.
- Runs on Safari/iOS and Chrome/Android hardware (NFR-03), and against the production host with its real compression and CDN behaviour.
- The RSVP service budget (95th-percentile save ≤ 1.5 s at 50 concurrent sessions) needs a backend; the preview uses an in-page mock and was not load-tested.
