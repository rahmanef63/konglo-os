import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Value } from "convex/values";
import type {
  AuthProviderMaterializedConfig,
  GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";
import type { GenericDataModel } from "convex/server";
import {
  withSignInRateLimit,
  TooManyAttemptsError,
} from "../../convex/authRateLimit";

// rr: This suite drives the `withSignInRateLimit` WRAPPER itself — the seam the
// sibling `authRateLimit.test.ts` deliberately skips (that one drives the
// rate-limiter PRIMITIVE — limit/check/reset — straight against the registered
// component). The wrapper is a pure, synchronous function over a provider
// object: it monkey-patches the provider's `authorize` to front it with the
// per-email limiter. We can therefore test it WITHOUT convexTest/edge-runtime —
// a plain fake provider + a hand-rolled ctx whose `runQuery`/`runMutation` are
// spies is enough, and it isolates the one behaviour that matters here:
// did the wrapper actually wrap, delegate, and (the known gap) fail OPEN when it
// can't find `authorize`?
//
// HONESTY BOUNDARY (read before trusting this): the fake ctx does NOT run the
// real token-bucket math (no component is registered here). The limiter client
// just forwards to `ctx.runQuery`/`ctx.runMutation`, so we assert the wrapper
// *invokes those primitives on the right code paths* (consume on failure, reset
// on success, pre-check on entry) and *propagates the inner authorize's
// result/error* — NOT that 10 attempts actually exhaust a bucket. The bucket
// math is the sibling file's job. Together: sibling proves the bucket engages;
// this proves the wrapper is wired to that bucket and didn't silently fail open.

// Spy-able fake ctx. The limiter client's check() calls ctx.runQuery; limit()
// and reset() call ctx.runMutation. We hand each a `name`-discriminating return
// so the wrapper's own try/catch logic runs realistically:
//  - runQuery (check) returns { ok: true } by default so the pre-check passes.
//  - runMutation (limit/reset) returns a benign value; the wrapper ignores it.
// Individual tests override these to simulate "already over limit", etc.
type FakeCtx = GenericActionCtxWithAuthConfig<GenericDataModel>;

function makeCtx(over?: {
  checkReturn?: { ok: boolean; retryAfter?: number };
}) {
  const runQuery = vi.fn(async () =>
    over?.checkReturn ?? { ok: true, retryAfter: 0 },
  );
  const runMutation = vi.fn(async () => ({ ok: true, retryAfter: 0 }));
  const ctx = { runQuery, runMutation } as unknown as FakeCtx;
  return { ctx, runQuery, runMutation };
}

type AuthorizeFn = (
  params: Record<string, Value | undefined>,
  ctx: FakeCtx,
) => Promise<{ userId: string; sessionId?: string } | null>;

// A provider whose REAL authorize lives under options.authorize — exactly the
// shape `@convex-dev/auth`'s Password({...}) materializes (the wrapper's doc
// comment describes this precisely).
function providerWithOptionsAuthorize(
  authorize: AuthorizeFn,
): AuthProviderMaterializedConfig {
  return {
    id: "password",
    options: { authorize },
  } as unknown as AuthProviderMaterializedConfig;
}

// A provider with NO authorize anywhere — models an upstream shape change that
// moved/renamed `authorize`. This is the documented FAIL-OPEN path.
function providerWithNoAuthorize(): AuthProviderMaterializedConfig {
  return {
    id: "password",
    options: { somethingElse: true },
  } as unknown as AuthProviderMaterializedConfig;
}

function getAuthorize(p: AuthProviderMaterializedConfig): unknown {
  return (p as { options?: { authorize?: unknown } }).options?.authorize;
}

const SIGN_IN = { flow: "signIn", email: "victim@mail.com", password: "x" };

describe("authRateLimit — withSignInRateLimit wrapper", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    // The fail-open path logs via console.error; silence + observe it.
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
  });

  // (1) REGRESSION GUARD — catches fail-open. If a future @convex-dev/auth bump
  // moves `authorize` and the `options.authorize` lookup silently misses, the
  // wrapper returns the provider untouched and this assertion goes RED.
  it("actually wraps options.authorize (returns a DIFFERENT fn)", () => {
    const original: AuthorizeFn = async () => ({ userId: "u1" });
    const provider = providerWithOptionsAuthorize(original);

    const wrapped = withSignInRateLimit(provider);
    const wrappedAuthorize = getAuthorize(wrapped);

    expect(typeof wrappedAuthorize).toBe("function");
    // The load-bearing assertion: the function on the provider is NO LONGER the
    // original. If it equals `original`, rate-limiting was silently disabled.
    expect(wrappedAuthorize).not.toBe(original);
    // No fail-open log on the happy path.
    expect(errSpy).not.toHaveBeenCalled();
  });

  // (2a) On the SUCCESS path the wrapper must invoke the inner authorize, return
  // its result verbatim, and RESET the bucket (a runMutation against the limiter
  // component) so an honest user never accumulates toward a lockout.
  it("delegates to inner authorize on success, propagates result, and resets the bucket", async () => {
    const result = { userId: "u-ok", sessionId: "s1" };
    const original = vi.fn<AuthorizeFn>(async () => result);
    const provider = providerWithOptionsAuthorize(original);
    const wrapped = withSignInRateLimit(provider);
    const wrappedAuthorize = getAuthorize(wrapped) as AuthorizeFn;

    const { ctx, runMutation } = makeCtx();
    const got = await wrappedAuthorize(SIGN_IN, ctx);

    // Inner authorize ran with the same params and its result flowed through.
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(SIGN_IN, ctx);
    expect(got).toBe(result);
    // Success -> reset() -> exactly one runMutation (the reset). No limit/consume.
    expect(runMutation).toHaveBeenCalledTimes(1);
  });

  // (2b) On the FAILURE path the wrapper must let the inner auth error surface
  // AND consume a token (a runMutation = the limiter's `limit`) against the
  // target account — this is the brute-force counter incrementing.
  it("propagates inner authorize rejection AND consumes a token on failure", async () => {
    const authErr = new Error("InvalidSecret");
    const original = vi.fn<AuthorizeFn>(async () => {
      throw authErr;
    });
    const provider = providerWithOptionsAuthorize(original);
    const wrapped = withSignInRateLimit(provider);
    const wrappedAuthorize = getAuthorize(wrapped) as AuthorizeFn;

    const { ctx, runMutation } = makeCtx();

    await expect(wrappedAuthorize(SIGN_IN, ctx)).rejects.toBe(authErr);
    expect(original).toHaveBeenCalledTimes(1);
    // Failure -> limit() consumes exactly one token (one runMutation).
    expect(runMutation).toHaveBeenCalledTimes(1);
  });

  // (2c) PRE-CHECK rejection: when the per-email bucket is already empty, the
  // wrapper rejects with TooManyAttemptsError BEFORE ever calling the inner
  // authorize (no password verification, no token consumed).
  it("rejects with TooManyAttemptsError before calling inner authorize when over the limit", async () => {
    const original = vi.fn<AuthorizeFn>(async () => ({ userId: "nope" }));
    const provider = providerWithOptionsAuthorize(original);
    const wrapped = withSignInRateLimit(provider);
    const wrappedAuthorize = getAuthorize(wrapped) as AuthorizeFn;

    // check() (runQuery) reports the bucket exhausted with a positive retryAfter.
    const { ctx, runMutation } = makeCtx({
      checkReturn: { ok: false, retryAfter: 42_000 },
    });

    let thrown: unknown;
    try {
      await wrappedAuthorize(SIGN_IN, ctx);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(TooManyAttemptsError);
    expect((thrown as TooManyAttemptsError).retryAfter).toBe(42_000);
    // Short-circuited: inner authorize never ran, no token consumed.
    expect(original).not.toHaveBeenCalled();
    expect(runMutation).not.toHaveBeenCalled();
  });

  // (2d) Non-signIn flows (signUp/reset/verification) are NOT brute-forceable
  // against a known account, so the wrapper must NOT touch the limiter for them
  // — it just delegates straight through. (key === null path.)
  it("does not engage the limiter for non-signIn flows", async () => {
    const original = vi.fn<AuthorizeFn>(async () => ({ userId: "reset-user" }));
    const provider = providerWithOptionsAuthorize(original);
    const wrapped = withSignInRateLimit(provider);
    const wrappedAuthorize = getAuthorize(wrapped) as AuthorizeFn;

    const { ctx, runQuery, runMutation } = makeCtx();
    const got = await wrappedAuthorize(
      { flow: "reset", email: "victim@mail.com" },
      ctx,
    );

    expect(got).toEqual({ userId: "reset-user" });
    expect(original).toHaveBeenCalledTimes(1);
    // No check (runQuery) and no limit/reset (runMutation) for a non-signIn flow.
    expect(runQuery).not.toHaveBeenCalled();
    expect(runMutation).not.toHaveBeenCalled();
  });

  // (3) DOCUMENTED FAIL-OPEN: a provider with NO authorize anywhere is returned
  // UNCHANGED (rate-limiting silently disabled, logged only). This test documents
  // — and pins — that known behaviour so it's a deliberate choice, not a surprise.
  it("fails OPEN (returns provider unchanged, logs) when no authorize is found", () => {
    const provider = providerWithNoAuthorize();

    let ret: AuthProviderMaterializedConfig | undefined;
    expect(() => {
      ret = withSignInRateLimit(provider);
    }).not.toThrow();

    // Same object back, untouched: no `authorize` was injected.
    expect(ret).toBe(provider);
    expect(getAuthorize(ret as AuthProviderMaterializedConfig)).toBeUndefined();
    // And the fail-open is LOUD in logs (the only signal a future shape change
    // disabled the limiter) — assert the documented warning fired.
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0]?.[0])).toContain(
      "could not find Password.authorize to wrap",
    );
  });
});
