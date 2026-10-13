# WebKit AR CI diagnosis

**Goal:** Identify and repair the one WebKit model-inference failure on the Linux GitHub runner while preserving real model and pixel checks.

- [x] Read the actual failed run: build/unit passed; 130 browser checks passed, 31 skipped, one real-model WebKit check failed.
- [ ] Capture worker errors and browser capabilities from the same focused test on the same Linux environment.
- [ ] Reproduce the diagnosed failure with a regression before changing runtime behavior.
- [ ] Apply the smallest fix; verify the original checks locally and on GitHub.
- [ ] Integrate the verified change and preserve failure artifacts for future diagnostics.

Do not skip the model check, replace real detections with fixtures, or relax landmark/mask/pixel assertions. Keep user photos and credentials out of diagnostics.
