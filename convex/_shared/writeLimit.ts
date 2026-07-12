import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { components } from "../_generated/api";

// rr: Per-user write rate limit for the GENERIC data-studio CRUD surface
// (notiondb createRow / updateRow / deleteRow). Sign-in is already brute-force
// guarded (authRateLimit.ts); this closes the symmetric blind spot — an authed
// elevated caller could otherwise script mass-create/delete against any
// allow-listed table. Backed by the SAME rate-limiter component already
// registered in `convex.config.ts` (a second RateLimiter instance over the
// same component is fine — limits are namespaced by their definition keys).
//
// WHY a GENEROUS token bucket keyed per userId:
//  - `rate: 120 / 10 min` with `capacity: 120` lets a human edit/add/delete
//    rows as fast as they realistically click (a burst of 120, refilling 12
//    /min thereafter) and NEVER trips during normal data-studio use. It only
//    bites a scripted loop firing hundreds of writes, which is the abuse vector.
//  - Keyed on the authed userId (from requireFeatureWrite), so one caller's
//    burst can't throttle another, and the limit follows the principal/cfo
//    identity, not an IP.
export const WRITE_LIMIT = {
  // ~120 writes / 10 min per user, burst of 120 (12/min sustained refill).
  perUserWrite: {
    kind: "token bucket",
    rate: 120,
    period: 10 * MINUTE,
    capacity: 120,
  },
} as const;

export const writeRateLimiter = new RateLimiter(
  components.rateLimiter,
  WRITE_LIMIT,
);

// Surfaced to the data-studio client when a caller exceeds the write budget.
// Indonesian message matches the app's user-facing copy (conflict errors etc).
export class TooManyWritesError extends Error {
  readonly retryAfter: number;
  constructor(retryAfter: number) {
    super("terlalu banyak perubahan — coba lagi sebentar");
    this.name = "TooManyWritesError";
    this.retryAfter = retryAfter;
  }
}

// Consume one write token for the calling user. Call AFTER the auth gate (so we
// have the authed userId) and BEFORE the db write (so an over-budget caller is
// rejected before mutating). A failure inside the limiter component itself must
// never block a legitimate write — only our deliberate over-budget rejection
// throws; component faults are logged and the write is allowed through.
export async function consumeWriteToken(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  try {
    const status = await writeRateLimiter.limit(ctx, "perUserWrite", {
      key: userId,
    });
    if (!status.ok) {
      throw new TooManyWritesError(status.retryAfter ?? 0);
    }
  } catch (err) {
    if (err instanceof TooManyWritesError) throw err;
    console.error("[writeLimit] limit consume failed (allowing):", err);
  }
}
