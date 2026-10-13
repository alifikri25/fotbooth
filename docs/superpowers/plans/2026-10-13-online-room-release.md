# Online Room Release Continuation Plan

> **For agentic workers:** Continue the authorized implementation with one lifecycle agent and an independent verification agent. Root integrates, reviews and prepares the HTTPS preview. Existing local edits are preserved.

**Goal:** Deliver a verified, reviewable Foto Bareng Online preview with reliable completed downloads and recovery after the room connection closes.

**Architecture:** Retain the existing Worker coordinator, browser-only photo composition, WebRTC and transient WebSocket relay. Keep completed PNGs in the current browser independently of subsequent room membership changes. Terminal server disconnects release camera resources and offer reconnect through the existing camera activation control.

**Tech Stack:** React, TypeScript, Cloudflare Durable Objects, Vitest, Playwright Chromium/WebKit.

## Global Constraints

- Preserve all existing uncommitted solo, frame, photo-effect and AR changes.
- Do not enable paid TURN, subscriptions, photo persistence or microphone capture.
- Test camera footage is synthetic; do not represent viewport tests as physical-phone verification.
- Use the existing room backend and a reversible Pages preview; production publication follows review of the concrete preview.
- Keep Open Office available and preserve its selected layout/theme.

### Task 1: Preserve completed downloads after departure

**Files:** `src/components/OnlineRoom.tsx`, `tests/e2e/online-room.spec.ts`.

**Interfaces:** `onState(state: RoomState)` handles authoritative membership/capture changes; `resetCapture()` explicitly clears a capture/result; `resultURL.current` owns the completed local Blob URL.

- [x] Extend the real two-context direct/relay flow to leave after both results exist, before retaking. The remaining participant must still see and download its completed image.

```ts
await guest.getByRole('button', { name: 'Keluar room', exact: true }).click();
await expect(host.getByTestId('room-peer-status')).toContainText('Menunggu');
await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible();
await expect(host.getByRole('link', { name: 'Unduh PNG', exact: true })).toBeVisible();
```

- [x] Run the regression against the current implementation and observe the missing result/download failure.
- [x] Keep completed results on a membership reset; continue canceling incomplete captures and clearing a result on explicit retake/new capture/room exit.
- [x] Re-run both transports, including identical downloadable bytes and retake clearing.
- [x] Reproduce result loss when a local camera track ends, then preserve completed PNGs while still stopping tracks and canceling unfinished captures. Verify completed PNG retention through participant rejoin and server disconnection.

### Task 2: Recover from a closed server connection

**Files:** `src/core/room/client.ts`, `src/components/OnlineRoom.tsx`, `tests/e2e/room-lifecycle.spec.ts`.

**Interfaces:** `RoomConnectionOptions.onError(message: string)` reports terminal room errors; `stopCamera()` releases connection, media tracks and segmentation; the existing Nyalakan kamera button reconnects the same browser identity.

- [x] Add a browser regression that closes an established real room socket from the transport boundary, outside a capture, then checks visible recovery and released camera resources. Add expiry handling coverage using close code 4004.

```ts
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByRole('button', { name: 'Nyalakan kamera', exact: true })).toBeVisible();
expect(await page.locator('video').first().evaluate(video =>
  (video as HTMLVideoElement).srcObject)).toBeNull();
```

- [x] Run regressions and observe current stale-camera/recovery failures before production changes.
- [x] Report unexpected terminal socket close and expiry with a useful message, release the stale session, and retain any completed local PNG.
- [x] Verify reconnect, explicit close without spurious error, unfinished-capture cancellation and lifecycle regressions.
- [x] Reproduce offline retake with the same guest tab: finish both PNGs, end the host camera, retake while disconnected, reconnect and capture again. Queue the reset until the authenticated connection returns so the guest leaves its retained result screen.

### Task 3: Share one canonical result across browser engines

**Files:** `src/core/room/client.ts`, `src/components/OnlineRoom.tsx`, `tests/unit/room-result-transfer.test.ts`, `tests/e2e/room-cross-browser-result.spec.ts`.

**Evidence:** Real Chromium/WebKit exports from identical input PNGs differ in bytes and decoded pixels for all nine frame/scene combinations. An identical solid-red raster is also encoded to different PNG bytes. Re-composition on both devices cannot guarantee identical downloads.

**Interfaces:** Add `RoomConnection.sendResult(captureId: string, result: Blob): Promise<void>` and optional `RoomConnectionOptions.onResult(captureId: string, result: Blob): void`. Keep `sendPhoto`/`onPhoto` for original portraits. Only the host produces a result; only the guest accepts it.

- [x] Add failing transport tests for host-result/guest-receive, guest-send rejection, host-receive rejection, stale capture rejection and snapshot/result separation. Reuse actual bounded PNG and chunk validation.
- [x] Add a real Chromium-to-WebKit room test, with pre-encoded PNG portraits and real coordinator plus direct/forced-relay transport. Compare the guest's received PNG bytes with the host's exported PNG.

```ts
expect(new Uint8Array(await receivedResult.arrayBuffer())).toEqual(
  new Uint8Array(await hostResult.arrayBuffer()),
);
```

- [x] Run the tests against current code and observe missing result API/behavior failures.
- [x] Implement a separate result discriminator/assembly path with the existing 8 MB, ordered-chunk, capture ID and PNG bounds. Preserve direct-to-relay fallback and canceled-capture rejection.
- [x] Reject stale transfer-start metadata without erasing an already partial current photo/result; prove this with a failing then passing test.
- [x] Change UI composition ownership: host builds the PNG once and transmits it; guest displays the complete transmitted Blob. Both retain completed results, and explicit retake clears old transfer IDs/results.
- [x] Verify exact cross-engine downloaded bytes and both full UI flows, then independently review the new transfer direction and cleanup behavior.

### Task 4: Preview, evidence and release handoff

**Files:** `docs/ONLINE-ROOMS.md`, `docs/RELEASE.md`, `docs/DEPLOY-CLOUDFLARE.md`, `docs/qa/online-room-release-20261013.json`.

- [x] Correct the documented TURN secret to the actual `TURN_API_TOKEN` implementation.
- [x] Run the unit suite and `npm run build`, `node worker/verify-local.mjs`, and the complete Chromium/WebKit browser suite after the fixes.
- [x] Deploy the verified `dist` to the existing Pages preview branch, recording the immutable deployment URL and build checksums.
- [x] Check the real coordinator HTTP/WebSocket behavior and repeat direct/forced-relay two-browser capture against HTTPS. Verify entry/composition and the solo/AR smoke behavior on the preview.
- [x] Inspect desktop/mobile screenshots. Record exact passes/skips, identical PNG evidence, backend version, preview deployment, physical-device limitations and the current production rollback deployment.
- [x] Present the working preview for final production review; do not claim physical-phone compatibility or publication before it occurs.

Final evidence: 127 unit tests; build passed; full Chromium/WebKit 93 passed, 17 skipped; HTTPS room 4 passed, 2 skipped; four HTTPS solo/AR smokes passed. Preview 0b4def98-7f5d-4621-874f-a0244fe2c56a uses the verified 730-file candidate. See docs/qa/online-room-release-20261013.json.

- [x] Production publication authorized and completed by the subsequent catalog-room release: production b88cf128-ff60-443d-a8a0-31e919951ee5 is live at https://fotbooth.pages.dev. The newer candidate supersedes this three-frame preview; current production evidence is recorded in docs/qa/online-room-catalog-release-20261013.json and docs/qa/online-room-continuation-audit-20261013.json. Physical-phone testing remains separate.
