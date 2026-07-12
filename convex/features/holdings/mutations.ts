import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, nextOrder, casBump, uniqueSlug } from "../../_shared/db";

// holdings display fields are pre-formatted strings (deploy-safe: schema stores
// them verbatim). The only numeric payload is the sparkline `points`, which must
// be finite and bounded so a poisoned array can't blow up the chart renderer.
function assertPoints(points: number[] | undefined) {
  if (points === undefined) return;
  if (points.length > 64) {
    throw new Error("points must have at most 64 entries");
  }
  for (const p of points) {
    if (!Number.isFinite(p) || p < -1e6 || p > 1e6) {
      throw new Error("points must be finite numbers within +/- 1e6");
    }
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    ticker: v.string(),
    value: v.string(),
    change: v.string(),
    up: v.boolean(),
    weight: v.string(),
    avg: v.string(),
    lot: v.string(),
    sector: v.string(),
    points: v.array(v.number()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "investasi-pasar");
    assertPoints(args.points);
    // order = max(order) + 1 via the by_order index (desc .first()), not a scan.
    const order = await nextOrder(ctx, "holdings");
    const slug = await uniqueSlug(ctx, "holdings", slugify(args.name), order, `holding-${order}`);
    return await ctx.db.insert("holdings", { ...args, slug, order, version: 1 });
  },
});

export const update = mutation({
  args: {
    id: v.id("holdings"),
    name: v.optional(v.string()),
    ticker: v.optional(v.string()),
    value: v.optional(v.string()),
    change: v.optional(v.string()),
    up: v.optional(v.boolean()),
    weight: v.optional(v.string()),
    avg: v.optional(v.string()),
    lot: v.optional(v.string()),
    sector: v.optional(v.string()),
    points: v.optional(v.array(v.number())),
    color: v.optional(v.string()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "investasi-pasar");
    assertPoints(patch.points);
    await casBump(ctx, "holdings", id, expectedVersion, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("holdings") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "investasi-pasar");
    await ctx.db.delete(id);
  },
});
