import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1360, height: 1600 },
    deviceScaleFactor: 1,
  });
  await page.goto('http://127.0.0.1:5173/tests/harness.html');
  await page.evaluate(async () => {
    const { ARRuntime } = await import('/src/core/ar/runtime.ts');
    const { arEffects } = await import('/src/core/ar/effects.ts');
    const { drawAR } = await import('/src/core/ar/draw.ts');
    const im = new Image();
    im.src = '/artwork/materials/portrait-a.jpg';
    await im.decode();
    const photo = document.createElement('canvas');
    photo.width = 600;
    photo.height = 750;
    const ctx = photo.getContext('2d');
    ctx.fillStyle = '#d9cbbd';
    ctx.fillRect(0, 0, 600, 750);
    ctx.drawImage(im, 75, 100, 450, (450 * im.naturalHeight) / im.naturalWidth);
    const engine = new ARRuntime(),
      face = await engine.infer(photo, 'face'),
      person = await engine.infer(photo, 'person');
    document.body.replaceChildren();
    document.body.style.cssText =
      'margin:0;padding:44px;background:#f7f6f2;font-family:DM Sans,sans-serif;color:#282d29';
    const title = document.createElement('h1');
    title.textContent = 'Fotbooth / AR playground';
    title.style.cssText = 'font-size:36px;margin:0 0 8px;font-weight:500;letter-spacing:-1px';
    document.body.append(title);
    const sub = document.createElement('p');
    sub.textContent = '16 pilihan · landmark dan mask dari model asli · sampel foto buatan AI';
    sub.style.cssText = 'margin:0 0 28px;color:#626960';
    document.body.append(sub);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:18px';
    document.body.append(grid);
    for (const effect of arEffects.filter((item) => item.id !== 'none')) {
      const tile = document.createElement('div');
      tile.style.cssText =
        'background:#fffdf8;padding:10px;border:1px solid #dcded5;border-radius:14px';
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      canvas.style.cssText = 'width:100%;display:block;border-radius:8px';
      const detection = ['studio', 'aquarium', 'neon', 'outline'].includes(effect.id)
        ? person
        : face;
      drawAR(canvas, photo, {
        ...detection,
        effect: effect.id,
        time: 1234,
        faces: detection.faces.map((f) =>
          effect.group === 'Reaksi'
            ? { ...f, expressions: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8, jawOpen: 0.8 } }
            : f,
        ),
      });
      const name = document.createElement('p');
      name.textContent = effect.name;
      name.style.cssText = 'margin:10px 0 3px;font-size:15px;font-weight:600';
      tile.append(canvas, name);
      grid.append(tile);
    }
    const note = document.createElement('p');
    note.textContent =
      'Efek reaksi dicontohkan dengan skor senyum/mulut. Animasi dibekukan saat shutter. Kamera fisik dan HP belum diuji.';
    note.style.cssText = 'margin:24px 0 0;font-size:13px;color:#626960';
    document.body.append(note);
    engine.close();
  });
  await page.screenshot({ path: 'docs/qa/ar-effects-board.png', fullPage: true });
} finally {
  await browser.close();
}
