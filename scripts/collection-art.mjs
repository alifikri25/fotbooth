// Original vector motifs. Each collection has its own objects and paper system.
const xml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const circle = (x, y, r, fill, stroke = 'none', sw = 5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const path = (d, fill, stroke = 'none', sw = 6, more = '') =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
const line = (d, ink, sw = 5, more = '') => path(d, 'none', ink, sw, more);
const rect = (x, y, w, h, fill, rx = 0, more = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${more}/>`;
const place = (body, x, y, scale = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
const heart = (fill, ink) =>
  path(
    'M0 65C-15 45 -94 5 -83 -39C-73 -80 -18 -88 0 -47C18 -88 73 -80 83 -39C94 5 15 45 0 65Z',
    fill,
    ink,
  );
const sparkle = (fill, ink = 'none') =>
  path('M0 -83Q14 -14 83 0Q14 14 0 83Q-14 14 -83 0Q-14 -14 0 -83Z', fill, ink, 3);
function daisy(fill, center, ink) {
  return (
    Array.from(
      { length: 10 },
      (_, i) =>
        `<ellipse cx="0" cy="-43" rx="19" ry="39" fill="${fill}" stroke="${ink}" stroke-width="3" transform="rotate(${i * 36})"/>`,
    ).join('') +
    circle(0, 0, 26, center, ink, 3) +
    circle(-6, -7, 5, '#ffffff')
  );
}
function rose(fill, ink) {
  return (
    Array.from({ length: 6 }, (_, i) =>
      place(
        `<ellipse cy="-25" rx="42" ry="49" fill="${fill}" stroke="${ink}" stroke-width="3"/>`,
        0,
        0,
        1,
        i * 60,
      ),
    ).join('') + line('M-31 -2Q-15 -48 28 -21Q59 11 10 27Q-24 42 -22 6Q-5 -15 15 1', ink, 4)
  );
}
const leaf = (fill, ink) =>
  path('M-60 55Q-74 -62 63 -63Q80 44 -60 55Z', fill, ink, 4) +
  line('M-58 53L50 -49M-22 21L-24 -24M2 -4L39 7', ink, 4);
function bow(fill, ink) {
  return (
    path(
      'M-14 0Q-127 -100 -132 -27Q-147 63 -14 16L-60 103L-25 88L-5 111L20 20Q139 74 135 -21Q121 -100 17 -5L77 91L42 87L31 112L1 20Z',
      fill,
      ink,
      5,
    ) +
    path('M-109 -19Q-71 -15 -18 5M28 5Q82 -31 113 -28', 'none', ink, 3) +
    rect(-20, -22, 43, 49, fill, 12, `stroke="${ink}" stroke-width="4"`) +
    line('M-2 -9L-6 18', '#ffffff', 3)
  );
}
const face = (ink) =>
  circle(-25, -7, 6, ink) +
  circle(25, -7, 6, ink) +
  line('M-16 15Q0 31 16 15', ink, 5) +
  `<ellipse cx="-43" cy="12" rx="10" ry="6" fill="#e6a2a0"/><ellipse cx="43" cy="12" rx="10" ry="6" fill="#e6a2a0"/>`;
const badge = (text, p, shape = 'pill') => {
  const base =
    shape === 'stamp'
      ? rect(
          -166,
          -45,
          332,
          90,
          '#fff8ec',
          2,
          `stroke="${p.accent}" stroke-width="9" stroke-dasharray="9 7"`,
        )
      : rect(-178, -39, 356, 78, '#fff8ec', 39, `stroke="${p.accent}" stroke-width="4"`);
  return (
    base +
    `<text y="11" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="31" fill="${p.ink}">${xml(text)}</text>`
  );
};

function motif(kind, p) {
  const a = p.accent,
    s = p.secondary,
    ink = p.ink,
    cream = '#fff9ed',
    green = '#819b72';
  switch (kind) {
    case 'flower':
      return (
        place(leaf(green, ink), -52, 43, 0.7, -24) +
        place(leaf(green, ink), 51, 46, 0.64, 97) +
        rose(a, ink) +
        place(daisy(cream, a, ink), 61, 45, 0.42)
      );
    case 'bow':
      return (
        bow(a, ink) +
        place(sparkle(cream, ink), -137, -42, 0.28) +
        circle(155, 33, 8, cream, ink, 2)
      );
    case 'cherry':
      return (
        line('M-43 17Q-5 -7 17 -72Q54 -34 49 19', green, 9) +
        place(leaf(green, ink), 44, -65, 0.4, 61) +
        circle(-45, 39, 39, a, ink, 4) +
        circle(45, 49, 39, a, ink, 4) +
        line('M-61 19q-12 5 -12 16M30 30q-12 5 -12 16', cream, 7)
      );
    case 'daisy':
      return (
        place(leaf(s, ink), -63, 60, 0.65, -20) +
        daisy('#fffdf5', '#efc469', ink) +
        circle(42, 56, 9, a, ink, 2)
      );
    case 'sparkle':
      return (
        sparkle(a, cream) +
        place(sparkle(s, cream), 64, -61, 0.4) +
        place(sparkle(cream, ink), -69, 51, 0.35) +
        `<ellipse rx="107" ry="35" fill="none" stroke="${ink}" stroke-width="3" transform="rotate(-28)"/>`
      );
    case 'film':
      return (
        rect(-90, -88, 180, 176, '#14141b', 6, `stroke="${a}" stroke-width="4"`) +
        [-70, -26, 18, 62]
          .map((y) => rect(-82, y, 14, 24, cream, 2) + rect(68, y, 14, 24, cream, 2))
          .join('') +
        rect(-52, -63, 104, 123, s, 3) +
        line('M-40 37L-8 -2L12 16L42 -25', a, 6) +
        circle(23, -35, 13, cream) +
        `<text y="79" font-size="11" fill="${cream}" text-anchor="middle">35 MM / GOOD TIMES</text>`
      );
    case 'orange':
      return (
        place(leaf(green, ink), 46, -66, 0.55, 48) +
        circle(0, 5, 78, a, ink, 4) +
        circle(0, 5, 65, cream) +
        Array.from({ length: 8 }, (_, i) =>
          place(path('M0 -3L-20 -51Q0 -66 20 -51Z', a), 0, 5, 1, i * 45),
        ).join('') +
        circle(0, 5, 9, cream)
      );
    case 'shell':
      return (
        path('M-66 58Q-152 -17 -83 -57Q-54 -105 0 -82Q57 -101 83 -57Q145 -8 66 58Z', a, ink, 4) +
        line('M-53 50L-75 -44M-29 49L-34 -67M0 49V-70M29 49L34 -67M53 50L75 -44', cream, 5) +
        path('M-55 55H55L38 82H-38Z', cream, ink, 3)
      );
    case 'leaf':
      return (
        line('M0 91Q-20 -2 23 -91', ink, 5) +
        place(leaf(green, ink), -39, 23, 0.6, -81) +
        place(leaf(s, ink), 27, -20, 0.54, 9) +
        place(leaf(green, ink), 1, -67, 0.36, -42) +
        line('M-73 91H73', a, 3)
      );
    case 'butterfly':
      return (
        path(
          'M-6 5Q-113 -102 -126 -29Q-120 24 -37 29Q-134 18 -91 88Q-29 100 -7 24M6 5Q113 -102 126 -29Q120 24 37 29Q134 18 91 88Q29 100 7 24Z',
          a,
          ink,
          4,
        ) +
        place(heart(s, cream), -63, -17, 0.36, 10) +
        place(heart(s, cream), 63, -17, 0.36, -10) +
        line('M0 -25V53M-2 -19Q-15 -56 -31 -45M2 -19Q15 -56 31 -45', ink, 7) +
        circle(-64, 63, 9, cream) +
        circle(64, 63, 9, cream)
      );
    case 'record':
      return (
        circle(0, 0, 91, ink, a, 5) +
        [73, 59, 43].map((r) => circle(0, 0, r, 'none', s, 2)).join('') +
        circle(0, 0, 29, a) +
        circle(0, 0, 8, cream) +
        line('M-68 -25Q-45 -68 -20 -69', cream, 5) +
        place(sparkle(s, ink), 94, -58, 0.43)
      );
    case 'pixel':
      return (
        path(
          'M-72 -48H-24V-24H24V-48H72V-24H96V24H72V48H48V72H24V96H-24V72H-48V48H-72V24H-96V-24H-72Z',
          a,
          ink,
          5,
        ) +
        rect(-57, -28, 20, 20, cream) +
        rect(-78, -6, 20, 20, cream) +
        rect(21, 41, 20, 20, s)
      );
    case 'disco':
      return (
        line('M0 -136V-88', cream, 4) +
        circle(0, 0, 91, s, cream, 5) +
        `<defs><clipPath id="disco-clip"><circle r="85"/></clipPath></defs><g clip-path="url(#disco-clip)">${Array.from({ length: 7 }, (_, y) => Array.from({ length: 7 }, (_, x) => rect(-95 + x * 29, -95 + y * 29, 25, 25, (x + y) % 3 === 0 ? a : (x + y) % 3 === 1 ? cream : s)).join('')).join('')}</g>` +
        place(sparkle(cream), -107, -60, 0.43) +
        place(sparkle(a), 107, 52, 0.36)
      );
    case 'envelope':
      return (
        rect(-115, -70, 230, 146, cream, 9, `stroke="${ink}" stroke-width="5"`) +
        path('M-111 -63L0 24L111 -63', s, ink, 4) +
        line('M-113 72L-44 8M113 72L44 8', ink, 3) +
        place(heart(a, ink), 0, 19, 0.42) +
        place(sparkle(a), 130, -66, 0.32)
      );
    case 'lace':
      return (
        Array.from({ length: 20 }, (_, i) =>
          place(circle(0, -76, 20, cream, a, 2) + circle(0, -80, 7, 'none', a, 2), 0, 0, 1, i * 18),
        ).join('') +
        circle(0, 0, 73, cream, a, 3) +
        circle(0, 0, 58, 'none', a, 2) +
        place(bow(a, ink), 0, 0, 0.52)
      );
    case 'basket':
      return (
        path('M-82 -16Q-79 -111 0 -106Q79 -111 82 -16', 'none', ink, 11) +
        path('M-93 -19H93L75 83H-75Z', a, ink, 5) +
        [-51, -17, 17, 51].map((x) => line(`M${x} -10V73`, cream, 4)).join('') +
        [-1, 26, 52].map((y) => line(`M-78 ${y}H78`, cream, 4)).join('') +
        place(daisy(cream, s, ink), -72, -26, 0.55) +
        place(leaf(green, ink), 56, -41, 0.49, 70) +
        place(bow(s, ink), 0, 3, 0.41)
      );
    case 'bear':
      return (
        circle(-62, -54, 35, a, ink, 4) +
        circle(62, -54, 35, a, ink, 4) +
        circle(-62, -54, 21, cream) +
        circle(62, -54, 21, cream) +
        `<ellipse cy="9" rx="80" ry="75" fill="${a}" stroke="${ink}" stroke-width="5"/>` +
        `<ellipse cy="29" rx="36" ry="27" fill="${cream}"/>` +
        face(ink) +
        circle(0, 15, 8, ink) +
        place(bow(s, ink), 0, 92, 0.43)
      );
    case 'coffee':
      return (
        path('M62 -43Q135 -60 128 14Q124 52 66 36', 'none', ink, 13) +
        path('M-78 -46H77L60 74H-61Z', cream, ink, 5) +
        `<ellipse cy="-44" rx="77" ry="21" fill="${a}" stroke="${ink}" stroke-width="4"/>` +
        place(heart(s, ink), 0, -43, 0.28) +
        line('M-31 -85q-27 -20 0 -40M12 -85q-27 -20 0 -40', ink, 4) +
        `<ellipse cy="87" rx="113" ry="13" fill="${s}" stroke="${ink}" stroke-width="3"/>`
      );
    case 'cake':
      return (
        rect(-79, -10, 158, 82, a, 9, `stroke="${ink}" stroke-width="4"`) +
        path(
          'M-78 -8Q-64 29 -48 -3Q-32 30 -16 -3Q0 30 16 -3Q32 30 48 -3Q65 26 78 -8V-33H-78Z',
          cream,
          ink,
          4,
        ) +
        [-40, 0, 40]
          .map(
            (x) =>
              rect(x - 5, -77, 10, 44, s, 2) +
              place(path('M0 -12Q-18 10 0 15Q17 8 0 -12Z', '#edb154'), x, -96),
          )
          .join('') +
        line('M-107 85H107', ink, 5) +
        circle(-39, 46, 6, cream) +
        circle(9, 23, 6, cream) +
        circle(49, 51, 6, cream)
      );
    case 'graduate':
      return (
        path('M-68 -4V45Q0 88 68 45V-4', ink, a, 4) +
        path('M-120 -34L0 -89L120 -34L0 22Z', ink, a, 5) +
        line('M95 -26V65', a, 5) +
        rect(85, 62, 20, 43, a, 5) +
        circle(0, -36, 10, a) +
        place(leaf(green, cream), -96, 86, 0.4, -90) +
        place(leaf(green, cream), 96, 86, 0.4, 12)
      );
    case 'rings':
      return (
        circle(-30, 16, 57, 'none', a, 17) +
        circle(38, 13, 57, 'none', a, 17) +
        circle(-30, 16, 55, 'none', cream, 3) +
        path('M14 -56L37 -88L63 -58L38 -38Z', cream, ink, 4) +
        place(leaf(green, ink), -80, 65, 0.5, -29) +
        place(rose(p.secondary, ink), 80, 76, 0.51)
      );
    case 'headphones':
      return (
        path('M-75 15V-10Q-75 -110 0 -110Q75 -110 75 -10V15', 'none', a, 25) +
        path('M-75 15V-10Q-75 -110 0 -110Q75 -110 75 -10V15', 'none', ink, 3) +
        rect(-100, -9, 45, 86, s, 16, `stroke="${ink}" stroke-width="4"`) +
        rect(55, -9, 45, 86, s, 16, `stroke="${ink}" stroke-width="4"`) +
        place(heart(a, cream), 0, 25, 0.48) +
        place(sparkle(cream, ink), 113, -70, 0.34)
      );
    case 'pumpkin':
      return (
        rect(-12, -91, 24, 38, green, 6) +
        [-45, 0, 45]
          .map(
            (x) =>
              `<ellipse cx="${x}" cy="3" rx="51" ry="77" fill="${a}" stroke="${ink}" stroke-width="4"/>`,
          )
          .join('') +
        path('M-48 -27L-18 -27L-29 -4ZM48 -27L18 -27L29 -4Z', ink) +
        path('M-50 24L-25 41L-12 25L4 41L21 25L48 24Q0 80 -50 24Z', ink) +
        place(sparkle(cream, ink), 100, -77, 0.32)
      );
    case 'gift':
      return (
        rect(-81, -37, 162, 120, a, 7, `stroke="${ink}" stroke-width="4"`) +
        rect(-90, -47, 180, 32, s, 5, `stroke="${ink}" stroke-width="4"`) +
        rect(-14, -39, 28, 120, s) +
        place(bow(s, ink), 0, -55, 0.6) +
        place(sparkle(cream, ink), 106, 20, 0.38)
      );
    case 'tulip':
      return (
        line('M0 18V107', green, 10) +
        place(leaf(green, ink), -33, 65, 0.53, -75) +
        place(leaf(p.secondary, ink), 33, 50, 0.41, 3) +
        path('M-71 -74L-38 -45L0 -87L38 -45L71 -74V-18Q69 48 0 45Q-69 48 -71 -18Z', a, ink, 4) +
        line('M-37 -38Q-31 15 -12 27M36 -40Q30 8 15 29', cream, 4)
      );
    case 'smiley':
      return (
        circle(0, 0, 83, a, ink, 5) +
        face(ink) +
        place(sparkle(s, ink), 96, -67, 0.4) +
        line('M-103 -68l-20 -20M109 66l25 22', ink, 6)
      );
    default:
      throw new Error(`Unimplemented motif: ${kind}`);
  }
}

function companion(kind, p) {
  const ink = p.ink,
    a = p.accent,
    s = p.secondary,
    cream = '#fffaf1';
  switch (kind) {
    case 'pixel':
      return (
        rect(-103, -58, 206, 116, cream, 23, `stroke="${ink}" stroke-width="5"`) +
        path('M-74 -17H-51V-40H-28V-17H-5V6H-28V29H-51V6H-74Z', s, ink, 3) +
        circle(50, -15, 15, a, ink, 3) +
        circle(77, 15, 15, s, ink, 3) +
        rect(-9, 39, 22, 5, ink, 2) +
        rect(21, 39, 22, 5, ink, 2) +
        line('M-30 -80h14v-14h14M86 60h16v16h16', a, 7)
      );
    case 'bow':
      return (
        path('M-70 -68Q-8 -22 62 -59L38 92L-1 67L-38 94L-44 -20Z', s, ink, 3) +
        line('M-37 -13Q-11 29 -20 73M15 -18Q4 20 14 62', cream, 5) +
        place(bow(a, ink), -2, -34, 0.65) +
        [-65, -42, -18, 6, 30, 54]
          .map((x, i) => circle(x, 114 - Math.abs(i - 2.5) * 6, 6, cream, a, 2))
          .join('')
      );
    case 'flower':
      return (
        line('M-73 85Q-22 21 62 -54M-15 42L-3 -55M23 8L87 7', '#7d946d', 6) +
        place(rose(a, ink), 59, -54, 0.5) +
        place(daisy(cream, a, ink), -4, -58, 0.45) +
        place(leaf(s, ink), -43, 32, 0.48, -35) +
        place(leaf(s, ink), 48, 19, 0.4, 75)
      );
    case 'cherry':
      return (
        rect(-75, -70, 150, 153, cream, 9, `stroke="${ink}" stroke-width="4"`) +
        rect(-75, -70, 150, 27, s, 3) +
        line('M-72 -44H72', ink, 3) +
        place(motif('cherry', p), 0, 2, 0.56) +
        `<text y="68" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="${ink}">SWEET PICK</text>`
      );
    case 'daisy':
      return (
        rect(-104, -66, 208, 132, s, 12, `stroke="${ink}" stroke-width="4"`) +
        rect(
          -93,
          -55,
          186,
          110,
          'none',
          6,
          `stroke="${cream}" stroke-width="3" stroke-dasharray="8 5"`,
        ) +
        [-40, -20, 0, 20, 40].map((y) => line(`M-85 ${y}H83`, ink, 1, 'opacity=".17"')).join('') +
        place(daisy(cream, '#e3b85d', ink), -27, -5, 0.58) +
        circle(56, 20, 24, cream, ink, 3) +
        [-7, 7].flatMap((x) => [-7, 7].map((y) => circle(56 + x, 20 + y, 2.5, ink))).join('')
      );
    case 'sparkle':
      return (
        `<ellipse rx="93" ry="43" fill="none" stroke="${a}" stroke-width="5" transform="rotate(-25)"/>` +
        circle(0, 0, 42, s, ink, 3) +
        line('M-21 -10Q-6 -29 14 -26', cream, 5) +
        place(sparkle(cream, ink), -89, 32, 0.36) +
        place(sparkle(a, ink), 85, -30, 0.32)
      );
    case 'film':
      return (
        rect(-76, -71, 113, 141, s, 13, `stroke="${ink}" stroke-width="4"`) +
        rect(-71, -81, 103, 28, a, 5) +
        rect(-64, -40, 88, 73, cream, 2) +
        `<text x="-20" y="-2" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#45392d">35 mm</text>` +
        path('M37 -51H103V77H41V56H81V-30H37Z', '#302a28', a, 3) +
        [-18, 12, 42].map((y) => rect(86, y, 10, 15, cream, 1)).join('')
      );
    case 'orange':
      return (
        path('M-63 -66H63L47 82H-47Z', cream, ink, 4) +
        path('M-50 -14H51L40 69H-40Z', a, ink, 2) +
        line('M17 -88L4 54', s, 10) +
        place(motif('orange', p), -58, -64, 0.45) +
        circle(0, 27, 14, cream, a, 3)
      );
    case 'shell':
      return (
        path('M0 -87L26 -27L89 -25L39 17L59 81L0 47L-59 81L-39 17L-89 -25L-26 -27Z', s, ink, 4) +
        [
          [0, -44],
          [41, -11],
          [26, 39],
          [-26, 39],
          [-41, -11],
        ]
          .map(([x, y]) => circle(x, y, 5, cream))
          .join('') +
        circle(100, 64, 12, cream, a, 2) +
        circle(-97, 51, 7, cream, a, 2)
      );
    case 'leaf':
      return (
        path('M-103 -51H74L105 -22V65H-103Z', cream, ink, 3) +
        circle(76, -24, 5, a, ink, 2) +
        line('M82 -27Q132 -92 109 -94', ink, 3) +
        place(leaf(s, ink), -52, 0, 0.48, -25) +
        `<text x="0" y="-6" font-family="Georgia,serif" font-size="17" fill="${ink}">BOT. 03</text>` +
        line('M0 11H74M0 27H56M-78 48H71', a, 2)
      );
    case 'butterfly':
      return (
        line('M-104 60Q-84 -75 -9 1Q41 72 94 -56', a, 4, 'stroke-dasharray="6 8"') +
        place(motif('butterfly', p), -47, -34, 0.43, -23) +
        place(motif('butterfly', { ...p, accent: s }), 76, 43, 0.32, 18) +
        path('M-26 64Q-56 104 -35 111Q-9 115 15 64Q39 13 13 8Q-8 6 -21 46', 'none', ink, 4)
      );
    case 'record':
      return (
        line('M-56 29V-58L52 -78V8M-56 -41L52 -61', ink, 10) +
        `<ellipse cx="-77" cy="36" rx="28" ry="19" fill="${a}" transform="rotate(-22 -77 36)"/><ellipse cx="31" cy="16" rx="28" ry="19" fill="${s}" transform="rotate(-22 31 16)"/>` +
        place(sparkle(cream, ink), 87, 77, 0.34)
      );
    case 'disco':
      return (
        `<ellipse rx="98" ry="31" fill="none" stroke="${a}" stroke-width="5" transform="rotate(-27)"/>` +
        circle(0, 0, 57, s, cream, 4) +
        line('M-33 -26Q-6 -52 28 -30', cream, 4) +
        place(sparkle(cream), -84, 41, 0.38) +
        place(sparkle(a), 84, -64, 0.3) +
        circle(94, 38, 6, cream)
      );
    case 'envelope':
      return (
        rect(
          -75,
          -78,
          150,
          156,
          cream,
          3,
          `stroke="${a}" stroke-width="9" stroke-dasharray="8 8"`,
        ) +
        rect(-58, -61, 116, 120, s, 3) +
        place(heart(a, ink), 0, -4, 0.48) +
        `<text y="49" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="${ink}">LOVE MAIL</text>` +
        [0, 14, 28].map((y) => line(`M52 ${y}Q82 ${y - 13} 111 ${y}`, ink, 2)).join('')
      );
    case 'lace':
      return (
        Array.from({ length: 12 }, (_, i) =>
          place(
            `<ellipse cy="-55" rx="13" ry="26" fill="${cream}" stroke="${a}" stroke-width="2"/>`,
            0,
            0,
            1,
            i * 30,
          ),
        ).join('') +
        circle(0, 0, 36, s, a, 3) +
        place(rose(cream, ink), 0, 0, 0.34) +
        path('M-17 63L-38 121L-2 107L21 126L31 62', cream, a, 2)
      );
    case 'basket':
      return (
        path('M-74 -25Q-62 -74 0 -66Q62 -74 74 -25Q60 67 0 90Q-60 67 -74 -25Z', a, ink, 4) +
        path(
          'M0 -67L-30 -97L-32 -62L-74 -69L-51 -33L-14 -43L0 -21L16 -43L52 -32L75 -69L33 -62L30 -97Z',
          s,
          ink,
          3,
        ) +
        [
          [-30, 0],
          [29, 4],
          [0, 31],
          [-21, 48],
          [21, 58],
        ]
          .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="6" fill="${cream}"/>`)
          .join('')
      );
    case 'bear':
      return (
        rect(-86, -66, 172, 132, cream, 18, `stroke="${ink}" stroke-width="4"`) +
        rect(
          -73,
          -53,
          146,
          106,
          'none',
          10,
          `stroke="${a}" stroke-width="3" stroke-dasharray="7 6"`,
        ) +
        place(heart(s, ink), 0, 4, 0.58) +
        line('M-112 -54L-96 -38M97 50L113 66', a, 4)
      );
    case 'coffee':
      return (
        path(
          'M-77 -91H77V78L61 69L45 84L29 72L13 86L-4 71L-22 84L-39 72L-58 84L-77 75Z',
          cream,
          ink,
          3,
        ) +
        `<text y="-54" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="${ink}">COFFEE FOR TWO</text>` +
        line('M-59 -34H59M-59 -5H21M-59 16H42M-59 37H-8', a, 3) +
        `<ellipse cx="69" cy="60" rx="18" ry="27" fill="${a}" stroke="${ink}" stroke-width="3" transform="rotate(30 69 60)"/>` +
        line('M61 43Q78 59 75 77', cream, 3)
      );
    case 'cake':
      return (
        `<ellipse cy="-27" rx="59" ry="71" fill="${s}" stroke="${ink}" stroke-width="4"/>` +
        path('M0 44L-10 59H10Z', a, ink, 3) +
        line('M0 59Q-30 82 0 99T0 131', ink, 3) +
        line('M-35 -49Q-24 -74 -5 -77', cream, 5) +
        place(heart(cream, a), 7, -22, 0.42)
      );
    case 'graduate':
      return (
        rect(-88, -47, 176, 94, cream, 8, `stroke="${ink}" stroke-width="4"`) +
        `<ellipse cx="-82" rx="13" ry="47" fill="${s}" stroke="${ink}" stroke-width="3"/>` +
        rect(-16, -49, 32, 98, a, 3) +
        place(bow(a, ink), 1, 3, 0.43) +
        line('M-61 -24H-30M35 21H68', ink, 2)
      );
    case 'rings':
      return (
        line('M-91 53Q0 -102 91 53', a, 4) +
        [-65, -35, 0, 35, 65]
          .map((x, i) => place(leaf(s, ink), x, Math.abs(x) * 0.7 - 40, 0.3, i * 24 - 50))
          .join('') +
        place(rose(cream, a), -54, 31, 0.36) +
        place(rose(cream, a), 54, 31, 0.36) +
        place(bow(a, ink), 0, 59, 0.45)
      );
    case 'headphones':
      return (
        path(
          'M-111 -59H111V-23Q87 -23 87 0Q87 23 111 23V59H-111V23Q-87 23 -87 0Q-87 -23 -111 -23Z',
          cream,
          ink,
          3,
        ) +
        line('M49 -47V47', a, 3, 'stroke-dasharray="5 5"') +
        `<text x="-25" y="-8" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="${ink}">OUR ERA</text>` +
        `<text x="-25" y="20" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="${ink}">ALL ACCESS</text>` +
        place(sparkle(a, ink), 77, 0, 0.24)
      );
    case 'pumpkin':
      return (
        path('M15 -92Q-103 -75 -78 41Q-53 113 32 72Q-21 69 -36 10Q-52 -54 15 -92Z', s, ink, 4) +
        path(
          'M-13 19Q-50 -7 -77 27L-59 56L-23 48L0 71L23 48L59 56L77 27Q50 -7 13 19L9 -3L0 5L-9 -3Z',
          a,
          ink,
          3,
        ) +
        circle(-5, 30, 3, cream) +
        circle(5, 30, 3, cream)
      );
    case 'gift':
      return (
        line('M-91 76L76 -68', ink, 5) +
        place(leaf(s, ink), -46, 27, 0.6, -21) +
        place(leaf(s, ink), 44, -17, 0.5, 110) +
        [0, 22, -12].map((x, i) => circle(x, 17 + i * 16, 18, a, ink, 3)).join('') +
        place(sparkle(cream, a), 97, 45, 0.34)
      );
    case 'tulip':
      return (
        path('M-93 27Q-96 -78 -7 -75Q101 -69 98 32Q85 101 14 72Q-37 123 -93 27Z', cream, ink, 4) +
        [
          [-55, -20, a],
          [-8, -43, s],
          [44, -23, '#d7aa77'],
          [51, 34, '#8eab80'],
        ]
          .map(([x, y, c]) => circle(x, y, 19, c))
          .join('') +
        circle(-31, 46, 16, p.background, ink, 3) +
        line('M-15 98L76 -90', a, 12) +
        path('M68 -80L95 -117L88 -70Z', s, ink, 2)
      );
    case 'smiley':
      return (
        place(
          rect(-100, -59, 200, 118, cream, 16, `stroke="${ink}" stroke-width="4"`),
          0,
          0,
          1,
          -7,
        ) +
        circle(-48, 0, 34, a, ink, 3) +
        place(face(ink), -48, 0, 0.48) +
        `<text x="1" y="-5" font-family="Georgia,serif" font-size="19" fill="${ink}">GOOD</text><text x="1" y="21" font-family="Georgia,serif" font-size="19" fill="${ink}">DAYS</text>`
      );
    default:
      throw new Error(`Unimplemented companion motif: ${kind}`);
  }
}

function paper(f) {
  const { palette: p, designWidth: w, designHeight: h } = f;
  const { edition: e, motif: m } = f.artwork;
  let b = `<defs><linearGradient id="paper-wash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.background}"/><stop offset=".6" stop-color="${p.background}"/><stop offset="1" stop-color="${p.secondary}"/></linearGradient><pattern id="paper-grain" width="29" height="23" patternUnits="userSpaceOnUse">${circle(3, 6, 0.9, p.ink)}${line('M12 19h4', p.ink, 0.7)}</pattern></defs>${rect(0, 0, w, h, 'url(#paper-wash)')}${rect(0, 0, w, h, 'url(#paper-grain)', 0, 'opacity=".075"')}`;
  const pitch = w / 10;
  if (m === 'film') {
    for (let y = 70; y < h; y += 132)
      b += rect(16, y, 32, 67, p.ink, 6) + rect(w - 48, y, 32, 67, p.ink, 6);
  } else if (['cherry', 'basket', 'smiley'].includes(m) || e === 2) {
    b += `<defs><pattern id="checks" width="${pitch * 2}" height="${pitch * 2}" patternUnits="userSpaceOnUse">${rect(0, 0, pitch, pitch, p.accent)}${rect(pitch, pitch, pitch, pitch, p.accent)}</pattern></defs>${rect(0, 0, w, h, 'url(#checks)', 0, 'opacity=".11"')}`;
  } else if (['daisy', 'bear'].includes(m)) {
    for (let x = 0; x < w; x += pitch / 2)
      b += line(`M${x} 0V${h}`, p.accent, 1.5, 'opacity=".18"');
    for (let y = 0; y < h; y += pitch / 2) b += line(`M0 ${y}H${w}`, p.ink, 1, 'opacity=".10"');
    b += rect(
      22,
      22,
      w - 44,
      h - 44,
      'none',
      14,
      `stroke="${p.ink}" stroke-width="3" stroke-dasharray="16 13" opacity=".5"`,
    );
  } else if (e === 4 || ['bow', 'lace', 'rings'].includes(m)) {
    for (let x = 0; x < w; x += pitch)
      b += rect(x, 0, pitch * 0.35, h, p.accent, 0, 'opacity=".10"');
  } else if (e === 1 || ['leaf', 'envelope', 'coffee', 'shell', 'butterfly'].includes(m)) {
    for (let y = 125; y < h; y += 86) b += line(`M32 ${y}H${w - 32}`, p.ink, 1.5, 'opacity=".13"');
    b += line(`M${w * 0.095} 0V${h}`, p.accent, 3, 'opacity=".20"');
  } else {
    b += `<defs><pattern id="polka" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse">${circle(pitch / 2, pitch / 2, 5, p.accent)}</pattern></defs>${rect(0, 0, w, h, 'url(#polka)', 0, 'opacity=".3"')}`;
  }
  if (e === 3 || e === 8)
    b += path(`M0 ${h * 0.55}L${w} ${h * 0.45}V${h}H0Z`, p.secondary, 'none', 0, 'opacity=".3"');
  if (m === 'shell')
    for (let i = 0; i < 4; i++)
      b += line(
        `M-20 ${h - 90 - i * 27}Q${w / 4} ${h - 160 - i * 27} ${w / 2} ${h - 90 - i * 27}T${w + 20} ${h - 90 - i * 27}`,
        p.accent,
        6,
        'opacity=".5"',
      );
  return b;
}

