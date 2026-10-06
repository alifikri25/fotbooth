# Cartoon Photobooth Frame Expansion

> Execute this approved request inline, with checks after each stage.

**Goal:** Expand the usable collection from 8 to 16 original frames, drawing on the playful photostrip styles inspected in Canva. Show the new collection first and make cartoon/dynamic styles easy to find.

**Architecture:** Append eight definitions to preserve existing renderer fixtures. Generate native SVG artwork and version-bound manifests through the existing asset pipeline. Use the same renderer for thumbnails, previews and downloadable files.

**Design references:** https://www.canva.com/templates/s/photo-booth/ and https://www.canva.com/templates/s/photo-strip/?continuation=300. Reference styles include pastel illustrated strips, comic panels, chunky decorative lettering, checker patterns and stickers. Create new characters and geometry for this collection.

## Steps

- [x] Add failing catalog tests for 16 usable packages, new cartoon/dynamic tags and visibility in the bundled catalog.
- [x] Add Mochi Party, Kitty Club, Comic Dash, Froggy Day, Candy Bounce, Space Pals, Monster Moods and Peach Picnic. Give each a distinct layout and illustration system, preserve >=55% real photo area and keep text outside photos.
- [x] Generate outlined original mascots, patterned backgrounds, stickers and motion motifs in SVG. Show new frames first; add Cartoon and Dynamic filters; derive frame counts from the catalog.
- [x] Make contact sheets grow with the collection. Render all 16 at standard/light size, with long captions and transformed photos; visually inspect new designs.
- [x] Test actual gallery filters/selection and all frame assets/export dimensions/clear photo interiors in Chromium and WebKit. Run unit checks and build.
- [x] Refresh screenshots, registry and handoff notes with verified results and remaining limits.

## Validation

Completed 6 October 2026: 40 unit tests and build passed; full Chromium/WebKit suite 52 passed, 2 synthetic-camera skips, 0 failures/flaky. All 16 frame packages exported PNG/JPEG at exact standard/light dimensions, with clear protected interiors. Horizontal/vertical color landmark checks: 20–48 samples per frame, maximum 1 design pixel. Local 76-file candidate archive verified; public release and physical-device review remain outside this request.

Run `npm run test -- tests/unit/catalog.test.ts` before and after implementation. Run `npm run assets:build` and `npm run qa:frames`, inspect PNGs, then run `npm run check` and the browser suite. Standard strips must export 1200x3600 and cards 1800x2700; light sizes must be exactly half. Artwork must not block protected photo interiors.
