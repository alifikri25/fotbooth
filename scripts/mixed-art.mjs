// Original vector illustrations for Mixed Moments; every theme has its own drawn objects.
const rect = (x, y, w, h, fill, r = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = '') =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, ink, width = 4, extra = '') =>
  path(
    d,
    'none',
    `stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}`,
  );
const place = (body, x, y, size = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${size})">${body}</g>`;
const petal = (color, size = 34) =>
  path(`M0 0Q${-size} ${-size * 1.3} 0 ${-size * 1.8}Q${size} ${-size * 1.3} 0 0Z`, color);
const leaf = (color, ink) =>
  path('M-42 24Q-50 -30 43 -38Q51 21 -42 24Z', color) + line('M-40 22L34 -29', ink, 2);
function blossom(color, center = '#f8df8c', count = 5) {
  let out = '';
  for (let i = 0; i < count; i++) out += place(petal(color), 0, 0, 1, (i * 360) / count);
  return out + circle(0, 0, 12, center) + circle(-3, -3, 3, '#fff5db');
}
const twinkle = (color) => path('M0 -30Q5 -5 30 0Q5 5 0 30Q-5 5 -30 0Q-5 -5 0 -30Z', color);
function book(a, b, ink, angle = 0) {
  return place(
    rect(-42, -66, 84, 132, a, 5, `stroke="${ink}" stroke-width="4"`) +
      rect(-32, -60, 10, 121, b, 2) +
      line('M-12 -42H28M-12 39H28M-12 48H19', ink, 3) +
      rect(-10, -18, 38, 42, b, 3) +
      place(twinkle(a), 9, 3, 0.4),
    0,
    0,
    1,
    angle,
  );
}
function mountain(ink, a, snow = '#fff8ed') {
  return (
    path('M-115 75L-30 -91L21 -12L66 -68L139 75Z', a, `stroke="${ink}" stroke-width="4"`) +
    path(
      'M-61 -30L-30 -91L7 -32L-15 -42L-30 -20L-43 -43Z M43 -31L66 -68L90 -21L67 -30L58 -15Z',
      snow,
    )
  );
}
function twig(ink, a, count = 5) {
  let out = line('M0 98Q-15 8 5 -93', ink, 4);
  for (let i = 0; i < count; i++)
    out += place(leaf(a, ink), (i % 2 ? 1 : -1) * 15, 68 - i * 34, 0.57, i % 2 ? 25 : 175);
  return out;
}
function wheels(ink, paper, distance = 120, y = 45, r = 28) {
  return [-distance / 2, distance / 2]
    .map((x) => circle(x, y, r, paper, `stroke="${ink}" stroke-width="7"`) + circle(x, y, 5, ink))
    .join('');
}
function heart(a) {
  return path('M0 65C-160 -35 -37 -129 0 -45C37 -129 160 -35 0 65Z', a);
}

