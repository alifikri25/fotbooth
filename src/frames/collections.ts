import type { FrameDefinition, SlotDefinition } from '../core/types';
import { frame, slot } from './factory.ts';

// Each collection has its own illustration vocabulary. Editions change the
// composition, photo count, paper treatment and placement of the artwork.
export const collections = [
  {
    id: 'petal-post',
    name: 'Petal Post',
    motif: 'flower',
    tags: ['floral', 'soft'],
    colors: ['#fff6ee', '#694437', '#da8076', '#adbe8b'],
    note: 'Buket bunga, kelopak berlapis dan kertas surat bertekstur.',
    serif: true,
  },
  {
    id: 'ribbon-diary',
    name: 'Ribbon Diary',
    motif: 'bow',
    tags: ['romantic', 'soft'],
    colors: ['#fff0f4', '#743747', '#d86787', '#c5b6df'],
    note: 'Pita satin, renda scallop, mutiara dan label buku harian.',
    serif: true,
  },
  {
    id: 'cherry-kiss',
    name: 'Cherry Kiss',
    motif: 'cherry',
    tags: ['romantic', 'playful', 'retro'],
    colors: ['#fff6e7', '#722e37', '#d64b56', '#a6ba88'],
    note: 'Ceri merah, gingham, hati dan stiker buah mengilap.',
  },
  {
    id: 'denim-daisy',
    name: 'Denim Daisy',
    motif: 'daisy',
    tags: ['floral', 'scrapbook'],
    colors: ['#d9e6f1', '#314b68', '#faf0c7', '#82a2c1'],
    note: 'Denim dengan jahitan, bunga daisy putih dan patch kain.',
  },
  {
    id: 'star-studio',
    name: 'Star Studio',
    motif: 'sparkle',
    tags: ['dynamic', 'futuristic'],
    colors: ['#efeaff', '#42325b', '#a585d8', '#f8c9e0'],
    note: 'Bintang krom, kilau berlapis dan garis orbit Y2K.',
  },
  {
    id: 'midnight-film',
    name: 'Midnight Film',
    motif: 'film',
    tags: ['retro', 'scrapbook'],
    colors: ['#29272c', '#fff0d5', '#dc925b', '#60595b'],
    note: 'Lubang film analog, nomor negatif, tape dan cahaya amber.',
    serif: true,
  },
  {
    id: 'citrus-club',
    name: 'Citrus Club',
    motif: 'orange',
    tags: ['playful', 'nature'],
    colors: ['#fff3ce', '#496037', '#eda547', '#b2c875'],
    note: 'Irisan jeruk, daun dan label minuman musim panas.',
  },
  {
    id: 'ocean-postcard',
    name: 'Ocean Postcard',
    motif: 'shell',
    tags: ['nature', 'scrapbook', 'soft'],
    colors: ['#e9f3f4', '#345d72', '#e6af92', '#98c7cd'],
    note: 'Kerang, ombak, perangko dan kartu pos pantai.',
    serif: true,
  },
  {
    id: 'botanical-journal',
    name: 'Botanical Journal',
    motif: 'leaf',
    tags: ['nature', 'floral', 'scrapbook'],
    colors: ['#f2efdf', '#405544', '#8fa87c', '#d6b48b'],
    note: 'Daun herbarium, cap botani dan halaman jurnal.',
    serif: true,
  },
  {
    id: 'butterfly-notes',
    name: 'Butterfly Notes',
    motif: 'butterfly',
    tags: ['soft', 'nature', 'scrapbook'],
    colors: ['#f1eafa', '#624b79', '#b18acb', '#e5b3cc'],
    note: 'Kupu-kupu bersayap dekoratif, jejak terbang dan kertas memo.',
    serif: true,
  },
  {
    id: 'retro-diner',
    name: 'Retro Diner',
    motif: 'record',
    tags: ['retro', 'playful'],
    colors: ['#fae6d6', '#693c3a', '#df7c65', '#90bab0'],
    note: 'Piringan hitam, checker diner, sinar matahari dan tiket musik.',
  },
  {
    id: 'pixel-play',
    name: 'Pixel Play',
    motif: 'pixel',
    tags: ['futuristic', 'cartoon', 'dynamic'],
    colors: ['#eee4ff', '#4c356b', '#be8ae2', '#9acbad'],
    note: 'Hati piksel, konsol mini, tombol arcade dan tangga warna.',
  },
  {
    id: 'cosmic-disco',
    name: 'Cosmic Disco',
    motif: 'disco',
    tags: ['futuristic', 'party', 'dynamic'],
    colors: ['#282440', '#fff3de', '#d496d8', '#a2c3e4'],
    note: 'Bola disko mozaik, bintang dan orbit neon.',
  },
  {
    id: 'heart-mail',
    name: 'Heart Mail',
    motif: 'envelope',
    tags: ['romantic', 'scrapbook'],
    colors: ['#f9eadf', '#803e48', '#cd6b7a', '#d9b1a0'],
    note: 'Amplop cinta, segel hati, cap pos dan perangko.',
    serif: true,
  },
  {
    id: 'lace-story',
    name: 'Lace Story',
    motif: 'lace',
    tags: ['romantic', 'soft'],
    colors: ['#fff7ec', '#726354', '#c5aa8b', '#d9cab7'],
    note: 'Doily renda, mutiara, pita kecil dan emboss bunga.',
    serif: true,
  },
  {
    id: 'gingham-picnic',
    name: 'Gingham Picnic',
    motif: 'basket',
    tags: ['nature', 'playful'],
    colors: ['#fff3d9', '#5d4c35', '#d39475', '#a2b881'],
    note: 'Keranjang anyam, taplak gingham dan piknik bunga.',
  },
  {
    id: 'teddy-memory',
    name: 'Teddy Memory',
    motif: 'bear',
    tags: ['cartoon', 'soft', 'playful'],
    colors: ['#f7e8d8', '#644536', '#c69972', '#b8c8bb'],
    note: 'Boneka beruang, patch hati, jahitan dan bintang lembut.',
  },
  {
    id: 'coffee-date',
    name: 'Coffee Date',
    motif: 'coffee',
    tags: ['retro', 'scrapbook'],
    colors: ['#eee0cc', '#674635', '#a87656', '#c6b38e'],
    note: 'Cangkir latte, biji kopi, kuitansi dan kertas kraft.',
    serif: true,
  },
  {
    id: 'birthday-confetti',
    name: 'Birthday Confetti',
    motif: 'cake',
    tags: ['party', 'playful', 'dynamic'],
    colors: ['#fff1e2', '#754a60', '#e18ea1', '#a7cace'],
    note: 'Kue ulang tahun, lilin, balon dan confetti warna-warni.',
  },
  {
    id: 'graduation-club',
    name: 'Graduation Club',
    motif: 'graduate',
    tags: ['party', 'retro'],
    colors: ['#ece7d8', '#36465a', '#c2a052', '#9eafba'],
    note: 'Topi wisuda, medali, laurel dan pita kelulusan.',
    serif: true,
  },
  {
    id: 'wedding-bloom',
    name: 'Wedding Bloom',
    motif: 'rings',
    tags: ['romantic', 'floral'],
    colors: ['#faf3e9', '#635341', '#bf9b5c', '#a5b095'],
    note: 'Cincin emas, buket mawar, daun dan pita pengantin.',
    serif: true,
  },
  {
    id: 'kpop-starlight',
    name: 'Kpop Starlight',
    motif: 'headphones',
    tags: ['futuristic', 'party', 'dynamic'],
    colors: ['#ede6fa', '#604771', '#bd91d0', '#a3cbd2'],
    note: 'Headphone, hati holografis, kilau dan stiker photocard.',
  },
  {
    id: 'halloween-party',
    name: 'Halloween Party',
    motif: 'pumpkin',
    tags: ['seasonal', 'cartoon', 'party'],
    colors: ['#f6dfcd', '#513d51', '#d58a50', '#a894ba'],
    note: 'Labu lucu, hantu mini, bulan dan bintang malam.',
  },
  {
    id: 'festive-wishes',
    name: 'Festive Wishes',
    motif: 'gift',
    tags: ['seasonal', 'party'],
    colors: ['#eff2e5', '#37594e', '#bc665b', '#c6b47f'],
    note: 'Hadiah berpita, ranting evergreen, lonceng dan confetti.',
    serif: true,
  },
  {
    id: 'garden-paint',
    name: 'Garden Paint',
    motif: 'tulip',
    tags: ['floral', 'nature', 'soft'],
    colors: ['#fff1e8', '#674553', '#d78396', '#a1bc96'],
    note: 'Tulip, sapuan cat, kelopak dan kolase kebun.',
    serif: true,
  },
  {
    id: 'pop-doodle',
    name: 'Pop Doodle',
    motif: 'smiley',
    tags: ['cartoon', 'playful', 'dynamic'],
    colors: ['#fcf0bd', '#574654', '#e89a9e', '#a9b5de'],
    note: 'Smiley, doodle tangan, petir, bintang dan stiker pop.',
  },
] as const;

