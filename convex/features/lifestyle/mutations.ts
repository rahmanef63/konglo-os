import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { nextOrder, casBump, assertOrder } from "../../_shared/db";

// Lifestyle writes over lifestyleEvents. cfo's ROLE_MENU lacks
// "hiburan-gaya-hidup", so requireFeatureWrite blocks cfo+staf at the READ gate
// — principal only. The table has no money fields; `order` is managed internally
// and new rows append at the end of by_order (max + 1).

export const createEvent = mutation({
  args: {
    date: v.string(),
    title: v.string(),
    location: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    const order = await nextOrder(ctx, "lifestyleEvents");
    return await ctx.db.insert("lifestyleEvents", { ...args, order, version: 1 });
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("lifestyleEvents"),
    date: v.optional(v.string()),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    await casBump(ctx, "lifestyleEvents", id, expectedVersion, patch);
  },
});

export const removeEvent = mutation({
  args: { id: v.id("lifestyleEvents") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    await ctx.db.delete(id);
  },
});

// --- Concierge ---------------------------------------------------------------
// conciergeReservations (emoji/label) + conciergeRequests (label) share the same
// principal-only WRITE gate and the same internally-managed `order`. Neither has
// a slug field — both carry a by_order index, so the next order is the current
// max + 1 via by_order desc.first() (race-safer + cheaper than a take() scan).

export const createReservation = mutation({
  args: { emoji: v.string(), label: v.string() },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    const order = await nextOrder(ctx, "conciergeReservations");
    return await ctx.db.insert("conciergeReservations", {
      ...args,
      order,
      version: 1,
    });
  },
});

export const updateReservation = mutation({
  args: {
    id: v.id("conciergeReservations"),
    emoji: v.optional(v.string()),
    label: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    assertOrder(patch.order);
    await casBump(ctx, "conciergeReservations", id, expectedVersion, patch);
  },
});

export const removeReservation = mutation({
  args: { id: v.id("conciergeReservations") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    await ctx.db.delete(id);
  },
});

export const createRequest = mutation({
  args: { label: v.string() },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    const order = await nextOrder(ctx, "conciergeRequests");
    return await ctx.db.insert("conciergeRequests", {
      ...args,
      order,
      version: 1,
    });
  },
});

export const updateRequest = mutation({
  args: {
    id: v.id("conciergeRequests"),
    label: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    assertOrder(patch.order);
    await casBump(ctx, "conciergeRequests", id, expectedVersion, patch);
  },
});

export const removeRequest = mutation({
  args: { id: v.id("conciergeRequests") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "hiburan-gaya-hidup");
    await ctx.db.delete(id);
  },
});
