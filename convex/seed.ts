import { mutation, internalMutation } from "./_generated/server";
import { requireAdmin } from "./_shared/auth";
import type { MutationCtx } from "./_generated/server";
import { seedFilantropi } from "./features/filantropi/seed";
import { seedLifestyle } from "./features/lifestyle/seed";
import { seedSecurity } from "./features/security/seed";
import { seedFamily } from "./features/family/seed";
import { seedKesehatan } from "./features/kesehatan/seed";

// Idempotent seed of cross-cutting SSOT, ported verbatim from prototype data.jsx.
// Per-screen presentation data lives in each slice (slice-local), not here.
const FIGURES = {
  key: "current",
  netWorth: 312_600_000_000_000,
  netWorthChange: 4.8,
  liabilitas: 96_300_000_000_000,
  debtRatio: 23.5,
};

const ALLOCATIONS = [
  { slug: "pasar", label: "Pasar Modal", value: 56_300_000_000_000, accent: "var(--color-mk-blue)", order: 0 },
  { slug: "properti", label: "Properti", value: 81_300_000_000_000, accent: "var(--color-mk-green)", order: 1 },
  { slug: "bisnis", label: "Bisnis Operasional", value: 121_400_000_000_000, accent: "var(--color-gold)", order: 2 },
  { slug: "privat", label: "Ekuitas Privat", value: 38_700_000_000_000, accent: "var(--color-mk-purple)", order: 3 },
  { slug: "kas", label: "Kas & Setara", value: 14_900_000_000_000, accent: "var(--color-muted-foreground)", order: 4 },
];

const SUBSIDIARIES = [
  { slug: "agro", name: "Konglo Agro Nusantara", sector: "Agribisnis", revenue: 18_400_000_000_000, margin: 22.4, ownership: 92, trend: 6.1, color: "var(--color-mk-green)", order: 0 },
  { slug: "prop", name: "Konglo Land & Property", sector: "Properti", revenue: 14_900_000_000_000, margin: 31.2, ownership: 100, trend: 4.3, color: "var(--color-mk-blue)", order: 1 },
  { slug: "fin", name: "Konglo Finansial Group", sector: "Keuangan", revenue: 21_700_000_000_000, margin: 28.8, ownership: 76, trend: 7.5, color: "var(--color-gold)", order: 2 },
  { slug: "tek", name: "Konglo Digital Ventures", sector: "Teknologi", revenue: 9_200_000_000_000, margin: 18.5, ownership: 64, trend: 12.7, color: "var(--color-mk-purple)", order: 3 },
  { slug: "enr", name: "Konglo Energi Terbarukan", sector: "Energi", revenue: 16_800_000_000_000, margin: 25.1, ownership: 88, trend: 5.4, color: "var(--color-mk-cyan)", order: 4 },
  { slug: "log", name: "Konglo Logistik Maritim", sector: "Logistik", revenue: 11_300_000_000_000, margin: 19.7, ownership: 81, trend: 3.2, color: "var(--color-mk-orange)", order: 5 },
];

const CONTACTS = [
  { slug: "c1", name: "Dr. Bambang Wijaya", role: "Menteri Investasi", tier: "Pemerintah", warmth: "Hangat", last: "2 hari lalu", order: 0 },
  { slug: "c2", name: "Siti Nurhaliza", role: "CEO Bank Mandiri", tier: "Mitra", warmth: "Hangat", last: "1 minggu lalu", order: 1 },
  { slug: "c3", name: "Robert Tanoto", role: "Family Office Singapura", tier: "Investor", warmth: "Netral", last: "3 minggu lalu", order: 2 },
  { slug: "c4", name: "Lin Mei Hua", role: "Temasek Holdings", tier: "Investor", warmth: "Perlu disapa", last: "2 bulan lalu", order: 3 },
];

// investasi-pasar market holdings — mirrors HOLDINGS in
// frontend/slices/investasi-pasar/data.ts (color added per sector palette).
const HOLDINGS = [
  { slug: "aapl", name: "Apple Inc.", ticker: "AAPL", value: "Rp 4,2 T", change: "+1,8%", up: true, weight: "7,2%", avg: "Rp 2.840", lot: "1,48 jt lbr", sector: "Saham AS · Teknologi", points: [4, 6, 5, 8, 7, 10, 9, 12], color: "var(--color-mk-orange)", order: 0 },
  { slug: "asii", name: "Astra Intl.", ticker: "ASII", value: "Rp 3,1 T", change: "+0,4%", up: true, weight: "5,3%", avg: "Rp 4.910", lot: "631 jt lbr", sector: "Saham ID · Otomotif", points: [6, 7, 6, 8, 7, 9, 8, 10], color: "var(--color-mk-green)", order: 1 },
  { slug: "brk-b", name: "Berkshire B", ticker: "BRK.B", value: "Rp 2,8 T", change: "-0,6%", up: false, weight: "4,8%", avg: "Rp 5,9 jt", lot: "475 rb lbr", sector: "Saham AS · Holding", points: [12, 10, 11, 8, 9, 7, 8, 6], color: "var(--color-mk-purple)", order: 2 },
  { slug: "tsla", name: "Tesla Inc.", ticker: "TSLA", value: "Rp 1,9 T", change: "+3,2%", up: true, weight: "3,2%", avg: "Rp 3,1 jt", lot: "612 rb lbr", sector: "Saham AS · Otomotif", points: [5, 7, 6, 9, 8, 11, 10, 13], color: "var(--color-mk-orange)", order: 3 },
  { slug: "fr0096", name: "Obligasi Negara", ticker: "FR0096", value: "Rp 6,4 T", change: "+0,1%", up: true, weight: "10,9%", avg: "Par 100,2", lot: "Kupon 7,0%", sector: "Pendapatan tetap · IDR", points: [8, 8, 9, 8, 9, 9, 10, 10], color: "var(--color-mk-blue)", order: 4 },
];

