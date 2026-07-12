import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, casBump, nextOrder, uniqueSlug } from "../../_shared/db";

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    tier: v.string(),
    warmth: v.string(),
    last: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "relasi-jaringan");
    // append at end of by_order (max + 1, indexed .first()); slug collision check
    // uses the by_slug index (.eq(base).first()) — exact-match + race-safe.
    const order = await nextOrder(ctx, "contacts");
    const slug = await uniqueSlug(ctx, "contacts", slugify(args.name), order, `kontak-${order}`);
    return await ctx.db.insert("contacts", { ...args, slug, order, version: 1 });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    tier: v.optional(v.string()),
    warmth: v.optional(v.string()),
    last: v.optional(v.string()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "relasi-jaringan");
    await casBump(ctx, "contacts", id, expectedVersion, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "relasi-jaringan");
    await ctx.db.delete(id);
  },
});
