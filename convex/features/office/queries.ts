import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// Net-worth headline figures + portfolio allocation slices are PRINCIPAL/CFO
// data. Gate reads on the "kekayaan-kas" feature (matches the write gate in
// mutations.ts and the canAccess SSOT: principal=all, cfo holds it, staf does
// NOT). Previously requireUser-only → a staf/wrong-role caller could read the
// owner's net worth via the direct API even though the menu hides it. (P12-B)
export const getFigures = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "kekayaan-kas");
    return await ctx.db
      .query("officeFigures")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
  },
});

// Allocations read already-ordered via the by_order index (bounded .take(50)) —
// the index read is already ascending, so no in-memory re-sort is needed.
export const listAllocations = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "kekayaan-kas");
    return await ctx.db.query("allocations").withIndex("by_order").take(50);
  },
});
