import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// Read already-ordered via the by_order index, bounded take(200). The by_order
// index read is already ascending, so no in-memory re-sort is needed.
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "portofolio-bisnis");
    return await ctx.db.query("subsidiaries").withIndex("by_order").take(200);
  },
});
