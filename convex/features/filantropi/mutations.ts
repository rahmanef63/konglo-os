import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { casBump, nextOrder } from "../../_shared/db";

// Filantropi writes over philanthropyGrants. cfo's ROLE_MENU lacks "filantropi",
// so requireFeatureWrite blocks cfo+staf at the READ gate — principal only.
// `progress` is the lone numeric field (0–100 completion); `amount` is display
// copy ("Rp 420 M") kept as a string. New rows append at the end of by_order.

// Guard a 0–100 percentage: finite and within range.
function assertProgress(progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new Error("progress must be a finite number between 0 and 100");
  }
}

export const createGrant = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    amount: v.string(),
    progress: v.number(),
    color: v.string(),
    beneficiaries: v.string(),
    region: v.string(),
    partner: v.string(),
  },
  handler: async (ctx, args) => {
    await requireFeatureWrite(ctx, "filantropi");
    assertProgress(args.progress);
    const order = await nextOrder(ctx, "philanthropyGrants");
    return await ctx.db.insert("philanthropyGrants", {
      ...args,
      order,
      version: 1,
    });
  },
});

export const updateGrant = mutation({
  args: {
    id: v.id("philanthropyGrants"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.optional(v.string()),
    progress: v.optional(v.number()),
    color: v.optional(v.string()),
    beneficiaries: v.optional(v.string()),
    region: v.optional(v.string()),
    partner: v.optional(v.string()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "filantropi");
    if (patch.progress !== undefined) assertProgress(patch.progress);
    await casBump(ctx, "philanthropyGrants", id, expectedVersion, patch);
  },
});

export const removeGrant = mutation({
  args: { id: v.id("philanthropyGrants") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "filantropi");
    await ctx.db.delete(id);
  },
});
