import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireFeature, requirePrincipal } from "../../_shared/auth";
import { TABLES, TABLE_MAP, type StudioTable } from "./registry";

// Studio Data tab metadata: table list + editable columns (no internals).
// SEC-001: the `rows` gate below hides principal-sensitivity ROW DATA from cfo,
// but the tab list must ALSO hide such tables' EXISTENCE + schema — otherwise a
// 'Ahli Waris' tab surfaces in cfo's picker (403s on click) and leaks the estate
// table's structure. Drop principal-sensitivity specs unless the caller is principal.
export const tables = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireFeature(ctx, "data-studio");
    const roleRow = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const isPrincipal = roleRow?.role === "principal";
    return TABLES.filter((t) => isPrincipal || t.sensitivity !== "principal").map(
      ({ table, label, columns }) => ({ table, label, columns }),
    );
  },
});

// Rows of one allow-listed table, sorted by the doc `order` field. `take(N)`
// (bounded) per rr — never bare .collect(). Table name validated against the
// allow-list, then cast to the StudioTable union for typed db access.
// SEC-001: data-studio gate alone is not enough — a `principal`-sensitivity
// table (heirs) additionally requires requirePrincipal so cfo can't back-door
// the succession data its menu hides.
export const rows = query({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    await requireFeature(ctx, "data-studio");
    const spec = TABLE_MAP.get(table);
    if (!spec) throw new Error(`Unknown table: ${table}`);
    if (spec.sensitivity === "principal") await requirePrincipal(ctx);
    const docs = await ctx.db.query(table as StudioTable).take(500);
    return [...docs].sort(
      (a, b) =>
        ((a as { order?: number }).order ?? 0) - ((b as { order?: number }).order ?? 0),
    );
  },
});
