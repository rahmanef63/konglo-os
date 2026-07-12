import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// Reads are already-ordered via each table's by_order index (bounded .take()) —
// the index read is already ascending, so no in-memory re-sort is needed.
export const listMedicalTeam = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "kesehatan");
    return await ctx.db.query("healthMedicalTeam").withIndex("by_order").take(100);
  },
});

export const listSchedule = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "kesehatan");
    return await ctx.db.query("healthSchedule").withIndex("by_order").take(100);
  },
});

export const listPrograms = query({
  args: {},
  handler: async (ctx) => {
    await requireFeature(ctx, "kesehatan");
    return await ctx.db.query("healthPrograms").withIndex("by_order").take(100);
  },
});
