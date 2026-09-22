#!/usr/bin/env node
// Story image pipeline (audit IMP-13). Reads story.images[].source from content/site.config.json,
// re-encodes each original through Chromium's canvas (which drops EXIF/GPS metadata), and writes
// WebP + JPEG derivatives at 480, 800, 1200 and 1600 px wide (never upscaled) plus a manifest.
//   npm run images            all images in the configuration
//   node scripts/images.mjs --only lead,hero-2
// Originals stay in assets/story/originals/ (git-ignored); derivatives go to assets/story/derivatives/.
// The build publishes derivatives only when the story is enabled, approved and public.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORY_ROOT = process.env.STORY_ROOT ? path.resolve(process.env.STORY_ROOT) : ROOT;
const OUT = process.env.STORY_DERIVATIVES_DIR ? path.resolve(process.env.STORY_DERIVATIVES_DIR) : path.join(ROOT, 'assets', 'story', 'derivatives');
const CONFIG_PATH = process.env.SITE_CONFIG ? path.resolve(process.env.SITE_CONFIG) : path.join(ROOT, 'content', 'site.config.json');
const WIDTHS = [480, 800, 1200, 1600];
const BUDGET = { lead: 250 * 1024, other: 150 * 1024 };
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' };

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

export async function generateDerivatives({ images, storyRoot = STORY_ROOT, out = OUT, log = console.log } = {}) {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  fs.mkdirSync(out, { recursive: true });
  const manifestPath = path.join(out, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { generatedAt: null, images: {} };
  const problems = [];
  try {
    for (const im of images) {
      const src = path.resolve(storyRoot, im.source);
      if (!fs.existsSync(src)) { problems.push(`${im.id}: source not found at ${im.source}`); continue; }
      const mime = MIME[path.extname(src).toLowerCase()];
      if (!mime) { problems.push(`${im.id}: unsupported file type ${path.extname(src)}`); continue; }
      const dataUri = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;
      const result = await page.evaluate(async ({ dataUri, widths }) => {
        const img = new Image();
        img.src = dataUri;
        await img.decode();
        const W = img.naturalWidth, H = img.naturalHeight;
        const targets = widths.filter((w) => w < W);
        targets.push(W); // the largest derivative is the natural width, never upscaled
        const sizes = [];
        for (const w of targets) {
          const h = Math.round((H * w) / W);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          sizes.push({ w, h, webp: canvas.toDataURL('image/webp', 0.82).split(',')[1], jpg: canvas.toDataURL('image/jpeg', 0.84).split(',')[1] });
        }
        return { width: W, height: H, sizes };
      }, { dataUri, widths: WIDTHS });
      const entry = { id: im.id, role: im.role, source: im.source, width: result.width, height: result.height, sizes: [] };
      for (const s of result.sizes) {
        const webpFile = `${im.id}-${s.w}.webp`, jpgFile = `${im.id}-${s.w}.jpg`;
        const webp = Buffer.from(s.webp, 'base64'), jpg = Buffer.from(s.jpg, 'base64');
        fs.writeFileSync(path.join(out, webpFile), webp);
        fs.writeFileSync(path.join(out, jpgFile), jpg);
        entry.sizes.push({ w: s.w, h: s.h, webp: webpFile, jpg: jpgFile, bytesWebp: webp.length, bytesJpg: jpg.length });
      }
      const principal = entry.sizes.find((s) => s.w === 1200) || entry.sizes[entry.sizes.length - 1];
      const budget = im.role === 'lead' ? BUDGET.lead : BUDGET.other;
      const over = principal.bytesWebp > budget;
      manifest.images[im.id] = entry;
      log(`${im.id} (${im.role}): ${result.width}×${result.height} → ${entry.sizes.map((s) => `${s.w}w ${Math.round(s.bytesWebp / 1024)} KB`).join(', ')}${over ? `  [over the ${Math.round(budget / 1024)} KB budget at ${principal.w}w; review or supply a tighter crop]` : ''}`);
    }
  } finally {
    await browser.close();
  }
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return { manifest, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  let images = config.story?.images ?? [];
  if (only) images = images.filter((i) => only.has(i.id));
  if (!images.length) { console.log('No story images configured (story.images is empty). Nothing to do.'); process.exit(0); }
  const { problems } = await generateDerivatives({ images });
  for (const p of problems) console.error(`error: ${p}`);
  console.log(`Wrote ${path.relative(ROOT, OUT)}/manifest.json`);
  if (problems.length) process.exit(1);
}
