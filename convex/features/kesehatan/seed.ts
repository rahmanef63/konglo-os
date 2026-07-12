import type { MutationCtx } from "../../_generated/server";

// Mock values ported VERBATIM from frontend/slices/kesehatan/data.ts for visual
// continuity. Each table guarded independently so the seed is idempotent.

const MEDICAL_TEAM = [
  { name: "dr. Hartono", role: "Dokter pribadi", color: "var(--color-mk-blue)" },
  { name: "dr. Lim", role: "Kardiolog", color: "var(--color-mk-red)" },
  { name: "Coach Rina", role: "Pelatih & nutrisi", color: "var(--color-mk-green)" },
];

const SCHEDULE = [
  { date: "14 Mei · 08:00", title: "Medical check-up tahunan", location: "RS Pondok Indah · VIP", color: "var(--color-mk-purple)" },
  { date: "20 Mei · 17:00", title: "Sesi latihan + fisioterapi", location: "Home gym", color: "var(--color-mk-green)" },
  { date: "28 Mei · 10:00", title: "Konsultasi gizi", location: "Video call", color: "var(--color-mk-orange)" },
];

const PROGRAMS: [string, string][] = [
  ["Suplemen pagi", "08:00 ✓"],
  ["Meditasi", "06:30 ✓"],
  ["Hidrasi", "2,4 / 3 L"],
  ["Obat tekanan", "21:00"],
];

export async function seedKesehatan(ctx: MutationCtx) {
  if (!(await ctx.db.query("healthMedicalTeam").first())) {
    for (let i = 0; i < MEDICAL_TEAM.length; i++) {
      await ctx.db.insert("healthMedicalTeam", { ...MEDICAL_TEAM[i], order: i });
    }
  }

  if (!(await ctx.db.query("healthSchedule").first())) {
    for (let i = 0; i < SCHEDULE.length; i++) {
      await ctx.db.insert("healthSchedule", { ...SCHEDULE[i], order: i });
    }
  }

  if (!(await ctx.db.query("healthPrograms").first())) {
    for (let i = 0; i < PROGRAMS.length; i++) {
      const [label, value] = PROGRAMS[i];
      await ctx.db.insert("healthPrograms", { label, value, order: i });
    }
  }

  return "seeded kesehatan";
}
