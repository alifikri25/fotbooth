# Web Photobooth Implementation Plan

> **For agentic workers:** Execute this plan inline, one task at a time, with a verification checkpoint before proceeding. The requested executing-plans helper is not installed; use the explicit steps below. Do not parallelize feature implementation.

**Status 6 Oktober 2026:** langkah implementasi dan dokumentasi lokal di bawah sudah tersedia/terverifikasi. Pemeriksaan terbaru: 40 unit test dan build lulus, 52 browser test lulus, 2 skip kamera sintetis WebKit; audit 10 siklus per engine, target kontrol 44 px/kontras datar dan sampel geometri maksimal 1 px lulus. Visual standar/ringan/detail serta arsip/checksum kandidat lokal tersedia. Checklist ini mencatat tugas lokal, bukan penerimaan semua milestone PRD: perangkat nyata, review pemilik/uji pengguna dan M7–M8 HTTPS/rollback masih pending. Lihat `docs/QA.md` dan `HANDOFF.md` untuk bukti serta batasnya.

**Goal:** Implement the local, account-free P0 photobooth specified in PRD-Web-Photobooth.md and document evidence and remaining release gates honestly.

**Architecture:** React + TypeScript + Vite; pure geometry and session functions, a shared Canvas 2D renderer, serial local photo ingest, and a camera controller with explicit cancellation. Original frame artwork is deterministic vector data with versioned manifests and separate background/foreground. Photo resources live only in tab memory.

**Tech Stack:** Node 24, React, TypeScript, Vite, Vitest, Playwright, Canvas 2D. Exact compatible package versions are saved in package-lock.json.

## Global Constraints

- Product copy: Indonesian. No accounts, cloud uploads, analytics, service worker or mandatory watermark.
- Strip: design/standard 1200 × 3600; light 600 × 1800. Card: design/standard 1800 × 2700; light 900 × 1350.
- 16 original concepts (expanded from 8 by the user on 6 October); 2–4 non-overlapping slots; actual mask area ≥55%; foreground intrusion ≤8% at edges.
- JPEG/PNG/WebP only; 20 MB, 24 megapixels/file; 8 photos/session; serial decode; preview longest side ≤1600.
- Canonical normalized placement; cover zoom 1–3; contain centered, zoom 1; 90° rotation; explicit mirror.
- 40 grapheme caption; calendar date YYYY-MM-DD; local fonts; history maximum 30 steps.
- One export job using immutable snapshot; PNG/JPEG quality 0.92; no DPR in output dimensions.
- Real device testing and public HTTPS release are separate evidence gates. Do not claim release readiness from automated desktop tests.

## Task 1: Geometry and placement proof (M0–M1)

**Files:** src/core/types.ts, src/core/geometry.ts, src/core/renderer.ts, tests/unit/geometry.test.ts, tests/e2e/renderer.spec.ts.
**Interfaces:** `coverRect(iw, ih, sw, sh, placement)`, `containRect(iw, ih, sw, sh)`, `toSlotLocal(point, slot, frame)`, `renderComposition(canvas, frame, session, photoResolver, width, height)`.

- [x] Write red tests with independent numerical expectations:
```ts
expect(coverRect(4000, 3000, 1000, 1000, centered)).toMatchObject({x: 500, y: 0, width: 3000, height: 3000});
expect(containRect(4000, 3000, 1000, 1000)).toEqual({x: 0, y: 125, width: 1000, height: 750});
```
- [x] Run `npm test -- geometry`; confirm missing implementation. Implement formulas from PRD §10 with finite-value validation and inverse rotation.
- [x] Implement one shared renderer: background → individually clipped photos → foreground → fitted caption/date. Preview and export call the same function.
- [x] Run geometry tests and browser pixel tests: asymmetric fixtures, rotation/mirror, masks, output dimensions and reopened PNG/JPEG.

## Task 2: Catalog and eight original concepts (M2, M5)

