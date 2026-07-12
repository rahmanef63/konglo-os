import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// One list query per CRUD-able filantropi table. Reads are already-ordered via
// each table's by_order index (bounded .take()) — already ascending, no re-sort.
export const listGrants = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "filantropi");
    return await ctx.db.query("philanthropyGrants").withIndex("by_order").take(100);
  },
});

export const listImpact = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "filantropi");
    return await ctx.db.query("philanthropyImpact").withIndex("by_order").take(100);
  },
});
