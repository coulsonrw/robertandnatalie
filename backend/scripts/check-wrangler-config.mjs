// Fails if wrangler.toml has a [[send_email]] (or other table) in the middle of [vars],
// which wrangler only warns about: later keys become unexpected fields on send_email[0]
// and never reach the Worker.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toml = readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf8');
const active = toml.replace(/(^|\n)[ \t]*#[^\n]*/g, '$1');
const varsAt = active.search(/(^|\n)\[vars\]\s*(\n|$)/);
const sendAt = active.search(/(^|\n)\[\[send_email\]\]\s*(\n|$)/);
if (varsAt < 0 || sendAt < 0 || sendAt <= varsAt) {
  console.error('[[send_email]] must be a top-level table after [vars], not inside it.');
  process.exit(1);
}
const between = active.slice(varsAt, sendAt);
if (!/MAIL_PROVIDER\s*=\s*"cloudflare"/.test(between)) {
  console.error('MAIL_PROVIDER = "cloudflare" must stay in [vars], before [[send_email]].');
  process.exit(1);
}
if (!/never inside|after this \[vars\]|Must stay after \[vars\]/i.test(toml)) {
  console.error('wrangler.toml must keep the warning that [[send_email]] cannot sit inside [vars].');
  process.exit(1);
}

const wrangler = path.join(ROOT, 'node_modules', '.bin', 'wrangler');
const outdir = mkdtempSync(path.join(tmpdir(), 'wrangler-dry-'));
const ran = spawnSync(wrangler, ['deploy', '--dry-run', '--outdir', outdir], {
  cwd: ROOT,
  encoding: 'utf8',
});
const output = `${ran.stdout || ''}\n${ran.stderr || ''}`;
if (ran.status !== 0) {
  console.error(output);
  process.exit(ran.status || 1);
}
if (/Unexpected fields/i.test(output)) {
  console.error(output);
  console.error('wrangler reported unexpected fields — a table header is probably sitting inside [vars].');
  process.exit(1);
}
if (!/env\.EMAIL/.test(output) || !/MAIL_PROVIDER \("cloudflare"\)/.test(output)) {
  console.error(output);
  console.error('dry-run did not show env.EMAIL and MAIL_PROVIDER=cloudflare.');
  process.exit(1);
}
const missing = [
  'COORDINATOR_EMAIL', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'OWNER_EMAILS',
  'COORDINATOR_EMAILS', 'ACCESS_DEV_BYPASS', 'GOOGLE_SHEETS_ID',
  'GOOGLE_SHEETS_SOURCE_TAB', 'GOOGLE_SHEETS_ANSWERS_TAB',
].filter((key) => !output.includes(`env.${key}`));
if (missing.length) {
  console.error(output);
  console.error(`dry-run is missing Worker vars: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('wrangler deploy --dry-run: no unexpected fields; EMAIL + surviving vars present.');