export const editions = [
  {
    id: 'trio',
    name: 'Trio',
    format: 'strip',
    slots: () => [
      slot(1, 0.075, 0.155, 0.85, 0.225),
      slot(2, 0.075, 0.405, 0.85, 0.225),
      slot(3, 0.075, 0.655, 0.85, 0.225),
    ],
  },
  {
    id: 'wander',
    name: 'Wander',
    format: 'strip',
    slots: () => [
      slot(1, 0.07, 0.155, 0.86, 0.22, 'roundedRect', { radius: 45, rotationDeg: -1.3 }),
      slot(2, 0.095, 0.405, 0.83, 0.22, 'roundedRect', { radius: 70, rotationDeg: 1.2 }),
      slot(3, 0.06, 0.655, 0.88, 0.22, 'roundedRect', { radius: 35, rotationDeg: -1 }),
    ],
  },
  {
    id: 'mini',
    name: 'Mini',
    format: 'strip',
    slots: () =>
      [0.15, 0.337, 0.524, 0.711].map((y, i) =>
        slot(i + 1, 0.08, y, 0.84, 0.166, 'roundedRect', { radius: 22 }),
      ),
  },
  {
    id: 'duo',
    name: 'Duo',
    format: 'strip',
    slots: () => [slot(1, 0.075, 0.15, 0.85, 0.345), slot(2, 0.075, 0.535, 0.85, 0.345)],
  },
  {
    id: 'arch',
    name: 'Arch',
    format: 'strip',
    slots: () => [
      slot(1, 0.05, 0.145, 0.9, 0.235, 'path', { pathRef: 'arch' }),
      slot(2, 0.05, 0.395, 0.9, 0.235, 'roundedRect', { radius: 95 }),
      slot(3, 0.05, 0.645, 0.9, 0.235, 'roundedRect', { radius: 35 }),
    ],
  },
  {
    id: 'film',
    name: 'Film',
    format: 'strip',
    slots: () => [0.155, 0.405, 0.655].map((y, i) => slot(i + 1, 0.11, y, 0.78, 0.24, 'rect')),
  },
  {
    id: 'offset',
    name: 'Offset',
    format: 'strip',
    slots: () => [
      slot(1, 0.055, 0.155, 0.89, 0.225, 'rect'),
      slot(2, 0.11, 0.405, 0.835, 0.225, 'roundedRect', { radius: 55 }),
      slot(3, 0.055, 0.655, 0.89, 0.225, 'rect'),
    ],
  },
  {
    id: 'portrait',
    name: 'Portrait',
    format: 'card',
    slots: () => [
      slot(1, 0.06, 0.145, 0.415, 0.73, 'roundedRect', { radius: 95 }),
      slot(2, 0.525, 0.145, 0.415, 0.73, 'roundedRect', { radius: 95 }),
    ],
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    format: 'card',
    slots: () => [
      slot(1, 0.06, 0.145, 0.425, 0.34),
      slot(2, 0.515, 0.145, 0.425, 0.34),
      slot(3, 0.06, 0.535, 0.425, 0.34),
      slot(4, 0.515, 0.535, 0.425, 0.34),
    ],
  },
  {
    id: 'story',
    name: 'Story',
    format: 'card',
    slots: () => [
      slot(1, 0.06, 0.145, 0.88, 0.365, 'roundedRect', { radius: 40 }),
      slot(2, 0.06, 0.555, 0.425, 0.32, 'rect'),
      slot(3, 0.515, 0.555, 0.425, 0.32, 'path', { pathRef: 'chamfer' }),
    ],
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    format: 'card',
    slots: () => [
      slot(1, 0.065, 0.15, 0.42, 0.337, 'rect', { rotationDeg: -1.2 }),
      slot(2, 0.52, 0.15, 0.42, 0.337, 'rect', { rotationDeg: 1.2 }),
      slot(3, 0.065, 0.535, 0.42, 0.337, 'rect', { rotationDeg: 1.2 }),
      slot(4, 0.52, 0.535, 0.42, 0.337, 'rect', { rotationDeg: -1.2 }),
    ],
  },
] satisfies { id: string; name: string; format: 'strip' | 'card'; slots: () => SlotDefinition[] }[];

