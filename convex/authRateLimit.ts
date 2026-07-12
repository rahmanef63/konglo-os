import {
  RateLimiter,
  MINUTE,
  isRateLimitError,
} from "@convex-dev/rate-limiter";
import type {
  AuthProviderMaterializedConfig,
  GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";
import type { GenericDataModel } from "convex/server";
import type { Value } from "convex/values";
import { components } from "./_generated/api";

// rr: Brute-force / password-spray guard for the @convex-dev/auth Password
// sign-in. Backed by the rate-limiter component registered in
// `convex.config.ts`. See `auth.ts` for the integration seam.
//
// WHY a token bucket keyed per normalized email:
//  - `rate: 10 / 10 min` with `capacity: 10` means a fresh account can make up
//    to 10 attempts in quick succession, then refills 1 token/min. That easily
//    covers a human fat-fingering their password a few times, while a spray of
//    hundreds of guesses per account is throttled to ~1/min after the burst.
//  - The key is the *target account* (email), NOT the caller IP, so one
//    attacker cannot lock every account, and a victim account cannot be DoS'd
//    across unrelated users.
//
// CRITICAL (demo safety): we only ever CONSUME a token on a FAILED sign-in,
// and we RESET the bucket on every SUCCESSFUL sign-in. A legitimate user
// (seeded principal `konglo@mail.com` / cfo `ajudan@mail.com`) who types the
// right password is therefore NEVER limited — successful logins cost 0 tokens
// and wipe any accumulated failures. Only excessive *wrong* guesses bite.
export const SIGN_IN_LIMIT = {
  // ~10 attempts / 10 min per normalized email, burst of 10.
  signInPerEmail: {
    kind: "token bucket",
    rate: 10,
    period: 10 * MINUTE,
    capacity: 10,
  },
} as const;

export const signInRateLimiter = new RateLimiter(
  components.rateLimiter,
  SIGN_IN_LIMIT,
);

// Normalize the email used as the bucket key so "User@Mail.com" and
// "user@mail.com " share one limit (mirrors how accounts are keyed by email).
function emailKey(params: Record<string, Value | undefined>): string | null {
  const email = params.email;
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

// Only the password sign-IN flow is brute-forceable against a known account.
// signUp/reset/verification go through other safeguards (signUp is disabled in
// this app; reset/verify require an emailed code), so we scope the limiter to
// `flow === "signIn"` to avoid throttling those paths.
function isSignInFlow(params: Record<string, Value | undefined>): boolean {
  return params.flow === "signIn";
}

/**
 * Wrap a materialized Password provider (the object returned by
 * `Password({...})`) so that its `authorize` is fronted by the per-email
 * sign-in rate limit, WITHOUT reimplementing any auth logic.
 *
 * Mechanism: `@convex-dev/auth` materializes a provider by merging
 * `provider.options` over the provider object, and the Password provider stores
 * its real `authorize` under `options.authorize`. We replace that single
 * function with a wrapper that delegates to the original. Nothing else about
 * the provider (crypto, flows, email providers) is touched.
 */
export function withSignInRateLimit<DataModel extends GenericDataModel>(
  provider: AuthProviderMaterializedConfig,
): AuthProviderMaterializedConfig {
  const options = (provider as { options?: Record<string, unknown> }).options;
  const original = (options?.authorize ??
    (provider as { authorize?: unknown }).authorize) as
    | ((
        params: Record<string, Value | undefined>,
        ctx: GenericActionCtxWithAuthConfig<DataModel>,
      ) => Promise<{ userId: string; sessionId?: string } | null>)
    | undefined;

  if (typeof original !== "function") {
    // Provider shape changed upstream — fail safe by leaving auth untouched.
    // (Logged so a future @convex-dev/auth bump that moves `authorize` is
    // caught instead of silently disabling the limiter.)
    console.error(
      "[authRateLimit] could not find Password.authorize to wrap; " +
        "sign-in rate limiting is DISABLED for this provider.",
    );
    return provider;
  }

  const wrapped = async (
    params: Record<string, Value | undefined>,
    ctx: GenericActionCtxWithAuthConfig<DataModel>,
  ) => {
    const key = isSignInFlow(params) ? emailKey(params) : null;

    // Pre-check WITHOUT consuming a token: if the account is already over the
    // limit, reject before we even hit the password verifier.
    if (key !== null) {
      try {
        const status = await signInRateLimiter.check(ctx, "signInPerEmail", {
          key,
        });
        if (!status.ok) {
          throw new TooManyAttemptsError(status.retryAfter);
        }
      } catch (err) {
        // A failure inside the limiter component itself must never block a
        // legitimate login. Re-throw only our own deliberate rejection.
        if (err instanceof TooManyAttemptsError) throw err;
        console.error("[authRateLimit] check failed (allowing):", err);
      }
    }

    try {
      const result = await original(params, ctx);
      // Successful sign-in (non-null) clears the failure bucket so honest users
      // never accumulate toward a lockout.
      if (key !== null && result !== null) {
        try {
          await signInRateLimiter.reset(ctx, "signInPerEmail", { key });
        } catch (err) {
          console.error("[authRateLimit] reset failed (ignoring):", err);
        }
      }
      return result;
    } catch (err) {
      // Failed sign-in: consume one token against the target account. Swallow
      // limiter errors so the original auth error is what surfaces.
      if (key !== null && !isRateLimitError(err)) {
        try {
          await signInRateLimiter.limit(ctx, "signInPerEmail", { key });
        } catch (limErr) {
          console.error("[authRateLimit] limit consume failed:", limErr);
        }
      }
      throw err;
    }
  };

  if (options) options.authorize = wrapped;
  (provider as { authorize?: unknown }).authorize = wrapped;
  return provider;
}

// Surfaced to the client as a generic credentials failure by @convex-dev/auth.
// `retryAfter` (ms) is attached for callers/logs that want to show a wait hint.
export class TooManyAttemptsError extends Error {
  readonly retryAfter: number;
  constructor(retryAfter: number) {
    super("Too many sign-in attempts. Please try again later.");
    this.name = "TooManyAttemptsError";
    this.retryAfter = retryAfter;
  }
}
