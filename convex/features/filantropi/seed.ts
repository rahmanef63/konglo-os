import type { MutationCtx } from "../../_generated/server";

// Mock values copied verbatim from frontend/slices/filantropi/data.ts for visual
// continuity. Integer `order` preserves the original array sort.
const PHILANTHROPY_GRANTS = [
  { name: "Beasiswa 10.000 Anak", category: "Pendidikan", amount: "Rp 420 M", progress: 72, color: "var(--color-mk-blue)", beneficiaries: "10.000 siswa", region: "34 provinsi", partner: "Kemendikbud" },
  { name: "RS Gratis Indonesia Timur", category: "Kesehatan", amount: "Rp 1,2 T", progress: 45, color: "var(--color-mk-red)", beneficiaries: "340.000 pasien", region: "Papua & Maluku", partner: "Kemenkes" },
  { name: "Reboisasi 1 Juta Pohon", category: "Lingkungan", amount: "Rp 180 M", progress: 88, color: "var(--color-mk-green)", beneficiaries: "880.000 pohon", region: "Kalimantan", partner: "KLHK" },
  { name: "UMKM Naik Kelas", category: "Ekonomi", amount: "Rp 310 M", progress: 60, color: "var(--color-mk-orange)", beneficiaries: "12.400 UMKM", region: "Nasional", partner: "Kemenkop" },
];

// Source: IMPACT [label, value][] tuples in data.ts, preserved in order.
const PHILANTHROPY_IMPACT = [
  { label: "Anak bersekolah", value: "128.000" },
  { label: "Pasien ditangani", value: "340.000" },
  { label: "Pohon ditanam", value: "880.000" },
  { label: "UMKM dibina", value: "12.400" },
];

// Idempotent: each table guarded independently so partial seeds self-heal.
export async function seedFilantropi(ctx: MutationCtx) {
  if (!(await ctx.db.query("philanthropyGrants").first())) {
    for (let i = 0; i < PHILANTHROPY_GRANTS.length; i++) {
      await ctx.db.insert("philanthropyGrants", { ...PHILANTHROPY_GRANTS[i], order: i });
    }
  }
  if (!(await ctx.db.query("philanthropyImpact").first())) {
    for (let i = 0; i < PHILANTHROPY_IMPACT.length; i++) {
      await ctx.db.insert("philanthropyImpact", { ...PHILANTHROPY_IMPACT[i], order: i });
    }
  }
}
