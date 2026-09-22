// Accessibility and performance evidence for PRD v1.1 §13 (NFR-01–NFR-04) and AT-15.
// Lab results in headless Chromium only. Output: docs/evidence/{ACCESSIBILITY.md,PERFORMANCE.md,results.json}.
//
//   node scripts/audit.mjs [--a11y-only | --perf-only] [--runs N] [--strict]
//
// Exit status is non-zero when any axe-core violation of impact serious/critical exists or any PRD budget
// is exceeded (median of the cold-cache runs). --strict also fails on the additional structural checks
// (h1 count, heading order, alt text, labels, skip link, focus indicator, tap targets, reduced motion).
// Requires a globally installed Playwright with Chromium (the repository has no npm dependencies).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'docs', 'evidence');
const AXE_PATH = path.join(ROOT, 'scripts', 'vendor', 'axe.min.js');
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const RUNS = Math.max(1, Number(opt('--runs', 5)));
const DO_A11Y = !flag('--perf-only');
const DO_PERF = !flag('--a11y-only');
const STRICT = flag('--strict');

// PRD §13 budgets (NFR-01 table). "MB"/"KB" are read as decimal (1,500,000 / 200,000 bytes).
const BUDGETS = { lcpMs: 2500, cls: 0.1, inpMs: 200, transferBytes: 1_500_000, jsGzipBytes: 200_000 };
// Lab profile for NFR-02. Throughput values are what CDP receives (bytes per second).
const PROFILE = {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  cpuThrottlingRate: 4,
  network: { label: 'approx. slow 4G', latencyMs: 150, downloadKbps: 1600, uploadKbps: 750 },
  runs: RUNS, cache: 'cold (fresh browser context per run)', server: 'scripts/serve.mjs (local, no compression, Cache-Control: no-store)',
};
const A11Y_VIEWPORTS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];
const PERF_PAGES = [
  { id: 'celebration', url: '/celebration.html', label: 'Guest home (/celebration.html)' },
  { id: 'rsvp-preview', url: '/rsvp.html?preview=1', label: 'RSVP with synthetic guests (/rsvp.html?preview=1)' },
];

// ---------- setup ----------
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('dist/ missing — running npm run build');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}
if (!fs.existsSync(AXE_PATH)) {
  console.error(`axe-core not found at ${AXE_PATH}. Copy axe.min.js from the axe-core npm package (MPL-2.0) there.`);
  process.exit(2);
}
const axeVersion = (fs.readFileSync(AXE_PATH, 'utf8').match(/axe v([\d.]+)/) || [])[1] || 'unknown';

function loadPlaywright() {
  try { return { pw: require('playwright'), pkg: require('playwright/package.json') }; } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return { pw: require(path.join(globalRoot, 'playwright')), pkg: require(path.join(globalRoot, 'playwright', 'package.json')) };
}
const { pw: { chromium }, pkg: pwPkg } = loadPlaywright();
const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });

import { createHash } from 'node:crypto';
function buildFingerprint() {
  const files = ['index.html', 'celebration.html', 'rsvp.html', 'privacy.html', '404.html', 'js/site.js', 'js/rsvp.js', 'styles/site.css'].filter((f) => fs.existsSync(path.join(DIST, f)));
  const hashes = Object.fromEntries(files.map((f) => [f, createHash('sha256').update(fs.readFileSync(path.join(DIST, f))).digest('hex').slice(0, 12)]));
  const builtAt = new Date(Math.max(...files.map((f) => fs.statSync(path.join(DIST, f)).mtimeMs))).toISOString();
  let commit = null; try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch {}
  let dirty = null; try { dirty = execSync('git status --porcelain -- src scripts/templates scripts/build.mjs content', { cwd: ROOT }).toString().trim().split('\n').filter(Boolean).length; } catch {}
  return { builtAt, hashes, commit, uncommittedSourceFiles: dirty };
}
const results = {
  generatedAt: new Date().toISOString(),
  build: buildFingerprint(),
  tool: { script: 'scripts/audit.mjs', node: process.version, playwright: pwPkg.version, browser: `Chromium ${browser.version()}`, axeCore: axeVersion,
    host: { platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model || 'unknown', cores: os.cpus().length, memoryGB: +(os.totalmem() / 1e9).toFixed(1) } },
  scope: 'Lab measurements in headless Chromium only. No Safari, Firefox, Edge, iOS or Android runs; no screen-reader (VoiceOver/NVDA) sessions; no field (RUM) data.',
  budgets: BUDGETS,
  accessibility: null,
  performance: null,
  summary: null,
};

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const worst = (xs) => (xs.length ? Math.max(...xs) : null);
const best = (xs) => (xs.length ? Math.min(...xs) : null);
const fmtBytes = (b) => (b == null ? '—' : b >= 1e6 ? `${(b / 1e6).toFixed(2)} MB` : `${(b / 1e3).toFixed(1)} kB`);
const fmtMs = (v) => (v == null ? '—' : `${Math.round(v)} ms`);

async function settle(page) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(300);
}

