# Signature Frame Art Direction

Execute inline. The user requested stronger, richer themed frames and provided theatre, pop birthday, printed-ticket and textile/lace references. Publishing revisions to the existing site is already authorized.

## Goal and constraints

- Produce eight individually art-directed flagship designs, replacing eight existing editions within the 60-ID catalog.
- Use original cinema velvet, sage textiles, holographic foil and ivory silk raster materials generated with the built-in imagegen tool; keep source assets and prompts in the repository.
- Build unique typography, ornaments, ticket details, mascot illustrations and print layering for each design with the native SVG system.
- Retain slot geometry, canonical dimensions, camera behavior and all previous version-1/version-2 assets. Eight revised IDs use version 3, the other 52 keep version 2.
- Promote the eight new designs in the gallery. Retain original collection membership so existing collection filters remain useful.
- Protect all photo interiors and text areas. Do not import Canva template files or reference portraits.

## Implementation

1. Add a focused regression for the eight current version-3 manifests, matching generated files and version-2 compatibility; confirm it fails before product changes.
2. Add `src/frames/signature.ts` to refine the eight definitions, names, colors, fixed titles and version-bound asset URLs. Apply it from `definitions.ts` and rank signature IDs first in `catalog.ts`.
3. Add `scripts/signature-art.mjs` with separate compositions: Velvet Premiere, Popstar Birthday, After Hours Ticket, Sage Atelier, Pearl Vows, Holo Encore, Rouge Romance, Disco Royale. Integrate before the generic artwork branch in `build-assets.mjs`.
4. Optimize generated material files for web output while retaining originals and prompt provenance. Embed the production materials in their SVG backgrounds so exports remain self-contained.
5. Generate assets/manifests and renderer-based thumbnails; make a dedicated eight-design board and inspect every standard/detail export. Refine compositions from visual evidence.
6. Update name-dependent browser expectations and regression coverage without changing the capture/controller/export functionality. Run unit/build and the full Chromium/WebKit suite.
7. Commit/push verified source, deploy preview, verify HTTPS assets/upload/download and camera regression, deploy the identical build to production and repeat stable-URL checks.
8. Record proofs, deployment, rollback candidate and final future-design direction in the registry, README, QA and handoff. Physical-device testing remains explicitly unverified.
