// Slice-local presentation data for Investasi & Pasar. The portfolio headline
// value derives from the live Convex allocation slice "pasar"; the holdings
// table is now live Convex (features/holdings). What remains here is the still-
// illustrative chart/donut + the holdings create/edit form config.
import type { FormField } from "@/frontend/shared";
import type { Doc } from "@/convex/_generated/dataModel";

export type Holding = Doc<"holdings">;

// Illustrative mock/demo constants now live centrally in mock-data/investasi-pasar.ts;
// re-exported here so screens importing from "./data" keep working unchanged.
export {
  DAY_CHANGE,
  YTD,
  BENCHMARK,
  DIVIDEND,
  DIVIDEND_YIELD,
  CASH,
  PERFORMANCE,
  ASSET_ALLOC,
} from "@/mock-data/investasi-pasar";

export const PERIODS = ["1H", "1M", "YTD", "1Th"];

// Accent palette (theme tokens) cycled across new holdings.
export const PALETTE = [
  "var(--color-mk-orange)",
  "var(--color-mk-blue)",
  "var(--color-mk-green)",
  "var(--color-mk-purple)",
  "var(--color-gold)",
];

// Flat default sparkline for a freshly-added holding (no price history yet).
export const DEFAULT_POINTS = [8, 8, 8, 8, 8, 8, 8, 8];

// Holdings are stored as pre-formatted display strings (deploy-safe verbatim),
// so the form takes them as-is. `up` is a select to drive the green/red tone.
export const FIELDS: FormField[] = [
  { name: "name", label: "Instrumen", placeholder: "Apple Inc.", required: true },
  { name: "ticker", label: "Ticker", placeholder: "AAPL", required: true },
  { name: "sector", label: "Sektor", placeholder: "Saham AS · Teknologi", required: true },
  { name: "value", label: "Nilai posisi", placeholder: "Rp 4,2 T", required: true },
  { name: "change", label: "Perubahan hari ini", placeholder: "+1,8%", required: true },
  { name: "up", label: "Arah", type: "select", options: ["Naik", "Turun"], required: true },
  { name: "weight", label: "Bobot portofolio", placeholder: "7,2%", required: true },
  { name: "avg", label: "Harga rata-rata", placeholder: "Rp 2.840", required: true },
  { name: "lot", label: "Jumlah", placeholder: "1,48 jt lbr", required: true },
];

// Seed a holding doc into the FormModal `initial` record for the edit flow.
export function holdingInitial(h: Holding): Record<string, string | number> {
  return {
    name: h.name,
    ticker: h.ticker,
    sector: h.sector,
    value: h.value,
    change: h.change,
    up: h.up ? "Naik" : "Turun",
    weight: h.weight,
    avg: h.avg,
    lot: h.lot,
  };
}
