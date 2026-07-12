// Slice-local presentation data for Properti & Aset. The asset registry is LIVE
// (Convex `propertyAssets` via api.features.property.queries.list); the estate
// KPI strip + composition donut + global map remain illustrative.
import type { FormField } from "@/frontend/shared";
import type { Doc } from "@/convex/_generated/dataModel";

export type Property = Doc<"propertyAssets">;

// Illustrative mock/demo constants relocated to the central mock-data store.
export { ESTATE, COMPOSITION } from "@/mock-data/properti-aset";

// Asset-class → accent token (theme tokens only). Drives the gallery gradient &
// detail accent so colour stays consistent with the type without a colour field.
const TYPE_COLOR: Record<string, string> = {
  Properti: "var(--color-mk-red)",
  "Jet pribadi": "var(--color-mk-blue)",
  "Kapal pesiar": "var(--color-mk-green)",
  Otomotif: "var(--color-mk-orange)",
  "Seni & koleksi": "var(--color-mk-purple)",
};
const FALLBACK_COLOR = "var(--color-gold)";
export function typeColor(type: string): string {
  return TYPE_COLOR[type] ?? FALLBACK_COLOR;
}

const TYPE_OPTIONS = Object.keys(TYPE_COLOR);

// Fields for the create/edit asset form. value/maint/year are free-text strings
// stored verbatim server-side (pre-formatted Rupiah, e.g. "Rp 480 M") — no
// numeric coercion, matching the deploy-safe `propertyAssets` string columns.
export const ASSET_FIELDS: FormField[] = [
  { name: "name", label: "Nama aset", placeholder: "Penthouse SCBD", required: true },
  { name: "type", label: "Jenis aset", type: "select", options: TYPE_OPTIONS, required: true },
  { name: "value", label: "Nilai taksiran", placeholder: "Rp 480 M", required: true },
  { name: "location", label: "Lokasi", placeholder: "Jakarta", required: true },
  { name: "status", label: "Status", placeholder: "Dihuni / Disewakan / …", required: true },
  { name: "maint", label: "Biaya perawatan", placeholder: "Rp 1,2 M/bln", required: true },
  { name: "year", label: "Sejak (tahun)", placeholder: "2019", required: true },
  { name: "note", label: "Catatan", placeholder: "Lantai 56 · 1.100 m² · staf 4", required: true },
];

// Seed a property doc into the FormModal `initial` record for the edit flow.
export function propInitial(p: Property): Record<string, string | number> {
  return {
    name: p.name,
    type: p.type,
    value: p.value,
    location: p.location,
    status: p.status,
    maint: p.maint,
    year: p.year,
    note: p.note,
  };
}
