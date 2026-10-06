// Original, code-native sticker illustrations for the cartoon collection.
const line = (d, ink, width = 8) =>
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const shape = (d, fill, ink) =>
  `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/>`;
const place = (body, x, y, scale = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
const face = (ink, wink = false) =>
  (wink ? line('M-33 -6l12 -7l12 7', ink, 7) : dot(-25, -8, 7, ink)) +
  dot(25, -8, 7, ink) +
  line('M-16 16q16 20 32 0', ink, 6) +
  `<ellipse cx="-45" cy="12" rx="13" ry="8" fill="#ff9cb5"/><ellipse cx="45" cy="12" rx="13" ry="8" fill="#ff9cb5"/>`;
function mochi(fill, ink, wink = false) {
  return (
    shape(
      'M-83 27Q-95 -7 -59 -48Q-18 -90 33 -57Q86 -34 85 23Q87 65 0 65Q-72 64 -83 27Z',
      fill,
      ink,
    ) +
    face(ink, wink) +
    line('M-72 32q-28 -13 -32 4M74 30q24 -16 31 -1', ink, 7)
  );
}
function cat(fill, ink) {
  return (
    shape(
      'M-77 -24L-77 -83L-33 -54Q0 -63 34 -54L78 -83L77 -24Q105 70 0 73Q-104 71 -77 -24Z',
      fill,
      ink,
    ) +
    shape('M-64 -55l2 -12l14 15Z', '#ffc9bd', ink) +
    shape('M64 -55l-2 -12l-14 15Z', '#ffc9bd', ink) +
    dot(-30, -6, 7, ink) +
    dot(30, -6, 7, ink) +
    shape('M-9 12H9L0 21Z', '#f07983', ink) +
    line(
      'M0 23q-12 20 -26 5M0 23q12 20 26 5M-57 12l-38 -7M-57 30l-35 10M57 12l38 -7M57 30l35 10M-15 -50l7 17M15 -50l-7 17',
      ink,
      6,
    )
  );
}
function frog(fill, ink) {
  return (
    shape(
      'M-75 -20Q-88 -82 -41 -77Q-16 -78 -10 -47H10Q16 -78 41 -77Q88 -82 75 -20Q100 67 0 72Q-100 67 -75 -20Z',
      fill,
      ink,
    ) +
    dot(-43, -49, 19, '#fffdf1') +
    dot(43, -49, 19, '#fffdf1') +
    dot(-43, -49, 7, ink) +
    dot(43, -49, 7, ink) +
    line('M-35 16q35 42 70 0', ink, 7) +
    dot(-58, 14, 10, '#ffb6b0') +
    dot(58, 14, 10, '#ffb6b0')
  );
}
function monster(fill, ink, variant = 0) {
  return (
    shape(
      'M-68 42Q-92 -14 -58 -48L-67 -76L-30 -59Q0 -73 31 -59L65 -79L59 -43Q93 -9 70 43L82 67L43 68L31 49L12 71L-8 51L-34 71L-45 51L-80 68Z',
      fill,
      ink,
    ) +
    (variant
      ? dot(-27, -12, 19, '#fffdf5') +
        dot(27, -12, 19, '#fffdf5') +
        dot(-27, -12, 7, ink) +
        dot(27, -12, 7, ink)
      : dot(0, -15, 30, '#fffdf5') + dot(0, -15, 13, ink)) +
    shape('M-27 23Q0 52 27 23Z', ink, ink) +
    `<path d="M-14 26l8 12l8 -12M7 27l8 12l8 -13" fill="#ffffff"/>`
  );
}
function peach(fill, ink) {
  return (
    shape('M0 -39Q-69 -85 -81 -20Q-91 32 0 76Q91 32 81 -20Q69 -85 0 -39Z', fill, ink) +
    line('M0 -38q-20 30 -10 55', '#e78679', 6) +
    shape('M0 -45Q5 -87 51 -78Q43 -44 0 -45Z', '#9fbc89', ink) +
    place(face(ink), 0, 18, 0.75)
  );
}
const heart = (fill, ink) =>
  shape('M0 43L-42 3Q-63 -23 -32 -38Q-10 -49 0 -24Q10 -49 32 -38Q63 -23 42 3Z', fill, ink);
function flower(fill, ink) {
  let petals = '';
  for (let i = 0; i < 6; i++)
    petals += `<ellipse cx="0" cy="-39" rx="23" ry="34" fill="${fill}" stroke="${ink}" stroke-width="6" transform="rotate(${i * 60})"/>`;
  return (
    petals +
    `<circle r="26" fill="#ffe887" stroke="${ink}" stroke-width="6"/>` +
    place(face(ink), 0, 0, 0.35)
  );
}
function candy(fill, ink) {
  return (
    shape('M-51 -34L-101 -53L-90 -8L-103 37L-51 22M51 -34L101 -53L90 -8L103 37L51 22', fill, ink) +
    `<rect x="-58" y="-42" width="116" height="81" rx="30" fill="${fill}" stroke="${ink}" stroke-width="8"/>` +
    place(face(ink), 0, 0, 0.7)
  );
}
function ufo(fill, ink) {
  return (
    `<path d="M-65 0Q-68 -100 0 -104Q68 -100 65 0" fill="#c2f590" stroke="${ink}" stroke-width="7"/>` +
    place(face(ink), 0, -49, 0.62) +
    `<ellipse rx="124" ry="37" fill="${fill}" stroke="${ink}" stroke-width="8"/>` +
    dot(-68, 0, 10, '#fff2a4') +
    dot(0, 13, 10, '#fff2a4') +
    dot(68, 0, 10, '#fff2a4') +
    line('M-61 52l-18 23M0 57v29M61 52l18 23', '#fff2a4', 9)
  );
}
function burst(fill, ink) {
  let points = '';
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10,
      r = i % 2 ? 61 : 99;
    points += `${Math.cos(a) * r},${Math.sin(a) * r} `;
  }
  return `<polygon points="${points}" fill="${fill}" stroke="${ink}" stroke-width="6"/>`;
}
const xmlText = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const label = (text, fill, ink, width = 220) =>
  `<rect x="${-width / 2}" y="-42" width="${width}" height="84" rx="42" fill="${fill}" stroke="${ink}" stroke-width="7"/><text x="0" y="17" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="46" fill="${ink}">${xmlText(text)}</text>`;
