# Ten Signature Frames and Neutral Gallery Implementation Plan

> **For agentic workers:** Execute inline, task by task, with checkpoints. Publishing revisions is already authorized. Use the existing test and renderer workflows; no delegation or new thread is needed.

**Goal:** Refine ten more editions into rich signature frames and show every gallery frame with neutral photo areas instead of people.

**Architecture:** Extend the existing version-3 signature definition refinement with ten current IDs. A separate encore artwork module supplies ten original material compositions. Render neutral thumbnails from empty compositions into a new filename while retaining old thumbnails and all prior layer URLs. Camera/session/export behavior remains unchanged.

**Tech Stack:** TypeScript, native SVG, Canvas renderer, built-in imagegen, Vitest, Chromium/WebKit and Cloudflare Pages Direct Upload.

## Global constraints

- Keep exactly 60 active frame IDs: 18 signature version 3 and 42 paper version 2.
- Preserve every photo slot, format, dimensions and original category/collection membership.
- All gallery thumbnails contain neutral photo areas, no photographic or illustrated people.
- Keep existing thumbnail.png assets; current gallery uses thumbnail-neutral.png at its selected version path. Revalidation remains active.
- Retain all previous v1/v2 and original v3 assets for open sessions.
- Use original generated materials with full prompt/source provenance; no new portrait generation or template asset import.

## Task 1: Definition and gallery contract

Files: tests/unit/catalog.test.ts, src/frames/signature.ts, src/frames/definitions.ts.

- [x] Add an explicit ten-ID regression requiring version 3 and unchanged previous-v2 slots/format/dimensions. Add the neutral thumbnail URL contract for all 60.
- [x] Run the selected unit tests and confirm new revisions/neutral gallery fail on the previous release.
- [x] Extend signature IDs/descriptions/palettes and title treatment. Apply a final definition map selecting thumbnail-neutral.png for every frame.
- [x] Generate the matching manifest packages and verify the unit suite.

Ten designs: ribbon-diary-trio / Rose Ribbon Salon; ocean-postcard-story / Azure Riviera; denim-daisy-portrait / Denim Bloom Studio; butterfly-notes-arch / Lilac Conservatory; cherry-kiss-story / Cherry Velvet Club; citrus-club-mini / Citrus Sunset; coffee-date-polaroid / Café Lumière; botanical-journal-portrait / Emerald Herbarium; festive-wishes-offset / Champagne Countdown; garden-paint-story / Monet Garden Party.

## Task 2: Original material artwork

Files: scripts/encore-art.mjs, scripts/signature-art.mjs, artwork/materials, artwork/originals, artwork/provenance/encore-materials-20261007.json.

- [x] Generate one material scene for each design using the built-in imagegen tool: blush satin/ribbons, blue coastal silk/shells, denim/embroidered daisies, lilac glasshouse/butterflies, burgundy cherries, terracotta citrus satin, mocha café textiles, emerald velvet/herbarium, champagne glitter/streamers, painted garden paper.
- [x] Save originals and optimized JPEGs in the workspace with exact prompts.
- [x] Compose specific print typography, layered mounts, gold/chrome borders, themed ornaments and footer panels. Protect photo interiors and all text areas with the existing outline mask.

## Task 3: Neutral thumbnails and visual verification

Files: scripts/render-library.mjs, docs/qa/signature-encore-board.png, docs/qa/signature-design-board.png, docs/qa/frame-contact-sheet.png, tests/e2e/catalog.spec.ts.

- [x] Generate gallery thumbnails using session placements=[], caption='', date=''; do not resolve sample images during this render. Use normal sample fixtures only for detailed QA/export evidence.
- [x] Save neutral thumbnails at each selected neutral filename, without overwriting previous thumbnail.png.
- [x] Add a meaningful gallery raster check comparing photo-slot pixels in all 60 thumbnails with their expected neutral matte at the exact slot geometry. Confirm failures before thumbnail regeneration and passes afterward.
- [x] Inspect the ten-design board, the prior eight neutral examples, all five contact-sheet pages and a large Cherry Velvet Club detail export; fix clipping or illegible labels.
- [x] Update name-dependent search/browser smoke fixtures to the current names while preserving their flow assertions.

## Task 4: Release

Files: scripts/smoke-signature.mjs, scripts/write-registry.mjs, README.md, HANDOFF.md, docs/QA.md, docs/RELEASE.md, docs/qa/encore-release-20261007.json.

- [x] Run npm run check and the full Chromium/WebKit suite. Record fresh results and physical-device limits.
- [x] Commit/push verified source, archive final dist with per-file SHA-256 checks, deploy preview and verify all 18 signature uploads/captions/PNG/JPEG plus 60 gallery assets and camera regression.
- [x] Deploy the same candidate to production, repeat public-origin checks and verify bytes of current/new and previous assets.
- [x] Record actual deployment IDs/checksums and completed steps, update source/asset provenance and future gallery direction, commit/push documentation.

## Verified completion — 7 October 2026

Source candidate 0260be14c41d1090c0b128f5eb8317300d8b2432 is public. Preview 4c1d776e-79d2-4425-bbc9-9b3fe00e0f39 and production 16d4bffa-5e83-48dc-893a-94e38782559e use the same 617-file build, archive SHA-256 e2106e84b97aff099e190e2ab53c64cdc644e79bb82c90c5efd7af8868a052d3. Unit/build: 46 passed; full browser: 63 passed, 3 synthetic-camera skips; final artwork catalog: 6 passed. Each remote engine decoded all 36 signature PNG/JPEG downloads; production neutral gallery checked all 60 thumbnails and 1,683 interior samples per engine without portrait requests. All 384 prior artwork files remain byte-identical; production SHA-256 matches 127 selected files. Source CI run 37554781186 completed successfully. Full evidence: docs/qa/encore-release-20261007.json. Physical-device limitations remain recorded in that report.
