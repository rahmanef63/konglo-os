import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePrincipal } from "../../_shared/auth";

// Set how the OS addresses the owner. principal-ONLY — it's the owner's own form
// of address, shown to every user. Idempotent upsert of the singleton.
export const setHonorific = mutation({
  args: { honorific: v.union(v.literal("Tuan"), v.literal("Nyonya")) },
  handler: async (ctx, { honorific }) => {
    await requirePrincipal(ctx);
    const row = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    if (row) await ctx.db.patch(row._id, { honorific });
    else await ctx.db.insert("appSettings", { key: "current", honorific });
    return null;
  },
});
