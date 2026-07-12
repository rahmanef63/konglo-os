/** Adapter — konglo's generic Studio-Data CRUD shape ↔ the real rr
 *  notion-database domain model. The Convex `notiondb` SSOT exposes each
 *  table as { table, label, columns:[{ field, label, type, options? }] }
 *  with docs carrying `_id` + the column fields. This module maps that
 *  onto the vendored <NotionDatabase>'s `Database` + `Page` contracts so
 *  the genuine notion table view drives konglo persistence unchanged.
 *
 *  Round-trip note (select cells): the notion OptionPicker stores + emits
 *  the SelectOption *id*. konglo stores the option's string value itself,
 *  so we set `id === name === <the konglo option string>`. The cell then
 *  matches the stored scalar to an option, and edits emit that same string
 *  back — `scalarFromValue` returns it untouched. No id↔label translation. */

import type {
  Database,
  DatabaseViewConfig,
  Page,
  Property,
  PropertyType,
  PropertyValue,
  SelectOption,
} from "./notion-database/types";

/** Mirrors the convex `notiondb.queries.tables` column shape (registry.ts
 *  ColType + ColumnSpec) — kept local so the adapter has no convex import. */
export interface StudioColumn {
  field: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
}
export interface StudioSpec {
  table: string;
  label: string;
  columns: StudioColumn[];
}

/** A konglo row doc as returned by `notiondb.queries.rows` — the column
 *  fields plus Convex system fields. Indexed access keeps it open. */
export type StudioDoc = {
  _id: string;
  _creationTime?: number;
  [field: string]: unknown;
};

/** Palette cycled across select options purely for chip colour (cosmetic;
 *  ids carry the real value). Drawn from the notion OPTION_COLORS set. */
const OPTION_PALETTE = ["blue", "green", "purple", "orange", "yellow", "pink", "red", "brown", "gray"];

/** konglo ColType → notion PropertyType. Only the three konglo column
 *  kinds are reachable; the schema is fixed server-side. */
function propTypeOf(col: StudioColumn): PropertyType {
  if (col.type === "number") return "number";
  if (col.type === "select") return "select";
  return "text";
}

/** First text column = the title / primary property of the table. Falls
 *  back to the very first column when a table has no text column. */
export function firstTextField(columns: StudioColumn[]): string {
  return (columns.find((c) => c.type === "text") ?? columns[0])?.field ?? "";
}

function toProperty(col: StudioColumn): Property {
  const base: Property = { id: col.field, name: col.label, type: propTypeOf(col) };
  if (col.type === "select") {
    base.options = (col.options ?? []).map<SelectOption>((opt, i) => ({
      id: opt,
      name: opt,
      color: OPTION_PALETTE[i % OPTION_PALETTE.length],
    }));
  }
  return base;
}

/** The single fixed table view. Every required DatabaseViewConfig field is
 *  filled with an inert default (no sort / filter / search). */
function defaultTableView(spec: StudioSpec): DatabaseViewConfig {
  return {
    id: "table",
    name: spec.label,
    type: "table",
    sorts: [],
    filters: [],
    search: "",
  };
}

/** Build the notion `Database` for one konglo table spec. One table view,
 *  one Property per editable column, title = first text column. */
export function buildDatabase(spec: StudioSpec): Database {
  return {
    id: spec.table,
    name: spec.label,
    icon: "",
    properties: spec.columns.map(toProperty),
    rowIds: [],
    views: [defaultTableView(spec)],
    activeViewId: "table",
    createdAt: 0,
    updatedAt: 0,
  };
}

/** Map one konglo doc → a notion `Page` (database row). Title = the first
 *  text column's value; `rowProps` carries every column's scalar keyed by
 *  field (= the Property id). All non-row Page fields are inert stubs. */
export function docToPage(doc: StudioDoc, spec: StudioSpec): Page {
  const titleField = firstTextField(spec.columns);
  const ts = typeof doc._creationTime === "number" ? doc._creationTime : 0;
  const rowProps: Record<string, PropertyValue> = {};
  for (const c of spec.columns) {
    rowProps[c.field] = (doc[c.field] ?? null) as PropertyValue;
  }
  return {
    id: doc._id,
    parentId: null,
    title: String(doc[titleField] ?? ""),
    icon: "",
    blocks: [],
    favorite: false,
    trashed: false,
    createdAt: ts,
    updatedAt: ts,
    rowOfDatabaseId: spec.table,
    rowProps,
  };
}

/** Coerce a notion cell `PropertyValue` back to a konglo scalar for the
 *  Convex mutation. Numbers stay numbers; select option id / text → string;
 *  null / undefined → "" (konglo columns are non-null scalars). Compound
 *  notion values (arrays, date objects, booleans) are not reachable from
 *  konglo's three column kinds, so they degrade to a stringified scalar. */
export function scalarFromValue(value: PropertyValue): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "";
  return String(value);
}

/** Blank row for "add row" — number columns → 0, select → first option (or
 *  ""), text → "". Matches the konglo create-row default contract. */
export function blankFromColumns(spec: StudioSpec): Record<string, string | number> {
  return Object.fromEntries(
    spec.columns.map((c) => [
      c.field,
      c.type === "number" ? 0 : c.options?.[0] ?? "",
    ]),
  );
}
