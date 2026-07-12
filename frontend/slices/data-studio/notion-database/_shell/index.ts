/** notion-shell (vendored type peer) — DOMAIN TYPE BARREL only.
 *
 *  Konglo OS vendoring: the upstream notion-shell slice is the Notion
 *  page editor (page + header + block + slash menu + sortable list +
 *  inline toolbar, etc.). The notion-database TABLE VIEW subset only
 *  needs the shared DOMAIN TYPES that physically live here (Database /
 *  Property / PropertyValue / DbView / DatabaseViewConfig / Page / …)
 *  plus the PROPERTY_TYPE_META registry.
 *
 *  All page-editor components + lib were pruned (they pull @dnd-kit /
 *  @/shared / @/packages which this app must not depend on). This barrel
 *  re-exports only the leaf type modules so the import graph stays
 *  self-contained and dependency-free. */

export type {
  Block, BlockType, BlockRenderers, BlockRendererProps,
  Page,
  Property, PropertyValue, PropertyType, SelectOption, NumberFormat,
  Database, DatabaseViewConfig, DatabaseFilter, DatabaseFilterOp, DatabaseSort, DbView,
  ChartKind, ChartAggregate, CalcKind,
  RollupAggregate,
} from "./types";

export type { PropertyTypeMeta } from "./property-type-meta";
export {
  PROPERTY_TYPE_META,
  PROPERTY_TYPES_USER_ADDABLE,
  PROPERTY_TYPES_CSV_IMPORTABLE,
} from "./property-type-meta";
