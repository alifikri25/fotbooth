# Maximalist Frames and Photo Effects Implementation Plan

> **For agentic workers:** Implement inline, task by task, with tests before behavior changes.

**Goal:** Add 20 distinct, busy printable frames and reversible photo effects in the camera and editor; provide AR ideas without implementing AR.

**Architecture:** Keep the existing versioned SVG frame pipeline and embed original generated material artwork underneath native photo masks and readable labels. Store effect ID/intensity per placement, retain original photos, and use the same color operations for camera CSS preview and pixel-based composition rendering on Chromium/WebKit.

**Tech Stack:** React, TypeScript, Canvas 2D, SVG, Vite, Vitest, Playwright, built-in ImageGen.

## Global Constraints

- Add 20 frames to the existing 60, retaining all existing assets.
- Gallery photo windows stay neutral and contain no example people.
- Photo masks cover at least 55% of each design and all caption/title/date regions stay readable.
- Effects affect photos only, survive frame changes/swapping/undo and export, and do not modify originals.
- No AR libraries, tracking models, or AR features are added.
- Keep user photos local. Verify desktop/mobile and both Chromium/WebKit.

### Task 1: Reversible effects

**Files:** `src/core/effects.ts`, `src/core/types.ts`, `src/core/session.ts`, `src/core/renderer.ts`, `src/components/PhotoEffects.tsx`, `src/components/Camera.tsx`, `src/components/Editor.tsx`, `src/App.tsx`, `src/styles.css`, `tests/unit/effects.test.ts`, `tests/e2e/effects.spec.ts`.

**Interfaces:** `getPhotoFilter(effect, intensity): string`; `applyEffectPixels(data, effect, intensity): void`; optional `Crop.effect`/`Crop.effectIntensity` metadata; reusable `PhotoEffects` controls.

- [x] Test-first: assert real exported monochrome pixels have equal RGB, original export restores red/blue, adjacent slots/frame decoration remain unchanged, and effects follow photos through swap/frame changes/history.
- [x] Run `npm test -- tests/unit/effects.test.ts` and `npx playwright test effects --project=chromium --reporter=list`; confirm missing feature failures.
- [x] Implement color stages with clamped finite intensity. Example monochrome behavior: `const l = .2126*r + .7152*g + .0722*b; r = g = b = l`.
- [x] Add camera controls below capture controls, preview with `getPhotoFilter`, pass capture metadata into the session; add per-slot editor controls with undo/redo.
- [x] Run the same tests on Chromium and WebKit and reopen downloaded PNG/JPEG pixels.

### Task 2: Twenty distinct frames

**Files:** `src/frames/maximalist.ts`, `scripts/maximalist-art.mjs`, `scripts/build-assets.mjs`, `src/frames/definitions.ts`, `src/frames/catalog.ts`, `scripts/render-library.mjs`, `tests/unit/catalog.test.ts`, catalog/browser count assertions, `artwork/originals`, `artwork/materials`, `artwork/provenance`, `public/frames`.

**Interfaces:** `maximalistFrames: FrameDefinition[]`; `maximalistIds: string[]`; `maximalistArt(frame, outline)` returns background/foreground SVG.

- [x] Test-first: update catalog count to 80, validate packages, require the 20 additions to be selectable and first in the catalog; scope historical compatibility checks to existing IDs.
- [x] Run `npm test -- tests/unit/catalog.test.ts`; confirm 60/80 failure.
- [x] Generate separate materials for night market, aquarium, racing, circus, street collage, ramen, space observatory, safari, candy shop, pinball, music, skate, comic newspaper, desert bazaar, jungle, winter, pirate, bakery, dragon festival, and neon city. Save originals, optimized web copies and prompts in the repository.
- [x] Define strip/card layouts with 2–4 photo windows and distinct masks/rims/labels; embed each material under photo windows and put decorative foreground behind protected masks.
- [x] Build assets and generate neutral thumbnails/contact sheet with the application renderer.
- [x] Verify all 80 packages, search/category filters, export dimensions, protected photo interiors, and desktop/mobile layout.

### Task 3: Review and delivery

**Files:** `README.md`, `artwork/README.md`, `docs/FRAME-REGISTRY.md`, `docs/AR-OPTIONS.md`, QA evidence.

- [x] Write AR concept list with face attachments, expression reactions, background segmentation, complexity and primary MediaPipe documentation links. Clearly identify these as proposals.
- [x] Run `npm run check`, `npm run test:e2e`; inspect new contact sheets and effect control screenshots.
- [x] Show the finished local result and report fresh checks and any real-device limitations.