export function collectionArt(f) {
  const {
    designWidth: w,
    designHeight: h,
    palette: p,
    artwork: { edition: e, motif: m },
  } = f;
  const main = motif(m, p),
    secondary = companion(m, p),
    scale = w / 1200;
  let fg = '';
  // Elegant scallop borders and side pearls are individually drawn.
  if (['bow', 'lace', 'rings', 'flower'].includes(m)) {
    for (let y = 54; y < h - 40; y += 60 * scale) {
      fg +=
        circle(19 * scale, y, 11 * scale, '#fff9ee', p.accent, 2) +
        circle(w - 19 * scale, y, 11 * scale, '#fff9ee', p.accent, 2);
    }
    for (let x = 55 * scale; x < w - 40 * scale; x += 55 * scale) {
      fg +=
        circle(x, 12 * scale, 20 * scale, '#fff9ee', p.accent, 2) +
        circle(x, h - 12 * scale, 20 * scale, '#fff9ee', p.accent, 2);
    }
  }
  const headerY = h * 0.101;
  fg += place(main, w * 0.5, headerY, 1.28 * scale, e % 2 ? -7 : 0);
  fg += place(
    m === 'bow'
      ? heart(p.secondary, p.ink)
      : ['leaf', 'rings', 'flower', 'tulip'].includes(m)
        ? leaf(p.secondary, p.ink)
        : secondary,
    w * 0.19,
    headerY,
    0.51 * scale,
    -24,
  );
  fg += place(
    m === 'bow'
      ? heart(p.secondary, p.ink)
      : ['leaf', 'rings', 'flower', 'tulip'].includes(m)
        ? leaf(p.secondary, p.ink)
        : secondary,
    w * 0.81,
    headerY,
    0.51 * scale,
    24,
  );
  if (e === 3 || e === 7)
    fg += line(
      `M${w * 0.13} ${headerY + h * 0.016}Q${w * 0.5} ${headerY + h * 0.06} ${w * 0.87} ${headerY + h * 0.016}`,
      p.accent,
      4 * scale,
      'stroke-dasharray="9 10"',
    );
  const rows = [...new Set(f.slots.map((s) => s.y))].sort((a, b) => a - b);
  for (let i = 0; i < rows.length - 1; i++) {
    const rowEnd = Math.max(...f.slots.filter((s) => s.y === rows[i]).map((s) => s.y + s.h));
    const mid = (rowEnd + rows[i + 1]) / 2;
    const available = (rows[i + 1] - rowEnd) * h;
    const motifScale = Math.min(0.56 * scale, available / 175);
    fg += place(main, w * (i % 2 ? 0.74 : 0.25), mid * h, motifScale, (i % 2 ? 1 : -1) * (12 + e));
    fg += place(
      m === 'bow'
        ? bow(p.secondary, p.ink)
        : ['flower', 'daisy', 'tulip', 'rings'].includes(m)
          ? daisy('#fff9ef', p.accent, p.ink)
          : secondary,
      w * (i % 2 ? 0.25 : 0.74),
      mid * h,
      motifScale * 0.72,
      -11,
    );
    fg += line(
      `M${w * 0.4} ${mid * h}Q${w * 0.5} ${mid * h + 10} ${w * 0.59} ${mid * h - 4}`,
      p.accent,
      4 * scale,
      'stroke-dasharray="6 9"',
    );
  }
  // Collage tape and patch corners peek over the matte, masked away from photos.
  for (const [i, s] of f.slots.entries()) {
    const x = (i % 2 ? s.x + s.w : s.x) * w,
      y = (s.y + (e % 3 === 0 ? 0 : s.h)) * h;
    if (
      ['film', 'envelope', 'coffee', 'butterfly', 'daisy', 'shell'].includes(m) ||
      e === 10 ||
      e === 1
    ) {
      fg += place(
        rect(
          -79,
          -22,
          158,
          44,
          p.secondary,
          2,
          `stroke="${p.ink}" stroke-width="2" opacity=".86"`,
        ) + line('M-70 -7H65M-58 8H55', p.ink, 2, 'opacity=".18"'),
        x + (i % 2 ? -15 : 15),
        y,
        scale,
        i % 2 ? 17 : -15,
      );
    } else fg += place(main, x, y, 0.5 * scale, i % 2 ? 18 : -17);
    fg += place(secondary, (i % 2 ? s.x : s.x + s.w) * w, (s.y + s.h * 0.72) * h, 0.23 * scale, 6);
  }
  const words = {
    flower: 'pressed with love',
    bow: 'a little love story',
    cherry: 'sweet days with you',
    daisy: 'bloom in blue',
    sparkle: 'you are the moment',
    film: 'memories on film',
    orange: 'a slice of happiness',
    shell: 'wish you were here',
    leaf: 'collect little moments',
    butterfly: 'let the good days fly',
    record: 'our favorite track',
    pixel: 'player one + player two',
    disco: 'dance in the starlight',
    envelope: 'sealed with a smile',
    lace: 'a moment to treasure',
    basket: 'meet me in the sunshine',
    bear: 'our cozy little world',
    coffee: 'one more coffee together',
    cake: 'make a lovely wish',
    graduate: 'here is to what is next',
    rings: 'forever starts with us',
    headphones: 'our favorite era',
    pumpkin: 'a little spooky, very cute',
    gift: 'wrapped in happy moments',
    tulip: 'grow memories here',
    smiley: 'good mood, great company',
  };
  fg += place(
    badge(words[m], p, ['envelope', 'film', 'leaf', 'shell'].includes(m) ? 'stamp' : 'pill'),
    w * 0.5,
    h * 0.898,
    scale * 0.95,
    e === 1 ? -2 : 0,
  );
  fg +=
    place(secondary, w * 0.085, h * 0.945, 0.42 * scale, -12) +
    place(
      m === 'bow' ? bow(p.secondary, p.ink) : secondary,
      w * 0.915,
      h * 0.945,
      0.42 * scale,
      12,
    );
  const bg =
    paper(f) +
    rect(w * 0.15, h * 0.914, w * 0.7, h * 0.052, '#fff9ef', 14 * scale, 'opacity=".95"');
  // The glazes and soft shadow give flowers, ribbons and stickers visible depth.
  const gradients = `<defs><linearGradient id="motif-glaze" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff2e5"/><stop offset=".32" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.ink}" stop-opacity=".62"/></linearGradient><linearGradient id="secondary-glaze" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9ef"/><stop offset=".45" stop-color="${p.secondary}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient><filter id="sticker-shadow" x="-.12" y="-.12" width="1.24" height="1.24"><feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="${p.ink}" flood-opacity=".19"/></filter></defs>`;
  const shaded = fg
    .replaceAll(`fill="${p.accent}"`, 'fill="url(#motif-glaze)"')
    .replaceAll(`fill="${p.secondary}"`, 'fill="url(#secondary-glaze)"');
  return {
    background: bg,
    foreground: gradients + `<g filter="url(#sticker-shadow)">${shaded}</g>`,
  };
}
