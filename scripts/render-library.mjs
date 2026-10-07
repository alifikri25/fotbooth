import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { definitions } from '../src/frames/definitions.ts';
import { encoreIds, originalSignatureIds } from '../src/frames/signature.ts';

// Bounded batches prevent the QA generator from retaining a canvas per frame.
const baseURL = process.env.FOTBOOTH_BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const thumbnails = [];
const batchSize = 6;
try {
  const page = await browser.newPage();
  // Asset regeneration can queue a Vite reload; let it settle before evaluating the catalog.
  await page.goto(`${baseURL}/tests/harness.html`, { waitUntil: 'networkidle' });
  const orderedIds = await page.evaluate(async () =>
    (await import('/src/frames/catalog.ts')).frames.map((f) => f.id),
  );
  await fs.mkdir('docs/qa', { recursive: true });
  for (let start = 0; start < orderedIds.length; start += batchSize) {
    const images = await page.evaluate(
      async (ids) => {
        const { definitions } = await import('/src/frames/definitions.ts');
        const { renderComposition, loadLayer } = await import('/src/core/renderer.ts');
        const { ensureFonts } = await import('/src/core/text.ts');
        await ensureFonts();
        const photos = await Promise.all(
          [1, 2, 3].map((n) => loadLayer(`/samples/friend-${n}.svg`)),
        );
        const canvas = document.createElement('canvas');
        const thumb = document.createElement('canvas');
        const output = [];
        for (const id of ids) {
          const frame = definitions.find((f) => f.id === id);
          const session = {
            caption: 'hari ini, kita.',
            date: '',
            placements: frame.slots.map((s, i) => ({
              slotId: s.id,
              photoId: String(i % 3),
              fitMode: 'cover',
              centerX: 0.5,
              centerY: 0.5,
              zoom: 1,
              rotation: 0,
              mirror: false,
            })),
          };
          const resolve = async (id) => {
            const image = photos[Number(id)];
            return { image, width: image.naturalWidth, height: image.naturalHeight };
          };
          await renderComposition(
            canvas,
            frame,
            session,
            resolve,
            frame.designWidth,
            frame.designHeight,
          );
          const standard = canvas.toDataURL('image/png').split(',')[1];
          // Public gallery shows empty frames. Sample fixtures are only used for export QA.
          await renderComposition(
            canvas, frame, { placements: [], caption: '', date: '' },
            async () => { throw new Error('Neutral gallery must not resolve sample photos'); },
            frame.designWidth, frame.designHeight,
          );
          thumb.height = 600;
          thumb.width = Math.round((600 * frame.designWidth) / frame.designHeight);
          thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
          const thumbnail = thumb.toDataURL('image/png').split(',')[1];
          await renderComposition(
            canvas,
            frame,
            session,
            resolve,
            frame.designWidth / 2,
            frame.designHeight / 2,
          );
          const light = canvas.toDataURL('image/png').split(',')[1];
          await renderComposition(
            canvas,
            frame,
            {
              ...session,
              caption: 'Hari yang akan selalu kita ingat bersama',
              date: '2026-10-06',
              placements: session.placements.map((p, i) => ({
                ...p,
                fitMode: i % 2 ? 'cover' : 'contain',
                zoom: i % 2 ? 1.6 : 1,
                rotation: (i % 4) * 90,
                mirror: i % 2 === 0,
              })),
            },
            resolve,
            frame.designWidth,
            frame.designHeight,
          );
          output.push({
            id,
            name: frame.name,
            categories: frame.categories,
            thumbnailPath: frame.thumbnail,
            thumbnail,
            standard,
            light,
            details: canvas.toDataURL('image/png').split(',')[1],
          });
        }
        canvas.width = 1;
        canvas.height = 1;
        return output;
      },
      orderedIds.slice(start, start + batchSize),
    );
    for (const item of images) {
      await fs.writeFile(
        `public${item.thumbnailPath}`,
        Buffer.from(item.thumbnail, 'base64'),
      );
      for (const [kind, suffix] of [
        ['standard', ''],
        ['light', '-light'],
        ['details', '-details'],
      ])
        await fs.writeFile(`docs/qa/${item.id}${suffix}.png`, Buffer.from(item[kind], 'base64'));
      thumbnails.push({
        id: item.id,
        name: item.name,
        categories: item.categories,
        thumbnail: item.thumbnail,
      });
    }
    console.log(`Rendered ${Math.min(start + batchSize, orderedIds.length)}/${orderedIds.length} frames.`);
  }
  for (const [name, items, columns] of [
    ['frame-contact-sheet', thumbnails, 6],
    ['decorated-design-board', thumbnails.slice(0, 12), 4],
    ['signature-design-board', thumbnails.filter((frame) => originalSignatureIds.includes(frame.id)), 4],
    ['signature-encore-board', thumbnails.filter((frame) => encoreIds.includes(frame.id)), 5],
    ['cartoon-contact-sheet', thumbnails.filter((f) => f.categories.includes('cartoon')), 4],
    ...Array.from({ length: Math.ceil(thumbnails.length / 12) }, (_, i) => [
      `library-${String(i + 1).padStart(2, '0')}`,
      thumbnails.slice(i * 12, i * 12 + 12),
      4,
    ]),
  ]) {
    const data = await page.evaluate(
      async ({ items, columns }) => {
        const sheet = document.createElement('canvas');
        sheet.width = columns * 400;
        sheet.height = Math.ceil(items.length / columns) * 790;
        const c = sheet.getContext('2d');
        c.fillStyle = '#f7f3ed';
        c.fillRect(0, 0, sheet.width, sheet.height);
        await Promise.all(
          items.map(async (f, i) => {
            const image = new Image();
            image.src = `data:image/png;base64,${f.thumbnail}`;
            await image.decode();
            const x = (i % columns) * 400,
              y = Math.floor(i / columns) * 790;
            c.drawImage(image, x + (400 - image.width) / 2, y + 55);
            c.font = '500 19px "DM Sans"';
            c.fillStyle = '#413a36';
            c.textAlign = 'center';
            c.fillText(f.name, x + 200, y + 707);
            c.font = '12px "DM Sans"';
            c.fillStyle = '#80756c';
            c.fillText(f.id, x + 200, y + 736);
          }),
        );
        return sheet.toDataURL('image/png').split(',')[1];
      },
      { items, columns },
    );
    await fs.writeFile(`docs/qa/${name}.png`, Buffer.from(data, 'base64'));
  }
  await fs.writeFile(
    'docs/qa/library-generation.json',
    JSON.stringify(
      {
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()),
        versions: [...new Set(definitions.map((f) => f.version))],
        gallery: 'Neutral empty photo areas; no photographic or illustrated people',
        count: definitions.length,
        decorated: definitions.filter((f) => f.artwork).length,
        frames: thumbnails.map(({ thumbnail, ...f }) => f),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Generated ${thumbnails.length} thumbnails and full/light/detail evidence, with 5 paged contact sheets.`,
  );
} finally {
  await browser.close();
}
