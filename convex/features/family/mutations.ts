import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requirePrincipal } from "../../_shared/auth";
import { casBump, nextOrder } from "../../_shared/db";

// Succession (ahli waris) is the principal's PRIVATE estate plan. Per SEC-001,
// every heirs write is requirePrincipal — NOT requireFeatureWrite. cfo holds the
// data-studio feature but must never reach the heirs table through any surface.

// `share` is stored as a display string ("28%"). The integrity GUARD validates
// the numeric portion is a finite percentage in [0,100]. Throws on violation so
// a bad share never lands in the table.
function assertShare(share: string): void {
  const pct = Number(share.replace(/%/g, "").trim());
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error("Invalid share: percentage must be a number in [0,100]");
  }
}

export const createHeir = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    share: v.string(),
    readiness: v.number(),
    age: v.string(),
    next: v.string(),
    mandate: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePrincipal(ctx);
    assertShare(args.share);
    const order = await nextOrder(ctx, "heirs");
    return await ctx.db.insert("heirs", {
      ...args,
      color: args.color ?? "var(--color-mk-blue)",
      order,
      version: 1,
    });
  },
});

export const updateHeir = mutation({
  args: {
    id: v.id("heirs"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    share: v.optional(v.string()),
    readiness: v.optional(v.number()),
    age: v.optional(v.string()),
    next: v.optional(v.string()),
    mandate: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requirePrincipal(ctx);
    const normId = ctx.db.normalizeId("heirs", id);
    if (!normId) throw new Error("Invalid heir id");
    if (patch.share !== undefined) assertShare(patch.share);
    await casBump(ctx, "heirs", normId, expectedVersion, patch, "Invalid heir id");
  },
});

export const removeHeir = mutation({
  args: { id: v.id("heirs") },
  handler: async (ctx, { id }) => {
    await requirePrincipal(ctx);
    const normId = ctx.db.normalizeId("heirs", id);
    if (!normId) throw new Error("Invalid heir id");
    await ctx.db.delete(normId);
  },
});
