// Screenshot capture for the alt-b-couple-template concept proof (PRD TPL-10 viewports).
// Serves the REPOSITORY ROOT so ../../../../src/fonts, ../../../../src/img and ../../../../dist resolve.
// Run from anywhere: node docs/selection/proofs/alt-b-couple-template/capture.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const types = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript', '.ics': 'text/calendar' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root)) throw new Error('outside root');
    const data = await readFile(p);
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/docs/selection/proofs/alt-b-couple-template/index.html`;

const browser = await chromium.launch();
const results = { capturedAt: new Date().toISOString(), browser: `${browser.browserType().name()} ${browser.version()}`, node: process.version, viewports: {} };
const widths = [320, 390, 768, 1440];

const overflow = (page) => page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScrollWidth: document.body.scrollWidth }));
const consoleErrors = [];

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`${w}: ${m.text()}`); });
  page.on('requestfailed', r => consoleErrors.push(`${w}: request failed ${r.url()}`));
  // Main proof: static/opened state (envelope skipped via ?entry=none), full page.
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `proof-${w}.png`), fullPage: true });
  const o = await overflow(page);
  const fonts = await page.evaluate(() => ['Pinyon Script', 'Cormorant Garamond', 'Cormorant SC'].map(f => `${f}: ${document.fonts.check(`18px "${f}"`)}`));
  // Docked state (invitation in the lower-left keepsake).
  await page.goto(`${base}?entry=none&state=docked`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `docked-${w}.png`), fullPage: true });
  const od = await overflow(page);
  results.viewports[w] = { opened: o, docked: od, horizontalOverflow: o.scrollWidth > o.innerWidth || od.scrollWidth > od.innerWidth, fontsLoaded: fonts };
  await ctx.close();
}

// Entry flow (envelope -> open -> invitation centred -> continue -> docked -> keepsake dialog) at 1440 and 390.
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `entry-envelope-${w}.png`) });
  const envelopeFocused = await page.evaluate(() => document.activeElement.id === 'envelope');
  await page.click('#envelope');
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(here, `entry-opening-${w}.png`) });
  await page.waitForSelector('#stage-invite', { state: 'visible' });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(here, `entry-invitation-${w}.png`) });
  const invitationCentred = await page.evaluate(() => document.getElementById('entry-slot').contains(document.getElementById('invitation-panel')));
  const continueVisible = await page.evaluate(() => { const r = document.getElementById('continue-btn').getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight && document.activeElement.id === 'continue-btn'; });
  await page.click('#continue-btn');
  await page.waitForSelector('#entry', { state: 'hidden' });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(here, `keepsake-docked-${w}.png`) });
  const docked = await page.evaluate(() => document.body.classList.contains('docked') && !document.getElementById('keepsake').hidden && getComputedStyle(document.getElementById('invitation-home')).display === 'none');
  await page.click('#keepsake');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, `keepsake-dialog-${w}.png`) });
  const dialogOpen = await page.evaluate(() => document.getElementById('keepsake-dialog').open && document.getElementById('dialog-slot').contains(document.getElementById('invitation-panel')));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const restored = await page.evaluate(() => !document.getElementById('keepsake-dialog').open && document.getElementById('invitation-home').contains(document.getElementById('invitation-panel')) && document.activeElement.id === 'keepsake');
  results[`entryFlow${w}`] = { envelopeFocusedOnLoad: envelopeFocused, invitationCentredAfterOpen: invitationCentred, continueVisibleAndFocusedWithoutScroll: continueVisible, dockedAfterContinue: docked, dialogOpenFromKeepsake: dialogOpen, restoredAfterEscape: restored };
  await ctx.close();
}

// Detail views at 390, 2x: invitation panel and the RSVP error row.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#invitation-panel').screenshot({ path: path.join(here, 'detail-invitation-390@2x.png') });
  await page.locator('#sam-ceremony-cell').screenshot({ path: path.join(here, 'detail-rsvp-error-390@2x.png') });
  // Phone sticky RSVP bar in the viewport while scrolled to Travel & Stay.
  await page.evaluate(() => document.getElementById('travel').scrollIntoView());
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, 'sticky-rsvp-bar-390.png') });
  results.stickyBarVisibleAt390 = await page.evaluate(() => { const r = document.getElementById('rsvp-bar').getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top >= 0 && r.height >= 44; });
  results.stickyBarHiddenAt768 = await (async () => { const c = await browser.newContext({ viewport: { width: 768, height: 900 } }); const p = await c.newPage(); await p.goto(`${base}?entry=none`, { waitUntil: 'networkidle' }); const v = await p.evaluate(() => getComputedStyle(document.getElementById('rsvp-bar')).display === 'none'); await c.close(); return v; })();
  await ctx.close();
}

// Keyboard: skip link then first nav items, 1440.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.keyboard.press('Tab');
  await page.screenshot({ path: path.join(here, 'keyboard-skip-link-1440.png') });
  results.firstTabIsSkipLink = await page.evaluate(() => document.activeElement.classList.contains('skip'));
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await page.screenshot({ path: path.join(here, 'keyboard-focus-1440.png') });
  results.keyboardFocusAfterThreeTabs = await page.evaluate(() => document.activeElement.textContent.trim());
  // Control and tap-target audit (static DOM, opened state).
  results.controlAudit = await page.evaluate(() => {
    const out = { smallFont: [], smallTarget: [] };
    const els = document.querySelectorAll('a, button, input, textarea, summary, label.choice');
    for (const el of els) {
      if (el.closest('[hidden]') || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const r = el.getBoundingClientRect();
      if (fs < 16) out.smallFont.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.id).trim().slice(0, 30)}" ${fs}px`);
      if (el.tagName !== 'INPUT' && r.height > 0 && r.height < 44) out.smallTarget.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.id).trim().slice(0, 30)}" ${Math.round(r.height)}px`);
    }
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    const closing = getComputedStyle(document.querySelector('.closing'));
    const info = getComputedStyle(document.querySelector('.inv-line'));
    out.bodyFontPx = body;
    out.closingMatchesInformational = ['fontFamily', 'fontSize', 'fontWeight', 'color'].every(k => closing[k] === info[k]);
    out.closingComputed = { fontSize: closing.fontSize, fontWeight: closing.fontWeight, color: closing.color };
    out.crestWidthPx = document.querySelector('#invitation-panel .crest').getBoundingClientRect().width;
    return out;
  });
  await ctx.close();
}

// Crest width on a phone (DES-01 proposed 110-140 mobile).
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  results.crestWidthPx390 = await page.evaluate(() => document.querySelector('#invitation-panel .crest').getBoundingClientRect().width);
  await ctx.close();
}

// Reduced motion: invitation stage should appear without the envelope delay.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.click('#envelope');
  await page.waitForTimeout(100);
  results.reducedMotionInvitationShownWithin100ms = await page.evaluate(() => !document.getElementById('stage-invite').hidden);
  await page.click('#continue-btn');
  await page.waitForTimeout(100);
  results.reducedMotionDockedWithin100ms = await page.evaluate(() => document.getElementById('entry').hidden && document.body.classList.contains('docked'));
  await ctx.close();
}

// No-JS equivalent rendering: the static page shows the invitation inline and no entry layer.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  results.noJsStaticInvitationVisible = await page.evaluate(() => document.getElementById('entry').hidden && document.getElementById('invitation-home').contains(document.getElementById('invitation-panel')) && document.getElementById('invitation-panel').getBoundingClientRect().height > 0);
  await ctx.close();
}

results.consoleOrRequestErrors = consoleErrors;
await browser.close();
server.close();
await writeFile(path.join(here, 'capture-results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
