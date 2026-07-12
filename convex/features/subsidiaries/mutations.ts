import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, casBump, nextOrder, uniqueSlug } from "../../_shared/db";

// Boundary numeric guards (schema validators stay permissive — deploy-safe).
// revenue is money (non-negative); margin/ownership/trend are percentages [0,100].
function assertNumbers(n: {
  revenue?: number;
  margin?: number;
  ownership?: number;
  trend?: number;
}) {
  const money: [string, number | undefined][] = [["revenue", n.revenue]];
  const pct: [string, number | undefined][] = [
    ["margin", n.margin],
    ["ownership", n.ownership],
    ["trend", n.trend],
  ];
  for (const [k, v] of money) {
    if (v !== undefined && (!Number.isFinite(v) || v < 0)) {
      throw new Error(`${k} must be a finite number >= 0`);
    }
  }
  for (const [k, v] of pct) {
    if (v !== undefined && (!Number.isFinite(v) || v < 0 || v > 100)) {
      throw new Error(`${k} must be a finite number between 0 and 100`);
    }
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    sector: v.string(),
    revenue: v.number(),
    margin: v.number(),
    ownership: v.number(),
    trend: v.number(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "portofolio-bisnis");
    assertNumbers(args);
    // append at end of by_order (max + 1, indexed .first()); slug collision check
    // uses the by_slug index (.eq(base).first()) — exact-match + race-safe.
    const order = await nextOrder(ctx, "subsidiaries");
    const slug = await uniqueSlug(ctx, "subsidiaries", slugify(args.name), order, `sub-${order}`);
    return await ctx.db.insert("subsidiaries", {
      ...args,
      slug,
      order,
      version: 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subsidiaries"),
    name: v.optional(v.string()),
    sector: v.optional(v.string()),
    revenue: v.optional(v.number()),
    margin: v.optional(v.number()),
    ownership: v.optional(v.number()),
    trend: v.optional(v.number()),
    color: v.optional(v.string()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "portofolio-bisnis");
    assertNumbers(patch);
    await casBump(ctx, "subsidiaries", id, expectedVersion, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("subsidiaries") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "portofolio-bisnis");
    await ctx.db.delete(id);
  },
});
