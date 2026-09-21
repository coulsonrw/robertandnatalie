// Screenshot capture for the alt-a-editorial-heritage concept proof (PRD TPL-10 viewports).
// Serves the REPOSITORY ROOT so ../../../../src/fonts and ../../../../src/img resolve.
// Run from anywhere: node docs/selection/proofs/alt-a-editorial-heritage/capture.mjs
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

const types = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript' };
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
const base = `http://127.0.0.1:${server.address().port}/docs/selection/proofs/alt-a-editorial-heritage/index.html`;

const browser = await chromium.launch();
const results = { capturedAt: new Date().toISOString(), browser: `${browser.browserType().name()} ${browser.version()}`, viewports: {} };
const widths = [320, 390, 768, 1440];

async function overflow(page) {
  return page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScrollWidth: document.body.scrollWidth }));
}

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // Main proof: static/opened state (envelope skipped via ?entry=none), full page.
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `proof-${w}.png`), fullPage: true });
  const o = await overflow(page);
  // Docked (keepsake in lower-left) state.
  await page.goto(`${base}?entry=none&state=docked`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const od = await overflow(page);
  results.viewports[w] = { opened: o, docked: od, horizontalOverflow: o.scrollWidth > o.innerWidth || od.scrollWidth > od.innerWidth };
  await ctx.close();
}

// Entry flow (envelope -> open -> continue -> keepsake -> dialog) at 1440 and 390.
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `entry-envelope-${w}.png`) });
  await page.click('#envelope');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(here, `entry-opening-${w}.png`) });
  await page.waitForSelector('#envelope-layer', { state: 'hidden' });
  await page.screenshot({ path: path.join(here, `entry-opened-${w}.png`) });
  await page.click('#continue-btn');
  await page.screenshot({ path: path.join(here, `keepsake-docked-${w}.png`) });
  await page.click('#keepsake');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, `keepsake-dialog-${w}.png`) });
  const dialogOpen = await page.evaluate(() => document.getElementById('keepsake-dialog').open && document.getElementById('dialog-slot').contains(document.getElementById('invitation-panel')));
  await page.click('#keepsake-close');
  const restored = await page.evaluate(() => !document.getElementById('keepsake-dialog').open && document.querySelector('.opening-grid').contains(document.getElementById('invitation-panel')));
  results[`entryFlow${w}`] = { dialogOpen, restored };
  await ctx.close();
}

// Detail views at 390, 2x.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#invitation-panel').screenshot({ path: path.join(here, 'detail-invitation-390@2x.png') });
  await page.locator('fieldset.error-row').screenshot({ path: path.join(here, 'detail-rsvp-error-390@2x.png') });
  await ctx.close();
}

// Keyboard: skip link then first nav item, 1440.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}?entry=none`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  await page.screenshot({ path: path.join(here, 'keyboard-skip-link-1440.png') });
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await page.screenshot({ path: path.join(here, 'keyboard-focus-1440.png') });
  results.keyboardFocusAfterThreeTabs = await page.evaluate(() => document.activeElement.textContent.trim());
  await ctx.close();
}

// Reduced motion: envelope should close without delay.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.click('#envelope');
  await page.waitForTimeout(100);
  results.reducedMotionLayerHiddenWithin100ms = await page.evaluate(() => document.getElementById('envelope-layer').hidden);
  await ctx.close();
}

await browser.close();
server.close();
await writeFile(path.join(here, 'capture-results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