**Files:** src/frames/catalog.ts, src/frames/validator.ts, public/frames/*/v1/manifest.json, public/frames/*/v1/background.svg, public/frames/*/v1/foreground.svg, public/frames/*/v1/thumbnail.png, public/fonts/*, scripts/build-assets.mjs.
**Interfaces:** `validateFrame(input): {valid, errors}`, `frames: FrameDefinition[]`; validator excludes invalid packages from `frames`.

- [x] Red tests reject nonfinite/out-of-bounds geometry, invalid circle ratio, duplicate IDs, overlap, unknown paths and insufficient actual photo area.
- [x] Implement curated rounded/arch/chamfer/circle masks and conservative transformed bounds validation.
- [x] Produce Orbit Club, Bubble Pop, Studio Notes, Concert Pass, Pocket Arcade, Sticker Rush, Cloud Windows and Gallery Issue with materially different geometry, type and motifs.
- [x] Generate honest thumbnails using the final renderer and original sample illustrations. Record artwork/font licenses. Test alpha at protected interiors and dimensions/assets for all 8.

## Task 3: Local image input (M3)

**Files:** src/core/ingest.ts, src/core/resources.ts, tests/unit/ingest.test.ts, tests/e2e/ingest.spec.ts.
**Interfaces:** `inspectImage(bytes): {format,width,height,animated}`, `ingestPhoto(file): Promise<PhotoAsset>`, resource registry with dispose/reset.

- [x] Red tests for magic bytes (including blank MIME), animated PNG/WebP, corruption, oversized files/pixels and mixed-valid batches.
- [x] Implement header inspection before decode; normalize orientation once via browser decoder; keep original Blob plus ≤1600 preview and small thumbnail; close transient bitmaps and revoke URLs.
- [x] Sequentially ingest files; append successes up to 8; retain old placements on a failed replacement.
- [x] Verify actual browser JPEG, PNG, WebP and EXIF 1–8; no session storage/network photo payload.

## Task 4: Session and complete editor (M4)

**Files:** src/core/session.ts, src/components/Editor.tsx, src/components/Preview.tsx, tests/unit/session.test.ts, tests/e2e/editor.spec.ts.
**Interfaces:** `createSession(frame)`, `addPhoto(session,id,replaceSlot?)`, `switchFrame(session,frame)`, `editPlacement(session,slotId,patch)`, `History.commit/undo/redo`.

- [x] Red tests for auto-fill, explicit duplicate use, swap, 4→2→4 restoration, version-specific crop cache and 30-step history.
- [x] Implement immutable metadata-only states. Crop gestures commit once; reset/rotation/flip re-center; contain disables pan/zoom.
- [x] Add slot/photo buttons, pointer inverse-transform dragging, arrow controls, zoom, rotation, mirror, reset, frame switch, caption and optional date; all usable by keyboard.
- [x] Verify editing through undo/redo, frame changes, resize and export; caption grapheme limit and font-fit failures block output.

## Task 5: Camera lifecycle (M3)

**Files:** src/core/camera.ts, src/components/Camera.tsx, tests/unit/camera.test.ts, tests/e2e/camera.spec.ts.
**Interfaces:** `CameraController.open(constraints)`, `.stop()`, `.capture(timer, onCount): Promise<Blob>`; explicit cancellation/generation token.

- [x] Red tests for rejected permission, readiness timeout, stream stop, cancellation during countdown and late getUserMedia resolution.
- [x] Request video only on click; wait for ready pixels; preserve full frame; store mirror explicitly. Offer 0/3/5/10 seconds, single/burst, retake and device/facing choices.
- [x] Stop countdown and tracks on exit/background/reset; release old stream before switch. Preserve successful previous shots on failure/cancel.
- [x] Browser fake-device tests cover capture/burst/retake/denial; mark physical device coverage pending.

## Task 6: Full user flow and safe export (M6)

**Files:** src/App.tsx, src/components/Gallery.tsx, src/components/Result.tsx, src/core/export.ts, src/styles.css, index.html, public/favicon.svg, tests/e2e/flow.spec.ts.
**Interfaces:** `exportComposition(snapshot, frame, registry, options): Promise<Blob>`; `exportFilename(frameId,date,format)`.

- [x] Red end-to-end tests: select → upload → edit → frame switch → PNG/JPEG/light/standard download; incomplete slots blocked; simulated encoding failure retains edits.
- [x] Build home/gallery/source/editor/result/privacy with neutral paper surfaces and cobalt accent. Desktop 3 columns; tablet 2; phone stacked at 360px; 44px controls; visible focus and reduced motion.
- [x] Gate export on readiness/fonts/text-fit; snapshot and single job; decode full sources sequentially and close them; Blob preview plus save fallback and explicit retry/light option.
- [x] Confirm clear-session dialog resets resources, history and output; audit request bodies; check keyboard and responsive overflow.

## Task 7: Verification and handoff (M6–M8 prerequisites)

**Files:** README.md, docs/QA.md, docs/RELEASE.md, docs/FRAME-REGISTRY.md.

- [x] Run `npm run check` then `npm run test:e2e`; inspect failures before changing production code, add regression coverage for bugs.
- [x] Render standard/light contact sheets for all frames and inspect them. Record automated browser versions and viewport coverage.
- [x] Document physical Android/iOS, performance reference devices, 10-person usability and HTTPS deployment as pending unless actually verified.
- [x] Keep local preview running for review; provide source, lockfile, run/build instructions and deployment/security-header/rollback instructions. No production launch claim without M7–M8 evidence.
