import { query } from "../../_generated/server";
import type { TableNames } from "../../_generated/dataModel";
import { requirePrincipal } from "../../_shared/auth";
import { BUSINESS_TABLES } from "./_tables";

// Snapshot list for the Settings → Version history panel. Metadata only — the
// `data` blob is never shipped to the client (bandwidth + it isn't rendered).
// principal-only (same gate as the mutations that create them).
export const listSnapshots = query({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    const rows = await ctx.db
      .query("dataSnapshots")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
    return rows.map((r) => ({
      id: r._id,
      label: r.label,
      kind: r.kind,
      createdAt: r.createdAt,
      rowCount: r.rowCount,
      createdByEmail: r.createdByEmail ?? null,
    }));
  },
});

// Whether ANY business table holds data — drives the Settings copy (load vs
// add/replace) and the onboarding "start empty vs load sample" step. One bounded
// .first() per table, stops at the first hit. principal-only.
export const status = query({
  args: {},
  handler: async (ctx) => {
    await requirePrincipal(ctx);
    let hasData = false;
    for (const t of BUSINESS_TABLES) {
      const first = await ctx.db.query(t as TableNames).first();
      if (first) {
        hasData = true;
        break;
      }
    }
    const snapshots = await ctx.db.query("dataSnapshots").withIndex("by_createdAt").take(50);
    return { hasData, snapshotCount: snapshots.length };
  },
});
