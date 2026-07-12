// Slice-local presentation data for Keamanan & Staf (roster + estate security).

import type { FormField } from "@/frontend/shared";
import type { Doc } from "@/convex/_generated/dataModel";

export const STATUS_COLOR: Record<string, string> = {
  Bertugas: "var(--color-mk-green)",
  Standby: "var(--color-mk-blue)",
  Cuti: "var(--color-muted-foreground)",
};

// Accent tokens offered in the create/edit forms (no raw hex — theme tokens
// only). Stored verbatim as the row's `color` string, consumed by Avatar / Pill.
const ACCENTS = [
  "var(--color-mk-green)",
  "var(--color-mk-blue)",
  "var(--color-mk-purple)",
  "var(--color-mk-orange)",
  "var(--color-mk-red)",
];

// Roster create/edit form. status drives the live "Sedang Bertugas" KPI, so it
// is a constrained select matching STATUS_COLOR keys. All display fields are
// free-form strings stored verbatim by the mutation.
export const STAFF_FIELDS: FormField[] = [
  { name: "name", label: "Nama", placeholder: "Pak Budi", required: true },
  { name: "role", label: "Peran", placeholder: "Kepala Keamanan", required: true },
  { name: "status", label: "Status", type: "select", options: ["Bertugas", "Standby", "Cuti"], required: true },
  { name: "location", label: "Penempatan", placeholder: "Kediaman Utama", required: true },
  { name: "shift", label: "Jam kerja", placeholder: "06:00–18:00", required: true },
  { name: "tenure", label: "Masa kerja", placeholder: "9 th", required: true },
  { name: "color", label: "Aksen", type: "select", options: ACCENTS, required: true },
];

// Estate zone create/edit form. status is a free-form label (e.g. Hijau/Siaga)
// rendered inside a Pill tinted by the chosen accent.
export const ZONE_FIELDS: FormField[] = [
  { name: "label", label: "Lokasi", placeholder: "Vila · Bali", required: true },
  { name: "status", label: "Status", placeholder: "Hijau", required: true },
  { name: "color", label: "Aksen", type: "select", options: ACCENTS, required: true },
];

// Seed a staff/zone doc into the FormModal `initial` record for the edit flow.
export function staffInitial(s: Doc<"staffRoster">): Record<string, string> {
  return {
    name: s.name,
    role: s.role,
    status: s.status,
    location: s.location,
    shift: s.shift,
    tenure: s.tenure,
    color: s.color,
  };
}
export function zoneInitial(z: Doc<"securityZones">): Record<string, string> {
  return { label: z.label, status: z.status, color: z.color };
}

export const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

// Illustrative demo constants (roster shift bands + static KPI copy) live centrally.
export { SHIFTS, STATS } from "@/mock-data/keamanan-staf";
