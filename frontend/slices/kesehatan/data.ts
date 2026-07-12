// Slice-local presentation data for Kesehatan (vitals + concierge medical).

import type { FormField } from "@/frontend/shared";
import type { Doc } from "@/convex/_generated/dataModel";

export type TeamMember = Doc<"healthMedicalTeam">;
export type ScheduleEntry = Doc<"healthSchedule">;

// Accent palette (theme tokens only — no raw hex) cycled across new rows.
export const PALETTE = [
  "var(--color-mk-green)",
  "var(--color-mk-blue)",
  "var(--color-mk-purple)",
  "var(--color-mk-orange)",
  "var(--color-gold)",
];

// Create/edit form fields. `order` is server-derived on create, so it's not a
// field here — append-at-end is the right default for a small concierge list.
export const TEAM_FIELDS: FormField[] = [
  { name: "name", label: "Nama", placeholder: "dr. …", required: true },
  { name: "role", label: "Spesialisasi / peran", placeholder: "Dokter keluarga", required: true },
];
export const SCHEDULE_FIELDS: FormField[] = [
  { name: "date", label: "Tanggal", placeholder: "18 Jun", required: true },
  { name: "title", label: "Janji / sesi", placeholder: "Cek lab tahunan", required: true },
  { name: "location", label: "Lokasi", placeholder: "Klinik Konsierge", required: true },
];

// Seed an existing doc into the FormModal `initial` record for the edit flow.
export function teamInitial(m: TeamMember): Record<string, string> {
  return { name: m.name, role: m.role };
}
export function scheduleInitial(e: ScheduleEntry): Record<string, string> {
  return { date: e.date, title: e.title, location: e.location };
}

// Illustrative vitals/readiness/KPI mock data now lives centrally in
// mock-data/kesehatan.ts — re-exported here so "./data" importers still work.
export { VITALS_TREND, VITAL_STATS, READINESS, STATS } from "@/mock-data/kesehatan";
