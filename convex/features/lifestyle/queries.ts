import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// One list query per CRUD-able lifestyle table. Reads are already-ordered via
// each table's by_order index (bounded .take()) — already ascending, no re-sort.
export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "hiburan-gaya-hidup");
    return await ctx.db.query("lifestyleEvents").withIndex("by_order").take(100);
  },
});

export const listReservations = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "hiburan-gaya-hidup");
    return await ctx.db.query("conciergeReservations").withIndex("by_order").take(100);
  },
});

export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "hiburan-gaya-hidup");
    return await ctx.db.query("conciergeRequests").withIndex("by_order").take(100);
  },
});
