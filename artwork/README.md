# Original signature assets

## Festival Editions, 7 October 2026

Twenty additional themes have separate original materials generated with the built-in ImageGen tool. [Complete prompts and saved paths](provenance/festival-materials-20261007.json) document each source. Originals are in artwork/originals/festival-*.png and optimized production JPEGs in artwork/materials/festival-*.jpg (quality 88, progressive encoding). Format optimization does not repaint the generated art. Native compositions are in scripts/maximalist-art.mjs; each new package is version 1. Strips repeat materials at their original proportions rather than stretching the motifs.

The gallery now contains 80 frames, all with neutral photo windows and no sample people. The previous 60 frames and historical assets remain available. [Twenty new designs](../docs/qa/festival-design-board.png).

Current gallery policy: all 60 frames use neutral empty photo areas, without photographic or illustrated people. Ten additional signature editions use new original generated material backgrounds; see [ten material prompts and saved paths](provenance/encore-materials-20261007.json). Materials remain separate from user photo slots. The current renderer does not load generated portraits for public thumbnails.

The ten new scenes use JPEG quality 88 with progressive/optimized encoding. Originals remain in artwork/originals/encore-*.png, production materials in artwork/materials/encore-*.jpg, and native compositions in scripts/encore-art.mjs. The original thumbnail.png assets remain available for earlier open sessions; current thumbnails are thumbnail-neutral.png.

## Historical first signature release

The built-in imagegen tool produced four material backgrounds and three fictional adult studio portraits for the eight signature frame editions. The supplied Canva screenshots informed the general art direction; their photos and template files were not imported.

- [Material prompts and saved paths](provenance/signature-materials-20261007.json): velvet, sage textiles, holographic foil and ivory silk.
- [Portrait prompts and saved paths](provenance/signature-portraits-20261007.json): two solo portraits and a couple portrait, all fictional models.

Original PNGs remain in `artwork/originals`. Production JPEGs are in `artwork/materials`: quality 88 for materials and 90 for portraits, progressive/optimized encoding. This packaging changes file size/format without repainting the generated artwork. `scripts/build-assets.mjs` embeds material JPEGs inside signature SVG backgrounds and copies portrait JPEGs to `public/samples`.

The native SVG compositions, fixed print labels, photo masks and editable caption/date areas remain separately defined. At that release, `scripts/render-library.mjs` rendered the signature thumbnails using fictional portraits; the other 52 used illustrated examples. The latest neutral gallery supersedes that display policy. No photo from the user or references is included in the public assets.
