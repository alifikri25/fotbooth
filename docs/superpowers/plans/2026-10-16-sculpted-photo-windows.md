# Narrow Portrait Column Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise only the nine two-column layouts with long, narrow downward photo windows, matching Aquarium Parade in the user's reference.

**Architecture:** Keep all 71 normal square, landscape, strip and mixed layouts identical to their original active packages. Share the new contours between Canvas, SVG, camera and editor for the nine revised layouts. Preserve original room presets and archived artwork.

**Tech Stack:** TypeScript, React, Canvas Path2D, SVG, Vitest, Playwright Chromium/WebKit, existing asset generators.

## Global Constraints

- User correction on 16 October 2026 supersedes the earlier all-catalog interpretation.
- Only revise: Aquarium Parade, Stellar Atlas, Desert Bazaar, Dragon Lantern, Froggy Day, Ribbon Diary Portrait, Denim Daisy Portrait, Botanical Journal Portrait and Wedding Bloom Portrait.
- Preserve the other71 complete frame definitions and all3 original room presets, including shape, bounds, text, version and asset URLs.
- Keep all80 catalog IDs and250 slot IDs/orders/counts.
- Advance asset versions only for the nine changed packages; retain all original assets byte-for-byte.
- Keep the pre-existing local room-error patch intact.
- Do not publish production.

### Task1: Scoped source and package revision

- [x] Write and observe a failing regression for unintended changes to the71 normal definitions.
- [x] Restrict `src/frames/sculpted.ts` to the exact9 long-column layouts; return every other frame unchanged.
- [x] Restore original `src/core/room/frames.ts` and room preset artwork paths.
- [x] Regenerate source/public manifests and only retain nine active revised packages.
- [x] Preserve unused broad draft packages in the ignored local `.frame-archive/sculpted-unselected-20261016` archive.
- [x] Verify all71 normal definitions and3 room presets deep-equal their original packages with `npm test -- --run tests/unit/catalog.test.ts`.

### Task2: Shared rendering and usable photographs

- [x] Keep shared vector mask support in `src/core/slot-masks.ts`, Canvas/SVG renderer, schema, validator, camera and editor selection.
- [x] Verify actual mask area, independent interior/exterior pixels and selection hit tests.
- [x] Keep paired portrait positioning safe inside the revised catalog cutouts; leave legacy room rendering unchanged.
- [x] Regenerate all neutral thumbnails and visual boards; verify no original public asset differs from Git HEAD.

### Task3: Final verification and review

- [x] Run `npm run check` against the final scoped source.
- [x] Run catalog, renderer and room composition/face regressions in Chromium/WebKit.
- [x] Inspect the corrected gallery and Aquarium before/after preview.
- [x] Update README, generated registry and this plan to describe only the nine long-column revisions.
- [x] Deliver the corrected local preview with publication status stated precisely.
