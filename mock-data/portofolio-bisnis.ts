import type { Sub } from "@/frontend/slices/portofolio-bisnis/data";

// Demo-only subsidiary rows (mirrors convex/seed.ts SUBSIDIARIES). portofolio-bisnis
// is fully Convex-backed, so — unlike the other slices — its showcase data lived
// ONLY in the seed. The demo user reads these instead of the shared subsidiaries
// table so an anonymous session never sees the real family-office portfolio.
// Cast with placeholder system fields (_id/_creationTime) — never persisted.
export const SUBSIDIARIES_MOCK: Sub[] = (
  [
    { slug: "agro", name: "Konglo Agro Nusantara", sector: "Agribisnis", revenue: 18_400_000_000_000, margin: 22.4, ownership: 92, trend: 6.1, color: "var(--color-mk-green)", order: 0 },
    { slug: "prop", name: "Konglo Land & Property", sector: "Properti", revenue: 14_900_000_000_000, margin: 31.2, ownership: 100, trend: 4.3, color: "var(--color-mk-blue)", order: 1 },
    { slug: "fin", name: "Konglo Finansial Group", sector: "Keuangan", revenue: 21_700_000_000_000, margin: 28.8, ownership: 76, trend: 7.5, color: "var(--color-gold)", order: 2 },
    { slug: "tek", name: "Konglo Digital Ventures", sector: "Teknologi", revenue: 9_200_000_000_000, margin: 18.5, ownership: 64, trend: 12.7, color: "var(--color-mk-purple)", order: 3 },
    { slug: "enr", name: "Konglo Energi Terbarukan", sector: "Energi", revenue: 16_800_000_000_000, margin: 25.1, ownership: 88, trend: 5.4, color: "var(--color-mk-cyan)", order: 4 },
    { slug: "log", name: "Konglo Logistik Maritim", sector: "Logistik", revenue: 11_300_000_000_000, margin: 19.7, ownership: 81, trend: 3.2, color: "var(--color-mk-orange)", order: 5 },
  ] as const
).map((r, i) => ({ ...r, _id: `demo-sub-${i}`, _creationTime: 0 })) as unknown as Sub[];
