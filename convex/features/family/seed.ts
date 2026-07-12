import type { MutationCtx } from "../../_generated/server";

// Mock values ported VERBATIM from frontend/slices/keluarga-warisan/data.ts for
// visual continuity. CHILDREN + STATS stay slice-local (pure presentation).
const HEIRS = [
  { name: "Andra W.", role: "Putra · CEO Energi", share: "28%", readiness: 86, color: "var(--color-mk-blue)", age: "38 th", next: "Pelatihan dewan holding (Q3)", mandate: "Energi & Tambang" },
  { name: "Bianca W.", role: "Putri · Komisaris Finansial", share: "28%", readiness: 74, color: "var(--color-mk-green)", age: "35 th", next: "Sertifikasi tata kelola (Q4)", mandate: "Bank & Asuransi" },
  { name: "Citra W.", role: "Putri · Direktur Filantropi", share: "22%", readiness: 60, color: "var(--color-mk-orange)", age: "31 th", next: "Rotasi unit usaha (2027)", mandate: "Yayasan & ESG" },
  { name: "Yayasan Keluarga", role: "Trust abadi", share: "22%", readiness: 100, color: "var(--color-mk-purple)", age: "—", next: "Tinjauan akta tahunan", mandate: "Aset abadi & legasi" },
];

const GOVERNANCE = [
  { title: "Dokumen Hukum", items: ["Wasiat utama ✓", "Akta trust keluarga ✓", "Perjanjian pemegang saham ✓"] },
  { title: "Tata Kelola", items: ["Konstitusi keluarga", "Rapat dewan keluarga · kuartalan", "Kode etik next-gen"] },
  { title: "Pendidikan Next-Gen", items: ["Program magang grup", "Mentoring family office", "Literasi filantropi"] },
];

// Idempotent: each table guarded by a .first() existence check.
export async function seedFamily(ctx: MutationCtx) {
  if (!(await ctx.db.query("heirs").first())) {
    for (let i = 0; i < HEIRS.length; i++) {
      await ctx.db.insert("heirs", { ...HEIRS[i], order: i });
    }
  }
  if (!(await ctx.db.query("governanceBuckets").first())) {
    for (let i = 0; i < GOVERNANCE.length; i++) {
      await ctx.db.insert("governanceBuckets", { ...GOVERNANCE[i], order: i });
    }
  }
}