// The large motifs use a common hand-inked scale but distinct silhouettes and internal detail.
function illustration(id, p, alternate = false) {
  const ink = p.ink,
    a = p.accent,
    b = p.secondary,
    paper = '#fff9e9',
    green = '#537b5d';
  const edge = `stroke="${ink}" stroke-width="4" stroke-linejoin="round"`;
  switch (id) {
    case 'rainy-window':
      if (alternate)
        return (
          rect(-74, -100, 148, 196, b, 42, edge) +
          rect(-61, -86, 122, 166, paper, 34) +
          line('M0 -83V81M-60 -3H60', ink, 7) +
          line('M-37 -52l-8 22M32 17l-9 23M33 -63l-4 13M-32 44l-5 14', a, 6)
        );
      return (
        path('M-115 0Q0 -156 115 0Q77 -26 38 0Q0 -26 -38 0Q-77 -26 -115 0Z', a, edge) +
        line('M0 -79V82Q0 120 32 103Q44 98 39 79M-38 0Q-34 -47 0 -79Q34 -47 38 0', ink, 5) +
        line('M-98 -90l-9 24M92 -112l-9 24M-137 -30l-5 17M128 29l-6 18', b, 7)
      );
    case 'sakura-station':
      if (alternate)
        return (
          place(blossom(a), -27, -20, 1.1) +
          place(blossom(b), 41, 36, 0.75) +
          line('M-83 90Q-4 3 69 -70', ink, 5)
        );
      return (
        rect(-101, -64, 202, 132, paper, 18, edge) +
        rect(-93, -54, 186, 34, a, 9) +
        rect(-84, -7, 68, 43, b, 8, edge) +
        rect(16, -7, 68, 43, b, 8, edge) +
        line('M-98 49H98M-63 79L-78 101M63 79L78 101M-95 94H95', ink, 5) +
        circle(-64, 58, 9, '#efc574') +
        circle(64, 58, 9, '#efc574') +
        place(blossom(a), 84, -63, 0.62)
      );
    case 'matcha-ceremony':
      if (alternate)
        return (
          place(leaf(green, ink), -25, -3, 1.2, -23) +
          place(leaf(b, ink), 24, 35, 0.8, 34) +
          line('M-70 77L60 -68', ink, 4)
        );
      return (
        ellipse(0, 80, 96, 16, b) +
        path('M-94 -18Q-93 88 0 89Q93 88 94 -18Z', paper, edge) +
        ellipse(0, -18, 94, 33, green, edge) +
        ellipse(0, -18, 76, 21, b) +
        line('M-52 -16Q-7 -39 39 -15M-32 -4Q11 -21 52 -6', paper, 3) +
        place(
          rect(-13, -137, 26, 75, '#ddbb73', 5, edge) +
            path(
              'M-13 -66Q-50 -5 -28 21M-7 -65Q-20 -9 -12 23M0 -65V25M7 -65Q20 -9 12 23M13 -66Q50 -5 28 21',
              'none',
              `stroke="${ink}" stroke-width="3"`,
            ),
          51,
          -18,
          1,
          20,
        )
      );
    case 'koi-pavilion':
      if (alternate)
        return (
          line(
            'M-108 3Q-50 -46 0 3T108 3M-108 26Q-50 -23 0 26T108 26M-108 49Q-50 0 0 49T108 49',
            b,
            8,
          ) + place(blossom(a), 37, -31, 0.65)
        );
      return (
        path('M-38 -86Q64 -48 53 42Q46 91 -2 97Q-48 67 -48 9Q-43 -24 -38 -86Z', paper, edge) +
        path('M-35 -63Q31 -68 43 -21Q-12 7 -44 -4Z M-43 20Q6 2 43 42L19 65Q-12 31 -41 58Z', a) +
        path(
          'M-36 -80L-84 -132L-33 -115L14 -145L-14 -79M-43 10L-88 27L-48 43M48 8L88 32L49 44',
          b,
          edge,
        ) +
        circle(-17, 73, 5, ink) +
        circle(13, 76, 5, ink) +
        line('M-9 91Q-15 112 -32 114M4 94Q18 116 31 111', ink, 2)
      );
    case 'crane-flight':
      if (alternate)
        return (
          circle(0, 0, 88, a) +
          line('M-103 40Q0 -4 103 40M-103 59Q0 15 103 59M-78 78Q0 45 78 78', paper, 5)
        );
      return (
        path(
          'M-12 29Q-55 -3 -124 -88Q-35 -69 10 -5Q39 -74 118 -107Q90 -8 30 32L69 66L14 49Z',
          paper,
          edge,
        ) +
        path(
          'M10 11Q16 -33 36 -54Q52 -71 66 -54L70 -32L104 -20L69 -17Q43 -42 38 -5L30 32Z',
          paper,
          edge,
        ) +
        circle(61, -47, 9, a) +
        circle(65, -42, 3, ink) +
        line('M-92 -66L-17 17M91 -76L28 16M16 49L-6 101M26 49L39 104', ink, 3)
      );
    case 'capybara-onsen':
      if (alternate)
        return (
          circle(0, 0, 57, '#e9bd5d', edge) +
          place(leaf(green, ink), 28, -51, 0.55, 20) +
          line('M-58 78Q0 49 58 78M-80 96Q0 64 80 96', b, 5)
        );
      return (
        ellipse(0, 72, 120, 36, b, edge) +
        ellipse(0, 68, 102, 24, '#c7ded3') +
        ellipse(0, 12, 86, 74, '#c49b73', edge) +
        ellipse(-59, -40, 24, 28, '#c49b73', edge) +
        ellipse(53, -41, 24, 28, '#c49b73', edge) +
        ellipse(-4, 26, 65, 42, '#d6b18a') +
        line('M-53 3l17 -2M29 0l17 1M-12 23l13 5l10 -5', ink, 5) +
        circle(-8, -73, 25, '#e9bd5d', edge) +
        place(leaf(green, ink), 4, -94, 0.3) +
        line('M-94 -71q-14 -18 0 -35M91 -76q-14 -18 0 -35', paper, 7)
      );
    case 'panda-bamboo':
      if (alternate)
        return (
          rect(-12, -119, 24, 238, green, 4, edge) +
          line('M-12 -68H12M-12 9H12M-12 81H12', paper, 4) +
          place(leaf(b, ink), 38, -34, 0.8, -22) +
          place(leaf(green, ink), -39, 42, 0.7, 168)
        );
      return (
        circle(-57, -64, 34, ink) +
        circle(57, -64, 34, ink) +
        ellipse(0, 1, 91, 86, paper, edge) +
        place(ellipse(0, 0, 24, 34, ink), -37, -10, 1, 26) +
        place(ellipse(0, 0, 24, 34, ink), 37, -10, 1, -26) +
        circle(-34, -18, 7, paper) +
        circle(34, -18, 7, paper) +
        ellipse(0, 22, 14, 10, ink) +
        line('M0 31Q-8 50 -22 40M0 31Q8 50 22 40', ink, 4) +
        place(twig(ink, green, 4), 90, 23, 0.6, 20)
      );
    case 'alpine-cabin':
      if (alternate) return mountain(ink, b) + place(twinkle(a), 80, -91, 0.55);
      return (
        mountain(ink, b) +
        rect(-63, -21, 130, 126, '#ba7650', 3, edge) +
        path('M-92 -14L0 -105L95 -14Z', paper, edge) +
        path('M-81 -16L0 -88L81 -16Z', a) +
        rect(-46, 10, 43, 46, '#efcf86', 3, edge) +
        rect(25, 30, 25, 75, ink, 2) +
        line('M-24 13V55M-44 32H-3M-62 78H20M-62 92H20', ink, 3) +
        rect(47, -91, 20, 43, ink, 2) +
        line('M57 -106q-16 -17 5 -30', paper, 8)
      );
    case 'aurora-camp':
      if (alternate)
        return (
          path('M-113 -21Q-67 -134 -17 -46T97 -86L116 -20Q45 98 -6 14T-99 66Z', b) +
          path(
            'M-105 20Q-57 -76 -10 -9T108 -44',
            'none',
            `stroke="${a}" stroke-width="17" opacity=".75"`,
          ) +
          place(twinkle(paper), -68, -82, 0.5)
        );
      return (
        path('M-112 96L0 -101L119 96Z', a, edge) +
        path('M0 -101L-8 96H80Z', b, edge) +
        path('M0 -44L-56 96H56Z', ink) +
        line('M-118 100H125M-130 99L-145 123M130 99L145 123', ink, 5) +
        circle(79, -66, 35, '#f4d88b') +
        circle(95, -80, 34, p.background || p.bg) +
        place(twinkle(paper), -80, -70, 0.55)
      );
    case 'mushroom-almanac':
      if (alternate)
        return (
          place(twig(ink, green), -16, 0, 0.9, -15) +
          circle(35, 47, 15, a, edge) +
          circle(55, 25, 10, a, edge)
        );
      return (
        path('M-27 -7L-39 100Q0 120 39 100L27 -7Z', paper, edge) +
        path('M-117 2Q-100 -121 1 -121Q101 -120 117 2Q0 47 -117 2Z', a, edge) +
        ellipse(0, 1, 110, 23, '#ead5b5', edge) +
        line(
          'M-96 3L-27 10M-72 16L-19 11M-43 20L-10 11M96 3L27 10M72 16L19 11M43 20L10 11',
          ink,
          2,
        ) +
        circle(-57, -57, 19, paper) +
        circle(13, -84, 22, paper) +
        circle(65, -33, 15, paper) +
        circle(-7, -30, 12, paper) +
        line('M-10 39L-15 84M12 43L14 91', '#c6ac87', 3)
      );
    case 'fairy-library':
      if (alternate)
        return (
          place(twinkle(a), -44, -28, 1.05) +
          place(twinkle(b), 42, 35, 0.7) +
          line('M-83 64Q31 -37 89 -73', ink, 3, 'stroke-dasharray="3 12"')
        );
      return (
        place(book(a, '#edcd86', ink), -62, 8, 0.95, -13) +
        place(book(b, paper, ink), 15, 1, 1.13, 7) +
        place(book('#d49b80', paper, ink), 81, 24, 0.8, 19) +
        place(twinkle('#edcd86'), 9, -107, 0.8) +
        path('M-99 86Q0 113 110 86L102 115Q0 137 -103 111Z', '#855d51', edge)
      );
    case 'potion-shelf':
      if (alternate)
        return (
          circle(-33, -25, 23, b, edge) +
          circle(22, -66, 15, a, edge) +
          circle(43, 25, 32, b, edge) +
          place(twinkle(paper), 44, 21, 0.5)
        );
      return (
        rect(-28, -111, 56, 24, '#bb9165', 5, edge) +
        path(
          'M-22 -85V-30Q-108 6 -83 79Q-63 112 0 112Q63 112 83 79Q108 6 22 -30V-85Z',
          paper,
          edge,
        ) +
        path('M-77 19Q0 36 77 19Q93 96 0 101Q-93 96 -77 19Z', b) +
        line('M-76 22Q0 45 76 22', a, 5) +
        place(twinkle(paper), -10, 56, 0.65) +
        circle(33, 66, 8, paper) +
        line('M-47 -4Q-66 12 -64 33', paper, 8) +
        circle(-1, -49, 7, a)
      );
    case 'enchanted-key':
      if (alternate)
        return (
          place(heart(a), 0, 12, 0.7) +
          place(twinkle(b), -78, -49, 0.6) +
          place(twinkle(b), 73, 40, 0.5)
        );
      return (
        circle(0, -59, 58, '#ddb75f', edge) +
        circle(0, -59, 34, paper, edge) +
        circle(0, -59, 13, b, edge) +
        path('M-13 -6H13V66H46V89H13V112H-13Z', '#ddb75f', edge) +
        line('M-4 8V91', '#fff0b5', 5) +
        place(leaf(a, ink), -66, -73, 0.72, 16) +
        place(leaf(a, ink), 66, -73, 0.72, 158) +
        circle(0, -119, 11, b, edge)
      );
    case 'dragonfly-marsh':
      if (alternate)
        return (
          line('M0 124Q-7 12 7 -99M-45 124Q-47 40 -39 -53', ink, 4) +
          rect(-4, -110, 21, 78, a, 11, edge) +
          rect(-51, -65, 21, 65, a, 11, edge) +
          place(leaf(green, ink), 37, 61, 0.9, -38)
        );
      return (
        place(ellipse(0, 0, 79, 24, paper, edge), -65, -21, 1, 26) +
        place(ellipse(0, 0, 79, 24, paper, edge), 65, -21, 1, -26) +
        place(ellipse(0, 0, 66, 20, b, edge), -57, 35, 1, -17) +
        place(ellipse(0, 0, 66, 20, b, edge), 57, 35, 1, 17) +
        line('M-117 -39L-14 -4M117 -39L14 -4M-109 49L-12 21M109 49L12 21', a, 2) +
        rect(-10, -38, 20, 137, a, 10, edge) +
        circle(0, -47, 19, ink) +
        circle(-9, -50, 9, b) +
        circle(9, -50, 9, b) +
        line('M-9 -70L-18 -83M9 -70L18 -83M-9 6H9M-9 27H9M-9 48H9M-8 69H8', ink, 3)
      );
    case 'honeycomb-studio':
      if (alternate)
        return [-1, 0, 1]
          .map((n) =>
            place(path('M0 -45L39 -22V23L0 45L-39 23V-22Z', n ? b : a, edge), n * 74, n ? 22 : -21),
          )
          .join('');
      return (
        ellipse(-31, -50, 27, 43, paper, edge) +
        ellipse(31, -50, 27, 43, paper, edge) +
        ellipse(0, 23, 69, 52, '#edbf62', edge) +
        path(
          'M-36 -20Q-18 21 -33 65L-7 74Q10 23 -2 -29Z M20 -27Q36 21 24 70L48 59Q66 14 46 -15Z',
          ink,
        ) +
        circle(-73, 7, 37, ink) +
        circle(-82, -2, 7, paper) +
        line('M-84 -24L-103 -45M-66 -26L-62 -51', ink, 4) +
        path('M65 7L91 25L67 40Z', ink)
      );
    case 'lavender-farm': {
      let out = '';
      for (let i = 0; i < 5; i++) {
        let sprig = line('M0 105V-75', green, 4);
        for (let j = 0; j < 7; j++)
          sprig += place(
            ellipse(0, 0, 10, 17, j % 2 ? a : b, edge),
            j % 2 ? 9 : -9,
            -68 + j * 17,
            1,
            j % 2 ? 35 : -35,
          );
        out += place(sprig, (i - 2) * 21, 0, 0.9, (i - 2) * 12);
      }
      return (
        out +
        line('M-45 65Q0 83 45 65M-44 77Q0 93 45 77', '#d5b47a', 11) +
        path('M-2 78L-49 123L-43 86L-72 92L-16 68M5 78L50 124L43 89L75 95L14 66', paper, edge)
      );
    }
    case 'firefly-meadow':
      if (alternate)
        return (
          line('M-91 98Q-40 -34 -88 -113M6 104Q33 -8 12 -85M80 103Q49 2 101 -54', green, 5) +
          place(blossom(paper), -64, -67, 0.5) +
          circle(22, -94, 13, '#e8d27b') +
          place(twinkle('#e8d27b'), -14, 12, 0.65)
        );
      return (
        rect(-53, -82, 106, 24, a, 6, edge) +
        rect(-65, -60, 130, 166, paper, 28, edge) +
        rect(-54, -46, 108, 138, b, 22, 'opacity=".58"') +
        line('M-46 -13V55M-35 -38H-20', paper, 7) +
        place(twinkle('#edcf66'), -15, 14, 0.7) +
        place(twinkle('#edcf66'), 30, 60, 0.4) +
        circle(-27, 61, 6, '#edcf66') +
        line('M-34 -84Q0 -124 34 -84', ink, 4) +
        line(
          'M-77 -103Q-108 -82 -91 -63M76 0Q112 -24 100 -53',
          '#edcf66',
          3,
          'stroke-dasharray="3 9"',
        )
      );
    case 'tulip-truck':
      if (alternate)
        return (
          line('M0 108V-18M0 55Q-67 59 -65 7M0 77Q59 70 63 18', green, 7) +
          path('M-52 -48L-30 -78L0 -48L29 -78L53 -48Q56 16 0 19Q-56 16 -52 -48Z', a, edge)
        );
      return (
        wheels(ink, paper, 145, 70, 27) +
        rect(-115, -14, 151, 77, a, 9, edge) +
        path('M36 -53H80L119 -4V64H36Z', b, edge) +
        path('M51 -39H75L103 -8H51Z', paper, edge) +
        line('M52 14H69M-104 12H23M-104 35H23', ink, 3) +
        [-82, -34, 7]
          .map((x, i) =>
            place(
              line('M0 20V-26', green, 5) +
                path(
                  'M-23 -42L-10 -55L0 -42L12 -55L25 -42Q22 -9 0 -9Q-22 -9 -23 -42Z',
                  i % 2 ? b : '#ef9c9d',
                  edge,
                ),
              x,
              -12,
            ),
          )
          .join('')
      );
    case 'quilt-cocoa':
      if (alternate)
        return [-1, 0, 1]
          .flatMap((x) =>
            [-1, 0, 1].map((y) =>
              rect(
                x * 53 - 25,
                y * 53 - 25,
                50,
                50,
                (x + y) % 2 ? a : b,
                2,
                `stroke="${ink}" stroke-width="2" stroke-dasharray="3 5"`,
              ),
            ),
          )
          .join('');
      return (
        ellipse(0, 93, 105, 20, b, edge) +
        path('M53 -43Q129 -55 112 20Q103 52 65 41L62 19Q93 22 93 -8Q93 -32 60 -24Z', a, edge) +
        path('M-72 -50H66L58 61Q-3 106 -64 61Z', a, edge) +
        ellipse(-3, -50, 69, 24, paper, edge) +
        ellipse(-3, -47, 55, 15, '#765044') +
        circle(-22, -51, 10, paper) +
        circle(4, -44, 9, paper) +
        circle(27, -52, 11, paper) +
        place(heart(paper), -8, 18, 0.24) +
        line('M-39 -89q-16 -17 0 -35M4 -88q-16 -17 0 -35M44 -91q-16 -17 0 -35', b, 6)
      );
    case 'yarn-social':
      if (alternate)
        return (
          line('M-79 110L65 -112M-49 118L92 -99', ink, 10) +
          circle(65, -112, 14, a, edge) +
          circle(92, -99, 14, b, edge)
        );
      return (
        circle(0, 0, 86, a, edge) +
        line(
          'M-75 -36Q-2 -95 66 -48M-84 -11Q-5 -76 80 -21M-84 16Q-9 -48 86 8M-74 42Q-11 -18 80 34M-54 67Q-7 17 65 58M-49 -68Q-31 31 46 72M-26 -81Q-4 21 67 53',
          paper,
          5,
        ) +
        line('M60 61Q146 83 101 116Q49 143 26 110Q8 90 -12 119', ink, 5) +
        line('M-101 -86L87 101', ink, 8) +
        circle(-101, -86, 12, b, edge)
      );
    case 'pottery-sunday':
      if (alternate)
        return (
          rect(-10, -109, 20, 183, '#b8835b', 6, edge) +
          path('M-10 57L-28 112Q0 133 28 112L10 57Z', b, edge) +
          line('M-16 92H17M-20 105H20', ink, 3)
        );
      return (
        ellipse(0, 110, 111, 18, '#c8ac84') +
        path(
          'M-42 -91H42L31 -42Q83 -12 90 49Q96 107 0 109Q-96 107 -90 49Q-83 -12 -31 -42Z',
          a,
          edge,
        ) +
        ellipse(0, -91, 42, 12, b, edge) +
        line(
          'M-78 11Q0 39 78 11M-87 35Q0 61 87 35M-86 63Q0 86 86 63M-69 85Q0 101 69 85',
          paper,
          4,
        ) +
        line('M-21 -69L-24 -45', paper, 5)
      );
    case 'glass-atelier':
      if (alternate)
        return (
          path('M0 -115L74 -40L0 105L-74 -40Z', b, edge) +
          line('M0 -115L-24 -39L0 105L26 -39L0 -115M-74 -40H74', paper, 4) +
          place(twinkle(a), 77, 67, 0.7)
        );
      return (
        path('M-43 -112H43L29 -33Q96 23 75 94Q0 126 -75 94Q-96 23 -29 -33Z', b, edge) +
        path(
          'M-42 -111Q-24 -18 -54 29Q-79 83 -48 104M-5 -108Q17 -29 -4 17Q-29 63 -5 115M29 -106Q47 -32 35 8Q16 62 49 103',
          'none',
          `stroke="${a}" stroke-width="15" opacity=".8"`,
        ) +
        ellipse(0, -111, 43, 12, paper, edge) +
        line('M-57 47Q-65 66 -58 82M-18 -80L-18 -52', paper, 7) +
        place(twinkle(paper), 26, 56, 0.6)
      );
    case 'mosaic-courtyard': {
      const points =
        '0,-112 31,-68 79,-79 69,-30 112,0 69,31 79,79 31,69 0,112 -31,69 -79,79 -69,31 -112,0 -69,-30 -79,-79 -31,-68';
      return (
        `<polygon points="${points}" fill="${a}" ${edge}/>` +
        place(rect(-57, -57, 114, 114, paper, 0, edge), 0, 0, 1, 45) +
        place(rect(-41, -41, 82, 82, b, 0, edge), 0, 0, 1, 45) +
        circle(0, 0, 22, a, edge) +
        [-1, 1].flatMap((x) => [-1, 1].map((y) => circle(x * 58, y * 58, 8, paper))).join('')
      );
    }
    case 'terrazzo-club':
      return (
        path('M-107 -71L-51 -94L-29 -38L-77 -17Z', a, edge) +
        path('M16 -111L80 -95L63 -31L23 -44Z', b, edge) +
        path('M-8 -22L42 -7L9 48L-31 31Z', paper, edge) +
        path('M77 4L113 27L91 83L53 64Z', '#c27f63', edge) +
        path('M-100 45L-46 31L-29 98L-90 112Z', b, edge) +
        path('M3 83L37 70L59 117L15 120Z', a, edge) +
        circle(-112, 2, 9, ink) +
        circle(110, -81, 7, ink) +
        circle(-12, -78, 7, ink) +
        circle(-10, 72, 6, ink)
      );
    case 'bauhaus-play':
      return (
        rect(-108, -105, 102, 102, a, 0, edge) +
        circle(51, -54, 51, b, edge) +
        path('M-108 112V56A51 51 0 0 1 -6 56V112H-35V56A22 22 0 0 0 -79 56V112Z', ink) +
        path('M9 109L111 -1V109Z', '#ddb65e', edge) +
        line('M-83 -80L-29 -26M-83 -26L-29 -80', paper, 7) +
        circle(50, -53, 19, paper) +
        line('M24 89H96M42 70H96M62 49H96', ink, 3)
      );
    case 'chess-society':
      if (alternate)
        return (
          [-1, 0, 1]
            .flatMap((x) =>
              [-1, 0, 1].map((y) =>
                rect(x * 61 - 30, y * 61 - 30, 61, 61, (x + y) % 2 ? a : paper),
              ),
            )
            .join('') + rect(-93, -93, 186, 186, 'none', 3, edge)
        );
      return (
        path(
          'M-70 85Q-73 14 -11 -22L-71 -11L-90 -35L-51 -90L-43 -125L-11 -106Q66 -114 74 -39Q80 8 34 62L43 85Z',
          a,
          edge,
        ) +
        rect(-78, 85, 148, 29, b, 6, edge) +
        path(
          'M-13 -104Q34 -64 26 -10Q24 20 -3 45L35 60',
          'none',
          `stroke="${ink}" stroke-width="5"`,
        ) +
        circle(-31, -66, 6, ink) +
        line('M-80 -31L-57 -34M-40 -105L-32 -82M47 -80L31 -68M59 -56L40 -47', ink, 3)
      );
    case 'origami-lab':
      if (alternate)
        return (
          path('M-115 -57L118 -99L-23 111L-37 9Z', a, edge) +
          path('M-37 9L118 -99L-14 37L-23 111L-45 51Z', b, edge) +
          line('M-37 9L-14 37', ink, 3)
        );
      return (
        path(
          'M-117 51L-34 -20L-59 -105L16 -22L116 -91L65 21L104 63L16 42L-28 110L-21 31Z',
          paper,
          edge,
        ) +
        path('M-34 -20L16 -22L65 21L16 42L-21 31Z', b, edge) +
        path('M-59 -105L16 -22L-21 31Z M116 -91L65 21L16 -22Z', a, edge) +
        line('M16 -22L16 42M-21 31L-28 110M65 21L104 63', ink, 3)
      );
    case 'museum-afterhours':
      if (alternate)
        return (
          path('M-46 106H46V83H36V-77H56V-101H-56V-77H-36V83H-46Z', b, edge) +
          line('M-21 -70V76M0 -70V76M21 -70V76', ink, 3) +
          line('M-51 -89H51M-41 94H41', paper, 5)
        );
      return (
        rect(-99, -122, 198, 244, '#ceaa61', 8, edge) +
        rect(-84, -106, 168, 212, paper, 3, edge) +
        rect(-71, -93, 142, 186, b, 1, edge) +
        path(
          'M-45 84Q-35 35 -12 31L-12 10Q-44 -7 -35 -49Q-15 -80 18 -60Q47 -36 25 0L12 13V33Q48 43 58 84Z',
          paper,
          edge,
        ) +
        path('M-35 -43Q-47 -88 0 -87Q36 -90 37 -48L24 -38Q-15 -69 -35 -43Z', ink) +
        line('M-13 -22L-9 -11L2 -12M-5 8L13 5M-22 53L9 73L34 46', '#bdac91', 3)
      );
    case 'sailor-knot':
      if (alternate)
        return (
          ellipse(0, 0, 83, 57, 'none', `stroke="${a}" stroke-width="22" transform="rotate(32)"`) +
          ellipse(0, 0, 83, 57, 'none', `stroke="${b}" stroke-width="13" transform="rotate(-32)"`) +
          line('M-67 -45L-119 -85M68 45L122 89', ink, 11)
        );
      return (
        circle(0, -91, 24, b, edge) +
        line('M0 -67V101M-63 -39H63', ink, 19) +
        line('M0 -67V101M-63 -39H63', a, 11) +
        path(
          'M-101 14L-108 58L-80 44Q-56 114 0 116Q56 114 80 44L108 58L101 14L66 33L79 39Q48 85 10 90H-10Q-48 85 -79 39L-66 33Z',
          b,
          edge,
        ) +
        line('M-73 -84Q-114 -9 -62 24Q2 61 64 -11', '#d8bd82', 10)
      );
    case 'submarine-logbook':
      if (alternate)
        return (
          circle(0, 0, 92, '#d0a56d', edge) +
          circle(0, 0, 70, b, edge) +
          circle(0, 0, 52, '#a8d1c9') +
          Array.from({ length: 8 }, (_, i) => place(circle(0, -80, 5, ink), 0, 0, 1, i * 45)).join(
            '',
          ) +
          line('M-35 22Q0 -8 35 22M-32 36Q0 8 32 36', paper, 4)
        );
      return (
        rect(-113, -42, 218, 111, '#e0b967', 55, edge) +
        path('M-31 -42V-91H14V-109H44V-64H-3V-42Z', b, edge) +
        [-59, 0, 59].map((x) => circle(x, 10, 21, b, edge) + circle(x - 5, 4, 7, paper)).join('') +
        path('M104 -13L137 -36V56L104 31Z', a, edge) +
        line('M-89 83H76M-79 93H65', ink, 5) +
        circle(-139, -35, 13, b, edge) +
        circle(-119, -83, 9, b, edge)
      );
    case 'mountain-railway':
      if (alternate)
        return (
          mountain(ink, b) +
          line(
            'M-130 92H139M-130 105H139M-112 84V113M-72 84V113M-32 84V113M8 84V113M48 84V113M88 84V113M128 84V113',
            ink,
            3,
          )
        );
      return (
        wheels(ink, paper, 139, 74, 25) +
        rect(-112, -10, 144, 72, a, 15, edge) +
        rect(15, -88, 90, 150, b, 5, edge) +
        rect(32, -68, 51, 55, paper, 3, edge) +
        rect(-82, -73, 29, 64, ink, 4) +
        rect(-91, -84, 47, 17, a, 3, edge) +
        line('M-97 16H11M-98 33H11M-70 74H69M48 -67V-16', ink, 4) +
        path('M-128 65L-147 93H-89Z', b, edge) +
        circle(-69, -111, 17, paper) +
        circle(-32, -133, 23, paper)
      );
    case 'aerogram-journey':
      if (alternate)
        return (
          circle(0, 0, 83, 'none', `stroke="${ink}" stroke-width="4"`) +
          circle(0, 0, 71, 'none', `stroke="${ink}" stroke-width="2" stroke-dasharray="4 8"`) +
          line('M-115 -13H115M-115 12H115M-115 37H115', ink, 5)
        );
      return (
        rect(-118, -79, 236, 158, paper, 6, edge) +
        path(
          'M-116 -77L0 15L116 -77M-116 77L-30 3M116 77L30 3',
          'none',
          `stroke="${ink}" stroke-width="4"`,
        ) +
        rect(62, -63, 36, 46, b, 2, `stroke="${ink}" stroke-width="2" stroke-dasharray="3 4"`) +
        place(twinkle(a), 80, -41, 0.4) +
        [-103, -60, -17, 26, 69]
          .map((x, i) => path(`M${x} 68l17 0l13 11h-17Z M${x} -79l17 0l13 11h-17Z`, i % 2 ? a : b))
          .join('') +
        circle(-33, -6, 23, a, 'opacity=".7"')
      );
    case 'bicycle-bloom':
      if (alternate)
        return (
          place(blossom(a), -38, -30, 0.9) +
          place(blossom(b), 39, 17, 0.72) +
          place(leaf(green, ink), -4, 59, 0.9, -22)
        );
      return (
        wheels(ink, paper, 173, 43, 49) +
        line(
          'M-86 43L-45 -38L2 43H-86L-25 -20H58L87 43M-45 -38L-60 -63M-77 -64H-35M58 -20L45 -68H72',
          a,
          9,
        ) +
        line(
          'M-86 43L-86 -4M-86 43L-126 22M-86 43L-120 72M87 43L87 -4M87 43L124 23M87 43L120 76',
          ink,
          2,
        ) +
        path('M25 -55H88L80 -15H33Z', b, edge) +
        place(blossom(a), 44, -60, 0.45) +
        place(blossom('#edc76e'), 72, -69, 0.42) +
        place(leaf(green, ink), 60, -39, 0.42)
      );
    case 'cinema-marquee':
      if (alternate)
        return (
          path('M-65 -65H65L46 108H-47Z', a, edge) +
          line('M-38 -62L-26 103M-3 -62V105M32 -62L23 103', paper, 16) +
          [-43, -12, 20, 50].map((x, i) => circle(x, -68 - (i % 2) * 24, 25, paper, edge)).join('')
        );
      return (
        rect(-114, -30, 228, 135, ink, 5, edge) +
        rect(-105, -18, 210, 111, b, 4) +
        place(
          rect(-116, -63, 232, 38, ink, 2) +
            [-98, -39, 20, 79].map((x) => path(`M${x} -63h31l-27 38h-31Z`, paper)).join(''),
          -4,
          -2,
          1,
          -12,
        ) +
        line('M-83 9H84M-83 36H84M-83 64H8M40 55V80M58 55V80M76 55V80', ink, 4)
      );
    case 'hot-air-post':
      if (alternate)
        return (
          line('M-114 32Q-63 -6 -32 14Q-16 -51 34 -32Q70 -45 85 4Q126 2 133 32Z', b, 5) +
          place(twinkle(a), -72, -58, 0.55)
        );
      return (
        path(
          'M0 -125Q-145 -121 -101 -18Q-74 45 -29 67H29Q74 45 101 -18Q145 -121 0 -125Z',
          a,
          edge,
        ) +
        path('M0 -125Q-79 -96 -52 -17Q-40 29 -12 67H12Q40 29 52 -17Q79 -96 0 -125Z', paper, edge) +
        line('M0 -120V67M-101 -18H101M-29 67L-21 105M29 67L21 105', ink, 3) +
        rect(-30, 102, 60, 42, b, 7, edge) +
        line('M-25 115H25M-25 128H25M-9 105V140M10 105V140', ink, 2)
      );
    case 'tennis-sunday':
      if (alternate)
        return (
          circle(0, 0, 78, b, edge) +
          path(
            'M-65 -44Q5 -28 -12 20Q-22 61 23 75M23 -75Q-22 -61 -12 -20Q5 28 -65 44',
            'none',
            `stroke="${paper}" stroke-width="8"`,
          )
        );
      return place(
        ellipse(0, -33, 69, 91, a, edge) +
          ellipse(0, -33, 55, 76, paper, edge) +
          [-39, -20, 0, 20, 39]
            .map((x) => line(`M${x} ${-95 + Math.abs(x) * 0.36}V${29 - Math.abs(x) * 0.36}`, b, 2))
            .join('') +
          [-81, -57, -33, -9, 15]
            .map((y) =>
              line(`M${-50 + Math.abs(y + 33) * 0.16} ${y}H${50 - Math.abs(y + 33) * 0.16}`, b, 2),
            )
            .join('') +
          path('M-18 50L-8 103H8L18 50M-10 101V160H10V101Z', a, edge) +
          line('M-8 115H8M-8 130H8M-8 145H8', ink, 3),
        0,
        -10,
        1,
        29,
      );
    case 'basketball-court':
      if (alternate)
        return (
          rect(-110, -105, 220, 148, paper, 8, edge) +
          rect(-52, -61, 104, 78, 'none', 1, `stroke="${a}" stroke-width="5"`) +
          ellipse(0, 25, 66, 15, a, edge) +
          path(
            'M-61 28L-38 105H38L61 28M-48 61H48M-40 85H40M-35 32L-18 106M0 38V106M35 32L18 106',
            'none',
            `stroke="${ink}" stroke-width="3"`,
          )
        );
      return (
        circle(0, 0, 100, '#d58b52', edge) +
        line('M-100 0H100M0 -100V100M-69 -72Q49 -27 70 72M69 -72Q-49 -27 -70 72', ink, 6) +
        path('M-80 -47Q-54 -78 -21 -86', 'none', `stroke="${paper}" stroke-width="5" opacity=".6"`)
      );
    case 'roller-disco':
      if (alternate)
        return (
          circle(0, 0, 87, b, edge) +
          line(
            'M-82 -24H82M-86 1H86M-82 26H82M-68 51H68M-68 -49H68M-23 -83V83M23 -83V83M-53 -65V65M53 -65V65',
            paper,
            3,
          ) +
          place(twinkle(paper), -62, -51, 0.7)
        );
      return (
        path('M-61 -107H21L30 -29L100 3Q127 14 118 57H-100Q-116 28 -87 10L-64 -9Z', a, edge) +
        path('M-60 -105H19L21 -67H-62Z', b, edge) +
        rect(-109, 57, 233, 20, paper, 6, edge) +
        wheels(ink, b, 153, 99, 25) +
        line('M-45 -46H13M-43 -27H15M-48 -8H18M-11 29H91', paper, 5) +
        place(twinkle(paper), -56, 22, 0.53) +
        line('M-74 83H94', ink, 5)
      );
    case 'strawberry-farm':
      if (alternate)
        return (
          path('M-85 -45H85L62 100H-62Z', b, edge) +
          path(
            'M-54 -44Q-48 -128 0 -126Q48 -128 54 -44',
            'none',
            `stroke="${ink}" stroke-width="8"`,
          ) +
          line(
            'M-65 -17H65M-72 13H72M-67 43H67M-64 73H64M-37 -40L-31 97M0 -40V99M37 -40L31 97',
            paper,
            4,
          )
        );
      return (
        path(
          'M-84 -32Q-105 28 -25 111Q0 137 25 111Q105 28 84 -32Q35 -88 0 -58Q-35 -88 -84 -32Z',
          a,
          edge,
        ) +
        path(
          'M0 -59L-23 -111L-29 -69L-78 -91L-53 -42L-99 -28L-35 -17L0 -41L35 -17L99 -28L53 -42L78 -91L29 -69L23 -111Z',
          green,
          edge,
        ) +
        [-1, 0, 1]
          .flatMap((x) => [0, 1, 2].map((y) => ellipse(x * (39 - y * 8), 3 + y * 35, 4, 8, paper)))
          .join('')
      );
    case 'paper-theatre':
      if (alternate)
        return (
          path('M-90 -119H90L87 -63Q55 -11 27 83L15 -2L-16 28L-25 -32L-65 -4Z', a, edge) +
          line('M-69 -107Q-60 -38 -24 -2M-40 -111Q-32 -69 -16 -39M57 -107Q48 -28 27 32', paper, 4) +
          line('M-32 -31L12 -17', '#d7b465', 10)
        );
      return (
        rect(-118, -113, 236, 236, b, 5, edge) +
        rect(-91, -85, 182, 173, ink, 2) +
        path(
          'M-111 -109H-2Q-3 -31 -77 14L-100 93H-114Z M111 -109H2Q3 -31 77 14L100 93H114Z',
          a,
          edge,
        ) +
        circle(0, -24, 25, paper, edge) +
        path('M-21 -1L-46 64L-12 58L0 82L12 58L46 64L21 -1Z', '#d7b465', edge) +
        line('M0 -92V-49M-46 -1L-30 12M46 -1L30 12', paper, 2) +
        rect(-118, 94, 236, 29, a, 3, edge) +
        [-80, -40, 0, 40, 80].map((x) => circle(x, 108, 6, '#f8df8c')).join('')
      );
    default:
      return '';
  }
}

