import type { MutationCtx } from "../../_generated/server";

// Mock VALUES copied verbatim from frontend/slices/keamanan-staf/data.ts for
// visual continuity. `order` added to preserve the original array sort. Each
// table is guarded independently so re-running is idempotent.

const STAFF_ROSTER = [
  { slug: "budi", name: "Pak Budi", role: "Kepala Keamanan", status: "Bertugas", color: "var(--color-mk-green)", location: "Kediaman Utama", shift: "06:00–18:00", tenure: "9 th" },
  { slug: "joko", name: "Sopir Joko", role: "Sopir utama", status: "Standby", color: "var(--color-mk-blue)", location: "Kediaman Utama", shift: "On-call", tenure: "6 th" },
  { slug: "marco", name: "Chef Marco", role: "Kepala dapur", status: "Bertugas", color: "var(--color-mk-orange)", location: "Kediaman Utama", shift: "05:00–14:00", tenure: "4 th" },
  { slug: "sari", name: "Bu Sari", role: "Estate manager", status: "Bertugas", color: "var(--color-mk-purple)", location: "Lintas properti", shift: "08:00–17:00", tenure: "11 th" },
  { slug: "aji", name: "Kapten Aji", role: "Pilot jet", status: "Cuti", color: "var(--color-mk-red)", location: "Hangar Halim", shift: "Rotasi", tenure: "7 th" },
];

const SECURITY_ZONES = [
  { slug: "jakarta", label: "Kediaman Utama · Jakarta", status: "Hijau", color: "var(--color-mk-green)" },
  { slug: "bali", label: "Vila · Bali", status: "Hijau", color: "var(--color-mk-green)" },
  { slug: "london", label: "Estate · London", status: "Siaga", color: "var(--color-mk-orange)" },
  { slug: "halim", label: "Hangar Jet · Halim", status: "Hijau", color: "var(--color-mk-green)" },
];

const SECURITY_METRICS = [
  { slug: "cctv", label: "CCTV aktif", value: "142 / 142" },
  { slug: "akses", label: "Akses gerbang hari ini", value: "37" },
  { slug: "patroli", label: "Patroli terjadwal", value: "8 / 8 ✓" },
  { slug: "panic", label: "Panic button", value: "Siap", panic: true },
];

export async function seedSecurity(ctx: MutationCtx) {
  if (!(await ctx.db.query("staffRoster").first())) {
    for (let i = 0; i < STAFF_ROSTER.length; i++) {
      await ctx.db.insert("staffRoster", { ...STAFF_ROSTER[i], order: i });
    }
  }
  if (!(await ctx.db.query("securityZones").first())) {
    for (let i = 0; i < SECURITY_ZONES.length; i++) {
      await ctx.db.insert("securityZones", { ...SECURITY_ZONES[i], order: i });
    }
  }
  if (!(await ctx.db.query("securityMetrics").first())) {
    for (let i = 0; i < SECURITY_METRICS.length; i++) {
      await ctx.db.insert("securityMetrics", { ...SECURITY_METRICS[i], order: i });
    }
  }
}
