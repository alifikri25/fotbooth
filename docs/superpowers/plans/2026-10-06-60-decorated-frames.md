# 60 Decorated Frames Implementation Plan

> Execute inline. The user capped the active request at 60 total frames and selected a public GitHub repository. This supersedes the earlier 302-frame plan. Cloudflare publication is requested for later.

**Goal:** Deliver 60 usable, decorated photo frames and publish their source repository, with Cloudflare Pages deployment prepared.

**Architecture:** Preserve the existing 16 frames and curate 44 editions across 26 new themes. Keep each theme's signature composition and selected extra layouts. Archive the 242 discarded generated packages locally. Use SVG decoration masks and the production renderer for previews, thumbnails and exports.

**Tech Stack:** React, TypeScript, Vite, SVG, Vitest, Playwright, GitHub, Cloudflare Pages.

## Tasks

- [x] Verify the missing-library tests fail before implementation; update the catalog expectation to the user's 60-frame cap.
- [x] Create 26 original illustration themes, 11 reusable compositions and 44 curated editions. Validate all 60 definitions and catalog entries.
- [x] Add name search plus collection/format/photo-count/category filters. Verify missing controls fail tests, then implement the controls.
- [x] Generate all thumbnails with the production renderer, full/light/detail exports, five contact-sheet pages and a featured design board.
- [x] Inspect all visual contact sheets, strengthen shading where needed and repair caption contrast.
- [x] Run all unit/build checks and Chromium/WebKit browser checks, including all 60 export packages and clear photo interiors. 41 unit tests and build passed; 58 browser checks passed, two synthetic-camera cases skipped on WebKit. The built package also passed strict-CSP and local Cloudflare PNG/JPEG smoke checks.
- [x] Prepare Cloudflare Pages configuration, build/deploy scripts and CI. Refresh repository docs with the current scope and verified results.
- [ ] Commit reviewed source, artwork and selected QA evidence. Push to the user's public `alifikri25/fotbooth` repository. Verify the branch remotely.

## Acceptance checks

- Exactly 60 selectable valid packages, 2–4 photos, >=55% usable photo area.
- All foreground decorations stay outside protected photo interiors and text areas.
- Strip/card standard exports: 1200×3600 / 1800×2700, light exports exactly half.
- All 26 new themes represented with original artwork and named composition editions.
- Photo processing stays local to the browser.
- No credentials, personal photos, dependencies, build output or archived unused frames in the public repository.
- Cloudflare deployment is prepared; no deployment occurs before the user's later publication request.
