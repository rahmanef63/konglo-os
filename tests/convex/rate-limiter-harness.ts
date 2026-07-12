import type { GenericSchema, SchemaDefinition } from "convex/server";
import type { convexTest } from "convex-test";

// Shared registration for the @convex-dev/rate-limiter component in convex-test.
// convex-test does NOT auto-host an `app.use(...)` component — every suite that
// exercises a function which touches a rate limiter (sign-in via authRateLimit,
// data-studio writes via writeLimit, and notiondb CRUD which now consumes a
// write token) must register the component's schema + modules, or the limiter
// throws "Component rateLimiter is not registered".
//
// We deliberately DON'T import the package's own `@convex-dev/rate-limiter/test`
// helper: it ships a `/// <reference types="vite/client" />` that, once in the
// tsc program, makes the local GlobImportMeta interfaces across the convex suite
// conflict with vite's real ImportMeta.glob. A filesystem glob bypasses the
// package's `exports` map and physically resolves schema.ts + lib.ts +
// _generated, so `components.rateLimiter.lib.*` is live in the mock backend.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}

const rateLimiterModules = (import.meta as GlobImportMeta).glob(
  "../../node_modules/@convex-dev/rate-limiter/src/component/**/!(*.test).ts",
);

let schemaPromise: Promise<SchemaDefinition<GenericSchema, boolean>> | null =
  null;
function loadSchema() {
  if (!schemaPromise) {
    const key = Object.keys(rateLimiterModules).find((k) =>
      k.endsWith("/schema.ts"),
    );
    if (!key) {
      throw new Error(
        "rate-limiter component schema.ts not found in the module glob — " +
          "the package layout changed; update the glob.",
      );
    }
    schemaPromise = rateLimiterModules[key]().then(
      (m) =>
        (m as { default: SchemaDefinition<GenericSchema, boolean> }).default,
    );
  }
  return schemaPromise;
}

// Register the rate-limiter component on a convexTest instance. Await before use.
export async function registerRateLimiter(
  t: ReturnType<typeof convexTest>,
): Promise<void> {
  t.registerComponent("rateLimiter", await loadSchema(), rateLimiterModules);
}
