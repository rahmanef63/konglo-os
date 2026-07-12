import { v } from "convex/values";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { internalMutation } from "../../_generated/server";
import { components } from "../../_generated/api";

// The aiChat action is `"use node"` + internet-reachable, and spends real money
// per call (ANTHROPIC_API_KEY). Its own ctx can't read the db or throttle, so it
// delegates authorization here. Two gates the rest of the app already enforces
// on far cheaper ops but this action lacked:
//  1. AUTHZ — a role-less authenticated caller (e.g. an allowlisted-out Google
//     login, claimRole → null) must NOT reach the LLM. "no role → no access".
//  2. RATE LIMIT — a per-user token bucket so a scripted / runaway loop can't
//     drain the budget. Reuses the rate-limiter component already registered in
//     convex.config.ts (namespaced by the `perUserChat` key; independent of the
//     data-studio write bucket in _shared/writeLimit.ts).
const chatLimiter = new RateLimiter(components.rateLimiter, {
  // ~30 replies / 10 min per user, burst of 15 (3/min sustained refill). A human
  // conversing never trips it; a scripted loop does.
  perUserChat: { kind: "token bucket", rate: 30, period: 10 * MINUTE, capacity: 15 },
});

export const chatGuard = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<{ ok: boolean; notice?: string }> => {
    const role = (
      await ctx.db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first()
    )?.role;
    if (!role) return { ok: false, notice: "Akun Anda belum diberi akses ke Asisten." };
    const status = await chatLimiter.limit(ctx, "perUserChat", { key: userId });
    if (!status.ok) {
      return { ok: false, notice: "Terlalu banyak permintaan ke Asisten — coba lagi sebentar." };
    }
    return { ok: true };
  },
});
