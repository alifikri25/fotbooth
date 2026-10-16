import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoom } from '../../src/core/room/client';

const settings = { frameId: 'online-satu-tempat', scene: 'studio', cutout: true } as const;

afterEach(() => vi.unstubAllGlobals());

describe('room creation connection failures', () => {
  it.each(['Load failed', 'Failed to fetch', 'NetworkError when attempting to fetch resource.'])(
    'explains the connection failure instead of exposing %s', async (nativeMessage) => {
      const failure = new TypeError(nativeMessage);
      vi.stubGlobal('fetch', async () => { throw failure; });

      await expect(createRoom('https://rooms.example', 'Ari', settings)).rejects.toMatchObject({
        message: expect.stringMatching(/layanan room.*Wi-Fi/i),
        cause: failure,
      });
    },
  );

  it('explains when the room service takes too long to respond', async () => {
    const failure = new DOMException('The operation timed out.', 'TimeoutError');
    vi.stubGlobal('fetch', async () => { throw failure; });

    await expect(createRoom('https://rooms.example', 'Ari', settings)).rejects.toMatchObject({
      message: expect.stringMatching(/terlalu lama.*coba lagi/i),
      cause: failure,
    });
  });

  it('preserves a readable validation error returned by the service', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({
      error: 'invalid_settings', message: 'Pengaturan foto bersama tidak valid.',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }));

    await expect(createRoom('https://rooms.example', 'Ari', settings)).rejects.toThrow(
      'Pengaturan foto bersama tidak valid.',
    );
  });
});
