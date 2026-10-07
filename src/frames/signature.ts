import type { FrameDefinition } from '../core/types';

export const originalSignatureIds = [
  'midnight-film-polaroid',
  'birthday-confetti-story',
  'concert-pass',
  'lace-story-arch',
  'wedding-bloom-portrait',
  'kpop-starlight-wander',
  'heart-mail-story',
  'cosmic-disco-mosaic',
];
export const encoreIds = [
  'ribbon-diary-trio',
  'ocean-postcard-story',
  'denim-daisy-portrait',
  'butterfly-notes-arch',
  'cherry-kiss-story',
  'citrus-club-mini',
  'coffee-date-polaroid',
  'botanical-journal-portrait',
  'festive-wishes-offset',
  'garden-paint-story',
];
export const signatureIds = [...originalSignatureIds, ...encoreIds];

const designs: Record<
  string,
  {
    name: string;
    description: string;
    colors: string[];
    serif: boolean;
    title?: string;
    titleColor?: string;
  }
> = {
  'midnight-film-polaroid': {
    name: 'Velvet Premiere',
    description:
      'Panggung premiere dengan tirai velvet merah, lampu marquee emas, clapperboard dan empat cetakan foto.',
    colors: ['#650b12', '#441c15', '#eac064', '#a83b29'],
    serif: true,
    titleColor: '#441c15',
  },
  'birthday-confetti-story': {
    name: 'Popstar Birthday',
    description:
      'Pesta ulang tahun pop dengan roket maskot, pita berkelok, halftone dan huruf poster yang berani.',
    colors: ['#e5f7fc', '#23315c', '#e84345', '#81c9e2'],
    serif: true,
    title: 'POPSTAR',
  },
  'concert-pass': {
    name: 'After Hours Ticket',
    description:
      'Tiket photobooth malam dengan kertas perforasi, cap foil, nomor cetak dan barcode dekoratif.',
    colors: ['#112747', '#242b39', '#a38750', '#f7f3e9'],
    serif: true,
    title: 'AFTER HOURS',
  },
  'lace-story-arch': {
    name: 'Sage Atelier',
    description:
      'Kolase kain sage jacquard, satin berlipat, renda gading, anggrek dan tepian jahitan.',
    colors: ['#99a378', '#344431', '#c4ba98', '#f8f3e6'],
    serif: true,
  },
  'wedding-bloom-portrait': {
    name: 'Pearl Vows',
    description:
      'Undangan couture dengan sutra ivory, rangkaian mutiara, mawar dan ornamen emas sampanye.',
    colors: ['#f5ead4', '#5d4931', '#c5a061', '#fcf8ed'],
    serif: true,
  },
  'kpop-starlight-wander': {
    name: 'Holo Encore',
    description:
      'Photocard konser dengan foil lavender holografis, hati chrome, pita metalik dan nomor encore.',
    colors: ['#e4d7fa', '#463161', '#9276c9', '#f5e9ff'],
    serif: false,
  },
  'heart-mail-story': {
    name: 'Rouge Romance',
    description:
      'Editorial surat cinta dengan kertas bergaris merah, amplop berlapis, pita panjang dan segel lilin.',
    colors: ['#f5e9de', '#781d2f', '#a62640', '#e5b3ae'],
    serif: true,
  },
  'cosmic-disco-mosaic': {
    name: 'Disco Royale',
    description:
      'Pesta malam dengan bola disko berkeping kaca, pancaran sorot, foil emas dan empat foto panggung.',
    colors: ['#18132c', '#ffedcc', '#e2b966', '#7652b2'],
    serif: true,
  },
  'ribbon-diary-trio': {
    name: 'Rose Ribbon Salon',
    description:
      'Ribbon Diary couture dengan satin blush, mawar, pita besar, renda gading dan untaian mutiara.',
    colors: ['#e8bec8', '#653849', '#c3a16b', '#fff1e9'],
    serif: true,
  },
  'ocean-postcard-story': {
    name: 'Azure Riviera',
    description:
      'Cetakan Riviera dengan sutra aqua, kerang mother-of-pearl, kilau air dan tepian kartu pos champagne.',
    colors: ['#b7dbe4', '#264d63', '#c6aa6c', '#f6f1e5'],
    serif: true,
  },
  'denim-daisy-portrait': {
    name: 'Denim Bloom Studio',
    description:
      'Denim Daisy couture dengan kain indigo, bordir daisy timbul, jahitan ganda, renda dan kancing mutiara.',
    colors: ['#7fa0bb', '#243e57', '#f4d57b', '#f6f0e4'],
    serif: true,
  },
  'butterfly-notes-arch': {
    name: 'Lilac Conservatory',
    description:
      'Kartu taman kaca lilac dengan kupu-kupu organza, hydrangea, filigree dan kertas botani berlapis.',
    colors: ['#dbcae8', '#574266', '#bc9a64', '#f4edf6'],
    serif: true,
  },
  'cherry-kiss-story': {
    name: 'Cherry Velvet Club',
    description:
      'Editorial ceri dengan velvet burgundy, pita merah, renda dan bingkai foil emas di atas kertas ivory.',
    colors: ['#5c142a', '#6c2135', '#d9b278', '#f7edde'],
    serif: true,
  },
  'citrus-club-mini': {
    name: 'Citrus Sunset',
    description:
      'Summer club dengan sutra tangerine, irisan jeruk segar, bunga citrus, linen dan detail anyaman.',
    colors: ['#e6a75c', '#735034', '#9a8247', '#fff4d8'],
    serif: true,
  },
  'coffee-date-polaroid': {
    name: 'Café Lumière',
    description:
      'Kafe pagi dengan latte art, linen mocha, satin karamel, kertas struk, pita cokelat dan brass clip.',
    colors: ['#b7977c', '#51372d', '#b28e5e', '#f4eadb'],
    serif: true,
  },
  'botanical-journal-portrait': {
    name: 'Emerald Herbarium',
    description:
      'Herbarium kolektor dengan velvet emerald, kain buku, daun pakis, eucalyptus dan filigree emas.',
    colors: ['#244f40', '#244438', '#c9a466', '#f5edde'],
    serif: true,
  },
  'festive-wishes-offset': {
    name: 'Champagne Countdown',
    description:
      'Pesta champagne dengan glitter emas, pita metalik, bokeh, confetti dan tiket kenangan.',
    colors: ['#dfc58e', '#65502d', '#ba9855', '#fff5dc'],
    serif: true,
  },
  'garden-paint-story': {
    name: 'Monet Garden Party',
    description:
      'Garden Paint dengan taman pastel impasto, kertas aquarelle, iris, bunga dan tepian undangan foil.',
    colors: ['#d6dbc1', '#415b4e', '#bf9766', '#f7f1e4'],
    serif: true,
  },
};

