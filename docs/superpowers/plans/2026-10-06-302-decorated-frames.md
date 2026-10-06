# 302 Decorated Frames Implementation Plan

**Superseded:** The user capped the active catalog at 60 frames during implementation. Continue with `2026-10-06-60-decorated-frames.md`. The 242 unused generated packages were archived outside public/source assets.

> Execute the user's approved request inline. Build and review the collection before publishing the repository. The user selected a public GitHub repository; Cloudflare is the requested hosting provider.

**Goal:** Deliver exactly 302 selectable, decorated photo frames and a public-ready repository with Cloudflare Pages deployment.

**Architecture:** Preserve 16 existing frame packages and add 26 original themed collections with 11 composition editions each (286 new packages). Generate SVG backgrounds, foregrounds, manifests and thumbnails through the existing renderer. Keep decoration outside photo masks and captions. Add search, collection, format and photo-count filters so a large catalog remains usable.

**Tech Stack:** React, TypeScript, Vite, SVG, Vitest, Playwright, GitHub, Cloudflare Pages.

## Constraints

- Exactly 302 unique IDs/names, valid geometry, at least 55% usable photo area, 2–4 photos per composition.
- Strip exports remain 1200×3600; cards remain 1800×2700; light exports use half dimensions.
- Original artwork inspired by inspected Canva examples; no imported Canva template assets.
- Photos/captions remain in browser memory.
- Public repository excludes credentials, build output, dependencies, generated QA archives and personal data.

## Tasks

- [ ] Add catalog tests requiring 302 selectable packages, 26 themed collections, 11 editions per theme, diverse layouts and valid geometry. Run `npm run test -- tests/unit/catalog.test.ts` and verify expected failures.
- [ ] Extract the existing frame factory; author the themed collection definitions and SVG motif library. Generate version-bound packages with `npm run assets:build`; rerun catalog tests.
- [ ] Add browser tests for search plus collection/format/photo-count filters. Verify they fail, implement accessible controls and rerun them.
- [ ] Render every thumbnail with the production composition renderer; generate paged contact sheets and a representative detailed design board. Review imagery and fix clipping or weak decoration.
- [ ] Validate every package's assets, photo interiors and PNG/JPEG standard/light export dimensions in Chromium and WebKit. Run the existing flow, renderer, camera and accessibility checks.
- [ ] Configure Cloudflare Pages (`npm run build`, output `dist`), CI and deploy scripts. Update README and the frame registry with the exact collection/edition breakdown and current verification evidence.
- [ ] Initialize Git, review tracked files and commit. Create/push `fotbooth` as a public GitHub repository when authenticated. Document the remaining login step if access is unavailable. Prepare Cloudflare publication for the user's later deployment request.

## Design references

- https://www.canva.com/templates/s/photo-strip/?continuation=150 — viewed template thumbnails: floral denim, layered scrapbook paper, checker patterns, illustrated stickers, romantic strips, retro film perforations.
- https://www.canva.com/templates/s/photo-booth/?continuation=150 — reference directions for event and playful frames.
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/ — Vite Pages build settings.
