import { mutation } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import type { Id, TableNames } from "../../_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePrincipal } from "../../_shared/auth";
import { seedAll } from "../../seed";
import { BUSINESS_TABLES, SNAPSHOT_CAP, TABLE_READ_CAP } from "./_tables";

// All data-management ops are principal-ONLY: the scope includes `heirs` (estate
// / succession), which SEC-001 keeps owner-only. Every destructive op auto-snaps
// first, so clear / replace / load / restore are always undoable.

// Collect every business table's rows with system fields stripped → a plain blob.
async function collectAll(ctx: MutationCtx): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of BUSINESS_TABLES) {
    const rows = await ctx.db.query(t as TableNames).take(TABLE_READ_CAP);
    // Drop _id/_creationTime so a restore re-inserts as fresh docs (konglo tables
    // relate by slug/key, not by _id, so new ids are safe).
    out[t] = rows.map(({ _id, _creationTime, ...rest }) => rest);
  }
  return out;
}

async function clearAllTables(ctx: MutationCtx): Promise<number> {
  let n = 0;
  for (const t of BUSINESS_TABLES) {
    const rows = await ctx.db.query(t as TableNames).take(TABLE_READ_CAP);
    for (const r of rows) {
      await ctx.db.delete(r._id);
      n++;
    }
  }
  return n;
}

async function insertBlob(ctx: MutationCtx, blob: Record<string, unknown[]>): Promise<number> {
  let n = 0;
  for (const t of BUSINESS_TABLES) {
    const rows = blob[t];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      // Stripped of system fields on capture; shape matches the table schema.
      await ctx.db.insert(t as TableNames, row as never);
      n++;
    }
  }
  return n;
}

// Snapshot current state, prune to the newest SNAPSHOT_CAP, return the new id.
async function takeSnapshot(
  ctx: MutationCtx,
  label: string,
  kind: "manual" | "auto",
): Promise<Id<"dataSnapshots">> {
  const data = await collectAll(ctx);
  const rowCount = Object.values(data).reduce((s, a) => s + a.length, 0);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const id = await ctx.db.insert("dataSnapshots", {
    label,
    kind,
    createdAt: Date.now(),
    rowCount,
    data: JSON.stringify(data),
    createdByEmail: user?.email ?? undefined,
  });
  // Prune oldest beyond the cap.
  const all = await ctx.db.query("dataSnapshots").withIndex("by_createdAt").order("desc").collect();
  for (const old of all.slice(SNAPSHOT_CAP)) await ctx.db.delete(old._id);
  return id;
}

// --- Public mutations (principal only) ---------------------------------------

export const createSnapshot = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    await requirePrincipal(ctx);
    const clean = label.trim().slice(0, 80) || "Snapshot manual";
    return takeSnapshot(ctx, clean, "manual");
  },
});

export const removeSnapshot = mutation({
  args: { id: v.id("dataSnapshots") },
  handler: async (ctx, { id }) => {
    await requirePrincipal(ctx);
    await ctx.db.delete(id);
    return null;
  },
});

export const restoreSnapshot = mutation({
  args: { id: v.id("dataSnapshots") },
  handler: async (ctx, { id }) => {
    await requirePrincipal(ctx);
    const snap = await ctx.db.get(id);
    if (!snap) throw new Error("Snapshot tidak ditemukan.");
    await takeSnapshot(ctx, "Sebelum pulihkan snapshot", "auto");
    await clearAllTables(ctx);
    const inserted = await insertBlob(ctx, JSON.parse(snap.data) as Record<string, unknown[]>);
    return { inserted };
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    await takeSnapshot(ctx, "Sebelum kosongkan data", "auto");
    const cleared = await clearAllTables(ctx);
    return { cleared };
  },
});

// Load the sample dataset ON TOP of whatever exists (idempotent per-slug/key —
// existing rows stay; missing sample rows are added).
export const loadSample = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    await takeSnapshot(ctx, "Sebelum muat data contoh", "auto");
    await seedAll(ctx);
    return "loaded";
  },
});

// Wipe, then load the sample dataset fresh.
export const replaceWithSample = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    await takeSnapshot(ctx, "Sebelum ganti dengan data contoh", "auto");
    await clearAllTables(ctx);
    await seedAll(ctx);
    return "replaced";
  },
});
