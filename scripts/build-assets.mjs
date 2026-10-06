import fs from 'node:fs/promises';
import path from 'node:path';
import { definitions } from '../src/frames/definitions.ts';
import { cartoonArt } from './cartoon-art.mjs';
import { collectionArt } from './collection-art.mjs';
import { printPaper } from './print-paper.mjs';
import { signatureArt } from './signature-art.mjs';

const root = path.resolve(import.meta.dirname, '..');
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const circle = (x, y, r, fill, more = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${more}/>`;
const stroke = (d, color, width = 10, more = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${more}/>`;
const star = (x, y, r, fill) =>
  `<path d="M${x - r},${y} L${x - r * 0.22},${y - r * 0.22} L${x},${y - r} L${x + r * 0.22},${y - r * 0.22} L${x + r},${y} L${x + r * 0.22},${y + r * 0.22} L${x},${y + r} L${x - r * 0.22},${y + r * 0.22}Z" fill="${fill}"/>`;
function outline(s, f, mask = false, style) {
  const x = s.x * f.designWidth,
    y = s.y * f.designHeight,
    w = s.w * f.designWidth,
    h = s.h * f.designHeight;
  const width = f.categories.includes('cartoon')
    ? 20
    : f.id === 'sticker-rush'
      ? 18
      : f.id === 'pocket-arcade'
        ? 14
        : 6;
  const attr =
    style ??
    (mask ? 'fill="black"' : `fill="none" stroke="${f.palette.ink}" stroke-width="${width}"`);
  let shape = `<rect x="0" y="0" width="${w}" height="${h}" rx="${s.shape === 'roundedRect' ? s.radius : 0}" ${attr}/>`;
  if (s.shape === 'circle') shape = `<circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}" ${attr}/>`;
  if (s.pathRef === 'arch')
    shape = `<path d="M0,${h}V${w / 2}C0,0 ${w},0 ${w},${w / 2}V${h}Z" ${attr}/>`;
  if (s.pathRef === 'chamfer') {
    const c = Math.min(w, h) * 0.09;
    shape = `<path d="M${c},0H${w - c}L${w},${c}V${h - c}L${w - c},${h}H${c}L0,${h - c}V${c}Z" ${attr}/>`;
  }
  return `<g transform="translate(${x + w / 2} ${y + h / 2}) rotate(${s.rotationDeg}) translate(${-w / 2} ${-h / 2})">${shape}</g>`;
}
for (const f of definitions) {
  const { designWidth: w, designHeight: h, palette: p } = f;
  let bg = `<rect width="${w}" height="${h}" fill="${p.background}"/>`;
  let fg = f.slots.map((s) => outline(s, f)).join('');
  const signature = signatureArt(f, outline);
  if (signature) {
    bg = signature.background;
    fg = signature.foreground;
  } else if (f.artwork) {
    const art = collectionArt(f);
    bg += art.background;
    if (f.artwork.edition === 10) {
      for (const s of f.slots) {
        const pw = s.w * w,
          ph = s.h * h;
        bg += `<g transform="translate(${(s.x + s.w / 2) * w} ${(s.y + s.h / 2) * h}) rotate(${s.rotationDeg})"><rect x="${-pw / 2 - 30}" y="${-ph / 2 - 30}" width="${pw + 60}" height="${ph + 100}" rx="5" fill="#fffcf7" stroke="${p.ink}" stroke-width="2" stroke-opacity=".18"/><path d="M${-pw / 2 + 12} ${ph / 2 + 47}h${pw * 0.25}" stroke="${p.ink}" stroke-width="2" opacity=".2"/></g>`;
      }
    }
    bg += `<g transform="translate(9 15)" opacity=".18">${f.slots.map((s) => outline(s, f, false, `fill="none" stroke="${p.ink}" stroke-width="80"`)).join('')}</g>`;
    bg += f.slots
      .map((s) => outline(s, f, false, `fill="none" stroke="${p.accent}" stroke-width="76"`))
      .join('');
    bg += f.slots
      .map((s) => outline(s, f, false, 'fill="none" stroke="#fff9ef" stroke-width="53"'))
      .join('');
    const textMasks = f.textAreas
      .map(
        (t) =>
          `<rect x="${t.x * w}" y="${t.y * h}" width="${t.w * w}" height="${t.h * h}" fill="black"/>`,
      )
      .join('');
    const safe = `<defs><mask id="decor-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/>${f.slots.map((s) => outline(s, f, true)).join('')}${textMasks}</mask></defs>`;
    fg =
      f.slots
        .map((s) => outline(s, f, false, `fill="none" stroke="${p.ink}" stroke-width="4"`))
        .join('') +
      safe +
      `<g mask="url(#decor-safe)">${art.foreground}</g>`;
  } else if (f.id === 'orbit-club') {
    bg += `<ellipse cx="600" cy="2000" rx="670" ry="1730" fill="none" stroke="${p.secondary}" stroke-width="22" transform="rotate(8 600 2000)"/>`;
    fg +=
      star(44, 1120, 32, p.accent) +
      star(1158, 2110, 28, p.ink) +
      circle(70, 3260, 18, p.accent) +
      stroke('M320 3485H880', p.ink, 5);
  } else if (f.id === 'bubble-pop') {
    bg += `<defs><radialGradient id="bubble"><stop stop-color="#ffffff"/><stop offset=".3" stop-color="${p.secondary}"/><stop offset="1" stop-color="${p.accent}"/></radialGradient></defs>`;
    for (const [x, y, r] of [
      [60, 1150, 95],
      [1125, 2140, 110],
      [110, 3220, 65],
      [1090, 110, 80],
    ])
      bg += circle(x, y, r, 'url(#bubble)');
    fg += circle(34, 1180, 22, '#ffffff') + circle(1160, 2145, 20, '#ffffff');
  } else if (f.id === 'studio-notes') {
    for (let x = 0; x < w; x += 90) bg += stroke(`M${x} 0V${h}`, p.secondary, 2);
    for (let y = 0; y < h; y += 90) bg += stroke(`M0 ${y}H${w}`, p.secondary, 2);
    fg +=
      stroke('M1020 2330h670 M150 2390h330', p.accent, 8) +
      `<rect x="75" y="157" width="260" height="35" fill="${p.accent}" transform="rotate(-3 200 175)"/>`;
  } else if (f.id === 'concert-pass') {
    fg += stroke('M0 2200H1200', p.ink, 8, 'stroke-dasharray="16 24"');
    fg += circle(0, 2200, 52, p.background) + circle(1200, 2200, 52, p.background);
    for (let i = 0; i < 25; i++)
      fg += `<rect x="${350 + i * 20}" y="2170" width="${i % 3 === 0 ? 12 : 5}" height="60" fill="${p.ink}"/>`;
  } else if (f.id === 'pocket-arcade') {
    bg += `<path d="M0 0H1200V3600H0Z" fill="none" stroke="${p.secondary}" stroke-width="30"/>`;
    [930, 1685, 2440, 3210].forEach((y, i) => {
      for (let j = 0; j < 4; j++)
        fg += `<rect x="${80 + j * 40}" y="${y}" width="25" height="12" fill="${j <= i ? p.accent : p.secondary}"/>`;
      fg += `<rect x="1030" y="${y - 7}" width="32" height="32" fill="${p.accent}"/>`;
    });
  } else if (f.id === 'sticker-rush') {
    fg += star(1125, 1140, 53, p.accent) + star(52, 2220, 46, p.secondary);
    fg +=
      stroke('M1050 2260q55 -100 110 0q-50 85 -110 0', p.ink, 12) +
      stroke('M105 3320q60 70 130 0', p.ink, 12);
    bg += `<path d="M30 3440L210 3340M960 40L1130 170" stroke="${p.secondary}" stroke-width="60"/>`;
  } else if (f.id === 'cloud-windows') {
    bg += `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${p.background}"/><stop offset="1" stop-color="#f2f6ff"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sky)"/>`;
    fg += `<g fill="#ffffff">${circle(110, 1195, 45, '#ffffff')}${circle(155, 1170, 65, '#ffffff')}${circle(210, 1195, 48, '#ffffff')}${circle(1040, 2245, 45, '#ffffff')}${circle(1090, 2225, 50, '#ffffff')}</g>`;
    fg += stroke('M270 3485q320 -60 660 0', p.accent, 5);
  } else if (f.id === 'gallery-issue') {
    fg += stroke('M90 150H1710M90 2420H1710', p.ink, 5);
    fg += `<rect x="1690" y="12" width="20" height="120" fill="${p.accent}"/>`;
    for (let i = 0; i < 4; i++)
      fg += `<rect x="${80 + i * 24}" y="2625" width="12" height="30" fill="${p.ink}"/>`;
  } else if (f.categories.includes('cartoon')) {
    const art = cartoonArt(f);
    bg += art.background;
    bg += f.slots
      .map((s) => outline(s, f, false, `fill="none" stroke="${p.accent}" stroke-width="64"`))
      .join('');
    bg += f.slots
      .map((s) => outline(s, f, false, 'fill="none" stroke="#fffdf7" stroke-width="40"'))
      .join('');
    // Stickers can peek around photo edges, while the actual photo masks stay clear.
    const safe = `<defs><mask id="decor-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/>${f.slots.map((s) => outline(s, f, true)).join('')}</mask></defs>`;
    fg += safe + `<g mask="url(#decor-safe)">${art.foreground}</g>`;
  }
  if (!signature) bg += printPaper(f);
  const dir = path.join(root, `public/frames/${f.id}/v${f.version}`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(f, null, 2) + '\n');
  await fs.mkdir(path.join(root, 'src/frames/manifests'), { recursive: true });
  await fs.writeFile(
    path.join(root, `src/frames/manifests/${f.id}.json`),
    JSON.stringify(f, null, 2) + '\n',
  );
  await fs.writeFile(path.join(dir, 'background.svg'), svg(w, h, bg));
  await fs.writeFile(path.join(dir, 'foreground.svg'), svg(w, h, fg));
}
await fs.mkdir(path.join(root, 'public/fonts'), { recursive: true });
for (const [src, name] of [
  ['@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', 'dm-sans.woff2'],
  ['@fontsource/fraunces/files/fraunces-latin-500-normal.woff2', 'fraunces.woff2'],
  ['@fontsource-variable/dm-sans/LICENSE', 'DM-Sans-OFL.txt'],
  ['@fontsource/fraunces/LICENSE', 'Fraunces-OFL.txt'],
])
  await fs.copyFile(path.join(root, 'node_modules', src), path.join(root, 'public/fonts', name));
await fs.mkdir(path.join(root, 'public/samples'), { recursive: true });
for (const letter of ['a', 'b', 'c'])
  await fs.copyFile(
    path.join(root, `artwork/materials/portrait-${letter}.jpg`),
    path.join(root, `public/samples/signature-portrait-${letter}.jpg`),
  );
const portraits = [
  ['#eccda6', '#f1704c', '#27363d', '#543f30'],
  ['#b6d4ca', '#8475c7', '#dba07f', '#302925'],
  ['#c5cbf0', '#dec642', '#b16b49', '#25272d'],
];
for (const [i, [background, shirt, skin, hair]] of portraits.entries()) {
  const drawing =
    `<rect width="800" height="1000" fill="${background}"/><path d="M0 700Q400 610 800 700V1000H0Z" fill="${shirt}"/>` +
    `<ellipse cx="400" cy="430" rx="220" ry="250" fill="${hair}"/><rect x="340" y="570" width="120" height="170" rx="50" fill="${skin}"/><ellipse cx="400" cy="470" rx="165" ry="190" fill="${skin}"/>` +
    `<path d="M230 390Q240 190 410 240Q565 200 575 390Q460 400 375 290Q360 410 230 390Z" fill="${hair}"/><path d="M318 459h32M450 459h32" stroke="${hair}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M355 552Q400 594 445 552" fill="none" stroke="${hair}" stroke-width="9" stroke-linecap="round"/><circle cx="130" cy="160" r="46" fill="${shirt}"/><path d="M660 700l15 -50l15 50l50 15l-50 15l-15 50l-15 -50l-50 -15Z" fill="${skin}"/>`;
  await fs.writeFile(
    path.join(root, `public/samples/friend-${i + 1}.svg`),
    svg(800, 1000, drawing),
  );
}
console.log(
  `Generated ${definitions.length} versioned original frame packages, 3 original sample illustrations, and local licensed fonts.`,
);
