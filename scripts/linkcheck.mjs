// Checks that every external link in the built pages responds (PRD CONTENT-06: no dead links).
// Usage: node scripts/linkcheck.mjs   (after npm run build). Exit code 1 if any link fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
const links = new Map();
for (const f of files) {
  const html = fs.readFileSync(path.join(DIST, f), 'utf8');
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const url = m[1].replace(/&amp;/g, '&');
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(f);
  }
}
let failures = 0;
for (const [url, pages] of links) {
  let status = 'error';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (link check for robertandnatalie.wedding)' } });
    if (res.status === 405 || res.status === 403) res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (link check for robertandnatalie.wedding)' } });
    clearTimeout(timer);
    status = String(res.status);
  } catch (e) {
    status = `error: ${e.name === 'AbortError' ? 'timeout' : e.message}`;
  }
  const ok = /^2\d\d$/.test(status) || /^3\d\d$/.test(status);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${status.padEnd(7)} ${url}  (${[...pages].join(', ')})`);
}
console.log(`${links.size} external links checked, ${failures} failing`);
process.exit(failures ? 1 : 0);
