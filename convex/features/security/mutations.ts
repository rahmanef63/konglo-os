import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { slugify, assertOrder, casBump, uniqueSlug } from "../../_shared/db";
import type { Id } from "../../_generated/dataModel";

// keamanan-staf CRUD for the two ordered, slug-keyed tables the screen renders:
// staffRoster (PersonRows) and securityZones (status pills). securityMetrics is
// left read-only on purpose — its tiles are derived counters, not user entities.
//
// RBAC: requireFeatureWrite(ctx, "keamanan-staf"). staf HAS the feature in its
// menu (read) but is not an elevated role, so the write gate rejects it; cfo
// lacks the feature entirely. Net: writes are principal-only.

// Tables this module owns — both share the slug + by_slug + by_order shape.
type SecurityTable = "staffRoster" | "securityZones";

// slugify + assertOrder (non-negative integer guard) come from _shared/db.ts.
// `order` is the only numeric column on either table — an optional co-list reorder
// input; assertOrder keeps a poisoned value out of the by_order index. NOTE the
// local nextOrder below seeds the FIRST row at order 0 (?? -1), unlike the shared
// nextOrder (?? 0 → 1), so it stays here to preserve the seed-row placement.

// max(order) + 1 via the by_order index (desc .first()) — a bounded index read,
// never a full-table scan. Seed rows start at order 0, so new rows append above.
async function nextOrder(
  ctx: MutationCtx,
  table: SecurityTable,
): Promise<number> {
  const top = await ctx.db.query(table).withIndex("by_order").order("desc").first();
  return (top?.order ?? -1) + 1;
}

// Trim accidental padding then re-validate against the table; the v.id validator
// already rejects a foreign-table id, this only hardens against stray whitespace.
function normalizeId<T extends SecurityTable>(
  ctx: MutationCtx,
  table: T,
  id: Id<T>,
): Id<T> {
  const trimmed = typeof id === "string" ? id.trim() : id;
  const norm = ctx.db.normalizeId(table, trimmed as Id<T>);
  if (!norm) throw new Error("Invalid id");
  return norm;
}

// --- staffRoster -------------------------------------------------------------
export const createStaff = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    status: v.string(),
    color: v.string(),
    location: v.string(),
    shift: v.string(),
    tenure: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { order, ...rest }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    assertOrder(order);
    const resolvedOrder = order ?? (await nextOrder(ctx, "staffRoster"));
    const slug = await uniqueSlug(
      ctx,
      "staffRoster",
      slugify(rest.name),
      resolvedOrder,
      `staff-${resolvedOrder}`,
    );
    return await ctx.db.insert("staffRoster", {
      ...rest,
      slug,
      order: resolvedOrder,
      version: 1,
    });
  },
});

export const updateStaff = mutation({
  args: {
    id: v.id("staffRoster"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
    location: v.optional(v.string()),
    shift: v.optional(v.string()),
    tenure: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    assertOrder(patch.order);
    const normId = normalizeId(ctx, "staffRoster", id);
    await casBump(ctx, "staffRoster", normId, expectedVersion, patch);
  },
});

export const removeStaff = mutation({
  args: { id: v.id("staffRoster") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    await ctx.db.delete(normalizeId(ctx, "staffRoster", id));
  },
});

// --- securityZones -----------------------------------------------------------
export const createZone = mutation({
  args: {
    label: v.string(),
    status: v.string(),
    color: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { order, ...rest }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    assertOrder(order);
    const resolvedOrder = order ?? (await nextOrder(ctx, "securityZones"));
    const slug = await uniqueSlug(
      ctx,
      "securityZones",
      slugify(rest.label),
      resolvedOrder,
      `zone-${resolvedOrder}`,
    );
    return await ctx.db.insert("securityZones", {
      ...rest,
      slug,
      order: resolvedOrder,
      version: 1,
    });
  },
});

export const updateZone = mutation({
  args: {
    id: v.id("securityZones"),
    label: v.optional(v.string()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    assertOrder(patch.order);
    const normId = normalizeId(ctx, "securityZones", id);
    await casBump(ctx, "securityZones", normId, expectedVersion, patch);
  },
});

export const removeZone = mutation({
  args: { id: v.id("securityZones") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "keamanan-staf");
    await ctx.db.delete(normalizeId(ctx, "securityZones", id));
  },
});
