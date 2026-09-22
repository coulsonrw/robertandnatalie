/**
 * Read-only public-site capture for the wedding audit.
 * Supplied with the live-site audit handoff of 22 September 2026 (tools/capture-public-site.mjs)
 * and kept here unchanged apart from this note so it resolves the repository's Playwright install.
 *   npm run capture:public                       (defaults to https://robertandnatalie.wedding)
 *   AUDIT_BASE_URL=http://127.0.0.1:8080 npm run capture:public   (against npm run serve)
 * NOT executed against the live website by the accompanying report.
 * Uses fresh, unauthenticated contexts; does not click or submit forms.
 * Install/use the project's approved Playwright dependency and browser binaries.
 * Run from a location where that dependency resolves, e.g. tools/capture-public-site.mjs.
 *
 * AUDIT_BASE_URL=https://robertandnatalie.wedding \
 * AUDIT_OUT=artifacts/public-audit node tools/capture-public-site.mjs
 * Optional: AUDIT_ENGINE=chromium|firefox|webkit; AUDIT_REDUCED_MOTION=1
 * Viewport emulation is not evidence of testing a physical phone or Safari itself.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

let pw;
try { pw = await import('@playwright/test'); }
catch { try { pw = await import('playwright'); }
catch { throw new Error('Use an approved local Playwright installation; no dependencies were installed by this script.'); } }

const base = new URL(process.env.AUDIT_BASE_URL || 'https://robertandnatalie.wedding');
if (!['http:', 'https:'].includes(base.protocol) || base.search || base.hash || base.username || base.password) {
  throw new Error('AUDIT_BASE_URL must be a plain HTTP(S) origin, without credentials, query or fragment.');
}
if (base.pathname !== '/') throw new Error('Use an origin, not a private route, as AUDIT_BASE_URL.');
const out = path.resolve(process.env.AUDIT_OUT || 'artifacts/public-audit');
const engine = process.env.AUDIT_ENGINE || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(engine)) throw new Error('Unsupported AUDIT_ENGINE');
const routes = [['home', '/'], ['wedding-day', '/#wedding-day'], ['rsvp', '/rsvp.html'], ['privacy', '/privacy.html']];
const widths = [320, 390, 768, 1440];
const reducedMotion = process.env.AUDIT_REDUCED_MOTION === '1' ? 'reduce' : 'no-preference';
const cleanUrl = value => { try { const u = new URL(value); return `${u.origin}${u.pathname}`; } catch { return '[unparseable]'; } };
const redact = value => String(value)
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
  .replace(/([?&](?:token|code|key|credential|secret)=)[^&\s]+/gi, '$1[redacted]')
  .slice(0, 1500);
await fs.mkdir(out, { recursive: true });
const summary = { startedAt: new Date().toISOString(), origin: base.origin, engine, reducedMotion,
  mode: 'Read-only public GETs; no authentication, clicks, form submission, or RSVP mutation.',
  limitation: 'Captures and inventories only, not a full accessibility, security or calendar-import certification.',
  cases: [], calendars: [] };
let browser;
try {
  browser = await pw[engine].launch({ headless: true });
  summary.browserVersion = browser.version();
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 },
      deviceScaleFactor: 1, reducedMotion, serviceWorkers: 'block' });
    // Do not permit mutations initiated by the loaded public page.
    await context.route('**/*', route => {
      const method = route.request().method();
      return ['GET', 'HEAD', 'OPTIONS'].includes(method) ? route.continue() : route.abort('blockedbyclient');
    });
    for (const [name, pathname] of routes) {
      const item = { route: pathname, width, status: 'not_run', consoleErrors: [], failedRequests: [], httpErrors: [] };
      const page = await context.newPage();
      page.on('pageerror', err => item.consoleErrors.push(redact(err.message)));
      page.on('console', msg => { if (msg.type() === 'error') item.consoleErrors.push(redact(msg.text())); });
      page.on('requestfailed', req => item.failedRequests.push({ url: cleanUrl(req.url()), failure: redact(req.failure()?.errorText) }));
      page.on('response', response => { if (response.status() >= 400) item.httpErrors.push({ url: cleanUrl(response.url()), status: response.status() }); });
      try {
        const response = await page.goto(new URL(pathname, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 5000))]));
        await page.waitForTimeout(700);
        item.httpStatus = response?.status();
        item.finalUrl = cleanUrl(page.url());
        item.title = await page.title();
        item.inventory = await page.evaluate(() => {
          const visible = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
          return {
            viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
            documentHeight: document.documentElement.scrollHeight,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            headings: [...document.querySelectorAll('h1,h2,h3')].map(e => ({ tag: e.tagName, text: e.textContent.trim(), visible: visible(e) })),
            forms: [...document.forms].map(f => ({ method: f.method, fields: [...f.querySelectorAll('input,select,textarea')].map(e => ({ tag: e.tagName, type: e.type, name: e.name, required: e.required })) })),
            links: [...document.querySelectorAll('a[href]')].map(e => ({ text: e.textContent.trim(), href: e.getAttribute('href'), visible: visible(e) })),
            images: [...document.images].map(e => ({ src: e.currentSrc || e.src, alt: e.alt, loaded: e.complete && e.naturalWidth > 0,
              naturalWidth: e.naturalWidth, naturalHeight: e.naturalHeight, width: e.width, height: e.height })),
            typography: [...document.querySelectorAll('h1,h2,h3,p,label,button')].filter(visible).slice(0, 150).map(e => {
              const s = getComputedStyle(e); return { tag: e.tagName, sample: e.textContent.trim().slice(0, 100),
                fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, background: s.backgroundColor };
            })
          };
        });
        const stem = `${engine}-${width}-${name}-${reducedMotion}`;
        await page.screenshot({ path: path.join(out, `${stem}.png`), fullPage: true });
        item.screenshot = `${stem}.png`;
        item.status = 'captured_not_certified';
      } catch (err) { item.status = 'capture_failed'; item.error = redact(err.message); }
      summary.cases.push(item);
      await page.close();
    }
    await context.close();
  }
  const request = await pw.request.newContext();
  for (const event of ['ceremony', 'reception']) {
    const item = { event, status: 'not_run' };
    try {
      const url = new URL(`/calendar/${event}.ics`, base).href;
      const response = await request.get(url, { timeout: 20000 });
      item.httpStatus = response.status();
      item.contentType = response.headers()['content-type'];
      const body = await response.body();
      if (body.length > 262144) throw new Error('Unexpectedly large calendar response; not saved.');
      if (!response.ok()) throw new Error(`Calendar returned HTTP ${response.status()}`);
      const text = body.toString('utf8');
      item.linesForReview = text.split(/\r?\n/).filter(l => /^(BEGIN:V(?:CALENDAR|EVENT)|UID:|DTSTART|DTEND|TZID:|LOCATION:)/.test(l));
      item.status = 'fetched_requires_calendar_client_validation';
      await fs.writeFile(path.join(out, `${event}.ics`), body);
    } catch (err) { item.status = 'fetch_failed'; item.error = redact(err.message); }
    summary.calendars.push(item);
  }
  await request.dispose();
} catch (err) { summary.fatalError = redact(err.message); process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  summary.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(out, 'capture-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Audit captures written to ${out}. Review results; capture is not a test pass.`);
}
