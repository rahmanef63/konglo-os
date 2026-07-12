import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, assertOrder, nextOrder, casBump, uniqueSlug } from "../../_shared/db";

// propertyAssets display fields (value/maint/year/...) are pre-formatted strings
// stored verbatim — deploy-safe, no numeric coercion. The only numeric column is
// `order`, an optional co-list reorder input, validated via the shared assertOrder
// (non-negative integer) so a poisoned value can't corrupt the by_order index.

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    value: v.string(),
    location: v.string(),
    color: v.string(),
    maint: v.string(),
    status: v.string(),
    year: v.string(),
    note: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { order, ...rest }) => {
    await requireFeatureWrite(ctx, "properti-aset");
    assertOrder(order);
    // order = supplied value, else max(order) + 1 via the by_order index
    // (desc .first()) — bounded index read, never a full-table scan.
    const resolvedOrder = order ?? (await nextOrder(ctx, "propertyAssets"));
    const slug = await uniqueSlug(ctx, "propertyAssets", slugify(rest.name), resolvedOrder, `asset-${resolvedOrder}`);
    return await ctx.db.insert("propertyAssets", {
      ...rest,
      slug,
      order: resolvedOrder,
      version: 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("propertyAssets"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    value: v.optional(v.string()),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    maint: v.optional(v.string()),
    status: v.optional(v.string()),
    year: v.optional(v.string()),
    note: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "properti-aset");
    assertOrder(patch.order);
    await casBump(ctx, "propertyAssets", id, expectedVersion, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("propertyAssets") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "properti-aset");
    await ctx.db.delete(id);
  },
});
