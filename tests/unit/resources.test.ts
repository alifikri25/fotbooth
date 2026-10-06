import { expect, it } from 'vitest';
import { PhotoRegistry } from '../../src/core/resources';
it('preview rendering keeps normalized source geometry when reduced bitmap dimensions round', async () => {
  const registry = new PhotoRegistry();
  registry.add({
    id: 'wide',
    blob: new Blob(),
    preview: { width: 1600, height: 70 } as HTMLCanvasElement,
    thumbnailUrl: 'blob:test',
    width: 23000,
    height: 1001,
    sourceType: 'upload',
    defaultMirror: false,
  });
  const source = await registry.preview('wide');
  expect([source.width, source.height]).toEqual([23000, 1001]);
});