// ---------- RSVP preview flow helpers (synthetic household, code PREVIEW) ----------
async function rsvpEnterCode(page) {
  await page.waitForSelector('[data-step="access"]');
  await page.fill('#code', 'PREVIEW');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-step="invitees"]');
}
async function rsvpToAttendanceError(page) {
  await rsvpEnterCode(page);
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="attendance"]');
  await page.click('[data-action="continue"]');
  await page.waitForSelector('.error-text:not([hidden])');
}
async function rsvpAnswerAll(page) {
  const radios = await page.$$('input[type=radio]');
  for (const r of radios) {
    const value = await r.getAttribute('value');
    const name = await r.getAttribute('name');
    const alex = name.startsWith('g_alex|') || name.startsWith('g_alex_guest|');
    if ((alex && value === 'attending') || (!alex && value === 'declining')) await r.check();
  }
  await page.fill('#plusone-g_alex_guest', 'Casey Example');
}
async function rsvpToDetails(page) {
  await rsvpToAttendanceError(page);
  await rsvpAnswerAll(page);
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="details"]');
  await page.fill('#contactEmail', 'alex@example.com');
  await page.fill('#notes', 'Vegetarian, please.');
}
async function rsvpToReview(page) {
  await rsvpToDetails(page);
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="review"]');
}
async function rsvpToConfirmation(page) {
  await rsvpToReview(page);
  await page.click('[data-action="submit"]');
  await page.waitForSelector('[data-step="confirmation"]');
}
// ---------- home entry stage helpers ----------
async function openEnvelope(page) {
  await page.waitForSelector('body[data-entry-state="closed"]');
  await page.click('#seal');
  await page.waitForSelector('body[data-entry-state="open"]', { timeout: 10000 });
  await page.waitForTimeout(200);
}
async function enterSite(page) {
  await openEnvelope(page);
  await page.click('#entry-open [data-action="enter"]');
  await page.waitForSelector('body[data-entry-state="site"]', { timeout: 10000 });
  await page.waitForTimeout(200);
}
async function openKeepsakeDialog(page) {
  await enterSite(page);
  await page.click('.hero-keepsake [data-action="view-invitation"]');
  await page.waitForSelector('body[data-entry-state="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(200);
}

const A11Y_STATES = [
  { id: 'home-sealed', url: '/', label: 'Home: sealed envelope (entry stage)', rsvpFlow: false },
  { id: 'home-open', url: '/', label: 'Home: envelope opened, invitation shown', setup: openEnvelope },
  { id: 'home-entered', url: '/', label: 'Home: entered the site, invitation docked bottom-left', setup: enterSite },
  { id: 'home-dialog', url: '/', label: 'Home: docked invitation re-opened in the dialog', setup: openKeepsakeDialog },
  { id: 'celebration', url: '/celebration.html', label: 'Guest home /celebration.html (site route)' },
  { id: 'rsvp-coming-soon', url: '/rsvp.html', label: 'RSVP /rsvp.html (coming-soon mode, no form)' },
  { id: 'rsvp-access', url: '/rsvp.html?preview=1', label: 'RSVP preview: access (code) step', setup: (p) => p.waitForSelector('[data-step="access"]'), rsvpFlow: true },
  { id: 'rsvp-invitees', url: '/rsvp.html?preview=1', label: 'RSVP preview: invitees step', setup: rsvpEnterCode, rsvpFlow: true },
  { id: 'rsvp-attendance-error', url: '/rsvp.html?preview=1', label: 'RSVP preview: attendance step with validation errors', setup: rsvpToAttendanceError, rsvpFlow: true },
  { id: 'rsvp-details', url: '/rsvp.html?preview=1', label: 'RSVP preview: details step', setup: rsvpToDetails, rsvpFlow: true },
  { id: 'rsvp-review', url: '/rsvp.html?preview=1', label: 'RSVP preview: review step', setup: rsvpToReview, rsvpFlow: true },
  { id: 'rsvp-confirmation', url: '/rsvp.html?preview=1', label: 'RSVP preview: confirmation step', setup: rsvpToConfirmation, rsvpFlow: true },
  { id: 'privacy', url: '/privacy.html', label: 'Privacy notice' },
  { id: 'not-found', url: '/404.html', label: '404 page' },
];

// Browser-side structural checks. Runs inside the page; returns plain data.
const STRUCTURE_CHECKS = `(() => {
  const inTree = (el) => !el.closest('[hidden],[inert],[aria-hidden="true"]');
  const rendered = (el) => { if (!inTree(el)) return false; const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const sel = (el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && parts.length < 5) {
      let s = n.tagName.toLowerCase();
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
      const cls = [...n.classList].slice(0, 2).map((c) => '.' + CSS.escape(c)).join('');
      const sib = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [];
      if (sib.length > 1) s += ':nth-of-type(' + (sib.indexOf(n) + 1) + ')';
      parts.unshift(s + cls);
      n = n.parentElement;
    }
    return parts.join(' > ');
  };
  const text = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);

  const level = (h) => (h.getAttribute('role') === 'heading' && +h.getAttribute('aria-level')) || (/^H[1-6]$/.test(h.tagName) ? +h.tagName[1] : null);
  const allHeadings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].filter(rendered).filter((h) => level(h));
  const h1s = allHeadings.filter((h) => level(h) === 1);
  const headings = allHeadings.map((h) => ({ level: level(h), text: text(h), selector: sel(h), via: h.getAttribute('role') === 'heading' ? 'aria-level' : 'element' }));
  const headingJumps = [];
  headings.forEach((h, i) => { if (i > 0 && h.level > headings[i - 1].level + 1) headingJumps.push({ from: headings[i - 1], to: h }); });

  const imgs = [...document.querySelectorAll('img')].filter(inTree);
  const imgsMissingAlt = imgs.filter((i) => !i.hasAttribute('alt')).map((i) => ({ selector: sel(i), src: i.currentSrc || i.src }));

  const controls = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]),select,textarea')].filter(inTree);
  const unlabeled = controls.filter((c) => {
    const byAttr = (c.getAttribute('aria-label') || '').trim();
    const byIds = (c.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean).map((e) => e.textContent.trim()).join(' ').trim();
    const byLabel = [...(c.labels || [])].map((l) => l.textContent.trim()).join(' ').trim();
    return !(byAttr || byIds || byLabel || (c.getAttribute('title') || '').trim());
  }).map((c) => ({ selector: sel(c), type: c.type || c.tagName.toLowerCase() }));

  const targets = [...document.querySelectorAll('main a[href], main button, main .choice label, main input:not([type=radio]):not([type=hidden]), main textarea, main select')].filter(rendered);
  // PRD target is 44×44 (product preference). WCAG 2.5.8 (AA) requires 24×24 but exempts targets sitting inline in text;
  // inline links are reported separately as "below the product target" rather than as failures.
  const tapTargets = targets.map((t) => {
    const r = t.getBoundingClientRect();
    const inline = getComputedStyle(t).display === 'inline' && !!t.closest('p, li, dd, address, td, span');
    const meets44 = r.width >= 44 && r.height >= 44, meets24 = r.width >= 24 && r.height >= 24;
    return { selector: sel(t), text: text(t), tag: t.tagName.toLowerCase(), width: Math.round(r.width), height: Math.round(r.height), inRsvpApp: !!t.closest('#rsvp-app'), inline, meets44, meets24, ok: meets44 || inline };
  });

  return { h1: { count: h1s.length, texts: h1s.map(text) }, headings, headingJumps, images: { total: imgs.length, missingAlt: imgsMissingAlt }, controls: { total: controls.length, unlabeled }, tapTargets, title: document.title, lang: document.documentElement.lang,
    overflow: { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth } };
})()`;

const FOCUS_INFO = `(() => {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return { tag: 'BODY' };
  const sel = (el) => el.id ? '#' + CSS.escape(el.id) : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  const hasOutline = (s) => s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  let via = null;
  let indicator = hasOutline(cs) ? 'outline' : (cs.boxShadow && cs.boxShadow !== 'none' ? 'box-shadow' : null);
  if (!indicator && a.tagName === 'INPUT' && a.id) {
    const label = document.querySelector('label[for="' + CSS.escape(a.id) + '"]');
    if (label) { const ls = getComputedStyle(label); if (hasOutline(ls)) { indicator = 'outline'; via = sel(label); } else if (ls.boxShadow && ls.boxShadow !== 'none') { indicator = 'box-shadow'; via = sel(label); } }
  }
  return { tag: a.tagName, selector: sel(a), text: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50), href: a.getAttribute('href'),
    focusVisible: a.matches(':focus-visible'), indicator, indicatorVia: via, outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden', inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth };
})()`;

async function focusWalk(page, limit) {
  const stops = [];
  const seen = new Set();
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(FOCUS_INFO);
    if (info.tag === 'BODY') { if (stops.length && !stops.passedBody) { stops.passedBody = true; continue; } break; }
    const k = info.selector + '|' + info.text;
    if (seen.has(k)) { info.repeatOf = k; stops.push(info); break; }
    seen.add(k);
    stops.push(info);
  }
  return stops;
}

// Accessible names as Chromium computes them (other engines may join split spans differently — not verified here).
async function accessibleNames(context, page, selectors) {
  const cdp = await context.newCDPSession(page);
  const out = {};
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    for (const sel of selectors) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel }).catch(() => ({ nodeId: 0 }));
      if (!nodeId) continue;
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
      const n = nodes[0];
      out[sel] = n ? { role: n.role?.value ?? null, name: n.name?.value ?? null, ignored: !!n.ignored } : null;
    }
  } finally { await cdp.detach().catch(() => {}); }
  return out;
}
const NAME_PROBES = ['#seal', '#invitation-title', '#hero-title', '.keepsake-btn', '.dialog-close', '.nav-toggle', '#rsvp-step-heading', '#code'];

async function runAxe(page) {
  await page.addScriptTag({ path: AXE_PATH });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ['violations', 'incomplete'], reporter: 'v2' });
    const pick = (v) => ({ id: v.id, impact: v.impact, tags: v.tags, help: v.help, helpUrl: v.helpUrl, description: v.description,
      nodes: v.nodes.map((n) => ({ target: n.target.join(' >>> '), html: n.html.slice(0, 200), failureSummary: (n.failureSummary || '').slice(0, 400),
        reasons: [...(n.any || []), ...(n.all || []), ...(n.none || [])].map((c) => c.message).filter(Boolean).slice(0, 3) })) });
    return { violations: res.violations.map(pick), incomplete: res.incomplete.map(pick), passes: res.passes?.length ?? null, testEngine: res.testEngine, url: res.url };
  });
  return r;
}

