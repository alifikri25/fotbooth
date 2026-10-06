const segmenter = new Intl.Segmenter('id', { granularity: 'grapheme' });
export const graphemes = (value: string) => Array.from(segmenter.segment(value), (s) => s.segment);
export function limitCaption(value: string): string {
  return graphemes(value.replace(/[\r\n]+/g, ' '))
    .slice(0, 40)
    .join('');
}
export function fitText(
  value: string,
  width: number,
  height: number,
  max: number,
  min: number,
  maxLines: number,
  measure: (text: string, size: number) => number,
): { size: number; lines: string[] } | null {
  for (let size = max; size >= min; size--) {
    const lines: string[] = [];
    let line = '';
    for (const word of value.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, size) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (
      lines.length <= maxLines &&
      lines.length * size * 1.2 <= height &&
      lines.every((l) => measure(l, size) <= width)
    )
      return { size, lines };
  }
  return null;
}
export const fontFamily = (id: string) => (id === 'serif' ? '"Fraunces"' : '"DM Sans"');
export async function ensureFonts() {
  for (const family of ['"DM Sans"', '"Fraunces"']) {
    await document.fonts.load(`500 48px ${family}`);
    if (
      !document.fonts.check(`500 48px ${family}`) ||
      !Array.from(document.fonts).some(
        (font) =>
          font.family.replaceAll('"', '') === family.replaceAll('"', '') &&
          font.status === 'loaded',
      )
    )
      throw new Error('Font belum siap. Coba muat ulang halaman.');
  }
}
