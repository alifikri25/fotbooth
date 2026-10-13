# CI Room Coordinator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing full browser test command start its required local room coordinator in a clean checkout and stop it when testing ends.

**Architecture:** Playwright owns both the Cloudflare Worker on port 8787 and Vite on port 5173 through its existing `webServer` configuration. The Worker readiness request returns 403 because it omits an allowed Origin; installed Playwright accepts status codes from 200 through 403 as ready. Production endpoints and authentication remain unchanged.

**Tech Stack:** Playwright 1.63.0, Cloudflare Wrangler 4.147.0, Vite 8.3.2, TypeScript.

## Global Constraints

- Modify only `playwright.config.ts`; preserve existing tests and source behavior.
- Reuse the existing room-catalog integration test as the red-to-green regression.
- Preserve historical QA reports before the fresh local suite overwrites them; save continuation reports separately.
- Do not commit, push, or publish from this subtask.

---

### Task 1: Start both browser-test dependencies

**Files:**
- Modify: `playwright.config.ts:16`.
- Test: `tests/e2e/room-catalog.spec.ts:61`.
- Create: `docs/qa/online-room-continuation-local-20261013.json`.

**Interfaces:** The `npm run rooms:dev` command starts the existing Worker at `http://127.0.0.1:8787`; Vite proxies `/api` and WebSockets there. Playwright launches and tears down servers listed in `webServer`.

- [x] Run the existing selector/room-creation integration test from a state with neither local server running:

```powershell
npx playwright test room-catalog --project=chromium --grep 'room offers' --reporter=list --output=test-results/continuation-ci-backend-probe
```

Observed failure: `POST /api/rooms` produces `ECONNREFUSED 127.0.0.1:8787`; the Room foto bareng heading does not appear. The failing trace remains under the specified test-results directory.

- [x] Replace the single Vite webServer with the exact two-server configuration:

```ts
webServer: [
  {
    command: 'npm run rooms:dev',
    url: 'http://127.0.0.1:8787',
    reuseExistingServer: true,
  },
  {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173/tests/harness.html',
    reuseExistingServer: true,
  },
],
```

- [x] Repeat the regression command; require a pass and inspect ports 5173/8787 afterward to prove Playwright released both launched servers. Result: one test passed in 4.6 seconds; neither port remained listening.
- [x] Run `npm run check`, then `npm run test:e2e -- --reporter=list,json` with `PLAYWRIGHT_JSON_OUTPUT_NAME` pointing to `test-results/continuation-full-20261013.json`. Fresh check: 146 unit tests in 19 files, TypeScript/build passed. Full browser suite: 120 passed, 24 skipped, zero failed/flaky, 649.516 seconds.
- [x] Save exact counts, failures/skips, command outcomes, red-to-green evidence, and local server cleanup in the new continuation QA JSON. Preserve historical QA evidence after copying the fresh reports under continuation filenames. Saved `docs/qa/online-room-continuation-local-20261013.json` and 21 fresh reports/screenshots; all 32 historical files restored byte-identically. Neither server port remained listening.
- [x] Return the reviewed configuration diff and fresh verification evidence to the parent agent for integration.
