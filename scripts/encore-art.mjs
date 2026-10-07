import fs from 'node:fs';

const artwork = {
  'ribbon-diary-trio': ['encore-rose', 'COUTURE MEMORIES / ROSE EDITION'],
  'ocean-postcard-story': ['encore-riviera', 'A LITTLE PIECE OF THE RIVIERA'],
  'denim-daisy-portrait': ['encore-denim', 'HANDCRAFTED MOMENTS / BLOOM EDITION'],
  'butterfly-notes-arch': ['encore-lilac', 'COLLECTING LITTLE WONDERS'],
  'cherry-kiss-story': ['encore-cherry', 'THE SWEETEST SOCIAL CLUB'],
  'citrus-club-mini': ['encore-citrus', 'SUMMER SOCIAL CLUB'],
  'coffee-date-polaroid': ['encore-cafe', 'A SLOW MORNING / A GOOD MEMORY'],
  'botanical-journal-portrait': ['encore-emerald', 'PRESSED LEAVES / PRECIOUS MOMENTS'],
  'festive-wishes-offset': ['encore-champagne', 'LET THE GOOD TIMES SPARKLE'],
  'garden-paint-story': ['encore-garden', 'AN INVITATION TO DAYDREAM'],
};
const cache = new Map();
const rect = (x, y, w, h, fill, radius = 0, more = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" ${more}/>`;
const path = (d, stroke, width = 3, more = '') =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${more}/>`;
const circle = (x, y, r, fill, more = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${more}/>`;
const place = (body, x, y, scale = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
const text = (label, x, y, size, color, spacing = 3) =>
  `<text x="${x}" y="${y}" fill="${color}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" letter-spacing="${spacing}">${label}</text>`;
const star = (x, y, r, fill) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y}Q${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r}Q${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y}Q${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r}Z" fill="${fill}"/>`;
const defs = `<defs>
  <linearGradient id="enc-gold" x2=".7" y2="1"><stop stop-color="#82603c"/><stop offset=".24" stop-color="#e6cd94"/><stop offset=".46" stop-color="#fff4c9"/><stop offset=".65" stop-color="#b48b50"/><stop offset=".85" stop-color="#f4dfab"/><stop offset="1" stop-color="#937045"/></linearGradient>
  <linearGradient id="enc-silver" x2="1" y2=".7"><stop stop-color="#f9f5ea"/><stop offset=".3" stop-color="#91a4b0"/><stop offset=".53" stop-color="#ffffff"/><stop offset=".72" stop-color="#b8c6c7"/><stop offset="1" stop-color="#f6efe2"/></linearGradient>
  <linearGradient id="enc-rose" x2="1" y2="1"><stop stop-color="#f7e1e7"/><stop offset=".33" stop-color="#be8398"/><stop offset=".51" stop-color="#f2c4d0"/><stop offset=".77" stop-color="#96647d"/><stop offset="1" stop-color="#ddb0c0"/></linearGradient>
  <pattern id="enc-paper" width="47" height="43" patternUnits="userSpaceOnUse"><path d="M3 12l4 -1M26 35l2 1" stroke="#715443" stroke-opacity=".12" stroke-width="1"/></pattern>
  <filter id="enc-shadow" x="-.12" y="-.1" width="1.24" height="1.22"><feDropShadow dx="5" dy="9" stdDeviation="5" flood-color="#24352b" flood-opacity=".22"/></filter>
  </defs>`;
function material(name, w, h) {
  if (!cache.has(name))
    cache.set(
      name,
      fs
        .readFileSync(new URL(`../artwork/materials/${name}.jpg`, import.meta.url))
        .toString('base64'),
    );
  return `<image width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/jpeg;base64,${cache.get(name)}"/>`;
}
function bow() {
  return (
    `<path d="M-14 4C-152 -107 -172 25 -52 25L-11 13L-65 129L-22 106L-9 137L21 15L62 132L83 99L115 120L35 9C166 35 166 -102 22 -16Z" fill="url(#enc-rose)" stroke="#9b6c82" stroke-width="4"/>` +
    rect(-20, -24, 48, 59, 'url(#enc-rose)', 12) +
    path('M-116 -31Q-58 -13 -18 5M25 5Q70 -22 119 -25', '#f8e0e6', 5)
  );
}
function daisy() {
  return (
    Array.from(
      { length: 10 },
      (_, i) =>
        `<ellipse cy="-35" rx="14" ry="31" fill="#fff6dc" stroke="#bec3b5" stroke-width="2" transform="rotate(${i * 36})"/>`,
    ).join('') +
    circle(0, 0, 21, '#e5b847') +
    circle(-6, -5, 6, '#f6d676')
  );
}
function butterfly() {
  return (
    `<path d="M0 7C-81 -106 -112 -22 -53 26C-113 76 -16 97 0 22C17 97 113 76 52 25C112 -22 80 -106 0 7Z" fill="#e9d9ef" stroke="#8e729f" stroke-width="4"/>` +
    path(
      'M-75 -35Q-47 -13 -10 13M75 -35Q47 -13 10 13M-61 51Q-33 32 -10 19M61 51Q33 32 10 19',
      '#b1a0c2',
      2,
    ) +
    path('M0 7V38M0 8Q-12 -16 -21 -10M0 8Q12 -16 21 -10', '#8e729f', 6)
  );
}
function citrus() {
  let body =
    circle(0, 0, 84, '#f6e7ba', 'stroke="#fff5d3" stroke-width="5"') + circle(0, 0, 71, '#df8e37');
  for (let i = 0; i < 9; i++)
    body += `<path d="M0 -8L-18 -61Q0 -76 18 -61Z" fill="#ffc868" stroke="#fff0c7" stroke-width="3" transform="rotate(${i * 40})"/>`;
  return body + circle(0, 0, 8, '#fff0cc');
}
function sprig(ink, fill) {
  let body = path('M0 140Q-16 0 8 -144', ink, 4);
  for (let i = 0; i < 7; i++) {
    const y = 110 - i * 34,
      side = i % 2 ? -1 : 1;
    body += `<path d="M0 ${y}Q${side * 60} ${y - 58} ${side * 66} ${y - 10}Q${side * 50} ${y + 22} 0 ${y}Z" fill="${fill}" stroke="${ink}" stroke-width="2"/>`;
  }
  return body;
}
function laurel(radius, ink) {
  return Array.from({ length: 15 }, (_, i) => {
    const angle = ((-155 + i * 10) * Math.PI) / 180;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    return `<ellipse cx="${x}" cy="${y}" rx="8" ry="20" transform="rotate(${i * 10 - 65} ${x} ${y})" fill="${ink}"/>`;
  }).join('');
}

export function encoreArt(frame, outline) {
  const art = artwork[frame.id];
  if (!art) return null;
  const { designWidth: w, designHeight: h, palette: p } = frame;
  const sw = w / 1200;
  let bg = defs + material(art[0], w, h),
    fg = defs;
  const border = (ink, width, more = '') =>
    frame.slots
      .map((s) =>
        outline(s, frame, false, `fill="none" stroke="${ink}" stroke-width="${width}" ${more}`),
      )
      .join('');
  const labelInk = ['cherry-kiss-story', 'denim-daisy-portrait'].includes(frame.id)
    ? '#fff0cf'
    : p.ink;
  const label = (words, x, y, size = 24, ink = labelInk) =>
    text(words, w * x, h * y, size * sw, ink, 2 * sw);
  const plate = (ink = '#fff6e7', stroke = p.accent) =>
    rect(
      w * 0.075,
      h * 0.021,
      w * 0.85,
      h * 0.068,
      ink,
      10 * sw,
      `fill-opacity=".95" stroke="${stroke}" stroke-width="${2 * sw}"`,
    );
  const footer = () =>
    rect(w * 0.14, h * 0.915, w * 0.72, h * 0.074, p.secondary, 9 * sw, 'fill-opacity=".96"') +
    rect(w * 0.14, h * 0.915, w * 0.72, h * 0.074, 'url(#enc-paper)', 9 * sw);
  bg += border('#fff8e9', 54 * sw) + border('url(#enc-gold)', 28 * sw) + border('#fff9ee', 7 * sw);
  bg += plate() + footer();
  switch (frame.id) {
    case 'ribbon-diary-trio': {
      fg += place(bow(), w * 0.5, h * 0.109, 0.67 * sw);
      for (const side of [0.033, 0.967])
        for (let i = 0; i < 61; i++)
          fg += circle(
            w * side,
            h * (0.142 + i * 0.0123),
            4.5 * sw,
            '#f8e9de',
            `stroke="#cfbda7" stroke-width="${sw}"`,
          );
      fg += border('#b68198', 3 * sw, 'stroke-dasharray="4 9"');
      fg += label('RIBBON DIARY / COUTURE', 0.5, 0.904, 20);
      break;
    }
    case 'ocean-postcard-story': {
      bg += rect(
        w * 0.015,
        h * 0.013,
        w * 0.97,
        h * 0.974,
        'none',
        9 * sw,
        `stroke="#f5e7c6" stroke-width="${3 * sw}"`,
      );
      fg += path(
        `M${w * 0.2} ${h * 0.114}Q${w * 0.25} ${h * 0.1} ${w * 0.3} ${h * 0.114}T${w * 0.4} ${h * 0.114}T${w * 0.5} ${h * 0.114}T${w * 0.6} ${h * 0.114}T${w * 0.7} ${h * 0.114}T${w * 0.8} ${h * 0.114}`,
        '#809caa',
        3 * sw,
      );
      const compass =
        circle(0, 0, 44, '#faf4e5', 'stroke="#ab905d" stroke-width="3"') +
        star(0, 0, 33, '#ab905d') +
        star(0, 0, 21, '#2e5368');
      fg += place(compass, w * 0.5, h * 0.533, 0.72 * sw);
      fg += label('POSTCARD № 02', 0.22, 0.542, 19) + label('RIVIERA SOUVENIR', 0.78, 0.542, 19);
      fg += label('SEA BREEZE / SOFT MEMORIES', 0.5, 0.903, 20);
      break;
    }
    case 'denim-daisy-portrait': {
      bg +=
        border('#f9edc7', 51 * sw) +
        border('#385972', 35 * sw) +
        border('#faf4df', 8 * sw, 'stroke-dasharray="12 13"');
      for (const y of [0.26, 0.5, 0.74]) fg += place(daisy(), w * 0.5, h * y, 0.52 * sw);
      fg += label('BLOOM STUDIO / HAND STITCHED', 0.5, 0.112, 22);
      fg += label('WOVEN TOGETHER', 0.5, 0.903, 20);
      break;
    }
    case 'butterfly-notes-arch': {
      bg += border('url(#enc-silver)', 31 * sw) + border('#fbf3fa', 8 * sw);
      fg += place(butterfly(), w * 0.5, h * 0.113, 0.67 * sw, 5);
      for (const [x, y, rotation] of [
        [0.031, 0.48, -28],
        [0.967, 0.73, 24],
      ])
        fg += place(butterfly(), w * x, h * y, 0.43 * sw, rotation);
      fg += label('BOTANICAL CLUB / LILAC SERIES', 0.5, 0.904, 18);
      break;
    }
    case 'cherry-kiss-story': {
      const cherries =
        path('M-30 18Q-20 -40 21 -51M32 20Q40 -25 21 -51', '#719166', 6) +
        circle(-30, 35, 29, '#ad2e49', 'stroke="#f2c49f" stroke-width="3"') +
        circle(32, 36, 29, '#73172c', 'stroke="#f2c49f" stroke-width="3"') +
        path('M-41 17Q-49 20 -47 30M20 18Q14 24 16 33', '#e59b9b', 6);
      fg += place(cherries, w * 0.5, h * 0.534, 0.59 * sw);
      fg += label('CHERRY CLUB', 0.24, 0.538, 23) + label('SPECIAL EDITION', 0.76, 0.538, 23);
      fg += label('SWEET MOMENTS / RARE FINDS', 0.5, 0.112, 22);
      fg += label('SEALED IN VELVET', 0.5, 0.903, 20);
      break;
    }
    case 'citrus-club-mini': {
      bg += border('#fff3ca', 36 * sw) + border('#9d9563', 6 * sw);
      fg +=
        place(citrus(), w * 0.054, h * 0.338, 0.62 * sw, -8) +
        place(citrus(), w * 0.954, h * 0.692, 0.58 * sw, 15);
      for (const [index, y] of [
        [1, 0.329],
        [2, 0.516],
        [3, 0.703],
      ])
        fg += label('0' + index + ' / GOLDEN HOUR', 0.5, y, 17);
      fg += label('SUMMER SOCIAL CLUB', 0.5, 0.112, 22);
      fg += label('SUNSHINE IN A PRINT', 0.5, 0.903, 19);
      break;
    }
    case 'coffee-date-polaroid': {
      bg += border('#f7f0e4', 77 * sw) + border('#ceb591', 9 * sw);
      const cup = `<ellipse cy="32" rx="61" ry="20" fill="#ddd0b4"/><path d="M-37 -22H37V18Q0 62 -37 18Z" fill="#fff5df" stroke="#81624b" stroke-width="3"/><path d="M37 -13C77 -24 80 29 36 25" fill="none" stroke="#fff4dc" stroke-width="10"/><ellipse cy="-22" rx="37" ry="13" fill="#7f4b31"/><path d="M0 -16C-29 -38 -26 -2 0 -8C26 -2 29 -38 0 -16" fill="#efd3a8"/>`;
      fg += place(cup, w * 0.5, h * 0.515, 0.53 * sw);
      fg +=
        label('CAFÉ RECEIPT / 01', 0.245, 0.512, 18) + label('FRESHLY PRINTED', 0.74, 0.512, 18);
      fg += label('SLOW MORNINGS / GOOD COMPANY', 0.5, 0.111, 21);
      fg += label('BREWED WITH LOVE', 0.5, 0.902, 21);
      break;
    }
    case 'botanical-journal-portrait': {
      bg +=
        border('#253f34', 55 * sw) + border('url(#enc-gold)', 31 * sw) + border('#fff1cf', 7 * sw);
      for (const y of [0.3, 0.57, 0.79])
        fg += place(sprig('#ccad74', '#688569'), w * 0.5, h * y, 0.2 * sw, 0);
      fg += label('HERBARIUM / COLLECTOR’S EDITION', 0.5, 0.112, 20);
      fg += label('GROWING A MEMORY', 0.5, 0.903, 20, '#fff0cf');
      break;
    }
    case 'festive-wishes-offset': {
      bg += border('#fff4d5', 43 * sw) + border('url(#enc-gold)', 17 * sw);
      for (let i = 0; i < 28; i++) {
        const x = w * (0.017 + ((i * 31) % 96) / 100),
          y = h * (0.107 + ((i * 17) % 77) / 100);
        fg += place(
          rect(-4, -12, 8, 24, i % 2 ? '#e8d095' : '#fff8db', 2),
          x,
          y,
          sw,
          (i * 41) % 180,
        );
      }
      const fireworks =
        Array.from({ length: 16 }, (_, i) => {
          const a = (i * Math.PI) / 8;
          return path(
            `M${Math.cos(a) * 33} ${Math.sin(a) * 33}L${Math.cos(a) * 73} ${Math.sin(a) * 73}`,
            '#ad8845',
            2,
          );
        }).join('') + star(0, 0, 21, '#ba9855');
      fg += place(fireworks, w * 0.5, h * 0.115, 0.8 * sw);
      fg += label('CHEERS TO THE NEXT CHAPTER', 0.5, 0.904, 17);
      break;
    }
    case 'garden-paint-story': {
      bg += border('#fff8e5', 62 * sw) + border('#c7b195', 13 * sw) + border('#eef0d6', 5 * sw);
      fg += label('GARDEN GATHERING / FLEURS &amp; FRIENDS', 0.5, 0.113, 20);
      const seal =
        circle(0, 0, 45, '#faf2df', 'stroke="#b49262" stroke-width="3"') +
        laurel(31, '#a0aa82') +
        text('GP', 0, 10, 23, '#506551', 0);
      fg += place(seal, w * 0.5, h * 0.534, 0.73 * sw);
      fg += label('FINE ART PRINT', 0.235, 0.542, 20) + label('GARDEN SERIES', 0.77, 0.542, 20);
      fg += label('A LITTLE GARDEN TO KEEP', 0.5, 0.903, 20);
      break;
    }
  }
  if (
    ![
      'denim-daisy-portrait',
      'coffee-date-polaroid',
      'cherry-kiss-story',
      'citrus-club-mini',
      'botanical-journal-portrait',
      'garden-paint-story',
    ].includes(frame.id)
  )
    fg += label(art[1], 0.5, 0.134, frame.format === 'strip' ? 14 : 19);
  const textMasks = frame.textAreas
    .map((t) => rect(t.x * w, t.y * h, t.w * w, t.h * h, 'black'))
    .join('');
  const safe = `<defs><mask id="encore-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">${rect(0, 0, w, h, 'white')}${frame.slots.map((s) => outline(s, frame, true)).join('')}${textMasks}</mask></defs>`;
  return { background: bg, foreground: safe + `<g mask="url(#encore-safe)">${fg}</g>` };
}
