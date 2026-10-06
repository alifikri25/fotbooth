import { expect, it } from 'vitest';
import { exportFilename, outputSize } from '../../src/core/export';
import { definitions } from '../../src/frames/definitions';
it('uses device calendar time in filenames and canonical dimensions without DPR', () => {
  expect(exportFilename('orbit-club', new Date(2026, 9, 6, 7, 8, 9), 'jpg')).toBe(
    'photobooth-orbit-club-20261006-070809.jpg',
  );
  expect(outputSize(definitions[0], 'standard')).toEqual({ width: 1200, height: 3600 });
  expect(outputSize(definitions[2], 'light')).toEqual({ width: 900, height: 1350 });
});