export function refineSignature(frame: FrameDefinition): FrameDefinition {
  const design = designs[frame.id];
  if (!design) return frame;
  const base = `/frames/${frame.id}/v3`;
  const colors = design.colors;
  const title = {
    ...frame.textAreas[0],
    text: design.title ?? design.name.toUpperCase(),
    fontId: design.serif ? ('serif' as const) : ('sans' as const),
    x: 0.12,
    y: 0.037,
    w: 0.76,
    h: 0.047,
    fontSize: frame.format === 'card' ? 136 : 105,
    minFontSize: 45,
    maxLines: 1,
    color: design.titleColor ?? colors[1],
  };
  if (frame.id === 'midnight-film-polaroid')
    Object.assign(title, { x: 0.17, w: 0.66, y: 0.047, h: 0.043, fontSize: 120 });
  if (frame.id === 'birthday-confetti-story')
    Object.assign(title, { y: 0.018, h: 0.031, fontSize: 70 });
  if (frame.id === 'concert-pass') Object.assign(title, { y: 0.015, h: 0.03, fontSize: 97 });
  if (frame.id === 'kpop-starlight-wander')
    Object.assign(title, { y: 0.063, h: 0.036, fontSize: 89 });
  if (frame.id === 'cosmic-disco-mosaic')
    Object.assign(title, { y: 0.025, h: 0.04, fontSize: 116 });
  if (encoreIds.includes(frame.id))
    Object.assign(title, {
      x: 0.12,
      w: 0.76,
      y: 0.033,
      h: 0.039,
      fontSize: frame.format === 'card' ? 108 : 88,
    });
  return {
    ...frame,
    name: design.name,
    description: design.description,
    version: 3,
    palette: { background: colors[0], ink: colors[1], accent: colors[2], secondary: colors[3] },
    layers: { background: `${base}/background.svg`, foreground: `${base}/foreground.svg` },
    thumbnail: `${base}/thumbnail.png`,
    textAreas: [
      title,
      ...frame.textAreas.slice(1).map((area) => ({
        ...area,
        color:
          frame.id === 'cosmic-disco-mosaic'
            ? '#382349'
            : frame.id === 'midnight-film-polaroid'
              ? '#fff2c5'
              : colors[1],
      })),
    ],
    licenses: [
      ...frame.licenses,
      'Original signature compositions and generated material artwork for Fotbooth; no Canva template assets.',
    ],
  };
}
