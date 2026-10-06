# Original signature assets

The built-in imagegen tool produced four material backgrounds and three fictional adult studio portraits for the eight signature frame editions. The supplied Canva screenshots informed the general art direction; their photos and template files were not imported.

- [Material prompts and saved paths](provenance/signature-materials-20261007.json): velvet, sage textiles, holographic foil and ivory silk.
- [Portrait prompts and saved paths](provenance/signature-portraits-20261007.json): two solo portraits and a couple portrait, all fictional models.

Original PNGs remain in `artwork/originals`. Production JPEGs are in `artwork/materials`: quality 88 for materials and 90 for portraits, progressive/optimized encoding. This packaging changes file size/format without repainting the generated artwork. `scripts/build-assets.mjs` embeds material JPEGs inside signature SVG backgrounds and copies portrait JPEGs to `public/samples`.

The native SVG compositions, fixed print labels, photo masks and editable caption/date areas remain separately defined. `scripts/render-library.mjs` renders the signature thumbnails using the fictional portraits and the same application renderer used for downloads; the other 52 thumbnails retain their illustrated examples. No photo from the user or references is included in the public assets.
