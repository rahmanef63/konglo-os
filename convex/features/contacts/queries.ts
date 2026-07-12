import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// Read already-ordered via the by_order index, bounded take(200). The trailing
// .sort() is a defensive no-op mirroring the holdings/property reference.
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "relasi-jaringan");
    return (await ctx.db.query("contacts").withIndex("by_order").take(200)).sort(
      (a, b) => a.order - b.order,
    );
  },
});