const signatureEditions: Record<string, string> = {
  'petal-post': 'story',
  'ribbon-diary': 'trio',
  'cherry-kiss': 'film',
  'denim-daisy': 'polaroid',
  'star-studio': 'wander',
  'midnight-film': 'film',
  'citrus-club': 'mini',
  'ocean-postcard': 'story',
  'botanical-journal': 'portrait',
  'butterfly-notes': 'arch',
  'retro-diner': 'offset',
  'pixel-play': 'mini',
  'cosmic-disco': 'mosaic',
  'heart-mail': 'duo',
  'lace-story': 'arch',
  'gingham-picnic': 'mini',
  'teddy-memory': 'trio',
  'coffee-date': 'polaroid',
  'birthday-confetti': 'story',
  'graduation-club': 'duo',
  'wedding-bloom': 'portrait',
  'kpop-starlight': 'wander',
  'halloween-party': 'mosaic',
  'festive-wishes': 'offset',
  'garden-paint': 'story',
  'pop-doodle': 'wander',
};
const extraEditions: Record<string, string[]> = {
  'ribbon-diary': ['portrait', 'wander', 'polaroid'],
  'petal-post': ['trio', 'arch', 'mosaic'],
  'cherry-kiss': ['trio', 'story'],
  'denim-daisy': ['trio', 'portrait'],
  'heart-mail': ['trio', 'story'],
  'botanical-journal': ['trio'],
  'ocean-postcard': ['trio'],
  'teddy-memory': ['mosaic'],
  'midnight-film': ['polaroid'],
  'butterfly-notes': ['story'],
  'wedding-bloom': ['trio'],
};

