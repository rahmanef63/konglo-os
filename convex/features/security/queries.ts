import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// One list query per CRUD-able security table. Reads are already-ordered via the
// by_order index (bounded .take()) — already ascending, no in-memory re-sort.
export const listStaff = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "keamanan-staf");
    return await ctx.db.query("staffRoster").withIndex("by_order").take(100);
  },
});

export const listZones = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "keamanan-staf");
    return await ctx.db.query("securityZones").withIndex("by_order").take(100);
  },
});

export const listMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "keamanan-staf");
    return await ctx.db.query("securityMetrics").withIndex("by_order").take(100);
  },
});