const themeIds = [
  'rainy-window',
  'sakura-station',
  'matcha-ceremony',
  'koi-pavilion',
  'crane-flight',
  'capybara-onsen',
  'panda-bamboo',
  'alpine-cabin',
  'aurora-camp',
  'mushroom-almanac',
  'fairy-library',
  'potion-shelf',
  'enchanted-key',
  'dragonfly-marsh',
  'honeycomb-studio',
  'lavender-farm',
  'firefly-meadow',
  'tulip-truck',
  'quilt-cocoa',
  'yarn-social',
  'pottery-sunday',
  'glass-atelier',
  'mosaic-courtyard',
  'terrazzo-club',
  'bauhaus-play',
  'chess-society',
  'origami-lab',
  'museum-afterhours',
  'sailor-knot',
  'submarine-logbook',
  'mountain-railway',
  'aerogram-journey',
  'bicycle-bloom',
  'cinema-marquee',
  'hot-air-post',
  'tennis-sunday',
  'basketball-court',
  'roller-disco',
  'strawberry-farm',
  'paper-theatre',
];

function paperPattern(index, p) {
  const step = 84 + (index % 4) * 12;
  let body = '';
  switch (index % 6) {
    case 0:
      body = line(`M0 ${step / 2}H${step}M${step / 2} 0V${step}`, p.secondary, 1.2);
      break;
    case 1:
      body = circle(step / 2, step / 2, 4, p.secondary) + circle(3, 3, 2, p.ink);
      break;
    case 2:
      body = path(
        `M0 0L${step} ${step}M${-step / 2} 0L${step / 2} ${step}M${step / 2} 0L${step * 1.5} ${step}`,
        'none',
        `stroke="${p.secondary}" stroke-width="2"`,
      );
      break;
    case 3:
      body = line(
        `M0 ${step / 3}Q${step / 4} 0 ${step / 2} ${step / 3}T${step} ${step / 3}M0 ${step * 0.8}Q${step / 4} ${step * 0.47} ${step / 2} ${step * 0.8}T${step} ${step * 0.8}`,
        p.secondary,
        2,
      );
      break;
    case 4:
      body =
        rect(0, 0, step / 2, step / 2, p.secondary) +
        rect(step / 2, step / 2, step / 2, step / 2, p.secondary);
      break;
    default:
      body = line(
        `M${step / 2 - 10} ${step / 2}h20M${step / 2} ${step / 2 - 10}v20`,
        p.secondary,
        3,
      );
      break;
  }
  return `<pattern id="mixed-print" width="${step}" height="${step}" patternUnits="userSpaceOnUse">${body}</pattern>`;
}

