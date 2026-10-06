import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { photoBytes } from './helpers';

for (const width of [360, 1440]) {
  test(`visible controls offer 44px targets and readable text across the flow at ${width}px`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    const contrasts: { checks: number; minimum: number }[] = [];
    await page.addInitScript(() => {
      const deny = async () => {
        throw new DOMException('Denied', 'NotAllowedError');
      };
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny;
      else
        Object.defineProperty(navigator, 'mediaDevices', {
          value: { getUserMedia: deny, enumerateDevices: async () => [] },
        });
    });
    const auditTargets = async () => {
      const undersized = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('button, a[href], input, select'))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
            );
          })
          .map((element) => {
            const target =
              element instanceof HTMLInputElement && element.type === 'checkbox'
                ? (element.closest('label') ?? element)
                : element;
            const rect = target.getBoundingClientRect();
            return {
              name: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.id,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((target) => target.width < 43.9 || target.height < 43.9),
      );
      expect(undersized).toEqual([]);
      const contrast = await page.evaluate(() => {
        const parse = (color: string) => {
          const values = color.match(/[\d.]+/g)!.map(Number);
          return [values[0], values[1], values[2], values[3] ?? 1];
        };
        const luminance = (rgb: number[]) => {
          const linear = rgb.slice(0, 3).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const failures: { name: string; ratio: number }[] = [];
        let checks = 0,
          minimum = Infinity;
        for (const element of document.querySelectorAll<HTMLElement>(
          'button, select, label, .control-help, .muted, .limits, .notice, .range-label span, .control-label span',
        )) {
          const rect = element.getBoundingClientRect();
          if (
            !rect.width ||
            !rect.height ||
            getComputedStyle(element).visibility === 'hidden' ||
            !element.textContent?.trim() ||
            element.querySelector('img') ||
            element.matches(':disabled') ||
            element.closest('fieldset:disabled')
          )
            continue;
          const layers: number[][] = [];
          let gradient = false;
          for (
            let ancestor: HTMLElement | null = element;
            ancestor;
            ancestor = ancestor.parentElement
          ) {
            const style = getComputedStyle(ancestor);
            if (style.backgroundImage !== 'none') {
              gradient = true;
              break;
            }
            const color = parse(style.backgroundColor);
            layers.push(color);
            if (color[3] === 1) break;
          }
          if (gradient) continue; // Image/gradient-backed decorative text requires pixel/manual review.
          let background = [255, 255, 255];
          for (const layer of layers.reverse())
            background = background.map(
              (channel, i) => layer[i] * layer[3] + channel * (1 - layer[3]),
            );
          const foreground = parse(getComputedStyle(element).color);
          const ink = foreground
            .slice(0, 3)
            .map((channel, i) => channel * foreground[3] + background[i] * (1 - foreground[3]));
          const a = luminance(ink),
            b = luminance(background);
          const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          checks++;
          minimum = Math.min(minimum, ratio);
          if (ratio < 4.5) failures.push({ name: element.textContent.trim().slice(0, 80), ratio });
        }
        return { checks, minimum, failures };
      });
      expect(contrast.checks).toBeGreaterThan(0);
      expect(contrast.failures).toEqual([]);
      contrasts.push({ checks: contrast.checks, minimum: contrast.minimum });
    };
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Mulai bikin foto' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await auditTargets();
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await auditTargets();
    await page.getByRole('button', { name: 'Pakai frame After Hours Ticket', exact: true }).click();
    await auditTargets();
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('izin');
    await auditTargets();
    await page.getByRole('button', { name: 'Pilih foto dari perangkat' }).click();
    const buffer = await photoBytes(page);
    await page
      .locator('input[type=file]')
      .setInputFiles(
        [1, 2].map((i) => ({ name: `target-${i}.png`, mimeType: 'image/png', buffer })),
      );
    await expect(page.getByTestId('photo-count')).toHaveText('2/8 foto');
    await auditTargets();
    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    await auditTargets();
    await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
    await auditTargets();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await fs.writeFile(
      `docs/qa/accessibility-${browserName}-${width}.json`,
      JSON.stringify(
        {
          width,
          targetMinimumPx: 44,
          contrastMinimum: 4.5,
          contrasts,
          scope:
            'Home, gallery, source, camera denial, editor, result, clear dialog; visible control targets including checkbox labels; flat-background UI text, excluding image/gradient-backed decorative text and disabled controls.',
        },
        null,
        2,
      ) + '\n',
    );
  });
}
