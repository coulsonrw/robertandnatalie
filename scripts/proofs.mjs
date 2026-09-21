// Captures the visual proofs required by PRD TPL-10 / NFR-03 at 320, 390, 768 and 1440 CSS px,
// plus keyboard-focus, reduced-motion and horizontal-overflow checks. Output: docs/proofs/.
// Requires Playwright (a global install is fine): node scripts/proofs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'proofs');
const require = createRequire(import.meta.url);

function loadPlaywright() {
  try { return require('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(path.join(globalRoot, 'playwright'));
}

const { chromium } = loadPlaywright();
const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}`;
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { width: 320, height: 568, scale: 1 },
  { width: 390, height: 844, scale: 1 },
  { width: 768, height: 1024, scale: 1 },
  { width: 1440, height: 900, scale: 1 },
];
const PAGES = [
  { name: 'entry-envelope', url: '/?envelope=1' },
  { name: 'invitation', url: '/celebration.html' },
  { name: 'rsvp-coming-soon', url: '/rsvp.html' },
  { name: 'rsvp-preview-access', url: '/rsvp.html?preview=1' },
  { name: 'privacy', url: '/privacy.html' },
];

const browser = await chromium.launch();
const results = { capturedAt: new Date().toISOString(), browser: `Chromium ${browser.version()}`, node: process.version, overflow: [], focusOrder: [], rsvpFlow: [] };

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
  const page = await context.newPage();
  for (const p of PAGES) {
    await page.goto(base + p.url, { waitUntil: 'networkidle' });
    await settle(page);
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    results.overflow.push({ page: p.name, width: vp.width, ok: overflow.scrollWidth <= overflow.innerWidth, ...overflow });
    await page.screenshot({ path: path.join(OUT, `${p.name}-${vp.width}.png`), fullPage: true });
  }
  // Mobile menu open state
  if (vp.width < 768) {
    await page.goto(base + '/celebration.html', { waitUntil: 'networkidle' });
    await settle(page);
    await page.click('.nav-toggle');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `menu-open-${vp.width}.png`), fullPage: false });
  }
  await context.close();
}

// Entry flow (HOME-03): sealed envelope -> opened invitation -> site with docked keepsake -> dialog
for (const vp of [VIEWPORTS[1], VIEWPORTS[3]]) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(base + '/?envelope=1', { waitUntil: 'networkidle' });
  await settle(page);
  await page.click('#seal');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, `entry-opened-${vp.width}.png`), fullPage: true });
  const opened = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), focused: document.activeElement && document.activeElement.id }));
  await page.click('button[data-action="enter"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `entry-site-keepsake-${vp.width}.png`), fullPage: false });
  const entered = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), focused: document.activeElement && document.activeElement.id, entryHidden: document.getElementById('entry').hidden, keepsake: document.getElementById('keepsake').getBoundingClientRect().toJSON() }));
  await page.click('.keepsake-btn');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `entry-dialog-${vp.width}.png`), fullPage: false });
  const dialog = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), modal: document.getElementById('invitation-dialog').matches(':modal'), focused: document.activeElement && document.activeElement.className }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  const closed = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), focused: document.activeElement && document.activeElement.className }));
  await page.goto(base + '/#wedding-day', { waitUntil: 'networkidle' });
  await settle(page);
  const deepLink = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), entryHidden: document.getElementById('entry').hidden, scrolled: window.scrollY > 100 }));
  results.entryFlow = results.entryFlow || [];
  results.entryFlow.push({ width: vp.width, opened, entered, dialog, closed, deepLink, pageErrors });
  await context.close();
}

// RSVP preview flow at 390 and 1440: access -> invitees -> attendance error state -> details -> review -> confirmation
for (const vp of [VIEWPORTS[1], VIEWPORTS[3]]) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
  const page = await context.newPage();
  await page.goto(base + '/rsvp.html?preview=1', { waitUntil: 'networkidle' });
  await settle(page);
  await page.fill('#code', 'PREVIEW');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-step="invitees"]');
  await page.screenshot({ path: path.join(OUT, `rsvp-preview-invitees-${vp.width}.png`), fullPage: true });
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="attendance"]');
  await page.click('[data-action="continue"]'); // submit without answering to show the error state
  await page.waitForSelector('.error-text:not([hidden])');
  const focused = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  results.rsvpFlow.push({ width: vp.width, step: 'attendance-error', focusedAfterError: focused });
  await page.screenshot({ path: path.join(OUT, `rsvp-preview-attendance-error-${vp.width}.png`), fullPage: true });
  // answer everything: first named guest attending both, plus-one attending with a name, others declining
  const radios = await page.$$('input[type=radio]');
  for (const r of radios) {
    const value = await r.getAttribute('value');
    const name = await r.getAttribute('name');
    if ((name.startsWith('g_alex|') || name.startsWith('g_alex_guest|')) && value === 'attending') await r.check();
    if (!(name.startsWith('g_alex|') || name.startsWith('g_alex_guest|')) && value === 'declining') await r.check();
  }
  await page.fill('#plusone-g_alex_guest', 'Casey Example');
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="details"]');
  await page.fill('#contactEmail', 'alex@example.com');
  await page.fill('#notes', 'Vegetarian, please.');
  await page.screenshot({ path: path.join(OUT, `rsvp-preview-details-${vp.width}.png`), fullPage: true });
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="review"]');
  await page.screenshot({ path: path.join(OUT, `rsvp-preview-review-${vp.width}.png`), fullPage: true });
  await page.click('[data-action="submit"]');
  await page.waitForSelector('[data-step="confirmation"]');
  await page.screenshot({ path: path.join(OUT, `rsvp-preview-confirmation-${vp.width}.png`), fullPage: true });
  await context.close();
}

// Decline-all path (AT-08): no details step, a valid decline is saved
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '/rsvp.html?preview=1', { waitUntil: 'networkidle' });
  await settle(page);
  await page.fill('#code', 'SOLO');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-step="invitees"]');
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="attendance"]');
  for (const r of await page.$$('input[type=radio][value=declining]')) await r.check();
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="review"]');
  const reviewStep = await page.evaluate(() => ({ step: document.querySelector('[data-step]').getAttribute('data-step'), emailAsked: !!document.getElementById('contactEmail') }));
  await page.screenshot({ path: path.join(OUT, 'rsvp-decline-all-review-390.png'), fullPage: true });
  await page.click('[data-action="submit"]');
  await page.waitForSelector('[data-step="confirmation"]');
  const confirmed = await page.evaluate(() => ({ reference: (document.querySelector('.reference strong') || {}).textContent, declines: document.querySelectorAll('.status-pill').length }));
  await page.screenshot({ path: path.join(OUT, 'rsvp-decline-all-confirmation-390.png'), fullPage: true });
  results.declineAll = { skippedDetails: reviewStep.step === 'review' && !reviewStep.emailAsked, reference: confirmed.reference, rows: confirmed.declines };
  await context.close();
}

// Private-link access (IA-02, SEC-02): token read from the fragment, stripped from the address bar,
// exchanged only on an explicit action. Uses the synthetic preview code as the token.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '/rsvp.html?preview=1#t=PREVIEW', { waitUntil: 'networkidle' });
  await settle(page);
  const before = await page.evaluate(() => ({ url: location.href, button: !!document.querySelector('[data-action="open-link"]') }));
  await page.screenshot({ path: path.join(OUT, 'rsvp-link-token-390.png'), fullPage: true });
  await page.locator('[data-action="open-link"]').click({ timeout: 10000 });
  await page.waitForSelector('[data-step="invitees"]', { timeout: 10000 });
  const after = await page.evaluate(() => ({ url: location.href, step: document.querySelector('[data-step]').getAttribute('data-step') }));
  results.linkToken = { tokenStrippedBeforeAction: !before.url.includes('t=PREVIEW'), buttonShown: before.button, stepAfter: after.step, urlAfter: after.url };
  await context.close();
}

// Keyboard focus order on the home page (desktop) and skip-link visibility
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/celebration.html', { waitUntil: 'networkidle' });
  await settle(page);
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement; if (!a) return null;
      const r = a.getBoundingClientRect();
      return { tag: a.tagName, text: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
    });
    results.focusOrder.push(info);
    if (i === 0) await page.screenshot({ path: path.join(OUT, 'keyboard-skip-link-1440.png'), fullPage: false });
    if (i === 5) await page.screenshot({ path: path.join(OUT, 'keyboard-focus-1440.png'), fullPage: false });
  }
  await context.close();
}

// Readable 2x detail views of the invitation opening and the RSVP attendance step (TPL-10)
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(base + '/?envelope=1', { waitUntil: 'networkidle' });
  await settle(page);
  await page.click('#seal');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'detail-invitation-390@2x.png'), fullPage: false });
  await page.goto(base + '/rsvp.html?preview=1', { waitUntil: 'networkidle' });
  await settle(page);
  await page.fill('#code', 'PREVIEW');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-step="invitees"]');
  await page.click('[data-action="continue"]');
  await page.waitForSelector('[data-step="attendance"]');
  await page.click('[data-action="continue"]');
  await page.waitForSelector('.error-text:not([hidden])');
  await page.screenshot({ path: path.join(OUT, 'detail-rsvp-attendance-error-390@2x.png'), fullPage: false });
  await context.close();
}

// Reduced motion: the envelope opens and the site appears without animation, keyboard only
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base + '/?envelope=1', { waitUntil: 'networkidle' });
  await settle(page);
  // With reduced motion the sealed envelope is skipped: the invitation is shown immediately, no animations run.
  const rm1 = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), animations: document.getAnimations().length, sealVisible: !!(document.getElementById('seal') && document.getElementById('seal').offsetParent) }));
  await page.screenshot({ path: path.join(OUT, 'invitation-reduced-motion-390.png'), fullPage: false });
  await page.focus('button[data-action="enter"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const rm2 = await page.evaluate(() => ({ state: document.body.getAttribute('data-entry-state'), focused: document.activeElement && document.activeElement.id, animations: document.getAnimations().length }));
  results.reducedMotion = { start: rm1, afterEnter: rm2 };
  await context.close();
}

// 200% text zoom approximation: 720px-wide viewport at 2x zoom equals a 1440 layout at 200%
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/celebration.html', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  await settle(page);
  const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  results.overflow.push({ page: 'invitation @ 200% text', width: 1440, ok: overflow.scrollWidth <= overflow.innerWidth, ...overflow });
  await page.screenshot({ path: path.join(OUT, 'invitation-text-200pct-1440.png'), fullPage: false });
  await context.close();
}

await browser.close();
server.close();

const lines = [
  '# Visual proofs',
  '',
  `Captured ${results.capturedAt} with ${results.browser} on Node ${results.node} using \`npm run proofs\` (Playwright, headless).`,
  'Synthetic guests only (PRD DATA-03). The RSVP preview uses the in-page mock adapter; nothing is saved.',
  '',
  '## Horizontal overflow check (must be none)',
  '',
  '| Page | Width | scrollWidth | innerWidth | OK |',
  '|---|---|---|---|---|',
  ...results.overflow.map((o) => `| ${o.page} | ${o.width} | ${o.scrollWidth} | ${o.innerWidth} | ${o.ok ? 'yes' : '**NO**'} |`),
  '',
  '## Keyboard focus order (home, 1440)',
  '',
  ...results.focusOrder.map((f, i) => `${i + 1}. ${f ? `${f.tag} — "${f.text}"${f.visible ? '' : ' (not in viewport)'}` : 'none'}`),
  '',
  '## Entry flow (sealed envelope → invitation → site with keepsake → dialog)',
  '',
  ...(results.entryFlow || []).map((f) => `- ${f.width}px: after opening, state=${f.opened.state} focus=${f.opened.focused}; after entering, state=${f.entered.state} focus=${f.entered.focused} entry hidden=${f.entered.entryHidden} keepsake=${Math.round(f.entered.keepsake.width)}×${Math.round(f.entered.keepsake.height)} at (${Math.round(f.entered.keepsake.left)}, ${Math.round(f.entered.keepsake.top)}); dialog modal=${f.dialog.modal} focus=${f.dialog.focused}; after Escape state=${f.closed.state} focus=${f.closed.focused}; deep link /#wedding-day skips the envelope=${f.deepLink.state === 'site' && f.deepLink.entryHidden} scrolled=${f.deepLink.scrolled}; page errors=${f.pageErrors.length}.`),
  '',
  '## Reduced motion, keyboard only (390)',
  '',
  results.reducedMotion ? `- On load the invitation is shown without the sealed envelope: state=${results.reducedMotion.start.state}, seal visible=${results.reducedMotion.start.sealVisible}, running animations=${results.reducedMotion.start.animations}; Enter on "Continue to the website": state=${results.reducedMotion.afterEnter.state}, focus=${results.reducedMotion.afterEnter.focused}, running animations=${results.reducedMotion.afterEnter.animations}.` : '- not run',
  '',
  '## Decline-all household (AT-08, synthetic code SOLO, 390)',
  '',
  results.declineAll ? `- Details step skipped when everyone declines: ${results.declineAll.skippedDetails}; decline saved with reference ${results.declineAll.reference} (${results.declineAll.rows} guest/event rows).` : '- not run',
  '',
  '## Private-link access (390)',
  '',
  results.linkToken ? `- Token removed from the address bar before any action: ${results.linkToken.tokenStrippedBeforeAction}; "Open my invitation" shown: ${results.linkToken.buttonShown}; after pressing it the wizard is at step "${results.linkToken.stepAfter}" and the URL is ${results.linkToken.urlAfter.replace(/^https?:\/\/[^/]+/, '')}.` : '- not run',
  '',
  '## RSVP preview error state',
  '',
  ...results.rsvpFlow.map((f) => `- ${f.width}px: after submitting an incomplete attendance form, focus moved to \`${f.focusedAfterError}\`.`),
  '',
  '## Files',
  '',
  ...fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).sort().map((f) => `- ${f}`),
  '',
];
fs.writeFileSync(path.join(OUT, 'README.md'), lines.join('\n'));
console.log(lines.join('\n'));
const bad = results.overflow.filter((o) => !o.ok);
if (bad.length) { console.error(`Horizontal overflow detected on ${bad.length} capture(s)`); process.exit(1); }
