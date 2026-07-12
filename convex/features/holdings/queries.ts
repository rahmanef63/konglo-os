import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// investasi-pasar market holdings. cfo HAS investasi-pasar in its menu, so this
// list is readable by cfo + principal (staf is blocked at the READ gate).
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "investasi-pasar");
    return await ctx.db.query("holdings").withIndex("by_order").take(100);
  },
});
