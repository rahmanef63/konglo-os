import type { FormField } from "@/frontend/shared";
import type { Doc } from "@/convex/_generated/dataModel";

export type Sub = Doc<"subsidiaries">;

// Sort comparators as a lookup map (rr: no switch-chains).
export const SORTS: Record<string, (a: Sub, b: Sub) => number> = {
  rev: (a, b) => b.revenue - a.revenue,
  margin: (a, b) => b.margin - a.margin,
  own: (a, b) => b.ownership - a.ownership,
  nama: (a, b) => a.name.localeCompare(b.name),
};
export const SORT_LABELS: [string, string][] = [
  ["rev", "Pendapatan"],
  ["margin", "Margin"],
  ["own", "Kepemilikan"],
  ["nama", "Nama"],
];

// Accent palette (theme tokens) cycled across new subsidiaries.
export const PALETTE = [
  "var(--color-mk-blue)",
  "var(--color-mk-green)",
  "var(--color-mk-purple)",
  "var(--color-mk-orange)",
  "var(--color-gold)",
];

// Fields for the "Tambah Anak Usaha" form. Revenue entered in triliun Rupiah.
export const ADD_FIELDS: FormField[] = [
  { name: "name", label: "Nama anak usaha", placeholder: "PT …", required: true },
  { name: "sector", label: "Sektor", placeholder: "Energi, Properti, …", required: true },
  { name: "revenue", label: "Pendapatan (triliun Rp)", type: "number", step: "0.01", placeholder: "4.8", required: true },
  { name: "margin", label: "Margin EBITDA (%)", type: "number", step: "0.1", placeholder: "32", required: true },
  { name: "ownership", label: "Kepemilikan (%)", type: "number", step: "1", placeholder: "100", required: true },
];

// Seed a subsidiary doc into the FormModal `initial` record for the edit flow.
// Revenue stored in absolute Rupiah → shown back in triliun (matches ADD_FIELDS).
export function subInitial(s: Doc<"subsidiaries">): Record<string, string | number> {
  return {
    name: s.name,
    sector: s.sector,
    revenue: s.revenue / 1e12,
    margin: s.margin,
    ownership: s.ownership,
  };
}
