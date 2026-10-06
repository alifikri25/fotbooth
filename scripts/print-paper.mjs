// A matte, trimmed paper surface shared by the existing photo-card and strip designs.
export function printPaper(frame) {
  const { designWidth: w, designHeight: h, palette: p } = frame;
  const rim = w * 0.022;
  return `<defs>
    <pattern id="print-fibers" width="79" height="67" patternUnits="userSpaceOnUse">
      <path d="M5 11l9 -2M38 45l6 2M66 23l4 -1" stroke="${p.ink}" stroke-width=".7" opacity=".12"/>
      <path d="M17 38l8 1M51 8l7 -2M63 59l6 1" stroke="#ffffff" stroke-width="1.2" opacity=".55"/>
      <circle cx="31" cy="21" r=".8" fill="${p.ink}" opacity=".1"/>
      <circle cx="72" cy="44" r="1.1" fill="#ffffff" opacity=".5"/>
    </pattern>
    <linearGradient id="print-light" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#ffffff" stop-opacity=".08"/>
      <stop offset=".6" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="${p.ink}" stop-opacity=".035"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#print-light)"/>
  <rect width="${w}" height="${h}" fill="url(#print-fibers)"/>
  <rect x="${rim / 2}" y="${rim / 2}" width="${w - rim}" height="${h - rim}" fill="none" stroke="#fffcf7" stroke-width="${rim}"/>
  <rect x="${rim + 2}" y="${rim + 2}" width="${w - rim * 2 - 4}" height="${h - rim * 2 - 4}" fill="none" stroke="${p.ink}" stroke-width="1.2" opacity=".16"/>`;
}
