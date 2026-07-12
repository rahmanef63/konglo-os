import { query } from "../../_generated/server";
import { requirePrincipal } from "../../_shared/auth";

// One list query per CRUD-able family table. Reads are already-ordered via each
// table's by_order index (bounded .take()) — already ascending, no re-sort.
// SECURITY: principal-ONLY by construction (defense-in-depth for SEC-001). The
// heirs/succession READ must never leak to cfo/staf — we do not rely on the
// keluarga-warisan menu omission, we gate the data itself with requirePrincipal.
export const listHeirs = query({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    return await ctx.db.query("heirs").withIndex("by_order").take(100);
  },
});

export const listGovernance = query({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    return await ctx.db.query("governanceBuckets").withIndex("by_order").take(100);
  },
});
