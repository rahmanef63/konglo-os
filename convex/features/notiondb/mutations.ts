import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import { requireFeatureWrite, requirePrincipal } from "../../_shared/auth";
import { consumeWriteToken } from "../../_shared/writeLimit";
import {
  TABLE_MAP,
  PALETTE,
  validateValues,
  validateColumn,
  type StudioTable,
  type TableSpec,
} from "./registry";
import { slugify } from "../../_shared/db";

// Generic CRUD over the allow-listed Konglo tables. requireFeatureWrite(...,
// "data-studio") = elevated (principal|cfo) caller WITH the data-studio feature
// (cfo holds it in the lib/roles.ts SSOT). Table names are validated against the
// registry before any db access; per-column validators (validateValues) reject a
// wrong-typed / out-of-enum / out-of-range value at the MUTATION boundary so the
// schema validators stay permissive (deploy-safe). doc/patch values are cast
// (`as never`) past the per-table insert/patch signatures — Convex still validates
// them against the schema at runtime.
// SEC-001: after the data-studio write gate, a `principal`-sensitivity table
// (heirs) ALSO requires requirePrincipal — cfo admins the business DB but never
// the estate / succession plan. See registry.ts Sensitivity for the policy.

// Minimal structural views of the Convex query builder for the two indexed reads
// below. The studio tables are a runtime-chosen union, so the generated per-table
// `withIndex` overloads don't apply uniformly (by_order/by_slug exist on a SUBSET);
// these interfaces describe exactly the builder surface used — no `any`. The index
// existence is guaranteed by the registry `indexes` flags + each slice's schema.
interface OrderQuery {
  withIndex(name: "by_order"): {
    order(dir: "desc"): { first(): Promise<{ order?: number } | null> };
  };
}
interface SlugQuery {
  withIndex(
    name: "by_slug",
    range: (q: { eq(field: "slug", value: string): unknown }) => unknown,
  ): { first(): Promise<{ slug?: string } | null> };
}

// Next `order` for a table. When the table declares a by_order index we read the
// current max via a DESC .first() (one row, no scan — and consumes that index);
// otherwise (a registry entry without indexes.order) we fall back to a bounded
// take() scan. Either way the new row appends at max + 1.
async function nextOrder(ctx: MutationCtx, spec: TableSpec): Promise<number> {
  const t = spec.table as StudioTable;
  if (spec.indexes.order) {
    const q = ctx.db.query(t) as unknown as OrderQuery;
    const top = await q.withIndex("by_order").order("desc").first();
    return (top?.order ?? 0) + 1;
  }
  const all = await ctx.db.query(t).take(500);
  return all.reduce((m, r) => Math.max(m, (r as { order?: number }).order ?? 0), 0) + 1;
}

// Resolve a unique slug for `name`. Collision detection prefers the by_slug index
// (.eq(base).first() — exact-match, race-safe) when the table declares it; no
// allow-listed table has auto.slug WITHOUT by_slug today, but we keep a bounded
// scan fallback for safety. Collisions get an order suffix (stable + unique).
async function uniqueSlug(
  ctx: MutationCtx,
  spec: TableSpec,
  name: string,
  order: number,
): Promise<string> {
  const t = spec.table as StudioTable;
  const base = slugify(name) || `row-${order}`;
  let taken: boolean;
  if (spec.indexes.slug) {
    const q = ctx.db.query(t) as unknown as SlugQuery;
    const hit = await q.withIndex("by_slug", (b) => b.eq("slug", base)).first();
    taken = hit != null;
  } else {
    const all = await ctx.db.query(t).take(500);
    taken = all.some((r) => (r as { slug?: string }).slug === base);
  }
  return taken ? `${base}-${order}` : base;
}