// properti-aset estate registry — mirrors ASSETS in
// frontend/slices/properti-aset/data.ts.
const PROPERTY_ASSETS = [
  { slug: "penthouse-scbd", name: "Penthouse SCBD", type: "Properti", value: "Rp 480 M", location: "Jakarta", color: "var(--color-mk-red)", maint: "Rp 1,2 M/bln", status: "Dihuni", year: "2019", note: "Lantai 56 · 1.100 m² · staf 4 orang", order: 0 },
  { slug: "vila-uluwatu", name: "Vila Uluwatu", type: "Properti", value: "Rp 320 M", location: "Bali", color: "var(--color-mk-red)", maint: "Rp 640 jt/bln", status: "Disewakan", year: "2017", note: "Cliffside · 6 kamar · okupansi 78%", order: 1 },
  { slug: "estate-mayfair", name: "Estate Mayfair", type: "Properti", value: "Rp 1,1 T", location: "London", color: "var(--color-mk-red)", maint: "Rp 2,8 M/bln", status: "Dihuni", year: "2021", note: "Grade II listed · 5 lantai", order: 2 },
  { slug: "gulfstream-g700", name: "Gulfstream G700", type: "Jet pribadi", value: "Rp 1,4 T", location: "Hangar Halim", color: "var(--color-mk-blue)", maint: "Rp 4,1 M/bln", status: "Siap terbang", year: "2023", note: "PK-KGL · 7.500 nm · 19 penumpang", order: 3 },
  { slug: "yacht-nusantara", name: "Yacht 'Nusantara'", type: "Kapal pesiar", value: "Rp 980 M", location: "Marina Bali", color: "var(--color-mk-green)", maint: "Rp 3,4 M/bln", status: "Sandar", year: "2020", note: "62 m · 12 tamu · kru 16", order: 4 },
  { slug: "koleksi-12-mobil", name: "Koleksi 12 Mobil", type: "Otomotif", value: "Rp 240 M", location: "Garasi Pondok Indah", color: "var(--color-mk-orange)", maint: "Rp 320 jt/bln", status: "Terawat", year: "—", note: "Ferrari · Rolls · Pagani · Mercedes", order: 5 },
];

// Per-row idempotent insert (guard by slug), mirroring the subsidiaries pattern.
async function seedHoldings(ctx: MutationCtx) {
  for (const h of HOLDINGS) {
    const e = await ctx.db.query("holdings").withIndex("by_slug", (q) => q.eq("slug", h.slug)).first();
    if (!e) await ctx.db.insert("holdings", h);
  }
}

async function seedProperty(ctx: MutationCtx) {
  for (const p of PROPERTY_ASSETS) {
    const e = await ctx.db.query("propertyAssets").withIndex("by_slug", (q) => q.eq("slug", p.slug)).first();
    if (!e) await ctx.db.insert("propertyAssets", p);
  }
}

// Shared idempotent insert logic. No auth gate — callers decide.
// Exported so the data-management surface (Settings → load / replace sample) can
// reuse the exact same sample dataset behind its own requirePrincipal + snapshot.
export async function seedAll(ctx: MutationCtx) {
  const fig = await ctx.db
    .query("officeFigures")
    .withIndex("by_key", (q) => q.eq("key", "current"))
    .first();
  if (!fig) await ctx.db.insert("officeFigures", FIGURES);

  for (const a of ALLOCATIONS) {
    const e = await ctx.db.query("allocations").withIndex("by_slug", (q) => q.eq("slug", a.slug)).first();
    if (!e) await ctx.db.insert("allocations", a);
  }
  for (const s of SUBSIDIARIES) {
    const e = await ctx.db.query("subsidiaries").withIndex("by_slug", (q) => q.eq("slug", s.slug)).first();
    if (!e) await ctx.db.insert("subsidiaries", s);
  }
  for (const c of CONTACTS) {
    const e = await ctx.db.query("contacts").withIndex("by_slug", (q) => q.eq("slug", c.slug)).first();
    if (!e) await ctx.db.insert("contacts", c);
  }
  await seedHoldings(ctx);
  await seedProperty(ctx);
  // Per-slice domain entities (formerly slice-local mock; idempotent self-guarded).
  await seedFilantropi(ctx);
  await seedLifestyle(ctx);
  await seedSecurity(ctx);
  await seedFamily(ctx);
  await seedKesehatan(ctx);
  return "seeded";
}

// Authed path — called by use-os-bootstrap on first load. Elevated-only so a
// plain "staf" cannot trigger seed writes; principal/cfo (the seeded accounts)
// pass. seed data is fully idempotent, so re-running on each elevated login
// is a no-op after the first.
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return seedAll(ctx);
  },
});

// Internal path — for `convex run seed:runInternal` (no auth ctx via CLI).
export const runInternal = internalMutation({
  args: {},
  handler: async (ctx) => seedAll(ctx),
});
