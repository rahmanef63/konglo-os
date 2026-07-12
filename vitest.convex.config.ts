import { defineConfig } from "vitest/config";

// convex-test suite — runs in edge-runtime (Convex's runtime), ISOLATED from
// the node-only unit suite (vitest.config.ts). Kept separate so the pre-push
// node suite stays fast/reliable and never pulls in @edge-runtime/vm.
// Run via `pnpm test:convex`. server.deps.inline is required by convex-test
// for correct module resolution under edge-runtime.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: true,
    include: ["tests/convex/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