// ---------- accessibility ----------
async function runAccessibility() {
  const states = [];
  for (const vp of A11Y_VIEWPORTS) {
    for (const st of A11Y_STATES) {
      const context = await browser.newContext({ bypassCSP: true,  viewport: vp, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
      page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e.message).slice(0, 200)));
      const rec = { id: st.id, label: st.label, url: st.url, viewport: vp.width, ok: false };
      try {
        const resp = await page.goto(base + st.url, { waitUntil: 'networkidle' });
        rec.httpStatus = resp?.status();
        await settle(page);
        if (st.setup) await st.setup(page);
        await settle(page);
        rec.entryState = await page.evaluate(() => document.body.getAttribute('data-entry-state'));
        rec.focusedAfterSetup = await page.evaluate(FOCUS_INFO);
        rec.structure = await page.evaluate(STRUCTURE_CHECKS);
        rec.accessibleNames = await accessibleNames(context, page, NAME_PROBES);
        rec.axe = await runAxe(page);
        const stops = await focusWalk(page, 90);
        rec.focus = {
          firstStop: stops[0] || null,
          skipLinkFirst: !!stops[0] && /^#main$/.test(stops[0].href || '') && /skip/i.test(stops[0].text),
          skipLinkApplicable: !st.setup, // after a scripted state change the app moves focus on purpose (heading / hero), so "first Tab" is not the page start
          stops: stops.length,
          withoutIndicator: stops.filter((s) => s.focusVisible && !s.indicator).map((s) => ({ selector: s.selector, text: s.text, outline: s.outline })),
          notFocusVisible: stops.filter((s) => !s.focusVisible).map((s) => ({ selector: s.selector, text: s.text })),
          invisibleFocused: stops.filter((s) => !s.visible).map((s) => ({ selector: s.selector, text: s.text })),
          order: stops.map((s) => `${s.tag}${s.selector.startsWith('#') ? s.selector : ''} "${s.text}"`),
        };
        rec.consoleErrors = consoleErrors;
        rec.ok = true;
      } catch (e) {
        rec.error = String(e && e.message ? e.message : e).slice(0, 500);
        rec.consoleErrors = consoleErrors;
      }
      await context.close();
      const v = rec.axe?.violations || [];
      const bad = rec.structure ? {
        h1: rec.structure.h1.count === 1, headingOrder: rec.structure.headingJumps.length === 0, alt: rec.structure.images.missingAlt.length === 0, labels: rec.structure.controls.unlabeled.length === 0,
        tapTargets: rec.structure.tapTargets.filter((t) => !t.ok && (st.rsvpFlow ? true : t.inRsvpApp)).length === 0,
        focusIndicator: rec.focus.withoutIndicator.length === 0 && rec.focus.invisibleFocused.length === 0,
        skipLink: rec.focus.skipLinkApplicable ? rec.focus.skipLinkFirst : null,
        overflow: rec.structure.overflow.scrollWidth <= rec.structure.overflow.innerWidth,
      } : null;
      rec.checks = bad;
      console.log(`[a11y] ${String(vp.width).padStart(4)}px ${st.id.padEnd(24)} axe: ${v.length} violation(s)${v.length ? ' [' + v.map((x) => x.impact + ':' + x.id).join(', ') + ']' : ''}` +
        (bad ? ` | h1=${rec.structure.h1.count} jumps=${rec.structure.headingJumps.length} alt-missing=${rec.structure.images.missingAlt.length} unlabeled=${rec.structure.controls.unlabeled.length} tap<44=${rec.structure.tapTargets.filter((t) => !t.ok).length} focus-no-indicator=${rec.focus.withoutIndicator.length} skip=${bad.skipLink === null ? 'n/a' : bad.skipLink}` : ` | ERROR ${rec.error}`));
      states.push(rec);
    }
  }

  // Reduced-motion emulation (NFR-01 Motion; HOME-03): the invitation must be readable and reachable with no animation.
  const reduced = [];
  for (const vp of A11Y_VIEWPORTS) {
    const context = await browser.newContext({ bypassCSP: true,  viewport: vp, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const rec = { viewport: vp.width, steps: [] };
    const probe = (label) => page.evaluate((label) => {
      const card = document.getElementById('invitation-card');
      const r = card.getBoundingClientRect();
      const cs = getComputedStyle(card);
      const lines = [...card.querySelectorAll('.invitation-body > *')].filter((e) => e.tagName !== 'PICTURE');
      const readable = lines.filter((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.99; });
      return { label, reduceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, entryState: document.body.getAttribute('data-entry-state'), animations: document.getAnimations().length,
        card: { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height), opacity: cs.opacity, visibility: cs.visibility, ariaHidden: card.getAttribute('aria-hidden') },
        textBlocks: lines.length, readableBlocks: readable.length, fontSizePx: lines[0] ? parseFloat(getComputedStyle(lines[0]).fontSize) : null, seal: !!document.querySelector('#seal') && document.querySelector('#seal').getBoundingClientRect().height > 0,
        focused: document.activeElement && (document.activeElement.id || document.activeElement.tagName) };
    }, label);
    try {
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      await settle(page);
      const first = await probe('initial');
      rec.steps.push(first);
      rec.startState = first.entryState;
      if (first.entryState === 'closed') {
        const t0 = Date.now();
        await page.click('#seal');
        await page.waitForSelector('body[data-entry-state="open"]', { timeout: 5000 });
        rec.openMs = Date.now() - t0;
        await page.waitForTimeout(150);
        rec.steps.push(await probe('open'));
      } else if (first.entryState === 'open') {
        rec.openMs = 0; // the page skipped the sealed envelope under reduced motion and rendered the invitation directly
        rec.steps.push(await probe('open'));
      } else throw new Error('unexpected start state ' + first.entryState);
      await page.click('#entry-open [data-action="enter"]');
      await page.waitForSelector('body[data-entry-state="site"]', { timeout: 5000 });
      await page.waitForTimeout(150);
      rec.steps.push(await probe('site (docked)'));
      await page.click('.hero-keepsake [data-action="view-invitation"]');
      await page.waitForSelector('body[data-entry-state="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(150);
      rec.steps.push(await probe('dialog'));
      const open = rec.steps[1], dlg = rec.steps[3];
      rec.skippedSealUnderReducedMotion = rec.startState === 'open';
      rec.pass = rec.steps.every((s) => s.reduceMatches && s.animations === 0) && open.readableBlocks === open.textBlocks && open.card.width > 0 && open.card.top >= 0 && open.card.top < vp.height
        && dlg.readableBlocks === dlg.textBlocks && dlg.card.width > 0;
    } catch (e) { rec.error = String(e.message).slice(0, 300); rec.pass = false; }
    await context.close();
    console.log(`[a11y] reduced-motion ${vp.width}px: ${rec.pass ? 'pass' : 'FAIL'}${rec.error ? ' ' + rec.error : ''} (open in ${rec.openMs ?? '?'} ms, animations ${rec.steps.map((s) => s.animations).join('/')})`);
    reduced.push(rec);
  }

  const allViolations = [];
  for (const s of states) for (const v of s.axe?.violations || []) for (const n of v.nodes) allViolations.push({ state: s.id, viewport: s.viewport, url: s.url, impact: v.impact, rule: v.id, selector: n.target, help: v.help, helpUrl: v.helpUrl, html: n.html, tags: v.tags.filter((t) => /^wcag|best-practice/.test(t)) });
  const byImpact = allViolations.reduce((m, v) => ((m[v.impact] = (m[v.impact] || 0) + 1), m), {});
  return { viewports: A11Y_VIEWPORTS.map((v) => v.width), states, reducedMotion: reduced, violations: allViolations, violationsByImpact: byImpact,
    seriousOrCritical: allViolations.filter((v) => v.impact === 'serious' || v.impact === 'critical').length };
}

// ---------- performance ----------
const PERF_INIT = `(() => {
  window.__perf = { lcp: [], cls: [], events: [], mark: 0, clickToPaint: null };
  // Sources/targets may be Text nodes (no tagName); never throw inside an observer callback or the rest of the batch is lost.
  const desc = (n) => { if (!n) return null; const el = n.nodeType === 1 ? n : n.parentElement; if (!el) return n.nodeName || null; return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + (n.nodeType === 3 ? ' (text)' : ''); };
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => __perf.lcp.push({ startTime: e.startTime, renderTime: e.renderTime, loadTime: e.loadTime, size: e.size, url: e.url || null, element: desc(e.element) }))).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => __perf.cls.push({ t: e.startTime, v: e.value, input: e.hadRecentInput, sources: (e.sources || []).slice(0, 3).map((s) => desc(s.node)) }))).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => __perf.events.push({ name: e.name, start: e.startTime, duration: e.duration, inputDelay: e.processingStart - e.startTime, processing: e.processingEnd - e.processingStart, interactionId: e.interactionId, target: desc(e.target) }))).observe({ type: 'event', buffered: true, durationThreshold: 16 }); } catch (e) {}
})()`;

function computeCls(shifts) {
  let sessionValue = 0, sessionEntries = [], max = 0;
  for (const s of shifts.filter((x) => !x.input)) {
    const first = sessionEntries[0], last = sessionEntries[sessionEntries.length - 1];
    if (sessionEntries.length && s.t - last.t < 1000 && s.t - first.t < 5000) { sessionValue += s.v; sessionEntries.push(s); } else { sessionValue = s.v; sessionEntries = [s]; }
    max = Math.max(max, sessionValue);
  }
  return max;
}

async function measureInteraction(page, label, action) {
  await page.evaluate(() => {
    window.__perf.events = []; window.__perf.mark = performance.now(); window.__perf.clickToPaint = null;
    document.addEventListener('click', (e) => { requestAnimationFrame(() => setTimeout(() => { window.__perf.clickToPaint = performance.now() - e.timeStamp; }, 0)); }, { capture: true, once: true });
  });
  await action();
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const names = ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
    const evs = window.__perf.events.filter((e) => names.includes(e.name) && e.start >= window.__perf.mark - 50);
    return { eventTiming: evs, maxEventDurationMs: evs.length ? Math.max(...evs.map((e) => e.duration)) : null, clickToPaintMs: window.__perf.clickToPaint };
  });
  // Event Timing durations are rounded to 8 ms and only reported when ≥ 16 ms; a null means every event handler finished within that floor.
  const latency = r.maxEventDurationMs ?? (r.clickToPaintMs != null ? Math.min(r.clickToPaintMs, 16) : null);
  return { label, latencyMs: latency, ...r };
}

