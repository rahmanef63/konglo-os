import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, nextOrder } from "../../_shared/db";

// Office net-worth headline figures + portfolio allocation slices.
// Write gate: requireFeatureWrite(..., "kekayaan-kas") = elevated (principal|cfo)
// caller WITH the kekayaan-kas feature. staf can never write.
//
// GUARDS (defense against a direct-API caller bypassing the client UI):
//   - every numeric must be finite (rejects NaN / Infinity).
//   - money fields (netWorth, liabilitas, allocation value) must be >= 0 (no cap).
//   - ratio/percentage fields (debtRatio) must be in [0,100].
//   - netWorthChange is a signed delta → finite only, may be negative.

const FIGURES_KEY = "current";

// finite-or-throw. Convex's v.number() already rejects non-numbers, so the only
// runtime escapes left are NaN / ±Infinity, which Number.isFinite catches.
function finite(label: string, n: number): void {
  if (!Number.isFinite(n)) throw new Error(`Invalid number: ${label}`);
}

function money(label: string, n: number): void {
  finite(label, n);
  if (n < 0) throw new Error(`Must be >= 0: ${label}`);
}

function percent(label: string, n: number): void {
  finite(label, n);
  if (n < 0 || n > 100) throw new Error(`Must be in [0,100]: ${label}`);
}

// Upsert the officeFigures "current" singleton (patch if present, else insert).
// expectedVersion enables optimistic concurrency: when supplied it must equal
// the row's current version (undefined → 0), else we throw a conflict. Every
// write bumps version. Omitting it skips the check but still increments.
export const setFigures = mutation({
  args: {
    netWorth: v.number(),
    netWorthChange: v.number(),
    liabilitas: v.number(),
    debtRatio: v.number(),
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { expectedVersion, ...args }) => {
    await requireFeatureWrite(ctx, "kekayaan-kas");
    money("netWorth", args.netWorth);
    finite("netWorthChange", args.netWorthChange); // signed delta, may be < 0
    money("liabilitas", args.liabilitas);
    percent("debtRatio", args.debtRatio);
    const existing = await ctx.db
      .query("officeFigures")
      .withIndex("by_key", (q) => q.eq("key", FIGURES_KEY))
      .first();
    if (existing) {
      const current = existing.version ?? 0;
      if (expectedVersion !== undefined && expectedVersion !== current) {
        throw new Error("conflict: data telah berubah");
      }
      await ctx.db.patch(existing._id, { ...args, version: current + 1 });
      return existing._id;
    }
    // New singleton: no row to conflict against; seed at version 1.
    if (expectedVersion !== undefined && expectedVersion !== 0) {
      throw new Error("conflict: data telah berubah");
    }
    return await ctx.db.insert("officeFigures", {
      key: FIGURES_KEY,
      ...args,
      version: 1,
    });
  },
});

// Upsert one allocation slice, keyed by slug (derived from label when absent).
// value is the slice's worth in Rupiah → money, >= 0 (no upper cap). The Beranda
// donut sizes each slice by its proportion of the rupiah total.
export const upsertAllocation = mutation({
  args: {
    slug: v.optional(v.string()),
    label: v.string(),
    value: v.number(),
    accent: v.string(),
    order: v.optional(v.number()),
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { slug, label, value, accent, order, expectedVersion }) => {
    await requireFeatureWrite(ctx, "kekayaan-kas");
    money("value", value);
    if (order !== undefined) {
      finite("order", order);
      if (order < 0) throw new Error("Must be >= 0: order");
    }
    // Resolve the monotonic order first: an explicit `order`, else append at the
    // end of by_order (max + 1, indexed .first()). Used both as the insert order
    // AND the slug fallback so a same-millisecond burst can't collide.
    const resolvedOrder = order ?? (await nextOrder(ctx, "allocations"));
    const key = (slug && slug.trim()) || slugify(label) || `alloc-${resolvedOrder}`;
    const existing = await ctx.db
      .query("allocations")
      .withIndex("by_slug", (q) => q.eq("slug", key))
      .first();
    if (existing) {
      // UPDATE path → compare-and-set on version (undefined → 0), then bump.
      const current = existing.version ?? 0;
      if (expectedVersion !== undefined && expectedVersion !== current) {
        throw new Error("conflict: data telah berubah");
      }
      const patch: {
        label: string;
        value: number;
        accent: string;
        order?: number;
        version: number;
      } = { label, value, accent, version: current + 1 };
      if (order !== undefined) patch.order = order;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("allocations", {
      slug: key,
      label,
      value,
      accent,
      order: resolvedOrder,
      version: 1,
    });
  },
});

export const removeAllocation = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "kekayaan-kas");
    const docId = ctx.db.normalizeId("allocations", id);
    if (!docId) throw new Error("Invalid id");
    await ctx.db.delete(docId);
  },
});
