import { describe, it, expect } from "vitest";
import { signInRateLimiter, SIGN_IN_LIMIT } from "../../convex/authRateLimit";
import { makeT as makeBaseT } from "./_harness";
import { registerRateLimiter } from "./rate-limiter-harness";

// convex-test does not auto-host `app.use(...)` components — the shared
// rate-limiter-harness registers the component's schema + modules.
async function makeT() {
  const t = makeBaseT();
  await registerRateLimiter(t);
  return t;
}

// We drive the PRODUCTION `signInRateLimiter` instance (the very object the
// `withSignInRateLimit` wrapper consumes a token from on every failed sign-in)
// straight against the registered @convex-dev/rate-limiter component. `t.run`
// hands us a real GenericMutationCtx — which carries `runQuery`/`runMutation`,
// exactly the RunMutationCtx the limiter's check/limit/reset expect — so this
// exercises the actual component seam end-to-end (token bucket, per-key state,
// retryAfter), not a stub.
//
// Boundary note: this asserts the rate-LIMITER seam itself engages — i.e. the
// primitive the wrapper's `authorize` delegates to. It does not re-drive the
// full @convex-dev/auth sign-in HTTP action: that materializes a Password
// provider behind an http router which convex-test does not host. The wrapper
// is a thin delegate over THESE primitives (consume-on-failure via `limit`,
// pre-check rejection via `check`, reset-on-success via `reset`), so driving
// them past the bucket is the load-bearing proof a brute-force burst throttles.

const NAME = "signInPerEmail" as const;
// The bucket the wrapper guards sign-in with: 10 tokens, refill 10 / 10 min.
const CAPACITY = SIGN_IN_LIMIT.signInPerEmail.capacity; // 10

// The component throws a ConvexError whose `.data` describes the limit. Across
// the convex-test syscall boundary `.data` arrives JSON-serialized (a string),
// so `isRateLimitError` (which relies on `instanceof ConvexError` + object
// indexing) can't see it — we parse defensively and assert on the payload,
// which proves the limiter (not some unrelated error) rejected the attempt.
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

describe("authRateLimit — sign-in token bucket engages past its burst", () => {
  it("exposes the documented 10 / 10min per-email config", () => {
    // Guards the brute-force budget against silent drift (a future bump that
    // widened the window would weaken the spray guard without failing a test).
    expect(SIGN_IN_LIMIT.signInPerEmail).toEqual({
      kind: "token bucket",
      rate: 10,
      period: 10 * 60 * 1000,
      capacity: 10,
    });
  });

  it("rejects the (capacity+1)th failed attempt for one email; a different email is unaffected", async () => {
    const t = await makeT();
    const victim = "spray-target@mail.com";
    const bystander = "other-user@mail.com";

    await t.run(async (ctx) => {
      // Burn the whole bucket for the victim — these model `capacity` failed
      // sign-ins in quick succession. Every one must be allowed (ok === true).
      for (let i = 0; i < CAPACITY; i++) {
        const status = await signInRateLimiter.limit(ctx, NAME, {
          key: victim,
        });
        expect(status.ok).toBe(true);
      }

      // The bucket is now empty: a non-consuming check reports NOT ok, with a
      // positive retryAfter (the wrapper's pre-check uses exactly this to reject
      // before hitting the password verifier).
      const overLimit = await signInRateLimiter.check(ctx, NAME, {
        key: victim,
      });
      expect(overLimit.ok).toBe(false);
      expect(overLimit.retryAfter ?? 0).toBeGreaterThan(0);

      // And the next *consuming* attempt (throws:true) raises the component's
      // RateLimited error — the engaged-limiter signal the wrapper turns into a
      // TooManyAttempts rejection at sign-in.
      let thrown: unknown;
      try {
        await signInRateLimiter.limit(ctx, NAME, { key: victim, throws: true });
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeDefined();
      const data = rateLimitData(thrown);
      expect(data?.kind).toBe("RateLimited");
      expect(data?.name).toBe(NAME);
      expect(data?.retryAfter ?? 0).toBeGreaterThan(0);

      // Isolation: a DIFFERENT account's bucket is untouched by the victim's
      // burst, so one attacker can't lock out every account (per-key keying).
      const bystanderStatus = await signInRateLimiter.check(ctx, NAME, {
        key: bystander,
      });
      expect(bystanderStatus.ok).toBe(true);
    });
  });

  it("a successful-login reset clears the bucket so an honest user recovers", async () => {
    const t = await makeT();
    const key = "recovers@mail.com";

    await t.run(async (ctx) => {
      // Drive the bucket dry, then confirm it's actually blocking.
      for (let i = 0; i < CAPACITY; i++) {
        await signInRateLimiter.limit(ctx, NAME, { key });
      }
      expect((await signInRateLimiter.check(ctx, NAME, { key })).ok).toBe(false);

      // reset() is what the wrapper calls on a SUCCESSFUL sign-in — it must wipe
      // accumulated failures so a user who finally types the right password (or
      // waits) is not stuck locked out.
      await signInRateLimiter.reset(ctx, NAME, { key });

      const afterReset = await signInRateLimiter.check(ctx, NAME, { key });
      expect(afterReset.ok).toBe(true);
    });
  });
});