async function coldLoad(pageDef, runIndex) {
  const context = await browser.newContext({ bypassCSP: true,  viewport: PROFILE.viewport, deviceScaleFactor: PROFILE.deviceScaleFactor, isMobile: PROFILE.isMobile, hasTouch: PROFILE.hasTouch });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const requests = new Map();
  cdp.on('Network.requestWillBeSent', (e) => { if (!e.request.url.startsWith('data:')) requests.set(e.requestId, { url: e.request.url, type: e.type, bytes: 0, status: null, mime: null }); });
  cdp.on('Network.responseReceived', (e) => { const r = requests.get(e.requestId); if (r) { r.type = e.type; r.status = e.response.status; r.mime = e.response.mimeType; r.fromCache = e.response.fromDiskCache || e.response.fromPrefetchCache; } });
  cdp.on('Network.loadingFinished', (e) => { const r = requests.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  cdp.on('Network.loadingFailed', (e) => { const r = requests.get(e.requestId); if (r) r.failed = e.errorText; });
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: PROFILE.network.latencyMs, downloadThroughput: PROFILE.network.downloadKbps * 1000 / 8, uploadThroughput: PROFILE.network.uploadKbps * 1000 / 8, connectionType: 'cellular4g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: PROFILE.cpuThrottlingRate });
  await page.addInitScript(PERF_INIT);
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message).slice(0, 200)));

  const t0 = Date.now();
  await page.goto(base + pageDef.url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2500); // let late LCP candidates and layout shifts settle before any input
  const wall = Date.now() - t0;

  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, p.startTime]));
    const lcpEntry = window.__perf.lcp[window.__perf.lcp.length - 1] || null;
    return {
      ttfbMs: nav ? nav.responseStart : null, docResponseEndMs: nav ? nav.responseEnd : null, domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null, loadMs: nav ? nav.loadEventEnd : null,
      fcpMs: paints['first-contentful-paint'] ?? null,
      lcpMs: lcpEntry ? (lcpEntry.renderTime || lcpEntry.loadTime || lcpEntry.startTime) : null, lcpElement: lcpEntry ? lcpEntry.element : null, lcpUrl: lcpEntry ? lcpEntry.url : null, lcpCandidates: window.__perf.lcp.length,
      shifts: window.__perf.cls, fontsLoaded: document.fonts.status,
    };
  });
  const cls = computeCls(m.shifts);

  // Interaction latency (lab INP proxy). Real input through Playwright so Event Timing records it.
  const interactions = [];
  if (pageDef.id === 'rsvp-preview') {
    await page.waitForSelector('#code');
    interactions.push(await measureInteraction(page, 'tap the invitation-code field (focus)', () => page.click('#code')));
    await page.fill('#code', 'PREVIEW');
    interactions.push(await measureInteraction(page, 'tap "Find my invitation" (submits the code; re-renders the busy state)', () => page.click('button[type=submit]')));
    await page.waitForSelector('[data-step="invitees"]', { timeout: 15000 }).catch(() => {});
    interactions.push(await measureInteraction(page, 'tap "These are correct — continue" (renders the attendance step)', () => page.click('[data-action="continue"]')));
  } else {
    interactions.push(await measureInteraction(page, 'tap "Menu" (opens the mobile navigation)', () => page.click('.nav-toggle')));
    interactions.push(await measureInteraction(page, 'tap "View the invitation" (opens the invitation dialog)', () => page.click('.hero-keepsake [data-action="view-invitation"]')));
  }

  const list = [...requests.values()];
  const byType = {};
  for (const r of list) { const t = r.type || 'Other'; byType[t] = (byType[t] || 0) + (r.bytes || 0); }
  const total = list.reduce((s, r) => s + (r.bytes || 0), 0);
  await context.close();
  return {
    run: runIndex + 1, page: pageDef.id, wallClockMs: wall, ttfbMs: m.ttfbMs, docResponseEndMs: m.docResponseEndMs, fcpMs: m.fcpMs, domContentLoadedMs: m.domContentLoadedMs, loadMs: m.loadMs,
    lcpMs: m.lcpMs, lcpElement: m.lcpElement, lcpUrl: m.lcpUrl, lcpCandidates: m.lcpCandidates, cls, layoutShifts: m.shifts.filter((s) => !s.input).length,
    interactions, interactionMaxMs: Math.max(0, ...interactions.map((i) => i.latencyMs || 0)),
    transferBytes: total, bytesByType: byType, requests: list.length, resources: list.map((r) => ({ url: r.url.replace(base, ''), type: r.type, bytes: r.bytes, status: r.status, failed: r.failed || null })),
    fontsLoaded: m.fontsLoaded, pageErrors: consoleErrors,
  };
}

function compressedSizes() {
  const files = [];
  const add = (rel) => { const buf = fs.readFileSync(path.join(DIST, rel)); files.push({ file: `dist/${rel}`, raw: buf.length, gzip: zlib.gzipSync(buf, { level: 6 }).length, gzip9: zlib.gzipSync(buf, { level: 9 }).length, brotli: zlib.brotliCompressSync(buf).length }); };
  for (const f of fs.readdirSync(path.join(DIST, 'js')).filter((f) => f.endsWith('.js'))) add(`js/${f}`);
  for (const f of fs.readdirSync(path.join(DIST, 'styles')).filter((f) => f.endsWith('.css'))) add(`styles/${f}`);
  for (const f of fs.readdirSync(DIST).filter((f) => f.endsWith('.html'))) add(f);
  const jsGzipTotal = files.filter((f) => f.file.endsWith('.js')).reduce((s, f) => s + f.gzip, 0);
  const perPage = {
    'celebration.html': ['js/site.js'], 'index.html': ['js/site.js'], 'rsvp.html': ['js/site.js', 'js/rsvp.js'], 'privacy.html': ['js/site.js'], '404.html': ['js/site.js'],
  };
  const jsGzipPerPage = Object.fromEntries(Object.entries(perPage).map(([p, js]) => [p, js.reduce((s, j) => s + (files.find((f) => f.file === `dist/${j}`)?.gzip || 0), 0)]));
  return { files, jsGzipTotal, jsGzipPerPage, method: 'node:zlib gzipSync level 6 (also level 9 and brotli default for reference). The local server sends no Content-Encoding, so transfer bytes below are uncompressed.' };
}