export const createRow = mutation({
  args: { table: v.string(), values: v.record(v.string(), v.any()) },
  handler: async (ctx, { table, values }) => {
    const userId = await requireFeatureWrite(ctx, "data-studio");
    const spec = TABLE_MAP.get(table);
    if (!spec) throw new Error(`Unknown table: ${table}`);
    if (spec.sensitivity === "principal") await requirePrincipal(ctx);
    // Per-user write-abuse guard: consume one token AFTER auth, BEFORE the write
    // (and before deriving order/slug). Generous bucket — only scripted bursts
    // bite; the _version CAS below is untouched.
    await consumeWriteToken(ctx, userId);
    // Boundary validation: reject wrong-typed / out-of-enum / out-of-range values
    // BEFORE deriving order/slug or writing (schema validators stay permissive).
    validateValues(spec, values);
    const order = await nextOrder(ctx, spec);
    // SECURITY: build the insert doc from the registry's known EDITABLE columns
    // ONLY — never spread `values` verbatim. A spread let a caller inject any
    // schema-valid field, most dangerously `version` (poisoning the optimistic
    // token below) or `slug`/`order` (clobbering the auto fields). Whitelisting
    // the column allow-list means only declared, validated columns reach the db.
    const doc: Record<string, unknown> = { order, version: 1 };
    for (const col of spec.columns) {
      if (values[col.field] !== undefined) doc[col.field] = values[col.field];
    }
    if (spec.auto.slug) {
      doc.slug = await uniqueSlug(ctx, spec, String(values.name ?? ""), order);
    }
    if (spec.auto.color && doc.color == null) {
      // Cycle the palette by order (1-based) so concurrent inserts still spread.
      doc.color = PALETTE[(order - 1) % PALETTE.length];
    }
    await ctx.db.insert(spec.table as StudioTable, doc as never);
  },
});

export const updateRow = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    field: v.string(),
    value: v.any(),
    // Optimistic-concurrency token. When supplied it must equal the row's
    // current version (undefined → 0), else a conflict is thrown. Every write
    // bumps version; omitting it skips the check but still increments. Same
    // CAS shape as convex/features/*/mutations.ts (holdings/contacts/etc).
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { table, id, field, value, expectedVersion }) => {
    const userId = await requireFeatureWrite(ctx, "data-studio");
    const spec = TABLE_MAP.get(table);
    if (!spec) throw new Error(`Unknown table: ${table}`);
    if (spec.sensitivity === "principal") await requirePrincipal(ctx);
    // Per-user write-abuse guard (after auth, before the CAS check + patch).
    await consumeWriteToken(ctx, userId);
    const col = spec.columns.find((c) => c.field === field);
    if (!col) throw new Error(`Field not editable: ${field}`);
    // Boundary validation for the single patched field (type/enum/range).
    validateColumn(col, value);
    const docId = ctx.db.normalizeId(table as StudioTable, id);
    if (!docId) throw new Error("Invalid id");
    const existing = await ctx.db.get(docId);
    if (!existing) throw new Error("Invalid id");
    const current = (existing as { version?: number }).version ?? 0;
    if (expectedVersion !== undefined && expectedVersion !== current) {
      throw new Error("conflict: data telah berubah");
    }
    await ctx.db.patch(docId, { [field]: value, version: current + 1 } as never);
  },
});

export const deleteRow = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    // Optional CAS token: when supplied it must equal the row's current version
    // (undefined → 0) or the delete is rejected — prevents deleting a row that
    // changed under a stale client. No version bump (the row is removed).
    expectedVersion: v.optional(v.number()),
  },
  handler: async (ctx, { table, id, expectedVersion }) => {
    const userId = await requireFeatureWrite(ctx, "data-studio");
    const spec = TABLE_MAP.get(table);
    if (!spec) throw new Error(`Unknown table: ${table}`);
    if (spec.sensitivity === "principal") await requirePrincipal(ctx);
    // Per-user write-abuse guard (after auth, before the CAS check + delete).
    await consumeWriteToken(ctx, userId);
    const docId = ctx.db.normalizeId(table as StudioTable, id);
    if (!docId) throw new Error("Invalid id");
    if (expectedVersion !== undefined) {
      const existing = await ctx.db.get(docId);
      if (!existing) throw new Error("Invalid id");
      const current = (existing as { version?: number }).version ?? 0;
      if (expectedVersion !== current) {
        throw new Error("conflict: data telah berubah");
      }
    }
    await ctx.db.delete(docId);
  },
});
