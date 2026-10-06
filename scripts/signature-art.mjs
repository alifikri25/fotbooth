import fs from 'node:fs';

const materials = new Map();
const xml = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x, y, w, h, fill, rx = 0, more = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${more}/>`;
const line = (d, color, width = 3, more = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${more}/>`;
const circle = (x, y, r, fill, more = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${more}/>`;
const place = (body, x, y, scale = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
const text = (words, x, y, size, color, more = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" fill="${color}" ${more}>${xml(words)}</text>`;
const sparkle = (x, y, size, color) =>
  `<path d="M${x} ${y - size}Q${x + size * 0.15} ${y - size * 0.15} ${x + size} ${y}Q${x + size * 0.15} ${y + size * 0.15} ${x} ${y + size}Q${x - size * 0.15} ${y + size * 0.15} ${x - size} ${y}Q${x - size * 0.15} ${y - size * 0.15} ${x} ${y - size}Z" fill="${color}"/>`;
function material(name, w, h) {
  if (!materials.has(name))
    materials.set(
      name,
      fs
        .readFileSync(new URL(`../artwork/materials/${name}.jpg`, import.meta.url))
        .toString('base64'),
    );
  return `<image width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/jpeg;base64,${materials.get(name)}"/>`;
}
function barcode(x, y, w, h, ink) {
  let body = '';
  for (let i = 0; i < 73; i++)
    if (i % 5 !== 2)
      body += rect(x + (i * w) / 73, y, (w / 73) * (i % 3 === 0 ? 0.9 : 0.45), h, ink);
  return body;
}
function bow(ink, accent) {
  return (
    `<path d="M-12 6C-140 -130 -190 -15 -72 30L-30 11L-89 150L-40 118L-19 158L17 21L56 157L85 114L130 148L35 7C183 73 185 -102 28 -18Z" fill="${accent}" stroke="${ink}" stroke-width="5"/>` +
    line('M-139 -29Q-75 -18 -20 4M24 4Q94 -34 141 -34', ink, 3) +
    rect(-26, -27, 58, 67, 'url(#sig-satin)', 14, `stroke="${ink}" stroke-width="4"`) +
    line('M-9 -9L-13 23', '#f7dce0', 6)
  );
}
function rocket() {
  const ink = '#24365c',
    red = '#ed4644';
  return (
    `<path d="M-42 50L-87 106L-82 22L-45 -14M42 50L87 106L82 22L45 -14" fill="${red}" stroke="${ink}" stroke-width="6"/><path d="M-48 64Q-72 -38 0 -116Q72 -38 48 64Z" fill="#fff8e6" stroke="${ink}" stroke-width="6"/><path d="M-33 -65Q0 -54 33 -65M-46 47H46" stroke="${ink}" stroke-width="6" fill="none"/><ellipse cy="-9" rx="35" ry="43" fill="#9cd4eb" stroke="${ink}" stroke-width="6"/><ellipse cx="-11" cy="-14" rx="4" ry="9" fill="${ink}"/><ellipse cx="11" cy="-14" rx="4" ry="9" fill="${ink}"/>` +
    line('M-13 10Q0 29 13 10', ink, 5) +
    `<path d="M-22 66L-8 132L1 112L18 153L27 66Z" fill="#ffc86b" stroke="${ink}" stroke-width="5"/>` +
    line('M-49 17Q-94 -26 -119 -10M49 17Q86 68 118 8', red, 13) +
    circle(-119, -10, 13, red, `stroke="${ink}" stroke-width="5"`) +
    circle(119, 8, 13, red, `stroke="${ink}" stroke-width="5"`)
  );
}
function discoBall(radius) {
  let tiles = '';
  const n = 18,
    step = (radius * 2) / n;
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const x = -radius + col * step,
        y = -radius + row * step;
      const bright = Math.round(110 + 120 * (1 - Math.abs(col - 5) / 16));
      const colors = [
        '#fff8dc',
        '#d9baed',
        '#a997bc',
        `rgb(${bright},${Math.min(255, bright + 8)},${Math.min(255, bright + 18)})`,
      ];
      tiles += rect(x + 1, y + 1, step - 2, step - 2, colors[(row * 7 + col * 3) % 4], 2);
    }
  return (
    `<defs><clipPath id="sig-disco-ball"><circle r="${radius}"/></clipPath></defs><g clip-path="url(#sig-disco-ball)">${circle(0, 0, radius, '#433657')}${tiles}</g>` +
    circle(0, 0, radius, 'none', 'stroke="#f3d49b" stroke-width="3"') +
    `<ellipse rx="${radius * 0.67}" ry="${radius}" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="2"/>` +
    sparkle(-radius * 0.36, -radius * 0.39, radius * 0.3, '#fffbdc')
  );
}
function floralSprig(ink, accent) {
  let body = line('M0 140Q-22 20 5 -127', ink, 4);
  for (let i = 0; i < 6; i++) {
    const y = 110 - i * 42,
      side = i % 2 ? -1 : 1;
    body += `<path d="M0 ${y}Q${side * 72} ${y - 65} ${side * 82} ${y - 12}Q${side * 60} ${y + 28} 0 ${y}Z" fill="${accent}" stroke="${ink}" stroke-width="2"/>`;
    body += line(`M0 ${y}L${side * 66} ${y - 13}`, ink, 1);
  }
  return body;
}
const defs = `<defs>
 <linearGradient id="sig-gold" x2=".7" y2="1"><stop stop-color="#73482c"/><stop offset=".2" stop-color="#e2b862"/><stop offset=".45" stop-color="#fff0aa"/><stop offset=".64" stop-color="#b9823c"/><stop offset=".82" stop-color="#ffe7a0"/><stop offset="1" stop-color="#8b5a27"/></linearGradient>
 <linearGradient id="sig-chrome" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#faf5ff"/><stop offset=".22" stop-color="#81709f"/><stop offset=".4" stop-color="#fbf7ff"/><stop offset=".53" stop-color="#aacbde"/><stop offset=".7" stop-color="#614c80"/><stop offset=".88" stop-color="#ead8ef"/><stop offset="1" stop-color="#b6a4d3"/></linearGradient>
 <linearGradient id="sig-satin" x2="1" y2=".8"><stop stop-color="#f3b7b2"/><stop offset=".2" stop-color="#a92644"/><stop offset=".4" stop-color="#e9a3a8"/><stop offset=".65" stop-color="#941f39"/><stop offset="1" stop-color="#cf5e74"/></linearGradient>
 <radialGradient id="sig-night"><stop stop-color="#674380"/><stop offset=".62" stop-color="#281b40"/><stop offset="1" stop-color="#100e1e"/></radialGradient>
 <pattern id="sig-speckles" width="59" height="71" patternUnits="userSpaceOnUse"><circle cx="7" cy="19" r="2" fill="#fbecd0" opacity=".18"/><circle cx="41" cy="49" r="1.5" fill="#ffffff" opacity=".15"/><path d="M22 38l5 -2" stroke="#fff" opacity=".12"/></pattern>
 <pattern id="sig-halftone" width="42" height="42" patternUnits="userSpaceOnUse"><circle cx="21" cy="21" r="7" fill="#76b6d8" opacity=".24"/></pattern>
 <pattern id="sig-romance-stripe" width="92" height="92" patternUnits="userSpaceOnUse"><rect width="92" height="92" fill="#f7ebdd"/><rect width="24" height="92" fill="#a02640"/><path d="M36 0V92M54 0V92" stroke="#cc8889" stroke-width="2"/></pattern>
 <filter id="sig-shadow" x="-.15" y="-.15" width="1.3" height="1.3"><feDropShadow dx="8" dy="14" stdDeviation="8" flood-color="#201022" flood-opacity=".28"/></filter>
 <filter id="sig-bulb" x="-.6" y="-.6" width="2.2" height="2.2"><feGaussianBlur stdDeviation="6"/></filter>
 </defs>`;

