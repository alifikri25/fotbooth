# WebKit AR CI diagnosis

**Goal:** Identify and repair the one WebKit model-inference failure on the Linux GitHub runner while preserving real model and pixel checks.

- [x] Read the actual failed run: build/unit passed; 130 browser checks passed, 31 skipped, one real-model WebKit check failed.
- [x] Capture worker errors and browser capabilities from the same focused test on the same Linux environment. Run 38479183023 reproduces `GLctx.activeTexture` undefined despite the main-thread offscreen WebGL probe returning true.
- [x] Reproduce the diagnosed failure with a regression before changing runtime behavior. Both worker failure and cancellation regressions fail before the runtime fix; real models and cancellation pass after it.
- [x] Apply the smallest fix; verify the original checks locally and on GitHub. Focused Linux run 38480149931 passed four checks, including the original WebKit model test; two Chromium-only worker fixtures skipped in WebKit.
- [x] Integrate the verified change and preserve failure artifacts for future diagnostics. Failed runs retain Playwright artifacts for seven days; normal pushes still execute the full browser suite. Full main CI is checked before the completion report.

Do not skip the model check, replace real detections with fixtures, or relax landmark/mask/pixel assertions. Keep user photos and credentials out of diagnostics.
