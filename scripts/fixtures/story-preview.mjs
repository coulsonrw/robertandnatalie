// Synthetic layout fixture for the Our Story section. Used only by the protected preview page
// (dist/story-preview.html in local and CI builds). Nothing here is the couple's story or a
// photograph: the pictures are labelled placeholder graphics and the text says what it is.
// The deployed build (SITE_PREVIEW=0) never renders this page (audit IMP-12, QA-06).
// When the published story uses layout "timeline", this fixture mirrors that chapter form.

function placeholder(label, w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#EFE8D8"/>
<rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#B38A39" stroke-width="3"/>
<text x="50%" y="46%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 22)}" fill="#6E4F12">Placeholder picture</text>
<text x="50%" y="58%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 34)}" fill="#5A5A55">${label}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function image(id, role, label, w, h, kind = 'photo') {
  const ratio = w / h;
  const orientation = ratio < 0.85 ? 'portrait' : ratio > 1.15 ? 'landscape' : 'square';
  return { id, role, kind, alt: `${label} (synthetic placeholder, not a photograph)`, caption: `${label} — placeholder caption`, photographer: null, focal: { x: 0.5, y: 0.5 }, width: w, height: h, orientation, sizes: [{ w, h, src: placeholder(label, w, h) }] };
}

export function storyPreviewFixture(view) {
  const [n1, n2] = view.couple.names;
  const mark = image('fixture-mark', 'chapter', 'Monogram slot', 800, 800, 'monogram');
  const photo = image('fixture-photo', 'chapter', 'Chapter photograph slot', 800, 1066, 'photo');
  return {
    published: false,
    fixture: true,
    layout: 'timeline',
    heading: 'Our Story',
    title: 'Somewhere Between Africa & America',
    subtitle: 'A Love Without Borders',
    byline: `The Story of ${n1} & ${n2}`,
    paragraphs: [],
    milestones: [],
    images: [mark, photo],
    continued: true,
    close: {
      title: 'To be continued…',
      verse: 'And over all these virtues put on love, which binds them all together in perfect unity.',
      citation: 'Colossians 3:14',
    },
    chapters: [
      { id: 'ch1', number: 1, title: 'Chapter title (fixture)', when: null, place: 'Place names (optional)', paragraphs: [`Synthetic fixture: this preview shows where the first chapter of ${n1} and ${n2}'s story will sit. It is placeholder text supplied by the build so that the owners can judge the chapter timeline; it says nothing about the couple.`], comingSoon: false, image: mark },
      { id: 'ch2', number: 2, title: 'Second chapter (fixture)', when: 'Month', place: 'City', paragraphs: ['Synthetic fixture, chapter two: a photograph sits opposite the copy on wide screens and below the title on phones. Nothing here is drawn from private conversations, messages or photographs.'], comingSoon: false, image: photo },
    ],
  };
}
