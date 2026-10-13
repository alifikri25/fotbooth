# Existing frame catalogue in Foto Bareng Online

**Goal:** Let the host choose any of the 80 prepared catalogue frames, retain the three dedicated room frames, and fill every slot with a fresh shared pose. Both participants receive the same host-authored PNG.

**User steering:** The preview's three-only frame selector did not meet the expected reuse of the prepared catalogue. Publication was deferred during the revision. After reviewing the tested preview, the user explicitly authorized publication to the main site for physical-phone testing; the verified candidate is now published. Open Office is being removed at the user's request and must not start again.

**Architecture:** Reuse catalogue definitions/assets and the shared masked/rotated renderer. A coordinator-authorized series emits one bounded capture at a time, with a series ID and ordered slot index. Both originals must be acknowledged and the host must receive the current pair before the host advances. Each advance gets a fresh capture ID and countdown; the final PNG uses the last current ID. Intermediate pairs stay only in browser memory.

**Ownership:** Renderer agent owns frames/composition and renderer checks; backend agent owns protocol/client/coordinator and backend checks; root owns OnlineRoom UI, integration and preview; independent reviewer covers acceptance and Office removal.

## Implementation and validation

- [x] Expose all 80 validated catalogue frames plus the existing three room frames; group options and show pose count.
- [x] Add server-validated series metadata, authorized host advance, fixed frame/scene, fresh IDs/timestamps and bounded slot count; keep legacy single-shot clients compatible.
- [x] Add exact pair-per-slot export and accumulated live preview using shared masks, rotations and protected artwork.
- [x] Prove failing then passing selector, four distinct poses, host/guest identity, cancellation, reconnect and stale-message tests.
- [x] Integrate series accumulation and progress in both participants; cancel all partial pairs on settings changes, explicit retake, departure, camera loss, hidden tab or error; retain completed PNGs as before.
- [x] Verify all 80 catalogue exports in Chromium/WebKit, complete unit/build checks and relevant UI/transport regressions.
- [x] Deploy the compatible coordinator, verify HTTP/WSS, then deploy the frozen frontend to a new Pages preview and verify direct/relay multi-shot HTTPS downloads.
- [x] Save screenshots, checksums and release evidence; present the updated concrete preview for production review.

Physical cameras and phones remain outside the automated test evidence. No paid TURN or photo persistence is added. Existing uncommitted frame/effect/AR work is preserved.

Verified before publication: 146 unit tests/build; local room/catalog suite 42 passed/16 skipped; preview HTTPS UI 11 passed/7 skipped; legacy preview 3 passed; remote large result 2 passed/2 skipped; four preview solo/AR smokes passed. Candidate 730 files, SHA-256 8ae789fe1a3bcd46327b363ed4c5eca81c99aa7cc8aedd191dcb25a232d49c39; preview e2e8f932-d52a-4071-9cc8-1fcc0d16333f; backend f1327cfd-a643-43ed-a5a2-29e9d94c1839. Full evidence: docs/qa/online-room-catalog-release-20261013.json.

Office gateway stopped and all active startup instructions removed. The continuation audit found no active process, service, skill or port 9090. Installation archive and user data remain because automatic approval review rejected permanent deletion with `blocked by policy`; no complete-deletion claim or further Office startup.

- [x] Obtain explicit production authorization, publish the same frozen dist without rebuilding, and verify the main site. Production b88cf128-ff60-443d-a8a0-31e919951ee5 on branch main is live at https://fotbooth.pages.dev; immutable deployment https://b88cf128.fotbooth.pages.dev. Actual production room UI: 4 passed/2 WebKit synthetic-camera skips, 0 failed/flaky; four production solo/AR smokes passed. Four distinct paired poses and identical direct/relay downloads were verified; lifecycle recovery remains intact. Previous AR production 4d1cfcae-ee85-40cf-b513-74b5b4eb1445 remains the Pages rollback candidate. Physical-phone/camera testing is still separate and is now being undertaken by the user.