export const collectionFrames: FrameDefinition[] = collections.flatMap((collection) =>
  editions
    .map((edition, index) => {
      const colors = [...collection.colors];
      // Five deliberately different paper treatments keep each theme coherent.
      if ([2, 5, 8].includes(index) && !['midnight-film', 'cosmic-disco'].includes(collection.id)) {
        colors[0] = collection.colors[3];
        colors[3] = collection.colors[0];
      }
      const f = frame(
        `${collection.id}-${edition.id}`,
        `${collection.name} ${edition.name}`,
        edition.format,
        [...collection.tags],
        colors,
        edition.slots(),
        `${collection.note} Edisi ${edition.name}, ${edition.slots().length} foto.`,
        'serif' in collection && collection.serif,
      );
      f.collection = collection.name;
      f.artwork = { motif: collection.motif, edition: index };
      f.textAreas[0] = {
        ...f.textAreas[0],
        y: 0.019,
        h: 0.035,
        fontSize: edition.format === 'strip' ? 74 : 94,
        text: collection.name,
      };
      f.textAreas[1] = {
        ...f.textAreas[1],
        y: 0.918,
        h: 0.045,
        x: 0.16,
        w: 0.68,
        fontSize: 48,
        minFontSize: 28,
      };
      if (['midnight-film', 'cosmic-disco'].includes(collection.id))
        f.textAreas[1].color = '#483b45';
      return f;
    })
    .filter((f) => {
      const edition = editions[f.artwork!.edition].id;
      return (
        signatureEditions[collection.id] === edition ||
        extraEditions[collection.id]?.includes(edition)
      );
    }),
);