async function runPerformance() {
  const sizes = compressedSizes();
  const pages = [];
  for (const pd of PERF_PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await coldLoad(pd, i);
      runs.push(r);
      console.log(`[perf] ${pd.id} run ${i + 1}/${RUNS}: LCP ${fmtMs(r.lcpMs)} (${r.lcpElement || '?'}) CLS ${r.cls.toFixed(3)} TTFB ${fmtMs(r.ttfbMs)} DCL ${fmtMs(r.domContentLoadedMs)} load ${fmtMs(r.loadMs)} transfer ${fmtBytes(r.transferBytes)} (${r.requests} req) interaction max ${fmtMs(r.interactionMaxMs)}`);
    }
    const pick = (k) => runs.map((r) => r[k]).filter((v) => v != null);
    const stat = (k) => ({ median: median(pick(k)), worst: worst(pick(k)), best: best(pick(k)), all: pick(k) });
    const summary = { lcpMs: stat('lcpMs'), cls: stat('cls'), interactionMaxMs: stat('interactionMaxMs'), ttfbMs: stat('ttfbMs'), docResponseEndMs: stat('docResponseEndMs'), fcpMs: stat('fcpMs'), domContentLoadedMs: stat('domContentLoadedMs'), loadMs: stat('loadMs'), transferBytes: stat('transferBytes') };
    const textTypes = new Set(['Document', 'Stylesheet', 'Script']);
    const med = runs.find((r) => r.transferBytes === summary.transferBytes.median) || runs[0];
    const estCompressed = med.resources.reduce((s, r) => {
      if (!textTypes.has(r.type)) return s + (r.bytes || 0);
      const rel = r.url.replace(/^\//, '').replace(/\?.*$/, '') || 'index.html';
      const f = sizes.files.find((x) => x.file === `dist/${rel}`);
      return s + (f ? f.gzip + 200 : r.bytes || 0); // +200 bytes for headers
    }, 0);
    const htmlFile = pd.url.replace(/^\//, '').replace(/\?.*$/, '');
    const budget = {
      lcp: { value: summary.lcpMs.median, worst: summary.lcpMs.worst, limit: BUDGETS.lcpMs, pass: summary.lcpMs.median != null && summary.lcpMs.median <= BUDGETS.lcpMs, worstPass: summary.lcpMs.worst != null && summary.lcpMs.worst <= BUDGETS.lcpMs },
      cls: { value: summary.cls.median, worst: summary.cls.worst, limit: BUDGETS.cls, pass: summary.cls.median <= BUDGETS.cls, worstPass: summary.cls.worst <= BUDGETS.cls },
      inp: { value: summary.interactionMaxMs.median, worst: summary.interactionMaxMs.worst, limit: BUDGETS.inpMs, pass: summary.interactionMaxMs.median <= BUDGETS.inpMs, worstPass: summary.interactionMaxMs.worst <= BUDGETS.inpMs },
      transfer: { value: summary.transferBytes.median, worst: summary.transferBytes.worst, limit: BUDGETS.transferBytes, pass: summary.transferBytes.median <= BUDGETS.transferBytes, worstPass: summary.transferBytes.worst <= BUDGETS.transferBytes, estimatedCompressed: estCompressed },
      jsGzip: { value: sizes.jsGzipPerPage[htmlFile] ?? sizes.jsGzipTotal, limit: BUDGETS.jsGzipBytes, pass: (sizes.jsGzipPerPage[htmlFile] ?? sizes.jsGzipTotal) <= BUDGETS.jsGzipBytes },
    };
    pages.push({ ...pd, runs, summary, budget, medianRunResources: med.resources, medianRunBytesByType: med.bytesByType });
  }
  return { profile: PROFILE, compressed: sizes, pages, budgetsExceeded: pages.flatMap((p) => Object.entries(p.budget).filter(([, b]) => !b.pass).map(([k]) => `${p.id}:${k}`)) };
}

// ---------- reports ----------
function writeAccessibilityMd(a) {
  const L = [];
  L.push('# Accessibility evidence (lab, automated)', '');
  L.push(`Generated ${results.generatedAt} by \`node scripts/audit.mjs\`. ${results.tool.browser} (headless) via Playwright ${results.tool.playwright}, axe-core ${results.tool.axeCore} (MPL-2.0, vendored at scripts/vendor/axe.min.js), Node ${results.tool.node}.`, '');
  L.push(`Build audited: dist/ written ${results.build.builtAt}, repository HEAD ${results.build.commit || 'unknown'}${results.build.uncommittedSourceFiles ? ` with ${results.build.uncommittedSourceFiles} uncommitted source file(s) (the build under test is the working tree, not the commit)` : ''}. File hashes (sha256, first 12): ${Object.entries(results.build.hashes).map(([f, h]) => `${f} ${h}`).join(', ')}.`, '');
  L.push('**Scope and honesty note.** ' + results.scope + ' These automated checks cover only the part of WCAG 2.2 AA that tools can detect. PRD NFR-01/NFR-03 and AT-15 additionally require manual testing (keyboard-only completion of the RSVP flow, VoiceOver on iOS/macOS, NVDA on Windows, 200 % zoom and 400 % reflow, real reduced-motion devices) and browser coverage that this script does not provide. Those remain open.', '');
  L.push('## Method', '');
  L.push(`- Pages/states audited at ${a.viewports.join(' px and ')} px, each in a fresh browser context: ${A11Y_STATES.map((s) => `\`${s.id}\` (${s.label})`).join('; ')}.`);
  L.push('- axe-core `axe.run(document)` with the default rule set (WCAG 2.x A/AA plus best-practice rules); every violation node is listed below with impact, rule id, selector and help URL.');
  L.push('- Structural checks run in the page: exactly one rendered `h1`; heading levels never skip downwards; every `img` has an `alt` attribute; every form control has an accessible name (label, aria-label, aria-labelledby or title); the skip link is the first Tab stop on a fresh load; every keyboard focus stop matches `:focus-visible` and has a computed outline or box-shadow (on the control or, for radios, on its label); links, buttons, choice labels and inputs inside `main` measure at least 44 × 44 CSS px (inline links inside sentences are listed but not failed, per the WCAG 2.5.8 inline exception); no horizontal overflow; accessible names of key controls from the Chromium accessibility tree.');
  L.push('- Reduced motion: `prefers-reduced-motion: reduce` emulated, then the envelope is opened, the site entered and the docked invitation re-opened; at each step `document.getAnimations()` must be empty and every text block of the invitation must be rendered at full opacity.', '');

  L.push('## Summary', '');
  L.push('| Impact | axe violation nodes |', '|---|---|');
  for (const k of ['critical', 'serious', 'moderate', 'minor']) L.push(`| ${k} | ${a.violationsByImpact[k] || 0} |`);
  L.push('', `Serious/critical total: **${a.seriousOrCritical}**.`, '');
  L.push('| State | Viewport | axe (impact:rule) | h1 | Heading order | img alt | Labels | Skip link first | Focus indicator | Tap ≥44 (main) | Overflow |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const s of a.states) {
    if (!s.ok) { L.push(`| ${s.id} | ${s.viewport} | ERROR: ${s.error} | | | | | | | | |`); continue; }
    const v = s.axe.violations.map((x) => `${x.impact}:${x.id}`).join(', ') || 'none';
    const c = s.checks; const st = s.structure;
    const yn = (b) => (b === null ? 'n/a' : b ? 'yes' : '**no**');
    const tapFails = st.tapTargets.filter((t) => !t.ok).length;
    const tapInline = st.tapTargets.filter((t) => t.inline && !t.meets44).length;
    L.push(`| ${s.id} | ${s.viewport} | ${v} | ${st.h1.count === 1 ? '1' : '**' + st.h1.count + '**'} | ${yn(c.headingOrder)} | ${st.images.missingAlt.length ? '**' + st.images.missingAlt.length + ' missing**' : 'all ' + st.images.total} | ${st.controls.unlabeled.length ? '**' + st.controls.unlabeled.length + ' unlabeled**' : st.controls.total + '/' + st.controls.total} | ${yn(c.skipLink)} | ${yn(c.focusIndicator)} (${s.focus.stops} stops) | ${tapFails ? '**' + tapFails + ' small**' : (st.tapTargets.length - tapInline) + ' ok'}${tapInline ? ' (+' + tapInline + ' inline text links)' : ''} | ${yn(c.overflow)} |`);
  }
  L.push('');
  L.push('## axe-core violations (every node)', '');
  if (!a.violations.length) L.push('None.');
  else {
    L.push('| Impact | Rule | WCAG / best practice | State | Viewport | Selector | Help |', '|---|---|---|---|---|---|---|');
    for (const v of a.violations) L.push(`| ${v.impact} | \`${v.rule}\` | ${v.tags.filter((t) => /^wcag\d|best-practice/.test(t)).join(', ')} | ${v.state} | ${v.viewport} | \`${v.selector.replace(/\|/g, '\\|')}\` | [${v.help.replace(/\|/g, '\\|')}](${v.helpUrl}) |`);
    L.push('', 'Notes recorded during the run:', '');
    if (a.violations.some((v) => v.rule === 'scrollable-region-focusable')) L.push('- `scrollable-region-focusable` on `#dialog-slot`: the invitation dialog\'s scroll container (`.dialog-slot { overflow: auto; max-height: 100svh }`) has no `tabindex`. In this Chromium build the Tab walk did reach it (Chromium 130+ makes scrollers keyboard-focusable), but that behaviour is browser-specific and not present in Safari, so axe rates it serious under WCAG 2.1.1/2.1.3. Fix for the author (src/styles/site.css / scripts/templates/index.mjs): either give `#dialog-slot` `tabindex="0"` with an accessible name (for example `role="region" aria-label="Your invitation"`), or size the dialog so the card never needs to scroll.');
    if (a.violations.some((v) => v.rule === 'landmark-one-main' || v.rule === 'page-has-heading-one' || v.rule === 'region')) L.push('- `landmark-one-main`, `page-has-heading-one`, `region` (best-practice rules, not WCAG failures) on the sealed/open entry states: while the envelope is showing, `#site` (which holds `<main>` and the only `<h1>`) is hidden and inert, so the rendered document has no main landmark and no h1; the entry bar, envelope and hints sit outside any landmark. Options for the author (scripts/templates/index.mjs): make the entry stage a landmark (`<main>` or `role="region"` with a label) and give it a visually appropriate `h1` (for example the couple\'s names on the card as `h1` while in the entry state), or accept these as known best-practice deviations for a deliberately staged entry.');
  }
  L.push('');
  const inc = a.states.flatMap((s) => (s.axe?.incomplete || []).map((i) => ({ state: s.id, viewport: s.viewport, id: i.id, impact: i.impact, n: i.nodes.length, helpUrl: i.helpUrl, selectors: i.nodes.map((n) => n.target), reasons: i.nodes.flatMap((n) => n.reasons || []) })));
  L.push('## axe-core "needs review" (incomplete) items', '');
  if (!inc.length) L.push('None.');
  else {
    const grouped = {};
    for (const i of inc) { const k = i.id; grouped[k] = grouped[k] || { id: k, impact: i.impact, helpUrl: i.helpUrl, states: new Set(), nodes: 0, selectors: new Set(), reasons: new Set() }; grouped[k].states.add(`${i.state}@${i.viewport}`); grouped[k].nodes += i.n; i.selectors.forEach((x) => grouped[k].selectors.add(x)); i.reasons.forEach((x) => grouped[k].reasons.add(x)); }
    L.push('These are checks axe could not decide automatically (typically colour contrast behind gradients/images). They need a manual look, not a fix by default.', '');
    L.push('| Rule | Impact | Nodes | States | Help |', '|---|---|---|---|---|');
    for (const g of Object.values(grouped)) L.push(`| \`${g.id}\` | ${g.impact || '—'} | ${g.nodes} | ${[...g.states].join(', ')} | ${g.helpUrl} |`);
    L.push('');
    for (const g of Object.values(grouped)) L.push(`- \`${g.id}\` — elements: ${[...g.selectors].map((x) => '`' + x + '`').join(', ')}. axe reason(s): ${[...g.reasons].join(' / ') || 'not stated'}.`);
  }
  L.push('');
  L.push('## Structural check findings', '');
  let any = false;
  for (const s of a.states) {
    if (!s.ok) continue;
    const items = [];
    if (s.structure.h1.count !== 1) items.push(`level-1 heading count is ${s.structure.h1.count}${s.structure.h1.texts.length ? ' (' + s.structure.h1.texts.map((t) => '"' + t + '"').join(', ') + ')' : ''}; rendered headings: ${s.structure.headings.map((h) => 'h' + h.level + (h.via === 'aria-level' ? '(aria)' : '') + ' "' + h.text + '"').join(', ') || 'none'}`);
    for (const j of s.structure.headingJumps) items.push(`heading level jumps from h${j.from.level} "${j.from.text}" to h${j.to.level} "${j.to.text}" (\`${j.to.selector}\`)`);
    for (const m of s.structure.images.missingAlt) items.push(`image without alt: \`${m.selector}\` (${m.src})`);
    for (const u of s.structure.controls.unlabeled) items.push(`form control without accessible name: \`${u.selector}\` (${u.type})`);
    if (s.checks.skipLink === false) items.push(`first Tab stop is not the skip link: ${s.focus.firstStop ? s.focus.firstStop.tag + ' "' + s.focus.firstStop.text + '"' : 'none'}`);
    for (const f of s.focus.withoutIndicator) items.push(`focus stop without visible indicator: \`${f.selector}\` "${f.text}" (computed outline: ${f.outline})`);
    for (const f of s.focus.invisibleFocused) items.push(`keyboard focus landed on an element with no rendered box: \`${f.selector}\` "${f.text}"`);
    for (const t of s.structure.tapTargets.filter((t) => !t.ok)) items.push(`${t.tag} target ${t.width}×${t.height} px (below the 44×44 product target${t.meets24 ? '' : ' and below WCAG 2.5.8 24×24'}): \`${t.selector}\` "${t.text}"${t.inRsvpApp ? ' — inside #rsvp-app' : ''}`);
    const inl = s.structure.tapTargets.filter((t) => t.inline && !t.meets44);
    if (inl.length) items.push(`${inl.length} inline text link(s) under 44 px tall (WCAG 2.5.8 inline exception applies; below the PRD product target): ${inl.map((t) => '"' + t.text + '" ' + t.width + '×' + t.height).join(', ')}`);
    if (!s.checks.overflow) items.push(`horizontal overflow: scrollWidth ${s.structure.overflow.scrollWidth} > ${s.structure.overflow.innerWidth}`);
    if (s.consoleErrors.length) items.push(`console/page errors: ${s.consoleErrors.join(' | ')}`);
    if (items.length) { any = true; L.push(`### ${s.id} @ ${s.viewport} px — ${s.label}`, '', ...items.map((i) => `- ${i}`), ''); }
  }
  if (!any) L.push('None.', '');
  L.push('## Accessible names (Chromium accessibility tree)', '');
  L.push('Names as Chromium computes them for the split-span headings and icon-only controls. Other engines (WebKit/VoiceOver) may join `<span>` fragments differently; not verified here.', '');
  L.push('| State | Viewport | Element | Role | Name |', '|---|---|---|---|---|');
  for (const s of a.states.filter((x) => x.ok && x.viewport === a.viewports[0])) for (const [sel, n] of Object.entries(s.accessibleNames || {})) if (n && !n.ignored) L.push(`| ${s.id} | ${s.viewport} | \`${sel}\` | ${n.role} | "${n.name}" |`);
  L.push('');
  L.push('## Keyboard focus order (first stops, fresh load)', '');
  for (const s of a.states.filter((x) => x.ok && !A11Y_STATES.find((d) => d.id === x.id)?.setup)) L.push(`- **${s.id} @ ${s.viewport}**: ${s.focus.order.slice(0, 8).join(' → ')}${s.focus.stops > 8 ? ` → … (${s.focus.stops} stops)` : ''}`);
  L.push('');
  L.push('## Reduced motion (emulated)', '');
  for (const r of a.reducedMotion) {
    L.push(`- **${r.viewport} px**: ${r.pass ? 'pass' : '**fail**'}${r.error ? ' — ' + r.error : ''}. Start state \`${r.startState}\`${r.skippedSealUnderReducedMotion ? ' (the page skips the sealed envelope under reduced motion and shows the invitation directly)' : `; envelope opened in ${r.openMs ?? '?'} ms`}. ` + r.steps.map((s) => `${s.label}: state=${s.entryState}, animations=${s.animations}, readable text blocks ${s.readableBlocks}/${s.textBlocks}, card ${s.card.width}×${s.card.height} at top ${s.card.top}, opacity ${s.card.opacity}, font ${s.fontSizePx} px`).join('; ') + '.');
  }
  L.push('', '## Still open (not covered by this script)', '');
  L.push('- Manual keyboard-only and screen-reader completion of access → RSVP → error → correction (AT-15) with VoiceOver (iOS/macOS) and NVDA (Windows).');
  L.push('- Real-device checks on current and previous Safari/iOS, Chrome/Android, Edge and Safari/macOS (NFR-03).');
  L.push('- 200 % text zoom and 400 % reflow are only approximated by the proofs script (docs/proofs); a human review of the script lettering at those sizes is still needed.');
  L.push('- Colour contrast of gold headings and controls is only checked where axe can compute it; items listed under "needs review" require a manual contrast measurement.');
  L.push('');
  fs.writeFileSync(path.join(OUT, 'ACCESSIBILITY.md'), L.join('\n'));
}

