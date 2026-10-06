# Mobile Camera Layout Implementation Plan

> **For agentic workers:** Execute this focused task inline, using the current session's debugging, test-driven-development and verification-before-completion skills. The user has authorized the fix and publication to the existing site.

**Goal:** Keep the live face preview and capture/cancel/reopen button visible together on phones without scrolling between them.

**Architecture:** Put the existing primary camera action and timer in the preview panel, immediately after the live preview. Size the preview with its slot aspect ratio and the available small viewport height. Use a side-by-side preview/action arrangement for short landscape screens; leave secondary settings in their existing panel. Camera acquisition, capture, mirroring and session behavior stay in the existing controller.

**Tech Stack:** React/TypeScript, CSS, Playwright Chromium/WebKit, Cloudflare Pages.

## Global Constraints

- Fix the layout problem in the supplied phone screenshot, rather than changing camera functionality.
- Use the existing 60-frame catalog and keep the slot shape/aspect-ratio guide accurate.
- Keep a single accessible capture action, at least 44 px high, with visible countdown/cancel states.
- Retain upload fallback, timer, mirror, burst, device selection and session cleanup.
- Publish the verified result to https://fotbooth.pages.dev; no new hosting project or custom domain.

### Task 1: Fit camera preview and primary action in a phone viewport

**Files:**
- Create: `tests/e2e/mobile-camera.spec.ts` — viewport geometry, scrolling and capture regressions.
- Modify: `src/components/Camera.tsx` — relocate the existing primary action and timer; expose the slot ratio as a CSS custom property.
- Modify: `src/styles.css` — preview/action sizing for portrait and short landscape screens.
- Update: `docs/QA.md`, `HANDOFF.md`, `README.md` — verified change, deployment and limits.

**Interfaces:**
- Consume existing `CameraProps`, camera phases and capture/cancel/open handlers without changing their signatures.
- Add `.camera-shot-controls` around the existing action and timer.
- Add CSS custom property `--camera-ratio: sw / sh` to `.camera-live` via React `CSSProperties`.
- Tests consume existing button names, `.camera-live`, `camera-progress` and Playwright's native synthetic camera.

- [x] Write a regression that enters Denim Daisy Polaroid's live camera, then checks preview/action bounds at 390×700, 360×560 and 740×360 without Playwright auto-scrolling.

```ts
expect(preview.y).toBeGreaterThanOrEqual(0);
expect(preview.y + preview.height).toBeLessThanOrEqual(viewport.height);
expect(action.y + action.height).toBeLessThanOrEqual(viewport.height);
expect(action.height).toBeGreaterThanOrEqual(44);
expect(preview.width / preview.height).toBeCloseTo(756 / 909.9, 2);
```

- [x] Include permission-denied/reopen layouts at the same viewport sizes on Chromium and WebKit, plus a portrait slot from Concert Pass.
- [x] Run `npx playwright test mobile-camera --project=chromium --grep 'live camera' --reporter=list`; confirm an out-of-viewport action failure before changing product code.
- [x] Move the existing taking/stopped/error/live primary-action conditional into `.camera-shot-controls` after `.camera-live`; move the existing `camera-timer` label/select alongside it. Keep their handlers, names and disabled conditions.
- [x] Add the responsive rules below, refining only from measured geometry and screenshots:

```css
.camera-shot-controls { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 12px; width: 100%; margin-top: 14px; }
@media (max-width: 767px) {
  .camera-live { --camera-preview-height: min(440px, max(160px, calc(100svh - 310px))); width: min(100%, calc(var(--camera-preview-height) * var(--camera-ratio))); }
  .camera-page { padding: 16px 0; }
  .camera-heading { margin-bottom: 16px; }
  .camera-view-panel { min-height: 0; padding: 14px; }
  .camera-meta { margin-bottom: 12px; }
}
@media (max-width: 1100px) and (max-height: 500px) and (orientation: landscape) {
  .camera-grid { grid-template-columns: 1fr; }
  .camera-view-panel { display: grid; grid-template-columns: minmax(0, 1fr) 180px; }
  .camera-meta { grid-column: 1 / -1; }
  .camera-live { --camera-preview-height: calc(100svh - 200px); }
  .camera-shot-controls { display: flex; flex-direction: column; margin: 0; }
}
```

- [x] Run the regression until it passes, including coordinate clicks for countdown, cancel and capture with no scroll displacement. Inspect synthetic-camera screenshots, not the user's personal photo as a fixture. Include 844×390 landscape and 1440×900/1280×720 desktop: the relocated action must remain visible beside a complete preview on desktop too. Bound the base preview height with `min(600px, max(160px, calc(100svh - 400px)))`, with the portrait/landscape overrides above.
- [x] Run `npm run check`, then the full Chromium/WebKit browser suite. Review the changed diff and document actual results and real-device limits.
- [ ] Commit/push the verified source, publish preview, verify the production build at HTTPS with the layout regression, then publish the same build to `main` and verify the stable public URL.

No new camera feature, account, saved photo, monitoring or external service is needed.
