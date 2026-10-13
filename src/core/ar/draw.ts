import { facePose, reactionActive } from './effects';
import type { ARSnapshot } from './types';
type Context = CanvasRenderingContext2D;
const colors = ['#ff648d', '#ffe77e', '#61e9dd', '#b79aff', '#ffad72'];
function ellipse(ctx: Context, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function polygon(ctx: Context, points: number[][], color: string, stroke = '#302337') {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function star(ctx: Context, x: number, y: number, r: number, color: string, angle = 0) {
  polygon(
    ctx,
    Array.from({ length: 10 }, (_, i) => {
      const a = angle + (i * Math.PI) / 5 - Math.PI / 2,
        d = i % 2 ? r * 0.45 : r;
      return [x + Math.cos(a) * d, y + Math.sin(a) * d];
    }),
    color,
    '',
  );
}
function heart(ctx: Context, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r, r);
  ctx.beginPath();
  ctx.moveTo(0, 0.9);
  ctx.bezierCurveTo(-1.8, -0.1, -0.8, -1.4, 0, -0.55);
  ctx.bezierCurveTo(0.8, -1.4, 1.8, -0.1, 0, 0.9);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
function butterfly(ctx: Context, x: number, y: number, r: number, phase: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(phase) * 0.25);
  const wing = 0.65 + 0.25 * Math.sin(phase);
  ellipse(ctx, -r * 0.42, 0, r * wing, r * 0.7, '#ba9aff');
  ellipse(ctx, r * 0.42, 0, r * wing, r * 0.7, '#ff9bc2');
  ellipse(ctx, -r * 0.4, r * 0.6, r * 0.42, r * 0.4, '#8edfff');
  ellipse(ctx, r * 0.4, r * 0.6, r * 0.42, r * 0.4, '#ffe590');
  ctx.strokeStyle = '#4b325c';
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.restore();
}
function accessory(
  ctx: Context,
  snapshot: ARSnapshot,
  faceIndex: number,
  width: number,
  height: number,
) {
  const face = snapshot.faces[faceIndex],
    pose = facePose(face.points, width, height);
  if (!pose || !reactionActive(snapshot.effect, face.expressions)) return;
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.angle);
  ctx.scale(pose.width, pose.width);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.014;
  const t = snapshot.time / 1000,
    fx = snapshot.effect;
  if (['cat', 'bunny', 'bear'].includes(fx)) {
    for (const side of [-1, 1]) {
      const x = side * 0.34;
      if (fx === 'cat') {
        polygon(
          ctx,
          [
            [x - 0.16, -0.32],
            [x - 0.1, -0.68],
            [x + 0.17, -0.38],
          ],
          '#ffe8ec',
        );
        polygon(
          ctx,
          [
            [x - 0.1, -0.38],
            [x - 0.07, -0.57],
            [x + 0.09, -0.4],
          ],
          '#ff92b1',
          '',
        );
      } else if (fx === 'bunny') {
        ctx.save();
        ctx.translate(x, -0.54);
        ctx.rotate(side * 0.18);
        ellipse(ctx, 0, 0, 0.12, 0.29, '#fff6ee');
        ctx.strokeStyle = '#6c4058';
        ctx.stroke();
        ellipse(ctx, 0, 0, 0.06, 0.21, '#ff9bbe');
        ctx.restore();
      } else {
        ellipse(ctx, x, -0.43, 0.15, 0.15, '#b57953');
        ctx.strokeStyle = '#513325';
        ctx.stroke();
        ellipse(ctx, x, -0.43, 0.085, 0.085, '#f8ccb0');
      }
    }
    ellipse(ctx, 0, 0.22, 0.045, 0.028, fx === 'bear' ? '#604033' : '#ff89ad');
    if (fx === 'cat')
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = '#704556';
          ctx.lineWidth = 0.009;
          ctx.beginPath();
          ctx.moveTo(side * 0.15, 0.2 + i * 0.04);
          ctx.lineTo(side * 0.4, 0.17 + i * 0.06);
          ctx.stroke();
        }
    ellipse(ctx, -0.28, 0.2, 0.08, 0.035, '#ffa2b5');
    ellipse(ctx, 0.28, 0.2, 0.08, 0.035, '#ffa2b5');
  }
  if (fx === 'glasses') {
    const g = ctx.createLinearGradient(-0.5, -0.12, 0.5, 0.15);
    g.addColorStop(0, '#561dbd');
    g.addColorStop(0.5, '#302753');
    g.addColorStop(1, '#235b7e');
    for (const x of [-0.27, 0.27]) {
      ctx.beginPath();
      ctx.roundRect(x - 0.2, -0.105, 0.4, 0.235, 0.07);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#f5d56d';
      ctx.lineWidth = 0.028;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff8c';
      ctx.lineWidth = 0.014;
      ctx.beginPath();
      ctx.moveTo(x - 0.1, -0.055);
      ctx.lineTo(x - 0.045, 0.075);
      ctx.stroke();
    }
    ctx.strokeStyle = '#f5d56d';
    ctx.beginPath();
    ctx.moveTo(-0.055, 0);
    ctx.quadraticCurveTo(0, -0.055, 0.055, 0);
    ctx.moveTo(-0.47, -0.03);
    ctx.lineTo(-0.57, -0.08);
    ctx.moveTo(0.47, -0.03);
    ctx.lineTo(0.57, -0.08);
    ctx.stroke();
  }
  if (fx === 'crown') {
    polygon(
      ctx,
      [
        [-0.4, -0.33],
        [-0.45, -0.58],
        [-0.22, -0.47],
        [0, -0.72],
        [0.22, -0.47],
        [0.45, -0.58],
        [0.4, -0.33],
      ],
      '#ffdb63',
    );
    ctx.fillStyle = '#e5a845';
    ctx.fillRect(-0.4, -0.37, 0.8, 0.05);
    for (const [x, y] of [
      [-0.45, -0.58],
      [0, -0.72],
      [0.45, -0.58],
    ])
      ellipse(ctx, x, y, 0.04, 0.04, '#fff3b8');
    for (const x of [-0.23, 0, 0.23])
      polygon(
        ctx,
        [
          [x, -0.49],
          [x + 0.045, -0.44],
          [x, -0.39],
          [x - 0.045, -0.44],
        ],
        x ? '#ff80a6' : '#8adfdf',
        '',
      );
  }
  if (fx === 'ribbon') {
    ctx.save();
    ctx.translate(0.14, -0.42);
    ctx.rotate(0.1);
    polygon(
      ctx,
      [
        [0, 0],
        [-0.28, -0.18],
        [-0.3, 0.1],
        [-0.03, 0.06],
      ],
      '#ff719f',
    );
    polygon(
      ctx,
      [
        [0, 0],
        [0.28, -0.18],
        [0.3, 0.1],
        [0.03, 0.06],
      ],
      '#ff91b5',
    );
    polygon(
      ctx,
      [
        [-0.03, 0.03],
        [-0.2, 0.27],
        [-0.04, 0.23],
        [0.02, 0.3],
        [0.07, 0.04],
      ],
      '#ff719f',
    );
    polygon(
      ctx,
      [
        [0.03, 0.03],
        [0.2, 0.27],
        [0.07, 0.23],
        [0.02, 0.3],
        [-0.04, 0.04],
      ],
      '#ffa6c3',
    );
    ellipse(ctx, 0, 0, 0.065, 0.055, '#ffd6e4');
    ctx.stroke();
    ctx.restore();
  }
  if (fx === 'party') {
    polygon(
      ctx,
      [
        [-0.34, -0.3],
        [0.07, -0.92],
        [0.37, -0.3],
      ],
      '#ba9aff',
    );
    polygon(
      ctx,
      [
        [-0.2, -0.51],
        [-0.1, -0.67],
        [0.26, -0.5],
        [0.32, -0.4],
      ],
      '#ffda70',
      '',
    );
    ellipse(ctx, 0.07, -0.92, 0.09, 0.09, '#ff7da4');
    ellipse(ctx, 0.17, -0.65, 0.035, 0.035, '#79efde');
    ellipse(ctx, -0.08, -0.41, 0.04, 0.04, '#ff7da4');
  }
  if (fx === 'blush') {
    for (const side of [-1, 1]) {
      const gradient = ctx.createRadialGradient(side * 0.28, 0.2, 0, side * 0.28, 0.2, 0.14);
      gradient.addColorStop(0, '#ff739580');
      gradient.addColorStop(1, '#ff739500');
      ellipse(ctx, side * 0.28, 0.2, 0.17, 0.1, gradient as unknown as string);
      for (let i = 0; i < 7; i++)
        ellipse(
          ctx,
          side * (0.14 + i * 0.034),
          0.13 + Math.sin(i * 2) * 0.032,
          0.008,
          0.008,
          '#a46355aa',
        );
      star(ctx, side * 0.37, 0.08, 0.027, '#fff4c1');
      star(ctx, side * 0.21, 0.26, 0.018, '#ffe2a0');
    }
  }
  if (fx === 'hearts' || fx === 'butterflies')
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7 + t * 0.25,
        x = Math.cos(angle) * 0.66,
        y = -0.24 + Math.sin(angle) * 0.49;
      if (fx === 'hearts') heart(ctx, x, y, 0.07 + Math.sin(t * 2 + i) * 0.008, colors[i % 5]);
      else butterfly(ctx, x, y, 0.075, t * 5 + i);
    }
  if (fx === 'confetti')
    for (let i = 0; i < 38; i++) {
      const angle = i * 2.399963 + t * 0.3,
        r = 0.55 + (i % 5) * 0.045,
        x = Math.cos(angle) * r,
        y = Math.sin(angle) * r * 0.8 - 0.12;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t + i);
      ctx.fillStyle = colors[i % 5];
      if (i % 3 === 0) star(ctx, 0, 0, 0.035, colors[i % 5]);
      else ctx.fillRect(-0.01, -0.028, 0.02, 0.055);
      ctx.restore();
    }
  if (fx === 'comic') {
    ctx.save();
    ctx.translate(0.55, -0.4);
    ctx.rotate(0.12);
    polygon(
      ctx,
      Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12,
          r = i % 2 ? 0.23 : 0.34;
        return [Math.cos(a) * r, Math.sin(a) * r * 0.8];
      }),
      '#ffdc6a',
    );
    ctx.strokeStyle = '#3f2750';
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.moveTo(0, -0.15);
    ctx.lineTo(0, 0.03);
    ctx.stroke();
    ellipse(ctx, 0, 0.13, 0.025, 0.025, '#3f2750');
    ctx.restore();
    star(ctx, -0.55, -0.27, 0.095, '#ff7d9c');
  }
  ctx.restore();
}
function background(ctx: Context, effect: string, w: number, h: number, time: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  if (effect === 'studio') {
    g.addColorStop(0, '#f7ac94');
    g.addColorStop(1, '#eec7ac');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff2d269';
    ctx.lineWidth = w * 0.03;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.56, w * (0.23 + i * 0.14), Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    star(ctx, w * 0.12, h * 0.25, w * 0.045, '#fff0b7');
    star(ctx, w * 0.87, h * 0.7, w * 0.055, '#ffdda5');
  } else if (effect === 'aquarium') {
    g.addColorStop(0, '#125b9e');
    g.addColorStop(1, '#083e59');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) {
      const x = (((i * 137.5) % 100) / 100) * w,
        y = (((i * 79 + time * 0.013) % 100) / 100) * h,
        r = w * (0.01 + (i % 4) * 0.005);
      ellipse(ctx, x, y, r, r, '#a4f3ee18');
      ctx.strokeStyle = '#96fff066';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const x = ((i * 0.157 + time * 0.000025) % 1) * w,
        y = h * (0.1 + (i % 4) * 0.22),
        r = w * 0.026;
      ellipse(ctx, x, y, r * 1.4, r, colors[i % 5]);
      polygon(
        ctx,
        [
          [x + r, y],
          [x + r * 2.5, y - r],
          [x + r * 2.5, y + r],
        ],
        colors[i % 5],
        '',
      );
      ellipse(ctx, x - r * 0.65, y - r * 0.15, r * 0.13, r * 0.13, '#17454e');
    }
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = i % 2 ? '#38b7a5' : '#62d3aa';
      ctx.lineWidth = w * 0.014;
      ctx.beginPath();
      const x = (w * i) / 11;
      ctx.moveTo(x, h);
      ctx.bezierCurveTo(
        x - w * 0.07,
        h * 0.93,
        x + w * 0.08,
        h * 0.82,
        x,
        h * (0.8 + (i % 3) * 0.045),
      );
      ctx.stroke();
    }
  } else {
    g.addColorStop(0, '#261040');
    g.addColorStop(1, '#071d3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const x = (w * i) / 15,
        bh = h * (0.18 + ((i * 17) % 7) * 0.065);
      ctx.fillStyle = i % 2 ? '#30174c' : '#112b49';
      ctx.fillRect(x, h - bh, w * 0.078, bh);
      ctx.fillStyle = i % 2 ? '#ff51c4' : '#58dfe8';
      for (let j = 0; j < 5; j++)
        ctx.fillRect(x + w * 0.019, h - bh + h * 0.028 + j * h * 0.056, w * 0.025, h * 0.012);
    }
    ctx.strokeStyle = '#ad56df66';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.67);
      ctx.lineTo(w * (i / 11), h);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * (0.73 + i * 0.055));
      ctx.lineTo(w, h * (0.73 + i * 0.055));
      ctx.stroke();
    }
    ellipse(ctx, w * 0.8, h * 0.18, w * 0.09, w * 0.09, '#fa75cdaa');
  }
}
export function drawAR(canvas: HTMLCanvasElement, image: CanvasImageSource, snapshot: ARSnapshot) {
  const ctx = canvas.getContext('2d')!,
    w = canvas.width,
    h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);
  if (snapshot.effect === 'none') return;
  if (snapshot.mask && ['studio', 'aquarium', 'neon', 'outline'].includes(snapshot.effect)) {
    const mask = snapshot.mask,
      surface = document.createElement('canvas');
    surface.width = mask.width;
    surface.height = mask.height;
    const m = surface.getContext('2d')!,
      pixels = m.createImageData(mask.width, mask.height);
    for (let i = 0; i < mask.values.length; i++) {
      const n = Math.max(0, Math.min(1, (mask.values[i] - 0.25) / 0.5));
      pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
      pixels.data[i * 4 + 3] = Math.round(n * n * (3 - 2 * n) * 255);
    }
    m.putImageData(pixels, 0, 0);
    const foreground = document.createElement('canvas');
    foreground.width = w;
    foreground.height = h;
    const f = foreground.getContext('2d')!;
    f.drawImage(image, 0, 0, w, h);
    f.globalCompositeOperation = 'destination-in';
    f.drawImage(surface, 0, 0, w, h);
    if (snapshot.effect === 'outline') {
      ctx.save();
      ctx.shadowColor = '#65ffff';
      ctx.shadowBlur = w * 0.025;
      ctx.drawImage(foreground, 0, 0);
      ctx.shadowColor = '#ff63ce';
      ctx.shadowBlur = w * 0.012;
      ctx.drawImage(foreground, 0, 0);
      ctx.restore();
    } else background(ctx, snapshot.effect, w, h, snapshot.time);
    ctx.drawImage(foreground, 0, 0);
    surface.width = surface.height = foreground.width = foreground.height = 1;
  }
  for (let i = 0; i < snapshot.faces.length; i++) accessory(ctx, snapshot, i, w, h);
}
