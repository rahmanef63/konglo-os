// Centralized mock/demo constants for the investasi-pasar slice (illustrative — not live Convex data).
import type { DonutSeg } from "@/frontend/shared";

// DAY_CHANGE is pinned to the LIVE portfolio value but is itself fabricated —
// it falsely implies the real portfolio moved today, so the screen overlays a
// SAMPLE marker on the live "Nilai Portofolio" tile too.
export const DAY_CHANGE = "▲ 1,4% hari ini";
export const YTD = "+11,9%";
export const BENCHMARK = "vs IHSG +6,2%";
export const DIVIDEND = "Rp 1,8 T";
export const DIVIDEND_YIELD = "yield 3,1%";
export const CASH = "Rp 4,1 T";

export const PERFORMANCE = [50, 54, 49, 58, 62, 57, 66, 70, 68, 76, 80, 88];

export const ASSET_ALLOC: DonutSeg[] = [
  { label: "Saham global", value: 38, color: "var(--color-mk-orange)" },
  { label: "Obligasi", value: 28, color: "var(--color-mk-blue)" },
  { label: "Private equity", value: 20, color: "var(--color-mk-green)" },
  { label: "Alternatif", value: 14, color: "var(--color-mk-purple)" },
];
