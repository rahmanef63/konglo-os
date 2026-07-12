import { defineConfig, devices } from "@playwright/test";

// Playwright e2e config — CI-ONLY (the `e2e` job in .github/workflows/ci.yml,
// workflow_dispatch only). Do NOT install browsers or run this locally in the
// dev sandbox; author specs so they typecheck and let CI execute them.
//
// baseURL: point E2E_BASE_URL at a deployed env to test that instead — when set,
// the local webServer is skipped and Playwright drives the remote URL directly.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Start the app for the run unless E2E_BASE_URL targets a remote deploy. Default
// to `pnpm start` (built output) — closest to prod, where the auth proxy +
// optimized bundle behave as shipped; override with E2E_WEB_CMD="pnpm dev" for a
// hot-reload loop. reuseExistingServer keeps a server you already started in
// another shell, so reruns don't fight over :3000. Not started during --list.
const webServer = process.env.E2E_BASE_URL
  ? undefined
  : {
      command: process.env.E2E_WEB_CMD ?? "pnpm start",
      url: baseURL,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    };

export default defineConfig({
  testDir: "./e2e",
  // Fail the CI run if a `test.only` is left in a committed spec.
  forbidOnly: !!process.env.CI,
  // Backend/network probes can be flaky on a cold container — one retry in CI.
  retries: process.env.CI ? 1 : 0,
  // Deterministic, low-noise reporting for the Actions log.
  reporter: process.env.CI ? "github" : "list",
  // Per-test and per-assertion ceilings. Generous enough for a cold Next start
  // behind the auth proxy, tight enough to surface a genuine hang.
  timeout: 30_000,
  expect: { timeout: 10_000 },
  webServer,
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
