import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/tests/harness.html', { waitUntil: 'networkidle' });
  const output = await page.evaluate(async () => {
    const { frames } = await import('/src/frames/catalog.ts');
    const { ensureFonts } = await import('/src/core/text.ts');
    await ensureFonts();
    const examples = [
      ['aquarium-parade', 'Ombak & bintang laut'],
      ['stellar-atlas', 'Bintang & nebula'],
      ['desert-bazaar', 'Kelopak & batu organik'],
      ['dragon-lantern', 'Ombak & kelopak'],
      ['wedding-bloom-portrait', 'Hati & kelopak'],
      ['froggy-day', 'Batu organik & awan'],
      ['denim-daisy-portrait', 'Kelopak & kertas sobek'],
      ['ribbon-diary-portrait', 'Hati & awan'],
      ['botanical-journal-portrait', 'Batu organik & kelopak'],
    ];
    const canvas = document.createElement('canvas');
    canvas.width = 1120;
    canvas.height = 1900;
    const c = canvas.getContext('2d');
    c.fillStyle = '#f7f4ef';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#302d28';
    c.font = '500 44px "DM Sans"';
    c.fillText('Khusus kolom foto yang panjang sempit.', 48, 65);
    c.font = '22px "DM Sans"';
    c.fillStyle = '#716b61';
    c.fillText('9 layout direvisi. Frame persegi dan layout normal tetap seperti semula.', 48, 105);
    for (let i = 0; i < examples.length; i++) {
      const [id, note] = examples[i];
      const frame = frames.find((f) => f.id === id);
      const image = new Image();
      image.src = frame.thumbnail;
      await image.decode();
      const x = 32 + (i % 3) * 352;
      const y = 146 + Math.floor(i / 3) * 580;
      const h = 456;
      const w = (h * image.naturalWidth) / image.naturalHeight;
      c.drawImage(image, x + (320 - w) / 2, y, w, h);
      c.textAlign = 'center';
      c.fillStyle = '#302d28';
      c.font = '500 22px "DM Sans"';
      c.fillText(frame.name, x + 160, y + h + 35);
      c.fillStyle = '#716b61';
      c.font = '17px "DM Sans"';
      c.fillText(note, x + 160, y + h + 63);
    }
    const preview = canvas.toDataURL('image/png').split(',')[1];
    canvas.width = 840;
    canvas.height = 790;
    c.fillStyle = '#f7f4ef';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.textAlign = 'center';
    c.font = '500 30px "DM Sans"';
    c.fillStyle = '#302d28';
    c.fillText('Aquarium Parade', 420, 48);
    for (const [i, url, label] of [
      [0, '/frames/aquarium-parade/v1/thumbnail-neutral.png', 'Sebelumnya'],
      [1, frames.find((f) => f.id === 'aquarium-parade').thumbnail, 'Bentuk baru'],
    ]) {
      const image = new Image();
      image.src = url;
      await image.decode();
      c.drawImage(image, 36 + i * 408, 83, 360, 540);
      c.font = '500 23px "DM Sans"';
      c.fillStyle = '#302d28';
      c.fillText(label, 216 + i * 408, 675);
    }
    return { preview, comparison: canvas.toDataURL('image/png').split(',')[1] };
  });
  await fs.mkdir('docs/qa', { recursive: true });
  await fs.writeFile('docs/qa/sculpted-design-preview.png', Buffer.from(output.preview, 'base64'));
  await fs.writeFile(
    'docs/qa/sculpted-aquarium-before-after.png',
    Buffer.from(output.comparison, 'base64'),
  );
  console.log('Saved sculpted design preview and Aquarium comparison.');
} finally {
  await browser.close();
}
