// Our Story chapter timeline (Eames / Figma). Chapters 2–6 wrap the published
// full-colour still in a .sketch frame and load a separate OpenCV/Potrace line
// overlay; the photograph itself is unchanged (no sepia, no AI). Monogram and
// coming-soon chapters stay photo-first. No inline styles (CSP).
import { esc } from '../lib/html.mjs';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function roman(n) {
  return ROMAN[n] ?? String(n);
}

function chapterPictureInner(im, { eager = false } = {}) {
  const sizes = '(min-width: 900px) 460px, 92vw';
  const attrs = `width="${im.width}" height="${im.height}" alt="${esc(im.alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}`;
  if (im.sizes.length === 1 && im.sizes[0].src) {
    return `<img class="photo-el" src="${im.sizes[0].src}" ${attrs}>`;
  }
  const fallback = im.sizes.find((s) => s.w === 800) ?? im.sizes[0];
  return `<picture class="photo-el">
      <source type="image/webp" srcset="${im.sizes.map((s) => `${esc(s.webp)} ${s.w}w`).join(', ')}" sizes="${sizes}">
      <img src="${esc(fallback.jpg)}" srcset="${im.sizes.map((s) => `${esc(s.jpg)} ${s.w}w`).join(', ')}" sizes="${sizes}" ${attrs}>
    </picture>`;
}

function chapterPicture(im, { eager = false } = {}) {
  const picture = chapterPictureInner(im, { eager });
  if (im.kind === 'photo' && im.sketch) {
    const frame = ['sketch', 'is-real-photo'];
    if (im.orientation) frame.push(`is-${im.orientation}`);
    return `<div class="${frame.join(' ')}" data-sketch="${esc(im.sketch)}"><div class="sketch-photo">${picture}</div></div>`;
  }
  const frame = ['photo-frame'];
  if (im.kind === 'photo') frame.push('is-real-photo');
  if (im.kind === 'monogram') frame.push('is-monogram');
  if (im.kind === 'placeholder') frame.push('is-placeholder-img');
  if (im.kind === 'photo' && im.orientation) frame.push(`is-${im.orientation}`);
  return `<div class="${frame.join(' ')}">${picture}</div>`;
}

function chapterParagraph(text) {
  if (text === 'Colossians 3:14') return `<p class="scripture">${esc(text)}</p>`;
  if (/Love Story Continues/i.test(text)) return `<p class="coda">${esc(text)}</p>`;
  return `<p>${esc(text)}</p>`;
}

export function storyTimeline(view, { headingLevel = 2 } = {}) {
  const s = view.story;
  if (!s || (!s.published && !s.fixture) || !s.chapters?.length) return '';
  const H = `h${headingLevel}`;
  const C = `h${headingLevel + 1}`;
  const items = s.chapters.map((ch, i) => {
    const n = ch.number ?? i + 1;
    const r = roman(n);
    const when = [ch.when, ch.place].filter(Boolean).map(esc).join(' <span class="dot" aria-hidden="true">·</span> ');
    const fig = ch.image
      ? `<figure class="chapter-figure">${chapterPicture(ch.image, { eager: i === 0 })}${ch.image.caption ? `<figcaption>${esc(ch.image.caption)}</figcaption>` : ''}</figure>`
      : '';
    const cls = ['chapter', ch.comingSoon ? 'is-placeholder' : '', ch.image?.kind === 'photo' ? 'has-photo' : 'has-mark', ch.image?.sketch ? 'has-sketch' : ''].filter(Boolean).join(' ');
    return `<li class="${cls}" id="story-${esc(ch.id)}" aria-labelledby="story-${esc(ch.id)}-title">
  <span class="chapter-marker" aria-hidden="true">${esc(r)}</span>
  <div class="chapter-head chapter-text">
    <p class="kicker">Chapter ${esc(r)}</p>
    <${C} id="story-${esc(ch.id)}-title">${esc(ch.title)}</${C}>
    ${when ? `<p class="chapter-when">${when}</p>` : ''}
  </div>
  ${fig}
  <div class="chapter-body chapter-text">${ch.paragraphs.map(chapterParagraph).join('')}</div>
</li>`;
  });
  return `<section id="our-story" class="section story story-timeline" aria-labelledby="story-title">
  <header class="story-hero">
    <p class="kicker story-kicker">${esc(s.heading)}</p>
    <${H} id="story-title" class="story-title">${esc(s.title || s.heading)}</${H}>
    ${s.subtitle ? `<p class="story-sub">${esc(s.subtitle)}</p>` : ''}
    ${s.byline ? `<p class="story-byline">${esc(s.byline)}</p>` : ''}
  </header>
  <ol class="timeline" aria-label="Chapters">${items.join('\n')}</ol>
</section>`;
}
