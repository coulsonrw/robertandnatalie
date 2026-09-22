// Synthetic layout fixture for the Our Story section. Used only by the protected preview page
// (dist/story-preview.html in local and CI builds). Nothing here is the couple's story or a
// photograph: the pictures are labelled placeholder graphics and the text says what it is.
// The deployed build (SITE_PREVIEW=0) never renders this page (audit IMP-12, QA-06).

function placeholder(label, w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#EFE8D8"/>
<rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#B38A39" stroke-width="3"/>
<text x="50%" y="46%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 22)}" fill="#6E4F12">Placeholder picture</text>
<text x="50%" y="58%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 34)}" fill="#5A5A55">${label}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function image(id, role, label, w, h) {
  return { id, role, alt: `${label} (synthetic placeholder, not a photograph)`, caption: `${label} — placeholder caption`, photographer: null, focal: { x: 0.5, y: 0.5 }, width: w, height: h, sizes: [{ w, h, src: placeholder(label, w, h) }] };
}

export function storyPreviewFixture(view) {
  const [n1, n2] = view.couple.names;
  const images = [
    image('fixture-lead', 'lead', 'Lead image slot', 1200, 800),
    image('fixture-1', 'supporting', 'Supporting image 1', 800, 600),
    image('fixture-2', 'supporting', 'Supporting image 2', 600, 800),
    image('fixture-3', 'supporting', 'Supporting image 3', 800, 600),
    image('fixture-milestone', 'milestone', 'Milestone image slot', 800, 600),
  ];
  return {
    published: false,
    fixture: true,
    heading: 'Our Story',
    paragraphs: [
      `Synthetic fixture, paragraph one: this preview shows where the first paragraph of ${n1} and ${n2}'s story will sit. It is placeholder text supplied by the build so that the owners can judge the layout; it says nothing about the couple.`,
      'Synthetic fixture, paragraph two: the approved copy will be between 150 and 250 words in up to three short paragraphs, written in the couple\'s own voice. Nothing in this preview is drawn from private conversations, messages or photographs.',
      'Synthetic fixture, paragraph three: this paragraph exists to show line length, spacing and how the narrative wraps beside the lead picture on wide screens and below it on phones.',
    ],
    milestones: [
      { id: 'm1', title: 'Milestone title (fixture)', description: 'A short owner-approved description will appear here. Dates and places are optional and appear only when the couple wants them published.', when: 'Undated', place: null, image: images[4] },
      { id: 'm2', title: 'Second milestone (fixture)', description: 'Milestones are optional; the section works without them.', when: null, place: 'Place name (optional)', image: null },
      { id: 'm3', title: 'Third milestone (fixture)', description: 'At most a handful of milestones, in the order the couple chooses.', when: null, place: null, image: null },
    ],
    images,
  };
}
