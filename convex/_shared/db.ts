import type { MutationCtx } from "../_generated/server";
import type { Doc, Id, TableNames } from "../_generated/dataModel";

// Shared write/derive helpers for the feature mutations. Each is the SSOT for a
// pattern that was copy-pasted across contacts/family/holdings/kesehatan/
// lifestyle/filantropi/subsidiaries/property/security mutations. Pure dedup — the
// behavior (error strings, version semantics, ordering) is byte-identical to the
// originals these replaced.

// url-safe slug from a name; collisions get an order suffix at the call site.
// SSOT for the slugify previously redefined in 6 feature mutations + notiondb.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Guard a numeric `order` reorder input: finite, non-negative integer. Schema
// validators stay permissive (deploy-safe) so the boundary check lives here.
// `undefined` (field absent) is allowed — the caller falls back to an auto order.
export function assertOrder(order: number | undefined): void {
  if (order === undefined) return;
  if (!Number.isInteger(order) || order < 0) {
    throw new Error("order must be a non-negative integer");
  }
}

// Minimal structural view of the by_order query builder. The helper is generic
// over every table but only by_order-indexed tables call it; the generated
// per-table withIndex overloads don't unify across that union, so we describe
// exactly the surface used (mirrors notiondb/mutations.ts OrderQuery) — no `any`.
interface OrderQuery {
  withIndex(name: "by_order"): {
    order(dir: "desc"): { first(): Promise<{ order?: number } | null> };
  };
}

// Next append slot for a `by_order`-indexed table: current max order + 1 via a
// DESC .first() (one row, no scan). Falls back to 0 when the table is empty, so
// the first row lands at order 1 — matching every pre-dedup call site.
export async function nextOrder<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
): Promise<number> {
  const q = ctx.db.query(table) as unknown as OrderQuery;
  const top = await q.withIndex("by_order").order("desc").first();
  return (top?.order ?? 0) + 1;
}

// Minimal structural view of the by_slug query builder (same rationale as
// OrderQuery — the per-table withIndex overloads don't unify across the union).
interface SlugQuery {
  withIndex(
    name: "by_slug",
    range: (q: { eq(field: "slug", value: string): unknown }) => unknown,
  ): { first(): Promise<{ slug?: string } | null> };
}

// Race-safe unique slug for a `by_slug`-indexed table: an exact-match index
// lookup (.eq(root).first()), never a scan. `base` is the already-slugified
// candidate; `fallback` (e.g. `sub-${order}`) is used when base is empty. On a
// clash the row's order is suffixed to stay unique + stable. SSOT for the
// identical block in subsidiaries/contacts/holdings/property + security.
export async function uniqueSlug<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  base: string,
  order: number,
  fallback: string,
): Promise<string> {
  const root = base || fallback;
  const q = ctx.db.query(table) as unknown as SlugQuery;
  const clash = await q.withIndex("by_slug", (b) => b.eq("slug", root)).first();
  return clash ? `${root}-${order}` : root;
}

// Compare-and-set + version bump for an update mutation. Reads the doc, applies
// optimistic-locking (when expectedVersion is supplied it must equal the row's
// current version — undefined → 0 — else a /conflict/ is thrown), drops undefined
// patch fields, then patches with version: current + 1. Same CAS shape and exact
// error strings the ~13 inline copies used. `notFound` overrides the missing-row
// message (family/heirs use "Invalid heir id"); default is "Invalid id".
//
// FE expectedVersion is OPT-IN by design (assessment #5): casBump ALWAYS bumps
// version server-side, but the frontend only PASSES expectedVersion — activating
// the conflict-check — on the higher-contention shared tables (office figures +
// allocations, subsidiaries, filantropi grants, data-studio notiondb). The
// low-contention single-editor slices (heirs, holdings, property, lifestyle,
// security, contacts, kesehatan) intentionally omit it → last-write-wins at the
// ~3-user scale: no corruption (version still increments), just no conflict toast.
// Thread expectedVersion through a slice's edit form only if it grows real
// concurrent editors.
export async function casBump<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  id: Id<T>,
  expectedVersion: number | undefined,
  patch: Record<string, unknown>,
  notFound = "Invalid id",
): Promise<void> {
  const existing = await ctx.db.get(id);
  if (!existing) throw new Error(notFound);
  const current = (existing as { version?: number }).version ?? 0;
  if (expectedVersion !== undefined && expectedVersion !== current) {
    throw new Error("conflict: data telah berubah");
  }
  const fields = Object.fromEntries(
    Object.entries(patch).filter(([, val]) => val !== undefined),
  );
  await ctx.db.patch(id, {
    ...(fields as Partial<Doc<T>>),
    version: current + 1,
  } as never);
}