function writePerformanceMd(p) {
  const L = [];
  L.push('# Performance evidence (lab, NFR-02)', '');
  L.push(`Build audited: dist/ written ${results.build.builtAt}, repository HEAD ${results.build.commit || 'unknown'}${results.build.uncommittedSourceFiles ? ` with ${results.build.uncommittedSourceFiles} uncommitted source file(s)` : ''}; hashes in results.json.`, '');
  L.push(`Generated ${results.generatedAt} by \`node scripts/audit.mjs\`. ${results.tool.browser} (headless) via Playwright ${results.tool.playwright}, Node ${results.tool.node}. Host: ${results.tool.host.cpu} (${results.tool.host.cores} cores), ${results.tool.host.platform}. CPU throttling is relative to this host, so absolute timings are not comparable with a phone; they are comparable run to run.`, '');
  L.push('**Scope and honesty note.** ' + results.scope + ' PRD NFR-01 sets LCP/INP/CLS at the 75th percentile of field data; there is no field data yet, so per NFR-02 this file records lab runs only and lab interaction tests stand in for INP. The site is not on a production host during this run: assets are served uncompressed by scripts/serve.mjs, so transfer bytes are an upper bound and compressed sizes are computed locally with node:zlib. Whether the production host (GitHub Pages) compresses these files was not verified here.', '');
  L.push('## Profile', '');
  L.push(`- Viewport ${p.profile.viewport.width}×${p.profile.viewport.height} CSS px, device scale factor ${p.profile.deviceScaleFactor}, mobile UA/touch enabled.`);
  L.push(`- CDP \`Emulation.setCPUThrottlingRate\` ${p.profile.cpuThrottlingRate}×; \`Network.emulateNetworkConditions\` latency ${p.profile.network.latencyMs} ms, download ${p.profile.network.downloadKbps} kbps, upload ${p.profile.network.uploadKbps} kbps (${p.profile.network.label}); browser cache disabled.`);
  L.push(`- ${p.profile.runs} cold-cache loads per page, each in a fresh browser context; metrics read after \`load\`, network idle, \`document.fonts.ready\` and a 2.5 s settle, before any input.`);
  L.push('- LCP and CLS from `PerformanceObserver` (buffered `largest-contentful-paint` and `layout-shift`; CLS uses the standard 5 s / 1 s session-window maximum). TTFB, DOMContentLoaded and load from the Navigation Timing entry. Bytes from CDP `Network.loadingFinished.encodedDataLength`.');
  L.push('- Note on TTFB: Chromium DevTools throttling delays body delivery rather than the response headers, so `responseStart` still shows the local server\'s real ~2 ms; the emulated 150 ms latency and throughput appear from `responseEnd` onwards (verified with Resource Timing during this run\'s setup). A production TTFB depends on the host and was not measured.');
  L.push('- Interaction latency from the Event Timing API (`event` entries, `durationThreshold` 16 ms) for real Playwright taps; the reported value is the longest event duration of the interaction, which is how INP scores a single interaction. Durations under 16 ms are not reported by the API and are recorded as ≤16 ms.', '');
  L.push('## Budgets (PRD §13)', '');
  L.push(`LCP ≤ ${BUDGETS.lcpMs} ms · CLS ≤ ${BUDGETS.cls} · INP ≤ ${BUDGETS.inpMs} ms · initial transfer ≤ ${fmtBytes(BUDGETS.transferBytes)} · compressed JavaScript ≤ ${fmtBytes(BUDGETS.jsGzipBytes)}. Pass/fail below uses the median of the ${p.profile.runs} runs; the worst run is shown beside it.`, '');
  for (const pg of p.pages) {
    L.push(`## ${pg.label}`, '');
    L.push('| Metric | Median | Worst | Best | Budget | Median pass | Worst pass |', '|---|---|---|---|---|---|---|');
    const b = pg.budget;
    const row = (name, s, fmt, bb) => L.push(`| ${name} | ${fmt(s.median)} | ${fmt(s.worst)} | ${fmt(s.best)} | ${bb ? fmt(bb.limit) : '—'} | ${bb ? (bb.pass ? 'yes' : '**no**') : '—'} | ${bb ? (bb.worstPass ? 'yes' : '**no**') : '—'} |`);
    row('LCP', pg.summary.lcpMs, fmtMs, b.lcp);
    row('CLS', pg.summary.cls, (v) => (v == null ? '—' : v.toFixed(3)), b.cls);
    row('Interaction latency (lab INP proxy)', pg.summary.interactionMaxMs, fmtMs, b.inp);
    row('TTFB (responseStart; local server, see note)', pg.summary.ttfbMs, fmtMs, null);
    row('HTML document fully received (responseEnd)', pg.summary.docResponseEndMs, fmtMs, null);
    row('FCP', pg.summary.fcpMs, fmtMs, null);
    row('DOMContentLoaded', pg.summary.domContentLoadedMs, fmtMs, null);
    row('load', pg.summary.loadMs, fmtMs, null);
    row('Transfer (uncompressed, local server)', pg.summary.transferBytes, fmtBytes, b.transfer);
    L.push(`| Transfer, estimated with gzip for HTML/CSS/JS | ${fmtBytes(b.transfer.estimatedCompressed)} | | | ${fmtBytes(BUDGETS.transferBytes)} | ${b.transfer.estimatedCompressed <= BUDGETS.transferBytes ? 'yes' : '**no**'} | |`);
    L.push(`| JavaScript loaded by this page, gzip | ${fmtBytes(b.jsGzip.value)} | | | ${fmtBytes(BUDGETS.jsGzipBytes)} | ${b.jsGzip.pass ? 'yes' : '**no**'} | |`);
    L.push('', '### Runs', '');
    L.push('| Run | LCP | LCP element | CLS | Shifts | Interaction max | TTFB | FCP | DCL | load | Transfer | Requests | Errors |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of pg.runs) L.push(`| ${r.run} | ${fmtMs(r.lcpMs)} | \`${r.lcpElement || '—'}\` | ${r.cls.toFixed(3)} | ${r.layoutShifts} | ${fmtMs(r.interactionMaxMs)} | ${fmtMs(r.ttfbMs)} | ${fmtMs(r.fcpMs)} | ${fmtMs(r.domContentLoadedMs)} | ${fmtMs(r.loadMs)} | ${fmtBytes(r.transferBytes)} | ${r.requests} | ${r.pageErrors.length || '0'} |`);
    L.push('', '### Interactions (per run, longest event duration)', '');
    const labels = pg.runs[0].interactions.map((i) => i.label);
    L.push('| Run | ' + labels.join(' | ') + ' |', '|---|' + labels.map(() => '---').join('|') + '|');
    for (const r of pg.runs) L.push(`| ${r.run} | ` + r.interactions.map((i) => `${i.latencyMs == null ? '≤16 ms' : fmtMs(i.latencyMs)}${i.clickToPaintMs != null ? ` (click→paint approx ${Math.round(i.clickToPaintMs)} ms)` : ''}`).join(' | ') + ' |');
    L.push('', '### Bytes by resource type (median-transfer run, uncompressed)', '');
    L.push('| Type | Bytes |', '|---|---|');
    for (const [t, v] of Object.entries(pg.medianRunBytesByType).sort((a, b) => b[1] - a[1])) L.push(`| ${t} | ${fmtBytes(v)} |`);
    L.push('', '<details><summary>Resources (median run)</summary>', '', '| Resource | Type | Bytes | Status |', '|---|---|---|---|');
    for (const r of pg.medianRunResources) L.push(`| ${r.url} | ${r.type} | ${fmtBytes(r.bytes)} | ${r.failed ? 'FAILED ' + r.failed : r.status} |`);
    L.push('', '</details>', '');
  }
  L.push('## Compressed sizes (node:zlib, computed locally)', '');
  L.push(`${p.compressed.method}`, '');
  L.push('| File | Raw | gzip -6 | gzip -9 | brotli |', '|---|---|---|---|---|');
  for (const f of p.compressed.files) L.push(`| ${f.file} | ${fmtBytes(f.raw)} | ${fmtBytes(f.gzip)} | ${fmtBytes(f.gzip9)} | ${fmtBytes(f.brotli)} |`);
  L.push('', `All JavaScript in dist/js, gzip -6: **${fmtBytes(p.compressed.jsGzipTotal)}** (budget ${fmtBytes(BUDGETS.jsGzipBytes)}). Per page: ${Object.entries(p.compressed.jsGzipPerPage).map(([k, v]) => `${k} ${fmtBytes(v)}`).join(', ')}.`, '');
  L.push('## Result', '');
  L.push(p.budgetsExceeded.length ? `Budgets exceeded (median): ${p.budgetsExceeded.join(', ')}.` : 'All budgets met on the median run.');
  const worstFails = p.pages.flatMap((pg) => Object.entries(pg.budget).filter(([, b]) => b.worstPass === false).map(([k]) => `${pg.id}:${k}`));
  if (worstFails.length) L.push(`Worst-of-${p.profile.runs} exceeded the budget for: ${worstFails.join(', ')}.`);
  L.push('', '## Still open', '');
  L.push('- Field data (real guests, real devices) does not exist yet; NFR-01 75th-percentile targets cannot be confirmed from lab runs.');
  L.push('- Runs on Safari/iOS and Chrome/Android hardware (NFR-03), and against the production host with its real compression and CDN behaviour.');
  L.push('- The RSVP service budget (95th-percentile save ≤ 1.5 s at 50 concurrent sessions) needs a backend; the preview uses an in-page mock and was not load-tested.');
  L.push('');
  fs.writeFileSync(path.join(OUT, 'PERFORMANCE.md'), L.join('\n'));
}

// ---------- main ----------
let exitCode = 0;
const reasons = [];
try {
  if (DO_A11Y) results.accessibility = await runAccessibility();
  if (DO_PERF) results.performance = await runPerformance();
} finally {
  await browser.close();
  server.close();
}

const a = results.accessibility, p = results.performance;
results.buildAfterRun = buildFingerprint();
results.buildChangedDuringRun = JSON.stringify(results.buildAfterRun.hashes) !== JSON.stringify(results.build.hashes);
if (results.buildChangedDuringRun) { console.log('WARNING: dist/ changed while the audit was running; results mix two builds. Re-run.'); }
const structuralFailures = a ? a.states.filter((s) => !s.ok || Object.values(s.checks).some((v) => v === false)).map((s) => `${s.id}@${s.viewport}`) : [];
const reducedFail = a ? a.reducedMotion.filter((r) => !r.pass).map((r) => `reduced-motion@${r.viewport}`) : [];
if (a && a.seriousOrCritical > 0) { exitCode = 1; reasons.push(`${a.seriousOrCritical} serious/critical axe violation node(s)`); }
if (p && p.budgetsExceeded.length) { exitCode = 1; reasons.push(`budget exceeded: ${p.budgetsExceeded.join(', ')}`); }
if (results.buildChangedDuringRun) { exitCode = 1; reasons.push('dist/ was rebuilt during the run (results mix two builds)'); }
if (STRICT && (structuralFailures.length || reducedFail.length)) { exitCode = 1; reasons.push(`structural checks failed (--strict): ${[...structuralFailures, ...reducedFail].join(', ')}`); }

results.summary = {
  exitCode, reasons,
  axeViolationNodes: a ? a.violations.length : null, axeByImpact: a ? a.violationsByImpact : null, seriousOrCritical: a ? a.seriousOrCritical : null,
  structuralCheckFailures: structuralFailures, reducedMotionFailures: reducedFail,
  budgets: p ? Object.fromEntries(p.pages.map((pg) => [pg.id, Object.fromEntries(Object.entries(pg.budget).map(([k, b]) => [k, { value: b.value, worst: b.worst ?? null, limit: b.limit, pass: b.pass }]))])) : null,
  budgetsExceeded: p ? p.budgetsExceeded : null,
};
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
if (a) writeAccessibilityMd(a);
if (p) writePerformanceMd(p);

console.log('\n==== audit summary ====');
console.log(`${results.tool.browser}, Playwright ${results.tool.playwright}, axe-core ${results.tool.axeCore}, Node ${results.tool.node}, ${results.generatedAt}`);
if (a) {
  console.log(`axe: ${a.violations.length} violation node(s) — ${['critical', 'serious', 'moderate', 'minor'].map((k) => `${k} ${a.violationsByImpact[k] || 0}`).join(', ')}`);
  for (const v of a.violations) console.log(`  - [${v.impact}] ${v.rule} ${v.state}@${v.viewport} ${v.selector}  ${v.helpUrl}`);
  console.log(`structural checks: ${structuralFailures.length ? 'failures in ' + structuralFailures.join(', ') : 'all pass'}${STRICT ? '' : ' (informational unless --strict)'}`);
  console.log(`reduced motion: ${reducedFail.length ? 'FAIL ' + reducedFail.join(', ') : 'pass'}`);
}
if (p) {
  for (const pg of p.pages) {
    const b = pg.budget;
    console.log(`perf ${pg.id}: LCP median ${fmtMs(b.lcp.value)} / worst ${fmtMs(b.lcp.worst)} (≤${BUDGETS.lcpMs}) ${b.lcp.pass ? 'ok' : 'FAIL'} | CLS ${b.cls.value?.toFixed(3)} / ${b.cls.worst?.toFixed(3)} (≤${BUDGETS.cls}) ${b.cls.pass ? 'ok' : 'FAIL'} | interaction ${fmtMs(b.inp.value)} / ${fmtMs(b.inp.worst)} (≤${BUDGETS.inpMs}) ${b.inp.pass ? 'ok' : 'FAIL'} | transfer ${fmtBytes(b.transfer.value)} / ${fmtBytes(b.transfer.worst)} raw, ~${fmtBytes(b.transfer.estimatedCompressed)} gzip (≤${fmtBytes(BUDGETS.transferBytes)}) ${b.transfer.pass ? 'ok' : 'FAIL'} | JS gzip ${fmtBytes(b.jsGzip.value)} (≤${fmtBytes(BUDGETS.jsGzipBytes)}) ${b.jsGzip.pass ? 'ok' : 'FAIL'}`);
  }
}
console.log(`wrote ${path.relative(ROOT, OUT)}/ACCESSIBILITY.md, PERFORMANCE.md, results.json`);
console.log(exitCode ? `RESULT: FAIL — ${reasons.join('; ')}` : 'RESULT: PASS — no serious/critical axe violations and all budgets met (median of runs)');
process.exit(exitCode);
