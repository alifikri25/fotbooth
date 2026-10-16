# Mixed Moments and Email Feedback Implementation Plan

> **For agentic workers:** Execute the steps inline in this session. Steps use checkbox syntax for tracking.

**Goal:** Add 40 distinct themes whose four photo windows have different shapes, and a private email feedback form for cumanvalo25@gmail.com.

**Architecture:** Append a separate Mixed Moments catalog and vector illustration generator. Keep the current 80 definitions unchanged, including the nine approved narrow-column revisions. Reuse the shared masks in camera, editor and exports. Submit feedback only on an explicit form action through FormSubmit; no inbox or visitor message list is hosted by Fotbooth.

**Tech Stack:** React, TypeScript, SVG/Canvas, Vitest, Playwright, FormSubmit AJAX.

## Global Constraints

- Exactly 40 new themes, each with four different photo silhouettes, including a normal rectangle and three expressive masks.
- Keep normal square windows in the original catalog unchanged; never reapply a global shape conversion.
- Preserve all original public assets and all three dedicated room presets.
- No photos, captions, room invitations or session data are attached to feedback.
- Form fields: category, message, optional reply email; retain the draft on delivery failure.
- Report provider acceptance accurately; email activation/delivery requires verification in the owner's inbox.
- Do not publish production or send test emails during automated checks.

### Task 1: Catalog and original artwork

- [x] Save the current 80 IDs/versions as a preservation fixture; add a failing test expecting 40 Mixed Moments packages and four unique silhouettes per frame.
- [x] Add `src/frames/mixed.ts` with the 40 themes, four-slot card/strip geometry and version 1 assets. Append it in definitions and place the new collection first in the gallery.
- [x] Add `scripts/mixed-art.mjs` with a distinct illustrated symbol for every theme, patterned paper and photo-safe decoration.
- [x] Generate manifests, vector layers and empty neutral thumbnails. Update existing tests to retain their original-catalog assertions and also accept the expansion to 120.
- [x] Verify actual photo areas, exports and all four hit-test shapes. Inspect all 40 new frames on contact sheets and desktop/mobile gallery.

### Task 2: Email feedback

- [x] Add browser regressions for successful submission, rejected submission, offline draft retention, optional reply address and modal focus.
- [x] Add `src/core/feedback.ts` for field validation, explicit provider acceptance and bounded requests; verify with unit tests.
- [x] Add `src/components/Feedback.tsx`, a footer trigger and responsive styling. Show that messages go privately to the operator via FormSubmit.
- [x] Test using intercepted requests only. Document the one-time owner activation and optional opaque FormSubmit address.

### Task 3: Final verification

- [x] Run `npm run check` and focused Chromium/WebKit gallery, renderer, geometry, feedback and room regression checks.
- [x] Regenerate the registry and review current-catalog documentation and screenshots.
- [x] Verify original public assets remain byte-identical and no unrelated local changes were discarded.
- [x] Deliver the local preview and clearly state activation and publication status.

## Verification evidence

- `npm run check`: 183 tests in 23 files passed; TypeScript and Vite build passed. Built again after all 120 thumbnails were generated.
- All 120 neutral thumbnails, protected interiors and standard/light PNG/JPEG exports passed in Chromium and WebKit.
- Catalog, library, renderer, production CSP and room composition checks passed in both engines. The first new mobile gallery check used a desktop-only navigation link; corrected to the existing home call to action, then reran both viewport checks successfully.
- Follow-up flow, all-120 geometry, DPR 1/2/3 and Mixed Moments suite: 20/20 passed. Feedback suite: 12/12 passed. New-frame availability in rooms: 2/2 passed. Focused catalog/preservation/feedback units: 28/28 passed.
- All 40 designs inspected on contact sheets; desktop/mobile gallery and feedback screenshots saved under docs/qa. All 80 pre-expansion definitions match their existing versioned manifests. Original public assets and the three room presets have no Git diff.
- No real feedback POST, email activation, commit or deployment was performed. Owner activation after a first manual submission remains required for real inbox delivery.

## GitHub handoff

The user requested pushing the current work before continuing the real feedback delivery investigation. The provider rejection is recorded as an open issue in README. Error handling now preserves a bounded plain-text provider reason and explains an explicit activation response. Focused feedback checks passed: 16 unit and 14 browser cases. The final pre-push `npm run check` passed 185 tests in 23 files plus TypeScript and Vite build. No site deployment is part of this push.
