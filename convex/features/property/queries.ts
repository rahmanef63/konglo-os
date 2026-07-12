import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// properti-aset estate/asset registry. cfo HAS properti-aset in its menu, so this
// list is readable by cfo + principal (staf is blocked at the READ gate). Bounded
// scan via the by_order index (.take(100)) — already ascending, never a bare
// .collect() (rr: indexed take, not full-table read).
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "properti-aset");
    return await ctx.db.query("propertyAssets").withIndex("by_order").take(100);
  },
});
