# Online Photo Room Implementation Plan

> **For agentic workers:** Execute the authorized work with independent backend and composition agents, then integrate and review in the main chat. Use failing tests before implementation and verify the complete two-browser flow.

**Goal:** Two people join a private online room, appear beside each other against one shared background inside a photobooth frame, take a coordinated photo, and download the same result.

**Architecture:** Keep the existing solo workflow and frame renderer. A dedicated Cloudflare Worker with SQLite Durable Objects coordinates room membership, settings and capture time; WebRTC transports live video and original captured PNGs. Local person segmentation removes each person's background for a shared scene. Photos remain in browser memory and are exchanged with the invited participant, never persisted by the room server.

**Tech Stack:** Existing React/Vite, TypeScript, MediaPipe person segmentation, WebRTC, Cloudflare Workers/Durable Objects, Vitest and Playwright.

## Global Constraints

- Preserve existing uncommitted work and all solo camera/frame/export behavior.
- Two participants, one host and one guest; cryptographically random invitations, room expiry after one hour, explicit camera activation, no microphone or recording.
- The host chooses the frame and shared scene; both participants must mark ready before a coordinated capture.
- A result is available only after both original snapshots arrive; retake clears old snapshots and capture identifiers.
- Network/browser timing is coordinated rather than promised to be exactly simultaneous.
- Do not enable a paid subscription or create a billable TURN service without authorization. Support configured TURN credentials and report any actual connectivity limitation.
- No production publication until the concrete implementation and preview have passed verification. A reversible preview and dedicated room backend are within this feature setup.

### Task 1: Private room coordinator

**Files:** `src/core/room/protocol.ts`, `worker/rooms.ts`, `worker/wrangler.jsonc`, `tests/unit/room-server.test.ts`.

**Interfaces:** `RoomSettings = {frameId:string,scene:'studio'|'sunset'|'night',cutout:boolean}`. Create room with POST `/api/rooms`; return `{roomId,hostToken,guestToken,expiresAt}`. Connect `/api/rooms/:id/socket?token=...&client=...&name=...`. Events are `state`, `signal`, `capture`, `pong`, and `error`; client commands are `ready`, `settings`, `signal`, `capture`, `captured`, `retake`, and `ping`.

- [ ] Write failing real state-machine tests for unauthorized membership, a third participant, host-only settings, readiness gating, duplicate capture and expiry.
- [ ] Run `npx vitest run tests/unit/room-server.test.ts` and observe expected failure.
- [ ] Implement bounded JSON parsing, durable metadata, hibernating WebSockets, authoritative capture timestamps and origin checks.
- [ ] Run coordinator tests and test actual WebSocket connections with local Wrangler.

### Task 2: One-scene photo composition

**Files:** `src/core/room/composition.ts`, `tests/unit/room-composition.test.ts`, `tests/e2e/room-composition.spec.ts`.

**Interfaces:** Export `makeRoomPortrait(image:CanvasImageSource,width:number,height:number,mask?:ARMask,mirror?:boolean):HTMLCanvasElement`; export `drawRoomScene(canvas:HTMLCanvasElement,host:CanvasImageSource|null,guest:CanvasImageSource|null,scene:RoomSettings['scene']):void`; export `exportRoomFrame(host:Blob,guest:Blob,frame:FrameDefinition,scene:RoomSettings['scene']):Promise<Blob>`.

- [ ] Write failing geometry/alpha tests and an actual browser pixel check proving both people are placed over one continuous background.
- [ ] Implement masked transparent portraits, stable host-left/guest-right positioning and bounded canvas dimensions.
- [ ] Compose the same pair image into existing frame slots using the existing renderer and export PNG.
- [ ] Verify pixel behavior and release decoded sources after export.

### Task 3: Live room experience and transport

**Files:** `src/core/room/client.ts`, `src/components/OnlineRoom.tsx`, `src/components/online-room.css`, `src/App.tsx`, `tests/unit/room-transfer.test.ts`, `tests/e2e/online-room.spec.ts`, `vite.config.ts`, `public/_headers`.

- [ ] Write failing transfer tests for snapshot completeness, byte limits and stale capture IDs; write a failing two-browser user-flow test.
- [ ] Implement room create/join, fixed-offerer WebRTC negotiation, clock correction, chunked bounded original-PNG transfer and cleanup.
- [ ] Add a responsive room screen with invitation copy, two-person readiness, frame/scene selection, local segmentation, countdown, retake and PNG download.
- [ ] Add home/navigation entry and deep links, with accurate mode-specific privacy text.
- [ ] Run focused checks, then the complete existing unit suite and build.

### Task 4: Verify the online feature

**Files:** `docs/ONLINE-ROOMS.md`, `README.md`, `docs/qa/online-room-20261012.json`.

- [ ] Check the existing Cloudflare account without exposing credentials; deploy the dedicated coordinator and reversible site preview after tests pass.
- [ ] Verify two independent browser contexts, guest joining, live preview, readiness, shared capture, identical downloadable results, retake, room capacity and disconnect handling.
- [ ] Verify responsive layout and preserve the Open Office panel while agents work.
- [ ] Document exact deployment URLs, relay configuration and verified limitations. Present the reviewable result and any required final production approval.