export function signatureArt(frame, outline) {
  if (frame.version !== 3) return null;
  const { designWidth: w, designHeight: h, palette: p } = frame;
  const sw = w / 1200;
  let bg = defs,
    fg = defs;
  const border = (color, width) =>
    frame.slots
      .map((s) => outline(s, frame, false, `fill="none" stroke="${color}" stroke-width="${width}"`))
      .join('');
  const footer = (fill = '#fff8ee', opacity = '.95') =>
    rect(w * 0.14, h * 0.91, w * 0.72, h * 0.081, fill, 8 * sw, `opacity="${opacity}"`);
  switch (frame.id) {
    case 'midnight-film-polaroid': {
      bg += material('velvet', w, h);
      bg += rect(
        w * 0.15,
        h * 0.025,
        w * 0.7,
        h * 0.09,
        '#8b341f',
        16,
        'stroke="#b77935" stroke-width="10"',
      );
      bg += rect(w * 0.17, h * 0.032, w * 0.66, h * 0.073, 'url(#sig-gold)', 10);
      fg += text(
        'FOTBOOTH PICTURES PRESENTS',
        w * 0.5,
        h * 0.136,
        29,
        '#ffe3a3',
        'letter-spacing="7"',
      );
      bg += border('#4a1615', 72) + border('url(#sig-gold)', 49) + border('#a83624', 29);
      for (const s of frame.slots) {
        const pw = s.w * w,
          ph = s.h * h;
        let bulbs = '';
        for (let x = -pw / 2; x <= pw / 2; x += 53)
          bulbs += circle(x, -ph / 2 - 21, 7, '#fff2b4') + circle(x, ph / 2 + 21, 7, '#fff2b4');
        for (let y = -ph / 2 + 25; y < ph / 2; y += 53)
          bulbs += circle(-pw / 2 - 21, y, 7, '#fff2b4') + circle(pw / 2 + 21, y, 7, '#fff2b4');
        fg += place(bulbs, (s.x + s.w / 2) * w, (s.y + s.h / 2) * h, 1, s.rotationDeg);
      }
      const clapper =
        rect(-90, -49, 180, 108, '#f8e8c7', 5, 'stroke="#271c21" stroke-width="5"') +
        rect(-95, -79, 190, 32, '#262027', 1) +
        Array.from(
          { length: 5 },
          (_, i) => `<path d="M${-87 + i * 39} -78l27 0l-17 32h-27Z" fill="#f4e6cc"/>`,
        ).join('') +
        line('M-70 -22H68M-70 3H68M-70 27H33', '#4b302a', 3) +
        text('TAKE FOUR', 0, 45, 17, '#4b302a');
      fg +=
        place(clapper, w * 0.47, h * 0.509, 0.72, -13) +
        place(
          text('PREMIERE', 0, 0, 42, '#fff2a9', 'font-weight="bold"'),
          w * 0.28,
          h * 0.89,
          1,
          -5,
        );
      bg += footer('#610e14', '.82');
      break;
    }
    case 'birthday-confetti-story': {
      bg += rect(0, 0, w, h, '#e5f7fc') + rect(0, 0, w, h, 'url(#sig-halftone)');
      bg += rect(
        w * 0.035,
        h * 0.03,
        w * 0.93,
        h * 0.865,
        '#eefaff',
        75,
        'stroke="#26385f" stroke-width="4"',
      );
      bg += border('#25365d', 23) + border('#fffbee', 13);
      fg += text(
        'BIRTHDAY CLUB',
        w * 0.5,
        h * 0.103,
        117,
        '#eb4748',
        'font-weight="bold" stroke="#24345b" stroke-width="5" paint-order="stroke"',
      );
      fg +=
        place(rocket(), w * 0.087, h * 0.102, 0.83, -13) +
        place(rocket(), w * 0.916, h * 0.103, 0.83, 13);
      fg +=
        line(
          `M${w * 0.57} 0Q${w * 0.58} ${h * 0.03} ${w * 0.67} ${h * 0.025}T${w * 0.84} ${h * 0.02}Q${w * 0.93} ${h * 0.055} ${w} ${h * 0.025}`,
          '#24365c',
          31,
        ) +
        line(
          `M${w * 0.57} 0Q${w * 0.58} ${h * 0.03} ${w * 0.67} ${h * 0.025}T${w * 0.84} ${h * 0.02}Q${w * 0.93} ${h * 0.055} ${w} ${h * 0.025}`,
          '#89cde4',
          19,
        );
      fg += place(
        rect(-118, -35, 236, 70, '#24365c', 35) +
          text('PARTY ON!', 0, 13, 35, '#fff9e9', 'font-weight="bold"'),
        w * 0.7,
        h * 0.531,
        1.05,
        6,
      );
      fg +=
        sparkle(w * 0.07, h * 0.62, 49, '#ed4848') +
        sparkle(w * 0.945, h * 0.43, 58, '#ed4848') +
        sparkle(w * 0.936, h * 0.76, 34, '#24365c');
      fg +=
        line(
          `M0 ${h * 0.88}Q${w * 0.06} ${h * 0.85} ${w * 0.075} ${h * 0.89}T${w * 0.19} ${h * 0.91}`,
          '#24365c',
          23,
        ) +
        line(
          `M0 ${h * 0.88}Q${w * 0.06} ${h * 0.85} ${w * 0.075} ${h * 0.89}T${w * 0.19} ${h * 0.91}`,
          '#89cde4',
          13,
        );
      bg += footer('#fffaf0');
      fg += text(
        'MAKE A WISH · MAKE A MEMORY',
        w * 0.5,
        h * 0.907,
        30,
        '#24365c',
        'letter-spacing="4"',
      );
      break;
    }
    case 'concert-pass': {
      bg += rect(0, 0, w, h, '#112747') + rect(0, 0, w, h, 'url(#sig-speckles)');
      bg += rect(24, 18, w - 48, h - 36, '#f7f3e9', 10, 'stroke="#ddc99d" stroke-width="4"');
      for (let y = 55; y < h - 40; y += 52)
        fg += circle(23, y, 11, '#112747') + circle(w - 23, y, 11, '#112747');
      bg += border('#fffdf7', 25) + border('#293548', 3);
      fg += text(
        'PHOTO BOOTH / LATE NIGHT EDITION',
        w * 0.5,
        h * 0.061,
        27,
        '#303643',
        'letter-spacing="5"',
      );
      fg += line(`M45 ${h * 0.619}H${w - 45}`, '#333b48', 3, 'stroke-dasharray="10 12"');
      fg += circle(24, h * 0.619, 31, '#112747') + circle(w - 24, h * 0.619, 31, '#112747');
      fg +=
        text('ADMIT TWO', w * 0.25, h * 0.605, 29, '#303643', 'letter-spacing="4"') +
        barcode(w * 0.47, h * 0.597, w * 0.31, h * 0.012, '#283447');
      fg += text(
        '№ 004 / KEEP THIS TICKET',
        w * 0.5,
        h * 0.642,
        25,
        '#303643',
        'letter-spacing="4"',
      );
      fg += text('THE NIGHT IS OURS', w * 0.5, h * 0.898, 29, '#303643', 'letter-spacing="5"');
      fg += place(
        rect(-116, -28, 232, 56, 'url(#sig-gold)', 3) + text('ALL ACCESS', 0, 9, 23, '#46331e'),
        w * 0.785,
        h * 0.895,
        1,
        -6,
      );
      fg += barcode(w * 0.28, h * 0.965, w * 0.44, 19, '#283447');
      break;
    }
    case 'lace-story-arch': {
      bg += material('sage', w, h);
      bg += border('#51583a', 63) + border('#fff9e9', 50) + border('#d9d4b7', 6);
      bg += rect(
        w * 0.1,
        h * 0.031,
        w * 0.8,
        h * 0.059,
        '#f8f3e6',
        4,
        'opacity=".95" stroke="#8a916e" stroke-width="2"',
      );
      fg += text(
        'THE TEXTILE SERIES · No. 03',
        w * 0.5,
        h * 0.12,
        29,
        '#2f3f2c',
        'letter-spacing="4"',
      );
      for (const s of frame.slots) {
        const pw = s.w * w,
          ph = s.h * h;
        let lace = '';
        for (let y = 0; y < ph; y += 27) {
          lace +=
            circle(-22, y, 15, 'none', 'stroke="#fffae8" stroke-width="3"') +
            circle(pw + 22, y, 15, 'none', 'stroke="#fffae8" stroke-width="3"');
          lace += circle(-22, y, 4, '#fffbee') + circle(pw + 22, y, 4, '#fffbee');
        }
        fg += place(lace, s.x * w, s.y * h);
      }
      bg += footer('#f8f4e4');
      fg += text(
        'woven with little memories',
        w * 0.5,
        h * 0.9,
        35,
        '#fff8de',
        'font-style="italic"',
      );
      break;
    }
    case 'wedding-bloom-portrait': {
      bg += material('pearl', w, h);
      bg += border('#ccb58c', 50) + border('#fffdf5', 39) + border('url(#sig-gold)', 8);
      bg += rect(
        w * 0.18,
        h * 0.028,
        w * 0.64,
        h * 0.067,
        '#fff8e8',
        5,
        'opacity=".88" stroke="#c9a46f" stroke-width="2"',
      );
      fg += text('A LOVE TO KEEP', w * 0.5, h * 0.119, 30, '#745d3e', 'letter-spacing="7"');
      fg +=
        place(floralSprig('#9d895f', '#d6c69a'), w * 0.022, h * 0.38, 1.2, -8) +
        place(floralSprig('#9d895f', '#d6c69a'), w * 0.974, h * 0.68, 1.25, 171);
      for (let y = h * 0.155; y < h * 0.87; y += 41)
        fg += circle(w * 0.499, y, 8, '#fff8e7', 'stroke="#bca277" stroke-width="2"');
      bg += footer('#fff8e9', '.94');
      fg += text('TOGETHER, ALWAYS', w * 0.5, h * 0.901, 30, '#705738', 'letter-spacing="7"');
      break;
    }
    case 'kpop-starlight-wander': {
      bg += material('holo', w, h);
      bg += border('#89739f', 47) + border('url(#sig-chrome)', 39) + border('#fff1ff', 9);
      bg += rect(
        w * 0.13,
        h * 0.059,
        w * 0.74,
        h * 0.044,
        '#f9efff',
        5,
        'opacity=".87" stroke="#9982b3" stroke-width="2"',
      );
      fg += text('ENCORE / ALL ACCESS', w * 0.5, h * 0.129, 25, '#594079', 'letter-spacing="6"');
      fg += place(
        rect(-99, -28, 198, 56, 'url(#sig-chrome)', 8, 'stroke="#655083" stroke-width="2"') +
          text('OUR ERA', 0, 9, 24, '#39294e'),
        w * 0.71,
        h * 0.392,
        1,
        7,
      );
      fg +=
        sparkle(w * 0.048, h * 0.47, 39, '#fff9ff') + sparkle(w * 0.936, h * 0.69, 54, '#fff9ff');
      fg += text('YOU ARE THE MOMENT', w * 0.5, h * 0.907, 25, '#463161', 'letter-spacing="5"');
      bg += footer('#f9efff', '.9');
      break;
    }
    case 'heart-mail-story': {
      bg += rect(0, 0, w, h, 'url(#sig-romance-stripe)');
      bg += rect(
        w * 0.043,
        h * 0.018,
        w * 0.914,
        h * 0.973,
        '#f7ede2',
        8,
        'stroke="#90283b" stroke-width="4"',
      );
      bg += rect(w * 0.065, h * 0.02, w * 0.87, h * 0.978, 'url(#sig-speckles)');
      bg += border('#a32d43', 35) + border('#fff6e8', 23) + border('#9e5360', 4);
      fg +=
        line(
          `M${w * 0.13} ${h * 0.095}Q${w * 0.35} ${h * 0.117} ${w * 0.5} ${h * 0.096}Q${w * 0.71} ${h * 0.087} ${w * 0.88} ${h * 0.126}`,
          '#a52640',
          18,
        ) +
        line(
          `M${w * 0.13} ${h * 0.095}Q${w * 0.35} ${h * 0.117} ${w * 0.5} ${h * 0.096}Q${w * 0.71} ${h * 0.087} ${w * 0.88} ${h * 0.126}`,
          '#edacaf',
          4,
        );
      fg += place(bow('#7c2338', '#c8546b'), w * 0.49, h * 0.102, 0.7, -7);
      const envelope =
        rect(-92, -47, 184, 94, '#ead5b8', 2, 'stroke="#9d5d5b" stroke-width="3"') +
        line('M-92 -47L0 17L92 -47M-92 47L-19 -2M92 47L19 -2', '#9d5d5b', 3) +
        circle(0, 14, 19, '#9f223b', 'stroke="#da8c93" stroke-width="3"') +
        text('R', 0, 22, 23, '#efc2b4');
      fg += place(envelope, w * 0.23, h * 0.529, 0.73, -9);
      fg += place(
        text('LOVE NOTE № 01', 0, 0, 34, '#89243c', 'letter-spacing="4"'),
        w * 0.74,
        h * 0.541,
        1,
        6,
      );
      bg += footer('#fff9ef');
      fg +=
        line(`M${w * 0.22} ${h * 0.895}H${w * 0.78}`, '#90283b', 3) +
        text('SEALED WITH A MEMORY', w * 0.5, h * 0.909, 28, '#8e2942', 'letter-spacing="5"');
      break;
    }
    case 'cosmic-disco-mosaic': {
      bg += rect(0, 0, w, h, 'url(#sig-night)') + rect(0, 0, w, h, 'url(#sig-speckles)');
      for (const x of [0.03, 0.23, 0.77, 0.97])
        bg += `<path d="M${w * 0.5} ${h * 0.06}L${w * x} ${h * 0.94}L${w * (x + 0.025)} ${h * 0.94}Z" fill="#be83d8" opacity=".14"/>`;
      bg += border('#34233e', 64) + border('url(#sig-gold)', 45) + border('#fff1c7', 10);
      fg +=
        place(discoBall(74), w * 0.5, h * 0.109, 1.15) +
        line(`M${w * 0.5} ${h * 0.069}V${h * 0.079}`, '#f4d69c', 3);
      fg +=
        sparkle(w * 0.16, h * 0.091, 46, '#efcf8b') + sparkle(w * 0.83, h * 0.105, 40, '#efcf8b');
      for (let i = 0; i < 36; i++)
        fg += sparkle(
          w * (0.015 + ((i * 29) % 97) / 100),
          h * (0.02 + ((i * 37) % 95) / 100),
          i % 3 === 0 ? 12 : 6,
          i % 2 ? '#d3a7e9' : '#f5dca9',
        );
      fg += place(
        rect(-126, -35, 252, 70, 'url(#sig-gold)', 35) +
          text('DANCE ALL NIGHT', 0, 10, 25, '#41263f', 'letter-spacing="2"'),
        w * 0.5,
        h * 0.51,
        1.05,
        -3,
      );
      fg += text(
        'GOOD TIMES / GREAT COMPANY',
        w * 0.5,
        h * 0.904,
        27,
        '#f2d9a4',
        'letter-spacing="5"',
      );
      bg += footer('#ffefd6');
      break;
    }
    default:
      return null;
  }
  const textMasks = frame.textAreas
    .map((t) => rect(t.x * w, t.y * h, t.w * w, t.h * h, 'black'))
    .join('');
  const safe = `<defs><mask id="signature-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">${rect(0, 0, w, h, 'white')}${frame.slots.map((s) => outline(s, frame, true)).join('')}${textMasks}</mask></defs>`;
  return { background: bg, foreground: safe + `<g mask="url(#signature-safe)">${fg}</g>` };
}
