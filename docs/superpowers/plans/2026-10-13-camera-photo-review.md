# Camera Photo Review Implementation Plan

**Goal:** Prioritize the camera and let users inspect, reject, or accept each individual shot before moving to the next slot.

**Architecture:** Single shots remain drafts inside Camera until acceptance. The existing renderer produces review images and slot thumbnails with the captured crop, mirror, photo effects, and AR. Explicit automatic burst capture remains opt-in. Playwright covers the real camera-to-review-to-editor flow using synthetic media.

**Files:** `src/App.tsx`, `src/components/Camera.tsx`, `src/components/CameraPhoto.tsx`, `src/styles.css`; new source-priority and camera-review browser tests; existing camera/AR/effects/mobile tests and AR smoke script.

- [x] Reproduce the source action priority and immediate single-shot advance with failing browser tests.
- [x] Make Buka kamera the first primary source action, preserving explicit permission and upload fallback. Verify Chromium/WebKit.
- [x] Render pending and accepted shots through the same crop/mirror/effect/AR renderer as export; retain the video element and pause AR inference during review.
- [x] Add explicit accept/retake, accepted slot thumbnails, safe capture metadata, and a success result from ingestion. Preserve draft review across camera shutdown and release decoded resources.
- [x] Adapt existing integration tests to explicit acceptance; verify new review, mobile action placement, effects/AR, capture cancellation, export, and resource cleanup.
- [x] Build and publish the verified snapshot; check HTTPS camera/source flows and record repository/deployment evidence. Stop after the completion report.

Verification: 146 unit/build passed; focused local 11 passed/7 skipped; integration 22 passed/8 skipped; actual preview and production HTTPS each 11 passed/7 skipped; four AR smoke checks passed. Production 723ce602-57dd-4f35-b7ef-538207044e82, preview 5b09357d-58e6-4bdd-b00e-9be322a1acc8, same 730-file candidate. On 14 October continuation, source and documentation synchronization is finalized without a new production deployment.

Physical-camera screenshots supplied by the user are references only and must not be included in repository QA artifacts.
