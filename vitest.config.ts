import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Pure-unit test config (node-only). convex-test / edge-runtime setup
// lands in the authz cluster — keep this reliable for the unit suite.
//
// Coverage is a RATCHET: thresholds start modest and PASS at today's
// coverage so CI is never red on day one — raise them as suites grow.
// Component tests opt into jsdom per-file via `// @vitest-environment jsdom`.
export default defineConfig({
  // tsconfig `@/*` → repo root, so jsdom component tests can import the slice
  // modules under test (which import via the `@/` alias). Additive — the
  // relative-import unit/convex suites are unaffected.
  resolve: {
    // Specific-before-generic (mirrors tsconfig's longest-prefix `paths`): the
    // vendored theme-presets slice lives at frontend/slices/, not <root>/features/,
    // so the bare `@/` → root alias would mis-resolve `@/features/theme-presets`.
    alias: {
      "@/features/theme-presets": fileURLToPath(
        new URL("./frontend/slices/theme-presets/index.ts", import.meta.url),
      ),
      "@/": `${fileURLToPath(new URL(".", import.meta.url))}`,
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // convex-test suites run under edge-runtime via vitest.convex.config.ts
    // (pnpm test:convex) — exclude them here so the node suite doesn't run them
    // a SECOND time. e2e/** is playwright (.spec.ts), excluded for safety.
    // Spread configDefaults.exclude to keep node_modules/dist/etc. excluded.
    exclude: [...configDefaults.exclude, "tests/convex/**", "e2e/**"],
    // Two jsdom component tests (form-modal, feature-search) exceed the 5000ms
    // default under ~70s parallel collect (they pass in isolation). Bump to 20s
    // so the gate isn't flaky; node/convex unit tests are well under this.
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/**", "frontend/**", "convex/features/**"],
      exclude: [
        "**/_generated/**",
        "frontend/slices/data-studio/notion-database/**",
        "tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
      // Regression ratchet, run via `pnpm test:coverage`. Floors sit just below
      // today's REAL node-suite actuals (lines/stmts 29.4%, fns 60.6%, branches
      // 80.5% — measured 2026-06-20). NOTE this is the node config ONLY: it does
      // NOT include tests/convex/** (those run under edge-runtime via
      // vitest.convex.config.ts), so convex-suite-covered code is uncounted here
      // and the true cross-suite line % is higher. The number dropped from the
      // old ~35% because the mobile shell (mobile-home/quick-nav/nav-context/
      // os-topbar) added uncovered frontend lines + small handler fns — the
      // floors below catch a real regression (a deleted suite) without flapping
      // on every new component. Raise them when slice-body render tests land.
      thresholds: {
        lines: 28,
        statements: 28,
        functions: 58,
        branches: 75,
      },
    },
  },
});
