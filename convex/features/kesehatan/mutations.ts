import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireFeatureWrite } from "../../_shared/auth";
import { nextOrder, casBump } from "../../_shared/db";

// Kesehatan writes over healthSchedule + healthMedicalTeam. "kesehatan" is NOT
// in cfo's NOR staf's ROLE_MENU, so requireFeatureWrite blocks both at the READ
// gate — principal only. Neither table has a slug column; placement is the lone
// numeric and is derived race-safely from the by_order index (max + 1), or taken
// from an explicit caller-supplied `order`. New rows append at the end.

// Guard the lone numeric (placement): finite and non-negative. Schema validators
// stay permissive (deploy-safe) so the boundary check lives here. NOTE: this is
// intentionally NOT the shared _shared/db.ts assertOrder — kesehatan accepts a
// non-integer placement and uses a distinct error string, so it stays local.
function assertOrder(order: number | undefined) {
  if (order !== undefined && (!Number.isFinite(order) || order < 0)) {
    throw new Error("order must be a finite number >= 0");
  }
}

// ── healthSchedule ─────────────────────────────────────────────────────────
export const createSchedule = mutation({
  args: {
    date: v.string(),
    title: v.string(),
    location: v.string(),
    color: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { order, ...args }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    assertOrder(order);
    const resolved = order ?? (await nextOrder(ctx, "healthSchedule"));
    return await ctx.db.insert("healthSchedule", {
      ...args,
      order: resolved,
      version: 1,
    });
  },
});

export const updateSchedule = mutation({
  args: {
    id: v.id("healthSchedule"),
    date: v.optional(v.string()),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    assertOrder(patch.order);
    await casBump(ctx, "healthSchedule", id, expectedVersion, patch);
  },
});

export const removeSchedule = mutation({
  args: { id: v.id("healthSchedule") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    await ctx.db.delete(id);
  },
});

// ── healthMedicalTeam ──────────────────────────────────────────────────────
export const createMedicalTeam = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    color: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { order, ...args }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    assertOrder(order);
    const resolved = order ?? (await nextOrder(ctx, "healthMedicalTeam"));
    return await ctx.db.insert("healthMedicalTeam", {
      ...args,
      order: resolved,
      version: 1,
    });
  },
});

export const updateMedicalTeam = mutation({
  args: {
    id: v.id("healthMedicalTeam"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments.
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { id, expectedVersion, ...patch }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    assertOrder(patch.order);
    await casBump(ctx, "healthMedicalTeam", id, expectedVersion, patch);
  },
});

export const removeMedicalTeam = mutation({
  args: { id: v.id("healthMedicalTeam") },
  handler: async (ctx, { id }) => {
    await requireFeatureWrite(ctx, "kesehatan");
    await ctx.db.delete(id);
  },
});