export function mixedArt(frame, outline) {
  if (frame.collection !== 'Mixed Moments') return null;
  const index = themeIds.indexOf(frame.id);
  if (index < 0) return null;
  const { designWidth: w, designHeight: h, palette: originalPalette } = frame;
  const p = { ...originalPalette, background: originalPalette.background || originalPalette.bg };
  const u = w / 1200;
  const card = w / h > 0.5;
  const main = illustration(frame.id, p);
  const companion = illustration(frame.id, p, true);
  const rim = (color, width, extra = '') =>
    frame.slots
      .map((s) =>
        outline(
          s,
          frame,
          false,
          `fill="none" stroke="${color}" stroke-width="${width * u}" ${extra}`,
        ),
      )
      .join('');
  const defs = `<defs>${paperPattern(index, p)}
    <pattern id="mixed-fibres" width="127" height="139" patternUnits="userSpaceOnUse">
      ${line('M8 16l19 -2M71 108l31 2M94 39l13 -1M31 72l8 1', p.ink, 1, 'opacity=".13"')}
      ${circle(17, 111, 1.5, p.ink, 'opacity=".16"')}${circle(106, 79, 2, '#fff', 'opacity=".45"')}
      ${circle(61, 44, 1, p.ink, 'opacity=".14"')}
    </pattern>
    <linearGradient id="mixed-paper-light" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".25"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${p.ink}" stop-opacity=".06"/></linearGradient>
  </defs>`;
  let background =
    defs +
    rect(0, 0, w, h, p.background) +
    rect(0, 0, w, h, 'url(#mixed-print)', 0, 'opacity=".25"') +
    rect(0, 0, w, h, 'url(#mixed-fibres)') +
    rect(0, 0, w, h, 'url(#mixed-paper-light)');
  // A quiet inset double rule ties the paper together; figures break over it at the edges.
  background +=
    rect(
      w * 0.022,
      h * 0.009,
      w * 0.956,
      h * 0.982,
      'none',
      15 * u,
      `stroke="${p.ink}" stroke-width="${2 * u}" opacity=".4"`,
    ) +
    rect(
      w * 0.03,
      h * 0.013,
      w * 0.94,
      h * 0.974,
      'none',
      12 * u,
      `stroke="${p.accent}" stroke-width="${4 * u}" opacity=".5"`,
    );

  // Ghosted field illustrations remain printed behind the photographs, never on top of them.
  for (let row = 0; row < (card ? 5 : 9); row++) {
    for (let col = 0; col < 3; col++) {
      const x = ((col + (row % 2 ? 0.72 : 0.22)) / 2.5) * w;
      const y = (0.085 + row * (card ? 0.18 : 0.095)) * h;
      background += `<g opacity=".12">${place(row % 2 ? companion : main, x, y, u * (card ? 0.7 : 0.6), (((index + col + row) % 5) - 2) * 11)}</g>`;
    }
  }

  // Mat layers are drawn on the background so the entire uploaded silhouette stays visible.
  background +=
    `<g transform="translate(${5 * u} ${8 * u})" opacity=".17">${rim(p.ink, 54)}</g>` +
    rim(p.background, 58) +
    rim(p.ink, 46) +
    rim(p.accent, 39) +
    rim('#fff9ed', 22) +
    rim(p.secondary, 11, `stroke-dasharray="${3 * u} ${11 * u}" stroke-linecap="round"`);

  // The text is rendered by the app. These restrained paper panels clear its exact zones.
  for (const area of frame.textAreas || []) {
    background += rect(
      area.x * w - 12 * u,
      area.y * h - 4 * u,
      area.w * w + 24 * u,
      area.h * h + 8 * u,
      p.background,
      7 * u,
    );
  }

  const photoProtection = frame.slots.map((s) => outline(s, frame, true)).join('');
  const textProtection = (frame.textAreas || [])
    .map((t) =>
      rect(t.x * w - 10 * u, t.y * h - 5 * u, t.w * w + 20 * u, t.h * h + 10 * u, 'black'),
    )
    .join('');
  const safe = `<defs><mask id="mixed-decoration-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">
    ${rect(0, 0, w, h, 'white')}${photoProtection}${textProtection}
  </mask></defs>`;
  let decoration = '';
  if (card) {
    // Hero illustrations in the middle seam and outside corners show differently around every mask.
    const positions = [
      [0.06, 0.103, 0.7, -14, true],
      [0.945, 0.102, 0.76, 13, false],
      [0.49, 0.107, 0.6, -5, true],
      [0.038, 0.327, 0.78, -18, false],
      [0.967, 0.337, 0.8, 17, true],
      [0.5, 0.49, 0.94, -5, false],
      [0.055, 0.501, 0.68, 13, true],
      [0.944, 0.5, 0.72, -14, false],
      [0.035, 0.704, 0.76, 9, true],
      [0.974, 0.736, 0.85, -16, false],
      [0.09, 0.889, 0.7, -13, false],
      [0.9, 0.886, 0.78, 14, true],
      [0.5, 0.89, 0.63, 4, true],
    ];
    for (const [x, y, s, angle, alt] of positions)
      decoration += place(alt ? companion : main, x * w, y * h, s * u, angle);
  } else {
    for (let i = 0; i < 5; i++) {
      const y = (0.09 + i * 0.2) * h;
      decoration += place(
        i % 2 ? companion : main,
        (i % 2 ? 0.78 : 0.22) * w,
        y,
        u * 0.81,
        i % 2 ? 15 : -13,
      );
      decoration += place(
        i % 2 ? main : companion,
        (i % 2 ? 0.07 : 0.94) * w,
        y - h * 0.015,
        u * 0.66,
        i % 2 ? -12 : 18,
      );
    }
    for (let i = 0; i < 4; i++)
      decoration += place(
        i % 2 ? main : companion,
        (i % 2 ? 0.975 : 0.025) * w,
        (0.19 + i * 0.2) * h,
        u * 0.74,
        i % 2 ? 21 : -20,
      );
  }

  // Tiny sewn corner marks and short photo-edge highlights add print detail without covering faces.
  let edgeDetails = '';
  for (const [i, slot] of frame.slots.entries()) {
    const x = slot.x * w,
      y = slot.y * h,
      pw = slot.w * w,
      ph = slot.h * h;
    const dot = i % 2 ? p.secondary : p.accent;
    edgeDetails += place(
      circle(-pw / 2 - 12 * u, -ph / 2 + 27 * u, 7 * u, dot) +
        circle(pw / 2 + 12 * u, ph / 2 - 27 * u, 7 * u, dot) +
        line(
          `M${-pw / 2 + 15 * u} ${-ph / 2 - 12 * u}h${48 * u}M${pw / 2 - 15 * u} ${ph / 2 + 12 * u}h${-48 * u}`,
          p.ink,
          2 * u,
        ),
      x + pw / 2,
      y + ph / 2,
      1,
      slot.rotationDeg || 0,
    );
  }
  const foreground =
    safe +
    `<g mask="url(#mixed-decoration-safe)">${decoration}${edgeDetails}${rim(p.ink, 2.5)}</g>`;
  return { background, foreground };
}
