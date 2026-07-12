import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import type { GenericSchema, SchemaDefinition } from "convex/server";
import schema from "../../convex/schema";
import {
  writeRateLimiter,
  WRITE_LIMIT,
} from "../../convex/_shared/writeLimit";

// Scoped type for Vite's import.meta.glob (vite/client types aren't in tsconfig).
// Kept local so it never leaks into the app's global ImportMeta surface — same
// pattern as authRateLimit.test.ts / authz.test.ts. (We deliberately DON'T
// import the component's own `@convex-dev/rate-limiter/test` helper: that module
// ships a `/// <reference types="vite/client" />` which, once in the tsc
// program, makes the local GlobImportMeta interfaces across the convex suite
// conflict with vite's real ImportMeta.glob. Registering inline keeps tsc green.)
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}

// App-side function modules (incl. convex.config.ts, which registers the
// rate-limiter component in the manifest). Same glob convention as the sign-in
// limiter test — reaches convex/_generated so convex-test finds the root.
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

// The rate-limiter component's OWN function modules + schema. convex-test does
// NOT auto-host an `app.use(...)` component — it must be registered with the
// component's schema + module glob (exactly what the package's
// `@convex-dev/rate-limiter/test` `register()` helper does internally; we don't
// import that helper because of the vite/client reference noted above). The
// filesystem glob bypasses the package's `exports` map and physically resolves
// schema.ts + lib.ts + _generated, so `components.rateLimiter.lib.*` is live.
const rateLimiterModules = (import.meta as GlobImportMeta).glob(
  "../../node_modules/@convex-dev/rate-limiter/src/component/**/!(*.test).ts",
);

// Lazy-load the component's schema default export from that same glob.
let rateLimiterSchemaPromise: Promise<
  SchemaDefinition<GenericSchema, boolean>
> | null = null;
function loadRateLimiterSchema() {
  if (!rateLimiterSchemaPromise) {
    const key = Object.keys(rateLimiterModules).find((k) =>
      k.endsWith("/schema.ts"),
    );
    if (!key) {
      throw new Error(
        "rate-limiter component schema.ts not found in the module glob — " +
          "the package layout changed; update the glob.",
      );
    }
    rateLimiterSchemaPromise = rateLimiterModules[key]().then(
      (m) =>
        (m as { default: SchemaDefinition<GenericSchema, boolean> }).default,
    );
  }
  return rateLimiterSchemaPromise;
}

async function makeT() {
  const t = convexTest(schema, modules);
  t.registerComponent(
    "rateLimiter",
    await loadRateLimiterSchema(),
    rateLimiterModules,
  );
  return t;
}

// We drive the PRODUCTION `writeRateLimiter` instance — the very object
// `consumeWriteToken` (called inside notiondb createRow/updateRow/deleteRow
// after the auth gate, before the write) consumes a token from — straight
// against the registered @convex-dev/rate-limiter component. `t.run` hands us a
// real GenericMutationCtx carrying runQuery/runMutation, exactly the ctx the
// limiter's `limit` expects, so this exercises the actual component seam (token
// bucket, per-key state, retryAfter) — not a stub.
//
// Boundary note: this asserts the rate-LIMITER primitive engages (the exact
// `writeRateLimiter.limit(ctx, "perUserWrite", { key: userId })` call
// `consumeWriteToken` makes). It does not re-drive the full notiondb mutation
// (which also needs a seeded role + allow-listed table); the consume is a thin
// delegate over THIS primitive, so driving it past the cap is the load-bearing
// proof that a scripted write burst throttles.

const NAME = "perUserWrite" as const;
const CAPACITY = WRITE_LIMIT.perUserWrite.capacity; // 120

// Mirror of authRateLimit.test.ts: across the convex-test syscall boundary the
// component's ConvexError `.data` arrives JSON-serialized, so we parse
// defensively and assert on the payload to prove the limiter rejected.
function rateLimitData(
  err: unknown,
): { kind?: string; name?: string; retryAfter?: number } | null {
  const data = (err as { data?: unknown })?.data;
  if (data && typeof data === "object") {
    return data as { kind?: string; name?: string; retryAfter?: number };
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as {
        kind?: string;
        name?: string;
        retryAfter?: number;
      };
    } catch {
      return null;
    }
  }
  return null;
}

describe("writeLimit — per-user data-studio write token bucket engages past its cap", () => {
  it("exposes the documented generous 120 / 10min per-user config", () => {
    // Guards the write-abuse budget against silent drift — a future bump that
    // tightened this could throttle honest editing, or one that widened it
    // could neuter the guard, both without failing a test otherwise.
    expect(WRITE_LIMIT.perUserWrite).toEqual({
      kind: "token bucket",
      rate: 120,
      period: 10 * 60 * 1000,
      capacity: 120,
    });
  });

  it("allows a normal single write, and rejects the (capacity+1)th burst write for one user", async () => {
    const t = await makeT();
    // Stand-in for the authed userId consumeWriteToken keys on. (A `users` Id is
    // an opaque string at the limiter boundary; the bucket keys on it verbatim.)
    const user = "user_busy_editor";
    const other = "user_quiet_editor";

    await t.run(async (ctx) => {
      // Normal human use: a single write is well within the generous cap.
      const first = await writeRateLimiter.limit(ctx, NAME, { key: user });
      expect(first.ok).toBe(true);

      // Burn the rest of the bucket — these model `capacity` writes in quick
      // succession (a scripted loop). Every one up to the cap must be allowed.
      for (let i = 1; i < CAPACITY; i++) {
        const status = await writeRateLimiter.limit(ctx, NAME, { key: user });
        expect(status.ok).toBe(true);
      }

      // Bucket now empty: a non-consuming check reports NOT ok with a positive
      // retryAfter — exactly what consumeWriteToken turns into a
      // TooManyWritesError ("terlalu banyak perubahan — coba lagi sebentar").
      const overLimit = await writeRateLimiter.check(ctx, NAME, { key: user });
      expect(overLimit.ok).toBe(false);
      expect(overLimit.retryAfter ?? 0).toBeGreaterThan(0);

      // And the next *consuming* attempt (throws:true) raises the component's
      // RateLimited error — the engaged-limiter signal the write path rejects on.
      let thrown: unknown;
      try {
        await writeRateLimiter.limit(ctx, NAME, { key: user, throws: true });
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeDefined();
      const data = rateLimitData(thrown);
      expect(data?.kind).toBe("RateLimited");
      expect(data?.name).toBe(NAME);
      expect(data?.retryAfter ?? 0).toBeGreaterThan(0);

      // Per-user isolation: a DIFFERENT user's bucket is untouched by the busy
      // editor's burst, so one caller can't throttle another.
      const otherStatus = await writeRateLimiter.check(ctx, NAME, {
        key: other,
      });
      expect(otherStatus.ok).toBe(true);
    });
  });
});
