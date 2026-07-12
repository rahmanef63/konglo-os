import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireUser, requirePrincipal } from "../../_shared/auth";

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await requireUser(ctx);
    // SECURITY: scope the audit bell to the CALLING user only. With by_at a staf
    // account streamed principal/cfo action labels + free-form meta = cross-user
    // disclosure. by_user (schema.ts) keys on userId; .order("desc") then sorts
    // that user's rows by _creationTime newest-first. Still .take(N), no collect.
    return await ctx.db
      .query("activity")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(Math.min(limit ?? 20, 80));
  },
});

// Principal-ONLY org-wide audit feed. Unlike `recent` (self-scoped bell), this
// lets the estate owner review EVERY actor's activity — the oversight surface
// for the broadly-empowered cfo/ajudan (SEC-001). Uses the by_at index (newest
// first, bounded take — no bare .collect()) and joins each row's actor email +
// role for a "who did what". requirePrincipal, so it can never widen the bell.
export const allRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requirePrincipal(ctx);
    const rows = await ctx.db
      .query("activity")
      .withIndex("by_at")
      .order("desc")
      .take(Math.min(limit ?? 40, 100));
    return Promise.all(
      rows.map(async (r) => {
        const u = await ctx.db.get(r.userId);
        const roleRow = await ctx.db
          .query("roles")
          .withIndex("by_user", (q) => q.eq("userId", r.userId))
          .first();
        return {
          _id: r._id,
          label: r.label,
          meta: r.meta,
          at: r.at,
          actor: u?.email ?? u?.name ?? "—",
          role: roleRow?.role ?? null,
        };
      }),
    );
  },
});
