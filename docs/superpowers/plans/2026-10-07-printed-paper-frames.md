# Printed Paper Frame Refinement Implementation Plan

> **For agentic workers:** Execute inline in this session. The user requested this alongside the mobile-camera layout fix and authorized publication to the existing site.

**Goal:** Refine the existing 60 frames into themed paper prints, retaining their card/strip layouts and clear photo areas.

**Architecture:** Keep all frame IDs, slot geometry and export dimensions. Add a shared matte-paper finish and deepen the existing SVG theme vocabulary with companion illustrations and small print details. Publish artwork as version 2 so existing browser caches cannot mix old and new layers. Regenerate every thumbnail using the application renderer.

**Tech Stack:** Existing original SVG generators, TypeScript frame manifests, Vitest, Playwright, Cloudflare Pages.

## Global Constraints

- Exactly 60 active frames, including the existing cards and photo strips.
- Follow the user's Pixel Play example and preference for printed photobooth paper, with richer coherent decoration.
- Default to white/pastel/scrapbook paper appropriate to each theme, pending the optional style preference.
- Photos, caption and dates remain unobstructed; slot geometry, sizes and licensing stay valid.
- Revise asset URLs and manifests together; no remote runtime assets or copied templates.
- Complete and publish the mobile-camera fix in this same release.

### Task 1: Version and refine original artwork

**Files:** `tests/unit/catalog.test.ts`, `src/frames/factory.ts`, `scripts/build-assets.mjs`, `scripts/collection-art.mjs`, new `scripts/print-paper.mjs`, `scripts/render-library.mjs`, `scripts/write-registry.mjs`, `tests/e2e/editor.spec.ts`, generated manifests/assets.

**Interfaces:** Export `printPaper(frame): string` returning the SVG paper-finish overlay. Continue consuming `collectionArt(frame): {background: string; foreground: string}`. Use `frame.version` and `frame.thumbnail` for output directories instead of `/v1` literals.

- [x] Add a failing test requiring version-2 asset URLs, files and manifests that match their selected frame definitions.
- [x] Run `npm run test -- --run tests/unit/catalog.test.ts`; confirm it fails because the shipped artwork is still version 1.
- [x] Use `const version = 2; const base = '/frames/' + id + '/v' + version` in the frame factory, and use the same version in generated output paths.
- [x] Add a matte paper rim, soft fiber texture and fine edge printing through `printPaper(frame)`; use crisp paper edges rather than heavy fake 3D borders.
- [x] Add companion motifs appropriate to all 26 decorated themes: pixel gamepad/buttons, satin tails, stitched denim patches, postal stamps/airmail, pressed stems, coffee receipts, film counters and equivalent theme-specific accents.
- [x] Keep foreground decorations inside the existing photo/text exclusion masks. Use safe header/footer/margin positions; do not change slot geometry.
- [x] Generate SVG/manifests, render 60 thumbnails plus standard/light/detail exports, and update the registry with the actual revision.
- [x] Inspect all contact-sheet pages and enlarged representative Pixel Play, Denim Daisy, Ribbon Diary, Ocean Postcard, Botanical Journal and Coffee Date exports. Refine weak visual details before proceeding.
- [x] Back up previous `v1` directories locally after validating resolved source/destination paths stay inside `C:\fotbooth`. Retain the identical `v1` files in public output for users whose photo sessions are already open; the selectable catalog points only to `v2` and still contains exactly 60 IDs. A failing-then-passing regression checks previous assets and matching slot geometry. Preserve rollback via Git and the previous release archive.
- [ ] Run unit/build and the complete browser suite after final artwork generation. Commit/push source and assets, verify preview HTTPS, publish the same build to production, verify the phone-camera layout and image export at the stable URL, and document real-device limitations.