const paw = (fill, ink) =>
  `<ellipse cx="0" cy="18" rx="27" ry="22" fill="${fill}"/>` +
  [-32, -11, 13, 33]
    .map(
      (x, i) =>
        `<ellipse cx="${x}" cy="${i === 0 || i === 3 ? -8 : -22}" rx="10" ry="14" fill="${fill}"/>`,
    )
    .join('') +
  line('M-12 24q12 8 24 0', ink, 3);
const sticker = (body) => `<g stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
function grid(w, h, color, spacing, checker = false) {
  let result = '';
  for (let y = 0; y < h; y += spacing)
    for (let x = 0; x < w; x += spacing) {
      if (checker && (x / spacing + y / spacing) % 2 === 0)
        result += `<rect x="${x}" y="${y}" width="${spacing}" height="${spacing}" fill="${color}" opacity=".22"/>`;
    }
  if (!checker) {
    for (let x = 0; x <= w; x += spacing) result += line(`M${x} 0V${h}`, color, 3);
    for (let y = 0; y <= h; y += spacing) result += line(`M0 ${y}H${w}`, color, 3);
  }
  return result;
}

export function cartoonArt(f) {
  const { palette: p, designWidth: w, designHeight: h } = f;
  const ink = f.id === 'space-pals' ? '#292944' : p.ink;
  let bg = '',
    fg = '';
  const add = (body, x, y, scale = 1, angle = 0) => {
    fg += place(sticker(body), x, y, scale, angle);
  };
  if (f.id === 'mochi-party') {
    bg += grid(w, h, p.accent, 105, true);
    add(mochi('#fffef4', ink), 270, 298, 1.35, -10);
    add(mochi('#b5b9ef', ink, true), 605, 292, 1.45, 7);
    add(mochi('#ffaacb', ink), 950, 304, 1.3, -7);
    add(heart(p.accent, ink), 174, 1305, 0.86, -18);
    add(label('SO CUTE', '#fffdf2', ink, 286), 720, 1304, 0.9, 4);
    add(flower('#fffdf2', ink), 995, 2246, 0.76, 12);
    add(heart(p.secondary, ink), 290, 2253, 0.82, 10);
    add(label('tiny happy moments', '#fffdf2', ink, 590), 600, 3190, 0.9, -2);
  } else if (f.id === 'kitty-club') {
    bg += grid(w, h, '#dfbd96', 120);
    add(cat(p.accent, ink), 590, 296, 1.48, -6);
    add(paw(p.accent, ink), 245, 302, 1.25, -25);
    add(paw(p.accent, ink), 960, 287, 1.1, 22);
    add(label('MEOW!', '#b7d5c9', ink, 260), 284, 1335, 0.9, -7);
    add(paw(p.accent, ink), 967, 1320, 1.2, 22);
    add(
      shape('M-65 0Q-8 -57 51 0Q-8 57 -65 0L-93 -33V33Z', '#b7d5c9', ink) + dot(24, -4, 6, ink),
      866,
      2260,
      0.8,
      10,
    );
    add(heart(p.accent, ink), 287, 2247, 0.82, -20);
    add(label('purrfect together', '#fffdf2', ink, 530), 600, 3210, 0.84, 2);
  } else if (f.id === 'comic-dash') {
    bg += `<defs><pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">${dot(8, 8, 5, p.ink)}</pattern></defs><rect width="${w}" height="${h}" fill="url(#dots)" opacity=".12"/>`;
    for (let i = 0; i < 22; i++) {
      const a = (i * Math.PI) / 11;
      bg += line(
        `M900 1350L${900 + Math.cos(a) * 3000} ${1350 + Math.sin(a) * 3000}`,
        '#ff705a',
        9,
      );
    }
    add(label('GOOD TIMES!', '#fffdf2', ink, 430), 345, 202, 1.18, -4);
    add(burst(p.accent, ink), 1530, 217, 0.85, 12);
    add(label('WOW!', p.secondary, ink, 230), 1518, 214, 0.76, -5);
    add(burst('#fffdf2', ink), 226, 1250, 0.76, 12);
    add(label('POP!', p.accent, ink, 215), 234, 1252, 0.77, -8);
    add(label('YOU + ME', '#fffdf2', ink, 370), 1130, 1265, 0.9, 3);
    add(burst(p.secondary, ink), 901, 1810, 0.56, 7);
    add(label('WHAT A DAY!', p.accent, ink, 435), 900, 2396, 0.85, -3);
  } else if (f.id === 'froggy-day') {
    bg += grid(w, h, '#bfdaad', 140, true);
    bg += `<ellipse cx="900" cy="2130" rx="1040" ry="510" fill="${p.secondary}" opacity=".5"/>`;
    add(frog(p.accent, ink), 405, 244, 1.0, -9);
    add(frog('#b7d98b', ink), 1410, 242, 1.0, 9);
    add(flower('#fffef4', ink), 900, 245, 0.66);
    add(flower('#fffef4', ink), 894, 1100, 0.64, 10);
    add(heart('#ffb6b0', ink), 900, 1800, 0.63, -14);
    add(label('HOPPY TOGETHER', '#fffdf2', ink, 605), 900, 2398, 0.85, 1);
    for (const x of [220, 1570])
      fg += `<ellipse cx="${x}" cy="2370" rx="95" ry="15" fill="none" stroke="${p.accent}" stroke-width="6"/>`;
  } else if (f.id === 'candy-bounce') {
    bg += grid(w, h, '#bba2d6', 112, true);
    bg += `<path d="M-100 100Q650 560 1300 100M-100 1650Q650 2100 1300 1650M-100 3050Q650 3500 1300 3050" fill="none" stroke="#ffb7d7" stroke-width="90"/>`;
    add(candy(p.accent, ink), 320, 270, 1.05, -14);
    add(candy(p.secondary, ink), 912, 269, 1.05, 17);
    add(label('SWEET!', '#fffef4', ink, 270), 299, 1036, 0.7, 6);
    add(heart(p.accent, ink), 939, 1028, 0.67, -15);
    add(candy(p.secondary, ink), 970, 1736, 0.59, -17);
    add(label('BOUNCE', '#fffef4', ink, 302), 298, 2434, 0.72, -5);
    add(flower('#fffdf5', ink), 969, 2440, 0.55, 9);
    add(label('sugar & smiles', '#fffdf4', ink, 480), 600, 3206, 0.79, -2);
  } else if (f.id === 'space-pals') {
    for (let i = 0; i < 85; i++)
      bg += dot((i * 137 + 28) % w, (i * 389 + 189) % h, i % 4 ? 4 : 8, '#d3cbff');
    bg += `<path d="M-100 3380Q1200 2040 1290 1280" fill="none" stroke="${p.secondary}" stroke-width="32" opacity=".27"/>`;
    add(ufo(p.secondary, ink), 600, 291, 1.05, -6);
    add(burst('#ffe88b', ink), 182, 283, 0.5, 10);
    add(heart(p.accent, ink), 1030, 283, 0.58, 15);
    add(label('OUT OF THIS WORLD', p.accent, ink, 720), 600, 1340, 0.84, -2);
    add(
      `<circle r="47" fill="#f8a3c1" stroke="${ink}" stroke-width="6"/><ellipse rx="95" ry="23" fill="none" stroke="#fff0b6" stroke-width="17" transform="rotate(-20)"/>`,
      222,
      2340,
      0.7,
    );
    add(label('HELLO, HUMAN!', p.secondary, ink, 555), 830, 2338, 0.74, 3);
    add(
      line('M100 0H-80M70 24H-50M70 -24H-50', p.secondary, 8) +
        place(heart(p.accent, ink), 95, 0, 0.7),
      170,
      3225,
      0.8,
      -5,
    );
  } else if (f.id === 'monster-moods') {
    bg += grid(w, h, '#d3bfc9', 138);
    add(monster(p.accent, ink), 350, 229, 1.08, -8);
    add(monster(p.secondary, ink, 1), 1410, 229, 1.08, 8);
    add(label('ALL THE MOODS', '#fffdf5', ink, 600), 900, 227, 0.74, -2);
    add(label('SILLY', '#ffe393', ink, 245), 415, 1307, 0.83, -4);
    add(label('HAPPY', '#f5b8c9', ink, 245), 1392, 1307, 0.83, 4);
    add(monster('#f5b8c9', ink), 903, 1870, 0.68, -5);
    add(label('stay a little weird', '#fffdf5', ink, 670), 900, 2400, 0.82, -2);
  } else if (f.id === 'peach-picnic') {
    bg += grid(w, h, '#f3bea7', 135, true);
    add(peach(p.accent, ink), 342, 251, 1.02, -10);
    add(peach('#ffbfb3', ink), 1450, 251, 1.02, 8);
    add(label('PICNIC PALS', '#fffdf4', ink, 485), 900, 240, 0.92, -2);
    add(flower('#fffdf4', ink), 1452, 1488, 0.65, 5);
    add(label('a peachy little day', '#fffdf4', ink, 615), 564, 1487, 0.8, -3);
    add(heart(p.accent, ink), 1015, 1880, 0.6, 14);
    add(flower('#fffdf4', ink), 900, 2398, 0.59);
  }
  return { background: bg, foreground: fg };
}
